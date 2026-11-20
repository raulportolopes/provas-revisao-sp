<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Peça usada numa ordem (tabela part_work_order).
 * A tabela tem id próprio, quantidade e preço congelado, por isso virou um model
 * em vez de ser tratada só como pivot.
 */
class WorkOrderItem extends Model
{
    protected $table = 'part_work_order';

    protected $fillable = ['work_order_id', 'part_id', 'quantity', 'unit_price'];

    protected function casts(): array { return ['quantity' => 'integer', 'unit_price' => 'decimal:2']; }

    public function part() { return $this->belongsTo(Part::class); }
    public function workOrder() { return $this->belongsTo(WorkOrder::class); }

    public function subtotal(): float { return $this->quantity * (float) $this->unit_price; }
}
