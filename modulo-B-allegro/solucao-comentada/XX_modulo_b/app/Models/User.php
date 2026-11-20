<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

/** Equipe da escola. role: secretaria | professor | coordenacao. active = 0 não entra. */
class User extends Authenticatable
{
    public const CARGOS = ['secretaria' => 'Secretaria', 'professor' => 'Professor(a)', 'coordenacao' => 'Coordenação'];

    protected $fillable = ['name', 'email', 'password', 'role', 'active'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'active' => 'boolean'];
    }

    public function ehCoordenacao(): bool { return $this->role === 'coordenacao'; }
    public function ehSecretaria(): bool { return $this->role === 'secretaria'; }
    public function ehProfessor(): bool { return $this->role === 'professor'; }

    // Quem cuida de alunos, matrículas e mensalidades
    public function ehAdministrativo(): bool { return in_array($this->role, ['secretaria', 'coordenacao'], true); }

    public function cargo(): string { return self::CARGOS[$this->role] ?? $this->role; }

    public function turmas() { return $this->hasMany(SchoolClass::class, 'teacher_id'); }
}
