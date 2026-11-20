<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/** Funcionários da oficina: admin, atendente ou mecanico. */
class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['name', 'email', 'password', 'role'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['password' => 'hashed']; }

    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isMechanic(): bool { return $this->role === 'mecanico'; }
}
