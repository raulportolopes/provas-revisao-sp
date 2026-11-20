<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = ['sku', 'name', 'price', 'stock'];

    protected function casts(): array { return ['price' => 'decimal:2', 'stock' => 'integer']; }
}
