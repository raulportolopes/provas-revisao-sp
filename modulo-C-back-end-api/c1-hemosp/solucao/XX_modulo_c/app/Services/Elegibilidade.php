<?php
namespace App\Services;

use App\Models\Donor;
use Illuminate\Support\Carbon;

/**
 * Regras de quem pode doar (simplificadas do Ministério da Saúde).
 * Cada regra que falha vira um item {code, message}. Todas são checadas: o doador vê TODOS os motivos.
 */
class Elegibilidade
{
    public const MIN_AGE = 16;
    public const MAX_AGE = 69;
    public const FIRST_DONATION_MAX_AGE = 60;
    public const MIN_WEIGHT = 50;
    public const INTERVAL_DAYS = ['M' => 60, 'F' => 90];
    public const MAX_PER_YEAR = ['M' => 4, 'F' => 3];

    /** Motivos que o tempo não resolve: não existe "próxima data". */
    private const PERMANENTES = ['AGE_MAX', 'FIRST_DONATION_AGE', 'WEIGHT'];

    /** Datas (Carbon, só o dia) das doações efetivadas ANTES do dia informado, da mais recente para a mais antiga. */
    private function doacoes(Donor $donor, Carbon $dia)
    {
        return $donor->appointments()->donated()
            ->where('starts_at', '<', $dia->copy()->startOfDay())
            ->orderByDesc('starts_at')
            ->pluck('starts_at')
            ->map(fn ($d) => Carbon::parse($d)->startOfDay());
    }

    /** Lista de motivos de inaptidão para doar no dia informado ([] = apto). */
    public function motivos(Donor $donor, Carbon $dia): array
    {
        $dia = $dia->copy()->startOfDay();
        $m = [];
        $idade = $donor->ageOn($dia);
        $doacoes = $this->doacoes($donor, $dia);

        if ($idade < self::MIN_AGE) $m[] = ['code' => 'AGE_MIN', 'message' => 'Idade mínima para doar é 16 anos.'];
        if ($idade > self::MAX_AGE) $m[] = ['code' => 'AGE_MAX', 'message' => 'Idade máxima para doar é 69 anos.'];
        if ($idade >= self::MIN_AGE && $idade < 18 && ! $donor->guardian_document_path)
            $m[] = ['code' => 'GUARDIAN_DOCUMENT', 'message' => 'Menores de 18 anos precisam enviar a autorização do responsável.'];
        if ($idade > self::FIRST_DONATION_MAX_AGE && $idade <= self::MAX_AGE && $doacoes->isEmpty())
            $m[] = ['code' => 'FIRST_DONATION_AGE', 'message' => 'A primeira doação só pode ser feita até os 60 anos.'];
        if ($donor->weight_kg < self::MIN_WEIGHT) $m[] = ['code' => 'WEIGHT', 'message' => 'Peso mínimo para doar é 50 kg.'];

        if ($doacoes->isNotEmpty()) {
            $proxima = $doacoes->first()->copy()->addDays(self::INTERVAL_DAYS[$donor->sex]);
            if ($dia->lt($proxima))
                $m[] = ['code' => 'INTERVAL', 'message' => 'Intervalo mínimo entre doações não cumprido. Próxima data: ' . $proxima->format('d/m/Y') . '.'];

            // janela de 12 meses: doações com data > dia - 365
            $max = self::MAX_PER_YEAR[$donor->sex];
            $naJanela = $doacoes->filter(fn ($d) => $d->gt($dia->copy()->subDays(365)))->count();
            if ($naJanela >= $max)
                $m[] = ['code' => 'YEARLY_LIMIT', 'message' => "Limite de {$max} doações em 12 meses atingido."];
        }
        return $m;
    }

    /** Primeiro dia (a partir de hoje) em que as regras de DATA ficam cumpridas; null se houver motivo permanente. */
    public function proximaData(Donor $donor): ?Carbon
    {
        $hoje = Carbon::today();
        $codigos = array_column($this->motivos($donor, $hoje), 'code');
        if (array_intersect($codigos, self::PERMANENTES)) return null;

        $candidatas = [$hoje, $donor->birth_date->copy()->addYears(self::MIN_AGE)];
        $doacoes = $this->doacoes($donor, $hoje->copy()->addDay()); // inclui doação de hoje, se houver
        if ($doacoes->isNotEmpty()) {
            $candidatas[] = $doacoes->first()->copy()->addDays(self::INTERVAL_DAYS[$donor->sex]);
            $max = self::MAX_PER_YEAR[$donor->sex];
            if ($doacoes->count() >= $max) {
                // a vaga na janela abre 365 dias depois da "max-ésima" doação mais recente
                $candidatas[] = $doacoes[$max - 1]->copy()->addDays(365);
            }
        }
        return collect($candidatas)->max();
    }
}
