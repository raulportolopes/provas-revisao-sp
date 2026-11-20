<?php
namespace App\Http\Resources;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Formato único do agendamento no JSON (doador e equipe usam o mesmo). */
class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocol' => $this->protocol,
            'status' => $this->status,
            'status_label' => Appointment::LABELS[$this->status],
            'starts_at' => $this->starts_at->toIso8601String(),               // 2026-12-01T08:20:00-03:00
            'ends_at' => $this->starts_at->copy()->addMinutes(Appointment::SLOT_MINUTES)->toIso8601String(),
            'center' => ['id' => $this->center->id, 'name' => $this->center->name],
            // "whenLoaded": o doador só aparece quando o controller carregou a relação (rotas da equipe)
            'donor' => $this->whenLoaded('donor', fn () => [
                'id' => $this->donor->id, 'name' => $this->donor->name, 'cpf' => $this->donor->maskedCpf(),
            ]),
            'volume_ml' => $this->volume_ml,
            'unfit_reason' => $this->unfit_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }
}
