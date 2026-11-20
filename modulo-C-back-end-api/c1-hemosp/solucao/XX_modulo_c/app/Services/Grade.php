<?php
namespace App\Services;

use App\Models\Appointment;
use App\Models\Center;
use App\Models\Closure;
use Illuminate\Support\Carbon;

/**
 * Tudo sobre horário de funcionamento e grade de 20 minutos de uma unidade.
 * Fica num lugar só: a listagem de vagas e o agendamento usam as mesmas regras.
 */
class Grade
{
    public const MAX_DAYS_AHEAD = 90;

    /** Devolve [abre, fecha] (strings H:i) do dia, ou o motivo de estar fechado (string). */
    public function expediente(Center $center, Carbon $dia): array|string
    {
        if ($dia->isSunday()) return 'Domingo: unidade fechada.';
        if ($dia->isSaturday() && ! $center->saturday_opens_at) return 'Esta unidade não abre aos sábados.';

        // Fechamento da própria unidade OU geral (center_id NULL = feriado para todas)
        $fechado = Closure::whereDate('date', $dia->toDateString())
            ->where(fn ($q) => $q->whereNull('center_id')->orWhere('center_id', $center->id))
            ->first();
        if ($fechado) return 'Fechado: ' . $fechado->reason . '.';

        return $dia->isSaturday()
            ? [substr($center->saturday_opens_at, 0, 5), substr($center->saturday_closes_at, 0, 5)]
            : [substr($center->weekday_opens_at, 0, 5), substr($center->weekday_closes_at, 0, 5)];
    }

    /** Todos os inícios da grade do dia: de "abre" até o último que TERMINA até "fecha". */
    public function inicios(Center $center, Carbon $dia): array
    {
        $exp = $this->expediente($center, $dia);
        if (is_string($exp)) return [];
        $t = $dia->copy()->setTimeFromTimeString($exp[0]);
        $fim = $dia->copy()->setTimeFromTimeString($exp[1]);
        $lista = [];
        while ($t->copy()->addMinutes(Appointment::SLOT_MINUTES)->lte($fim)) {
            $lista[] = $t->copy();
            $t->addMinutes(Appointment::SLOT_MINUTES);
        }
        return $lista;
    }

    /** Quantos agendamentos já ocupam cada horário do dia: ['08:20' => 2, ...] */
    public function ocupacao(Center $center, Carbon $dia): array
    {
        return Appointment::occupying()
            ->where('center_id', $center->id)
            ->whereBetween('starts_at', [$dia->copy()->startOfDay(), $dia->copy()->endOfDay()])
            ->get(['starts_at'])
            ->countBy(fn ($a) => $a->starts_at->format('H:i'))
            ->all();
    }

    /** Valida a data pedida (para vagas e agendamento). Devolve mensagem de erro ou null. */
    public function erroDeData(Carbon $dia): ?string
    {
        if ($dia->lt(Carbon::today())) return 'A data já passou.';
        if ($dia->gt(Carbon::today()->addDays(self::MAX_DAYS_AHEAD))) return 'Só é possível agendar até ' . self::MAX_DAYS_AHEAD . ' dias à frente.';
        return null;
    }

    /** Valida um início de agendamento. Devolve mensagem de erro (422) ou null. */
    public function erroDeHorario(Center $center, Carbon $inicio): ?string
    {
        if ($inicio->lte(now())) return 'O horário já passou.';
        if ($e = $this->erroDeData($inicio->copy()->startOfDay())) return $e;
        $exp = $this->expediente($center, $inicio);
        if (is_string($exp)) return $exp;
        foreach ($this->inicios($center, $inicio->copy()->startOfDay()) as $t) {
            if ($t->eq($inicio)) return null;
        }
        return "Horário fora da grade da unidade ({$exp[0]} às {$exp[1]}, a cada " . Appointment::SLOT_MINUTES . ' minutos).';
    }
}
