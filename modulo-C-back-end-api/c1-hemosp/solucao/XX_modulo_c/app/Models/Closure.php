<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Dia sem atendimento. center_id NULL vale para todas as unidades (feriado). */
class Closure extends Model
{
    protected $fillable = ['center_id', 'date', 'reason'];
    protected function casts(): array { return ['date' => 'date']; }

    public function center(): BelongsTo { return $this->belongsTo(Center::class); }
}
