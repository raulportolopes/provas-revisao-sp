<?php

namespace App\Policies;

use App\Models\SchoolClass;
use App\Models\User;

class SchoolClassPolicy
{
    // Professor só abre a turma dele; secretaria e coordenação abrem todas.
    public function view(User $user, SchoolClass $turma): bool
    {
        return ! $user->ehProfessor() || $turma->teacher_id === $user->id;
    }

    public function create(User $user): bool { return $user->ehCoordenacao(); }
    public function update(User $user, SchoolClass $turma): bool { return $user->ehCoordenacao(); }
    public function delete(User $user, SchoolClass $turma): bool { return $user->ehCoordenacao(); }
}
