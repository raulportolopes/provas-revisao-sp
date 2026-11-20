<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'price', 'active'];

    protected function casts(): array { return ['active' => 'boolean', 'price' => 'decimal:2']; }

    public function workOrders()
    {
        return $this->belongsToMany(WorkOrder::class)->withPivot('price');
    }
}
