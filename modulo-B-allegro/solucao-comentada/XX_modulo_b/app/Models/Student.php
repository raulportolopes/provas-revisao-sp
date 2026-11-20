<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Student extends Model
{
    protected $fillable = ['name', 'birth_date', 'email', 'phone', 'guardian_name', 'guardian_phone'];

    protected function casts(): array { return ['birth_date' => 'date']; }

    public function enrollments() { return $this->hasMany(Enrollment::class); }

    // Mensalidades do aluno passando pelas matrículas (aluno -> matrículas -> mensalidades)
    public function invoices() { return $this->hasManyThrough(Invoice::class, Enrollment::class); }

    // Idade em anos completos. diffInYears já desconta quem ainda não fez aniversário no ano.
    public function idade(?Carbon $em = null): int
    {
        return (int) $this->birth_date->diffInYears($em ?? Carbon::today());
    }

    public function ehMenor(): bool { return $this->idade() < 18; }
}
