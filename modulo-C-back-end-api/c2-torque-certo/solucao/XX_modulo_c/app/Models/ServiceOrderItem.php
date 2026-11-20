<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Linha da OS: OU uma peça OU um serviço, com o preço copiado no momento do orçamento. */
class ServiceOrderItem extends Model
{
    protected $fillable = ['service_order_id', 'part_id', 'service_id', 'quantity', 'unit_price_cents'];
    protected function casts(): array { return ['quantity' => 'integer', 'unit_price_cents' => 'integer']; }

    public function part(): BelongsTo { return $this->belongsTo(Part::class); }
    public function service(): BelongsTo { return $this->belongsTo(Service::class); }

    public function totalCents(): int { return $this->quantity * $this->unit_price_cents; }
}
