<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    /** Duração de cada horário da grade, em minutos. */
    public const SLOT_MINUTES = 20;

    /** Rótulos em português (JSON e CSV). */
    public const LABELS = [
        'scheduled' => 'Agendado', 'attended' => 'Compareceu', 'donated' => 'Doou',
        'unfit' => 'Inapto', 'no_show' => 'Faltou', 'cancelled' => 'Cancelado',
    ];

    /** Máquina de estados: de onde pode ir para onde. Estados sem saída são finais. */
    public const TRANSITIONS = [
        'scheduled' => ['attended', 'no_show', 'cancelled'],
        'attended'  => ['donated', 'unfit'],
        'donated'   => [],
        'unfit'     => [],
        'no_show'   => [],
        'cancelled' => [],
    ];

    protected $fillable = ['protocol', 'donor_id', 'center_id', 'starts_at', 'status', 'volume_ml', 'unfit_reason', 'cancelled_at'];
    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'cancelled_at' => 'datetime', 'volume_ml' => 'integer'];
    }

    public function donor(): BelongsTo { return $this->belongsTo(Donor::class); }
    public function center(): BelongsTo { return $this->belongsTo(Center::class); }
    public function events(): HasMany { return $this->hasMany(AppointmentEvent::class)->orderBy('id'); }

    /** Agendamentos que ocupam vaga na grade (todos menos os cancelados). */
    public function scopeOccupying(Builder $q): Builder { return $q->where('status', '!=', 'cancelled'); }

    /** Doações efetivadas (status donated). */
    public function scopeDonated(Builder $q): Builder { return $q->where('status', 'donated'); }

    public function canGoTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status], true);
    }
}
