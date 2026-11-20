<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $dados = [];

        if ($user->ehProfessor()) {
            // dayOfWeekIso: 1 = segunda ... 7 = domingo (o mesmo número da coluna weekday)
            $dados['aulasHoje'] = SchoolClass::with(['instrument', 'room'])->withCount('ativas')
                ->where('teacher_id', $user->id)->where('active', 1)
                ->where('weekday', Carbon::today()->dayOfWeekIso)->orderBy('start_time')->get();
            $dados['minhasTurmas'] = SchoolClass::where('teacher_id', $user->id)->where('active', 1)->count();
        } else {
            $turmas = SchoolClass::where('active', 1)->withCount('ativas')->get();
            $dados['alunosAtivos'] = Enrollment::where('status', 'ativa')->distinct('student_id')->count('student_id');
            $dados['turmasAtivas'] = $turmas->count();
            $dados['vagasLivres'] = $turmas->sum(fn ($t) => max(0, $t->capacity - $t->ativas_count));
            $dados['naEspera'] = Enrollment::where('status', 'espera')->count();
            $vencidas = Invoice::naSituacao('vencida')->get();
            $dados['vencidasQtd'] = $vencidas->count();
            $dados['vencidasValor'] = $vencidas->sum(fn ($i) => $i->valorAtualizado());
            if ($user->ehCoordenacao()) {
                $dados['recebidoMes'] = Invoice::whereBetween('paid_at', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                    ->sum('paid_amount');
            }
        }

        return view('painel', $dados);
    }
}
