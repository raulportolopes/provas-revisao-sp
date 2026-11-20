<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/** Doador. É "Authenticatable" para poder receber token do Sanctum (habilidade "donor"). */
class Donor extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['name', 'cpf', 'email', 'password', 'birth_date', 'sex', 'weight_kg', 'blood_type_id', 'guardian_document_path'];
    protected $hidden = ['password'];
    protected function casts(): array
    {
        return ['password' => 'hashed', 'birth_date' => 'date', 'weight_kg' => 'float'];
    }

    public function bloodType(): BelongsTo { return $this->belongsTo(BloodType::class); }
    public function appointments(): HasMany { return $this->hasMany(Appointment::class); }

    /** Idade completa em uma data (Carbon 3: diffInYears devolve float, por isso o (int)). */
    public function ageOn(\DateTimeInterface $date): int
    {
        return (int) $this->birth_date->diffInYears($date);
    }

    public function maskedCpf(): string
    {
        return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $this->cpf);
    }
}
