<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** Turma (tabela school_classes; "Class" é palavra reservada no PHP, por isso SchoolClass). */
class SchoolClass extends Model
{
    public const DIAS = [1 => 'Segunda', 2 => 'Terça', 3 => 'Quarta', 4 => 'Quinta', 5 => 'Sexta', 6 => 'Sábado'];
    public const NIVEIS = ['basico' => 'Básico', 'intermediario' => 'Intermediário', 'avancado' => 'Avançado'];

    protected $fillable = ['code', 'instrument_id', 'teacher_id', 'room_id', 'level', 'weekday', 'start_time',
        'end_time', 'capacity', 'monthly_fee', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'weekday' => 'integer', 'capacity' => 'integer', 'monthly_fee' => 'decimal:2'];
    }

    public function instrument() { return $this->belongsTo(Instrument::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function room() { return $this->belongsTo(Room::class); }
    public function enrollments() { return $this->hasMany(Enrollment::class); }

    public function ativas() { return $this->enrollments()->where('status', 'ativa'); }

    // Lista de espera na ordem de chegada (desempate pelo id)
    public function espera() { return $this->enrollments()->where('status', 'espera')->orderBy('waitlisted_at')->orderBy('id'); }

    // "18:00:00" -> "18:00"
    public function inicio(): string { return substr($this->start_time, 0, 5); }
    public function fim(): string { return substr($this->end_time, 0, 5); }

    // "Segunda, 18:00–19:30"
    public function horario(): string { return self::DIAS[$this->weekday] . ', ' . $this->inicio() . '–' . $this->fim(); }

    public function nivel(): string { return self::NIVEIS[$this->level] ?? $this->level; }

    // Professor só enxerga as turmas dele
    public function scopeVisiveisPara(Builder $q, User $user): Builder
    {
        return $user->ehProfessor() ? $q->where('teacher_id', $user->id) : $q;
    }

    // Turmas no mesmo dia cujo horário se sobrepõe a [inicio, fim).
    // Sobrepõe quando: começa antes do outro terminar E termina depois do outro começar.
    // 18:00–19:30 e 19:30–20:30 só "encostam": não é conflito.
    public function scopeSobrepoe(Builder $q, int $dia, string $inicio, string $fim): Builder
    {
        return $q->where('weekday', $dia)->where('start_time', '<', $fim)->where('end_time', '>', $inicio);
    }
}
