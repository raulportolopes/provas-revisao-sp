<?php
namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentEvent;
use App\Models\Center;
use App\Models\Donor;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Criação e mudança de situação dos agendamentos.
 * A ordem das checagens é a do enunciado: formato (422) -> horário (422) -> elegibilidade (422) -> conflitos (409).
 */
class Agendamento
{
    public function __construct(private Grade $grade, private Elegibilidade $eleg) {}

    private function falha(int $status, array $corpo): never
    {
        throw new HttpResponseException(response()->json($corpo, $status));
    }

    public function criar(Donor $donor, Center $center, string $quando): Appointment
    {
        $inicio = Carbon::createFromFormat('Y-m-d H:i', $quando)->second(0);

        if ($erro = $this->grade->erroDeHorario($center, $inicio)) {
            $this->falha(422, ['message' => 'Dados inválidos.', 'errors' => ['starts_at' => [$erro]]]);
        }
        if ($motivos = $this->eleg->motivos($donor, $inicio)) {
            $this->falha(422, ['message' => 'Doador inapto para esta data.', 'reasons' => $motivos]);
        }

        // Transação + lockForUpdate na unidade: duas pessoas pedindo a última vaga ao mesmo tempo
        // ficam uma atrás da outra, e a segunda já enxerga a vaga ocupada.
        return DB::transaction(function () use ($donor, $center, $inicio) {
            Center::whereKey($center->id)->lockForUpdate()->first();

            $aberto = $donor->appointments()->where('status', 'scheduled')->where('starts_at', '>', now())->first();
            if ($aberto) {
                $this->falha(409, ['message' => 'Você já tem um agendamento em aberto.', 'protocol' => $aberto->protocol]);
            }
            $ocupadas = Appointment::occupying()->where('center_id', $center->id)->where('starts_at', $inicio)->count();
            if ($ocupadas >= $center->slot_capacity) {
                $this->falha(409, ['message' => 'Horário lotado. Escolha outro horário.']);
            }

            $a = Appointment::create([
                'protocol' => $this->proximoProtocolo(), 'donor_id' => $donor->id, 'center_id' => $center->id,
                'starts_at' => $inicio, 'status' => 'scheduled',
            ]);
            AppointmentEvent::create(['appointment_id' => $a->id, 'from_status' => null, 'to_status' => 'scheduled', 'note' => 'Agendado pelo doador']);
            return $a;
        });
    }

    /** HEMO-2026-00042: número sequencial dentro do ano (recomeça em 00001 todo ano). */
    public function proximoProtocolo(): string
    {
        $ano = now()->year;
        $ultimo = Appointment::where('protocol', 'like', "HEMO-{$ano}-%")->max('protocol'); // mesmo tamanho: max de texto funciona
        $n = $ultimo ? (int) substr($ultimo, -5) + 1 : 1;
        return sprintf('HEMO-%d-%05d', $ano, $n);
    }

    /** Muda a situação e grava o histórico. $userId null = o próprio doador. */
    public function mudarSituacao(Appointment $a, string $para, ?int $userId, ?string $nota = null, array $extra = []): Appointment
    {
        return DB::transaction(function () use ($a, $para, $userId, $nota, $extra) {
            $de = $a->status;
            $a->fill($extra + ['status' => $para]);
            if ($para === 'cancelled') $a->cancelled_at = now();
            $a->save();
            AppointmentEvent::create(['appointment_id' => $a->id, 'from_status' => $de, 'to_status' => $para, 'user_id' => $userId, 'note' => $nota]);
            return $a;
        });
    }
}
