<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClassRequest;
use App\Models\Instrument;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function index(Request $request)
    {
        $f = [
            'instrumento' => $request->query('instrumento', ''),
            'dia' => $request->query('dia', ''),
            'professor' => $request->query('professor', ''),
            'nivel' => $request->query('nivel', ''),
            'vagas' => $request->boolean('vagas'),
        ];

        $turmas = SchoolClass::with(['instrument', 'teacher', 'room'])
            ->withCount(['ativas', 'enrollments as espera_count' => fn ($q) => $q->where('status', 'espera')])
            ->visiveisPara($request->user())
            ->when(ctype_digit((string) $f['instrumento']), fn ($q) => $q->where('instrument_id', $f['instrumento']))
            ->when(ctype_digit((string) $f['dia']), fn ($q) => $q->where('weekday', $f['dia']))
            ->when(ctype_digit((string) $f['professor']), fn ($q) => $q->where('teacher_id', $f['professor']))
            ->when(array_key_exists($f['nivel'], SchoolClass::NIVEIS), fn ($q) => $q->where('level', $f['nivel']))
            // Com vaga: turma ativa e menos alunos ativos que a capacidade (subconsulta no WHERE)
            ->when($f['vagas'], fn ($q) => $q->where('active', 1)
                ->whereRaw("(SELECT COUNT(*) FROM enrollments e WHERE e.school_class_id = school_classes.id AND e.status = 'ativa') < school_classes.capacity"))
            ->orderBy('weekday')->orderBy('start_time')->orderBy('code')
            ->get();

        return view('turmas.index', [
            'turmas' => $turmas, 'f' => $f,
            'instrumentos' => Instrument::orderBy('name')->get(),
            'professores' => User::where('role', 'professor')->orderBy('name')->get(),
        ]);
    }

    public function show(SchoolClass $turma)
    {
        $this->authorize('view', $turma);
        $turma->load(['instrument', 'teacher', 'room']);
        $ativas = $turma->ativas()->with('student')->get()->sortBy('student.name');
        $espera = $turma->espera()->with('student')->get();

        return view('turmas.show', compact('turma', 'ativas', 'espera'));
    }

    public function create()
    {
        $this->authorize('create', SchoolClass::class);

        return view('turmas.form', $this->opcoes(new SchoolClass(['active' => true, 'weekday' => 1])));
    }

    public function store(SchoolClassRequest $request)
    {
        $turma = SchoolClass::create($request->validated());

        return redirect()->route('turmas.show', $turma)->with('ok', "Turma {$turma->code} cadastrada.");
    }

    public function edit(SchoolClass $turma)
    {
        $this->authorize('update', $turma);

        return view('turmas.form', $this->opcoes($turma));
    }

    public function update(SchoolClassRequest $request, SchoolClass $turma)
    {
        // Mudar a mensalidade NÃO altera as mensalidades já geradas: só as de novas matrículas
        $turma->update($request->validated());

        return redirect()->route('turmas.show', $turma)->with('ok', 'Turma atualizada.');
    }

    private function opcoes(SchoolClass $turma): array
    {
        return [
            'turma' => $turma,
            'instrumentos' => Instrument::orderBy('name')->get(),
            'professores' => User::where('role', 'professor')->where('active', 1)->orderBy('name')->get(),
            'salas' => Room::orderBy('name')->get(),
        ];
    }

    public function apagar(SchoolClass $turma)
    {
        $this->authorize('delete', $turma);

        return view('turmas.apagar', compact('turma'));
    }

    public function destroy(SchoolClass $turma)
    {
        $this->authorize('delete', $turma);
        // Turma com qualquer matrícula (até cancelada) tem histórico financeiro: não apaga
        if ($turma->enrollments()->exists()) {
            return redirect()->route('turmas.show', $turma)
                ->with('erro', 'A turma tem matrículas registradas e não pode ser apagada. Desative a turma.');
        }
        $turma->delete();

        return redirect()->route('turmas.index')->with('ok', "Turma {$turma->code} apagada.");
    }
}
