<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Center extends Model
{
    protected $fillable = ['name', 'neighborhood', 'address', 'weekday_opens_at', 'weekday_closes_at',
                           'saturday_opens_at', 'saturday_closes_at', 'slot_capacity', 'active'];
    protected function casts(): array { return ['active' => 'boolean', 'slot_capacity' => 'integer']; }

    public function appointments(): HasMany { return $this->hasMany(Appointment::class); }
    public function closures(): HasMany { return $this->hasMany(Closure::class); }

    /** scope: Center::active() */
    public function scopeActive(Builder $q): Builder { return $q->where('active', true); }
}
