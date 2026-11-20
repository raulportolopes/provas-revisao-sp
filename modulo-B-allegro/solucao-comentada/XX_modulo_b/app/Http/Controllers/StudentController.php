<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentRequest;
use App\Models\Invoice;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $f = [
            'busca' => trim((string) $request->query('busca', '')),
            'turma' => $request->query('turma', ''),
            'debito' => $request->boolean('debito'),
        ];

        $alunos = Student::query()
            ->with(['enrollments' => fn ($q) => $q->where('status', 'ativa')->with('schoolClass')])
            // withExists cria o atributo em_debito (true/false) com uma subconsulta
            ->withExists(['invoices as em_debito' => fn ($q) => $q->whereNull('paid_at')->whereDate('due_date', '<', Carbon::today())])
            ->when($f['busca'] !== '', fn ($q) => $q->where('name', 'like', "%{$f['busca']}%"))
            ->when(ctype_digit((string) $f['turma']), fn ($q) => $q->whereHas('enrollments',
                fn ($e) => $e->where('school_class_id', $f['turma'])->where('status', 'ativa')))
            ->when($f['debito'], fn ($q) => $q->whereHas('invoices',
                fn ($i) => $i->whereNull('paid_at')->whereDate('due_date', '<', Carbon::today())))
            ->orderBy('name')->orderBy('id')
            ->paginate(15)->withQueryString();

        return view('alunos.index', ['alunos' => $alunos, 'f' => $f, 'turmas' => SchoolClass::orderBy('code')->get()]);
    }

    public function create()
    {
        return view('alunos.form', ['aluno' => new Student()]);
    }

    public function store(StudentRequest $request)
    {
        $aluno = Student::create($request->validated());

        return redirect()->route('alunos.show', $aluno)->with('ok', 'Aluno cadastrado.');
    }

    public function show(Student $aluno)
    {
        $matriculas = $aluno->enrollments()->with('schoolClass.instrument')
            ->orderByRaw("FIELD(status, 'ativa', 'espera', 'cancelada')")->orderByDesc('id')->get();
        $mensalidades = Invoice::with('enrollment.schoolClass')
            ->whereIn('enrollment_id', $matriculas->pluck('id'))
            ->orderBy('due_date')->orderBy('id')->get();
        // Turmas para a nova matrícula: só ativas, com a contagem de vagas
        $turmas = SchoolClass::with('instrument')->withCount('ativas')->where('active', 1)
            ->orderBy('weekday')->orderBy('start_time')->get();

        return view('alunos.show', compact('aluno', 'matriculas', 'mensalidades', 'turmas'));
    }

    public function edit(Student $aluno)
    {
        return view('alunos.form', compact('aluno'));
    }

    public function update(StudentRequest $request, Student $aluno)
    {
        $aluno->update($request->validated());

        return redirect()->route('alunos.show', $aluno)->with('ok', 'Aluno atualizado.');
    }

    public function apagar(Student $aluno)
    {
        return view('alunos.apagar', compact('aluno'));
    }

    public function destroy(Student $aluno)
    {
        if ($aluno->enrollments()->exists()) {
            return redirect()->route('alunos.show', $aluno)
                ->with('erro', 'O aluno tem matrículas registradas e não pode ser apagado.');
        }
        $aluno->delete();

        return redirect()->route('alunos.index')->with('ok', 'Aluno apagado.');
    }
}
