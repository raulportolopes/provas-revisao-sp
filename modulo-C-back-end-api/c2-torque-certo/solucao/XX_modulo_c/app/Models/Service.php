<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Serviço do catálogo (mão de obra). */
class Service extends Model
{
    protected $fillable = ['name', 'price_cents', 'minutes'];
    protected function casts(): array { return ['price_cents' => 'integer']; }
}
