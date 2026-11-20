<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = ['student_id', 'school_class_id', 'status', 'enrolled_at', 'waitlisted_at', 'cancelled_at'];

    protected function casts(): array
    {
        return ['enrolled_at' => 'date', 'waitlisted_at' => 'datetime', 'cancelled_at' => 'date'];
    }

    public function student() { return $this->belongsTo(Student::class); }
    public function schoolClass() { return $this->belongsTo(SchoolClass::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }

    // Posição na lista de espera (1 = próximo a entrar)
    public function posicao(): ?int
    {
        if ($this->status !== 'espera') {
            return null;
        }

        return Enrollment::where('school_class_id', $this->school_class_id)->where('status', 'espera')
            ->where(fn ($q) => $q->where('waitlisted_at', '<', $this->waitlisted_at)
                ->orWhere(fn ($q) => $q->where('waitlisted_at', $this->waitlisted_at)->where('id', '<', $this->id)))
            ->count() + 1;
    }
}
