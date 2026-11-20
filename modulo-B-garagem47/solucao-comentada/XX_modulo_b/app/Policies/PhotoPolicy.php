<?php

namespace App\Policies;

use App\Models\Photo;
use App\Models\User;

class PhotoPolicy
{
    // "Policy de dono": só quem enviou a foto (ou o gerente) apaga,
    // e só enquanto a ordem aceita fotos.
    public function delete(User $user, Photo $foto): bool
    {
        $ordem = $foto->workOrder;
        $dono = $user->ehGerente() || $foto->user_id === $user->id;

        return $dono && (new WorkOrderPolicy())->fotos($user, $ordem);
    }
}
