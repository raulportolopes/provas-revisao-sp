<?php
namespace App\Http\Resources;

use App\Models\ServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** Detalhe completo da OS. A listagem usa só uma parte (ver $this->resumo). */
class OrderResource extends JsonResource
{
    public bool $resumo = false;

    public function toArray(Request $request): array
    {
        $t = $this->totals();
        $base = [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'status_label' => ServiceOrder::LABELS[$this->status],
            'opened_at' => $this->opened_at->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'vehicle' => ['id' => $this->vehicle->id, 'plate' => $this->vehicle->plate, 'model' => $this->vehicle->brand . ' ' . $this->vehicle->model],
            'customer' => ['id' => $this->vehicle->customer->id, 'name' => $this->vehicle->customer->name],
            'mechanic' => $this->mechanic ? ['id' => $this->mechanic->id, 'name' => $this->mechanic->name] : null,
            'total_cents' => $t['total_cents'],
            'total_formatted' => $t['total_formatted'],
        ];
        if ($this->resumo) return $base;

        return $base + [
            'complaint' => $this->complaint,
            'items' => $this->items->map(fn ($i) => [
                'id' => $i->id,
                'type' => $i->part_id ? 'part' : 'service',
                'item_id' => $i->part_id ?? $i->service_id,
                'description' => $i->part_id ? $i->part->name : $i->service->name,
                'quantity' => $i->quantity,
                'unit_price_cents' => $i->unit_price_cents,
                'total_cents' => $i->totalCents(),
            ]),
            'totals' => $t,
            'photos' => $this->photos->map(fn ($f) => [
                'id' => $f->id, 'url' => url(Storage::url($f->path)), 'thumb_url' => url(Storage::url($f->thumb_path)),
            ]),
            'history' => $this->events->map(fn ($e) => [
                'from' => $e->from_status, 'to' => $e->to_status, 'by' => $e->user->name, 'at' => $e->created_at->toIso8601String(),
            ]),
        ];
    }
}
