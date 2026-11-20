<?php

namespace App\Http\Controllers;

use App\Models\Invoice;

class ReportController extends Controller
{
    // Inadimplência: alunos com mensalidade vencida e não paga, do maior valor atualizado para o menor.
    public function inadimplencia()
    {
        $linhas = Invoice::with('enrollment.student', 'enrollment.schoolClass')->naSituacao('vencida')->get()
            ->groupBy(fn ($i) => $i->enrollment->student_id)
            ->map(function ($itens) {
                $aluno = $itens->first()->enrollment->student;

                return (object) [
                    'aluno' => $aluno,
                    'turmas' => $itens->map(fn ($i) => $i->enrollment->schoolClass->code)->unique()->sort()->implode(', '),
                    'quantidade' => $itens->count(),
                    'original' => $itens->sum(fn ($i) => (float) $i->amount),
                    'atualizado' => $itens->sum(fn ($i) => $i->valorAtualizado()),
                    'maisAntiga' => $itens->min('due_date'),
                ];
            })
            ->sortBy([['atualizado', 'desc'], fn ($a, $b) => strcmp($a->aluno->name, $b->aluno->name)])
            ->values();

        return view('relatorios.inadimplencia', compact('linhas'));
    }
}
