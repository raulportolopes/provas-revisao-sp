<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Usuário da oficina (tabela users do banco fornecido).
 * role: atendente | mecanico | gerente. active = 0 não pode entrar.
 */
class User extends Authenticatable
{
    public const CARGOS = ['atendente' => 'Atendente', 'mecanico' => 'Mecânico(a)', 'gerente' => 'Gerente'];

    protected $fillable = ['name', 'email', 'password', 'role', 'active'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'active' => 'boolean'];
    }

    // Atalhos usados nas policies e nas views. Ler "$user->ehGerente()" é mais claro que comparar string toda hora.
    public function ehGerente(): bool { return $this->role === 'gerente'; }
    public function ehAtendente(): bool { return $this->role === 'atendente'; }
    public function ehMecanico(): bool { return $this->role === 'mecanico'; }

    // "atende o balcão" = atendente ou gerente (quem abre, entrega e cancela ordens)
    public function ehBalcao(): bool { return in_array($this->role, ['atendente', 'gerente'], true); }

    public function cargo(): string { return self::CARGOS[$this->role] ?? $this->role; }

    public function ordensComoMecanico() { return $this->hasMany(WorkOrder::class, 'mechanic_id'); }
}
