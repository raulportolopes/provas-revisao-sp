<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'cpf', 'phone', 'email'];

    public function vehicles() { return $this->hasMany(Vehicle::class); }

    // Todas as ordens do cliente passando pelos veículos (cliente -> veículos -> ordens)
    public function workOrders() { return $this->hasManyThrough(WorkOrder::class, Vehicle::class); }
}
