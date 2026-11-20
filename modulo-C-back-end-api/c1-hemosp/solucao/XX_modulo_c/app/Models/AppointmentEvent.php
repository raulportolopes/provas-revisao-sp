<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Histórico (auditoria) de cada mudança de situação do agendamento. */
class AppointmentEvent extends Model
{
    protected $fillable = ['appointment_id', 'from_status', 'to_status', 'user_id', 'note'];

    public function appointment(): BelongsTo { return $this->belongsTo(Appointment::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
