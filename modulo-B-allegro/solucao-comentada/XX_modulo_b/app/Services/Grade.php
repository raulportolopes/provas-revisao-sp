<?php

namespace App\Services;

use App\Models\SchoolClass;

/** Conflitos de sala e de professor entre turmas ATIVAS (usado no cadastro e na edição de turma). */
class Grade
{
    // Lista TODOS os conflitos de uma vez (não para no primeiro)
    public function conflitos(array $dados, ?int $ignorarId = null): array
    {
        $sobrepostas = SchoolClass::with(['room', 'teacher'])->where('active', 1)
            ->sobrepoe((int) $dados['weekday'], $dados['start_time'], $dados['end_time'])
            ->when($ignorarId, fn ($q) => $q->where('id', '!=', $ignorarId))
            ->orderBy('start_time')->get();

        $erros = [];
        foreach ($sobrepostas as $t) {
            if ((int) $t->room_id === (int) $dados['room_id']) {
                $erros[] = "{$t->room->name} ocupada pela turma {$t->code} ({$t->horario()}).";
            }
            if ((int) $t->teacher_id === (int) $dados['teacher_id']) {
                $erros[] = "{$t->teacher->name} já dá aula na turma {$t->code} ({$t->horario()}).";
            }
        }

        return $erros;
    }
}
