<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = ['sku', 'name', 'price_cents', 'stock_qty', 'min_stock'];
    protected function casts(): array { return ['price_cents' => 'integer', 'stock_qty' => 'integer', 'min_stock' => 'integer']; }

    /** Peças abaixo do estoque mínimo. */
    public function scopeLowStock(Builder $q): Builder { return $q->whereColumn('stock_qty', '<', 'min_stock'); }
}
