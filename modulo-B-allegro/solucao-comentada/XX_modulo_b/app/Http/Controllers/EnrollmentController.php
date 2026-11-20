<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Matriculas;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function store(Request $request, Student $aluno, Matriculas $servico)
    {
        $dados = $request->validate(['school_class_id' => ['required', 'integer', 'exists:school_classes,id']]);
        $turma = SchoolClass::findOrFail($dados['school_class_id']);

        if ($erro = $servico->problema($aluno, $turma)) {
            return back()->withInput()->with('erro', $erro);
        }

        $m = $servico->matricular($aluno, $turma);
        $msg = $m->status === 'ativa'
            ? "Matrícula na turma {$turma->code} confirmada. Mensalidades geradas até dezembro."
            : "Turma {$turma->code} cheia: o aluno entrou na lista de espera (posição {$m->posicao()}).";

        return redirect()->route('alunos.show', $aluno)->with('ok', $msg);
    }

    public function cancelar(Enrollment $matricula, Matriculas $servico)
    {
        if ($matricula->status === 'cancelada') {
            return back()->with('erro', 'Esta matrícula já está cancelada.');
        }
        $promovido = $servico->cancelar($matricula);

        $msg = 'Matrícula cancelada.';
        if ($promovido) {
            $msg .= " {$promovido->student->name} saiu da lista de espera e foi matriculado(a).";
        }

        return redirect()->route('alunos.show', $matricula->student_id)->with('ok', $msg);
    }
}
