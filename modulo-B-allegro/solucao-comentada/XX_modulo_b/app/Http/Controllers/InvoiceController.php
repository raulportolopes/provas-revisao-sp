<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\SchoolClass;
use App\Support\Formato;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $f = $this->filtros($request);
        $base = $this->consulta($f);

        // Totais sobre TODAS as mensalidades filtradas (não só a página atual)
        $todas = (clone $base)->get();
        $totais = [
            'recebido' => $todas->whereNotNull('paid_at')->sum('paid_amount'),
            'aberto' => $todas->filter(fn ($i) => $i->situacao() === 'aberta')->sum('amount'),
            'vencido' => $todas->filter(fn ($i) => $i->situacao() === 'vencida')->sum(fn ($i) => $i->valorAtualizado()),
        ];

        $mensalidades = $base->paginate(15)->withQueryString();

        return view('mensalidades.index', [
            'mensalidades' => $mensalidades, 'f' => $f, 'totais' => $totais,
            'turmas' => SchoolClass::orderBy('code')->get(),
        ]);
    }

    private function filtros(Request $request): array
    {
        $mes = (string) $request->query('mes', '');

        return [
            // <input type="month"> envia "2026-11"
            'mes' => preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $mes) ? $mes : '',
            'situacao' => array_key_exists($request->query('situacao'), Invoice::SITUACOES) ? $request->query('situacao') : '',
            'busca' => trim((string) $request->query('busca', '')),
            'turma' => ctype_digit((string) $request->query('turma')) ? $request->query('turma') : '',
        ];
    }

    private function consulta(array $f)
    {
        return Invoice::with('enrollment.student', 'enrollment.schoolClass')
            ->when($f['mes'], fn ($q) => $q->whereDate('reference_month', $f['mes'] . '-01'))
            ->when($f['situacao'], fn ($q) => $q->naSituacao($f['situacao']))
            ->when($f['busca'] !== '', fn ($q) => $q->whereHas('enrollment.student', fn ($s) => $s->where('name', 'like', "%{$f['busca']}%")))
            ->when($f['turma'], fn ($q) => $q->whereHas('enrollment', fn ($e) => $e->where('school_class_id', $f['turma'])))
            ->orderBy('due_date')->orderBy('id');
    }

    public function pagar(Request $request, Invoice $mensalidade)
    {
        if ($mensalidade->paid_at) {
            return back()->with('erro', 'Esta mensalidade já está paga.');
        }
        $inicio = $mensalidade->enrollment->enrolled_at ?? $mensalidade->reference_month;
        $request->validate([
            'paid_at' => ['required', 'date_format:Y-m-d', 'before_or_equal:today', 'after_or_equal:' . $inicio->toDateString()],
        ], [
            'paid_at.before_or_equal' => 'A data do pagamento não pode ser no futuro.',
            'paid_at.after_or_equal' => 'A data do pagamento não pode ser anterior à matrícula (' . Formato::data($inicio) . ').',
        ]);

        // O VALOR é calculado no servidor (multa e juros até a data do pagamento), nunca vem do formulário
        $data = Carbon::parse($request->paid_at);
        $mensalidade->update(['paid_at' => $data->toDateString(), 'paid_amount' => $mensalidade->valorAtualizado($data)]);

        return back()->with('ok', 'Pagamento de ' . Formato::moeda($mensalidade->paid_amount) . ' registrado.');
    }

    public function estornar(Invoice $mensalidade)
    {
        if (! $mensalidade->paid_at) {
            return back()->with('erro', 'Só é possível estornar mensalidade paga.');
        }
        $mensalidade->update(['paid_at' => null, 'paid_amount' => null]);

        return back()->with('ok', 'Pagamento estornado.');
    }

    public function exportar(Request $request)
    {
        $lista = $this->consulta($this->filtros($request))->get();

        return response()->streamDownload(function () use ($lista) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Aluno', 'Turma', 'Referência', 'Vencimento', 'Valor', 'Situação', 'Pago em', 'Valor pago'], ';');
            foreach ($lista as $i) {
                fputcsv($out, [
                    $i->enrollment->student->name, $i->enrollment->schoolClass->code, $i->reference_month->format('m/Y'),
                    Formato::data($i->due_date), number_format($i->amount, 2, ',', '.'), Invoice::SITUACOES[$i->situacao()],
                    $i->paid_at ? Formato::data($i->paid_at) : '', $i->paid_at ? number_format($i->paid_amount, 2, ',', '.') : '',
                ], ';');
            }
            fclose($out);
        }, 'mensalidades-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
