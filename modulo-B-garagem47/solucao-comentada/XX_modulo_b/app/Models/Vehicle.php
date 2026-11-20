<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = ['customer_id', 'plate', 'brand', 'model', 'year'];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function workOrders() { return $this->hasMany(WorkOrder::class); }

    // Texto usado nos selects: "FJK2B31 · Fiat Argo (2021)"
    public function descricao(): string
    {
        return "{$this->plate} · {$this->brand} {$this->model} ({$this->year})";
    }
}
