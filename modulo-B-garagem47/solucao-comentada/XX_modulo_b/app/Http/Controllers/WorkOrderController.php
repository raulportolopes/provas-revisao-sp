<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkOrderRequest;
use App\Models\Part;
use App\Models\Service;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Services\FluxoOrdem;
use App\Support\Formato;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WorkOrderController extends Controller
{
    // Opções de ordenação aceitas na URL (?ordem=...). Qualquer outro valor cai no padrão.
    public const ORDENACOES = [
        'prazo' => 'Prazo (mais urgente primeiro)',
        'recentes' => 'Abertura (mais recentes primeiro)',
        'total' => 'Total (maior primeiro)',
    ];

    public function index(Request $request)
    {
        $ordens = $this->filtrar($request)->paginate(10)->withQueryString();
        $mecanicos = User::where('role', 'mecanico')->orderBy('name')->get();

        return view('ordens.index', [
            'ordens' => $ordens,
            'mecanicos' => $mecanicos,
            'f' => $this->filtrosDaUrl($request), // para manter os campos preenchidos
        ]);
    }

    // CSV com os MESMOS filtros da listagem (só gerente)
    public function exportar(Request $request)
    {
        $this->authorize('exportar');
        $ordens = $this->filtrar($request)->get();

        return response()->streamDownload(function () use ($ordens) {
            $saida = fopen('php://output', 'w');
            fwrite($saida, "\xEF\xBB\xBF"); // BOM: o Excel abre os acentos certos
            fputcsv($saida, ['Código', 'Placa', 'Cliente', 'Mecânico', 'Situação', 'Abertura', 'Prazo', 'Total'], ';');
            foreach ($ordens as $o) {
                fputcsv($saida, [
                    $o->code, $o->vehicle->plate, $o->vehicle->customer->name, $o->mechanic?->name ?? '-',
                    $o->situacao(), Formato::data($o->opened_at), Formato::data($o->due_date),
                    number_format($o->total(), 2, ',', '.'),
                ], ';');
            }
            fclose($saida);
        }, 'ordens-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filtrosDaUrl(Request $request): array
    {
        return [
            'status' => $request->query('status', ''),
            'mecanico' => $request->query('mecanico', ''),
            'busca' => trim((string) $request->query('busca', '')),
            'de' => $request->query('de', ''),
            'ate' => $request->query('ate', ''),
            'atrasadas' => $request->boolean('atrasadas'),
            'ordem' => array_key_exists($request->query('ordem'), self::ORDENACOES) ? $request->query('ordem') : 'prazo',
        ];
    }

    // Monta a consulta da listagem. Cada filtro só entra se tiver valor (when) e todos se combinam (AND).
    private function filtrar(Request $request)
    {
        $f = $this->filtrosDaUrl($request);

        $q = WorkOrder::query()->comTotal()
            ->with(['vehicle.customer', 'mechanic', 'services', 'items'])
            ->visiveisPara($request->user())
            ->when(array_key_exists($f['status'], WorkOrder::SITUACOES), fn ($q) => $q->where('status', $f['status']))
            ->when($f['mecanico'] === 'nenhum', fn ($q) => $q->whereNull('mechanic_id'))
            ->when(ctype_digit((string) $f['mecanico']), fn ($q) => $q->where('mechanic_id', $f['mecanico']))
            ->when($f['busca'] !== '', function ($q) use ($f) {
                $placa = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $f['busca']));
                // Agrupar os OR dentro de um where(function) é OBRIGATÓRIO,
                // senão o OR "fura" os outros filtros.
                $q->where(function ($q) use ($f, $placa) {
                    $q->where('code', 'like', "%{$f['busca']}%")
                        ->orWhereHas('vehicle', fn ($v) => $v->where('plate', 'like', "%{$placa}%"))
                        ->orWhereHas('vehicle.customer', fn ($c) => $c->where('name', 'like', "%{$f['busca']}%"));
                });
            })
            // Período de abertura: whereDate pega o dia inteiro (de 00:00 até 23:59)
            ->when($this->dataValida($f['de']), fn ($q) => $q->whereDate('opened_at', '>=', $f['de']))
            ->when($this->dataValida($f['ate']), fn ($q) => $q->whereDate('opened_at', '<=', $f['ate']))
            ->when($f['atrasadas'], fn ($q) => $q->atrasadas());

        // Ordenação sempre com desempate pelo id, na mesma direção
        return match ($f['ordem']) {
            'recentes' => $q->orderByDesc('opened_at')->orderByDesc('id'),
            'total' => $q->orderByDesc('total_calculado')->orderByDesc('id'),
            default => $q->orderBy('due_date')->orderBy('id'),
        };
    }

    private function dataValida($valor): bool
    {
        return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor)
            && checkdate((int) substr($valor, 5, 2), (int) substr($valor, 8, 2), (int) substr($valor, 0, 4));
    }

    public function create(Request $request)
    {
        $this->authorize('create', WorkOrder::class);

        return view('ordens.form', $this->dadosDoFormulario(new WorkOrder([
            // ?veiculo=3 vindo do botão "Nova ordem" na página do cliente
            'vehicle_id' => $request->query('veiculo'),
            'due_date' => Carbon::today(),
        ])));
    }

    public function store(WorkOrderRequest $request)
    {
        $dados = $request->validated();

        $ordem = DB::transaction(function () use ($dados, $request) {
            $ordem = WorkOrder::create([
                'code' => $this->proximoCodigo(),
                'vehicle_id' => $dados['vehicle_id'],
                'mechanic_id' => $dados['mechanic_id'] ?? null,
                'created_by' => $request->user()->id,
                'status' => 'aberta',
                'km' => $dados['km'],
                'complaint' => $dados['complaint'],
                'opened_at' => now(),
                'due_date' => $dados['due_date'],
            ]);
            $this->sincronizarServicos($ordem, $dados['services'] ?? []);
            $ordem->logs()->create(['user_id' => $request->user()->id, 'from_status' => null, 'to_status' => 'aberta']);

            return $ordem;
        });

        return redirect()->route('ordens.show', $ordem)->with('ok', "Ordem {$ordem->code} aberta.");
    }

    // OS-2026-0017: sequência reinicia a cada ano. lockForUpdate evita duas ordens com o mesmo código.
    private function proximoCodigo(): string
    {
        $ano = now()->year;
        $ultimo = WorkOrder::where('code', 'like', "OS-{$ano}-%")->lockForUpdate()->max('code');
        $seq = $ultimo ? ((int) substr($ultimo, -4)) + 1 : 1;

        return sprintf('OS-%d-%04d', $ano, $seq);
    }

    // sync() com dado na pivot: serviço que já estava mantém o preço antigo; serviço novo pega o preço atual.
    private function sincronizarServicos(WorkOrder $ordem, array $ids): void
    {
        $atuais = $ordem->services()->pluck('service_work_order.price', 'services.id');
        $precos = Service::whereIn('id', $ids)->pluck('price', 'id');
        $dados = [];
        foreach ($ids as $id) {
            $dados[$id] = ['price' => $atuais[$id] ?? $precos[$id]];
        }
        $ordem->services()->sync($dados);
    }

    public function show(WorkOrder $ordem, FluxoOrdem $fluxo)
    {
        $this->authorize('view', $ordem);
        $ordem->load(['vehicle.customer', 'mechanic', 'creator', 'services', 'items.part', 'logs.user', 'photos.user']);

        return view('ordens.show', [
            'ordem' => $ordem,
            'opcoes' => $fluxo->opcoes(request()->user(), $ordem),
            'pecas' => Part::where('stock', '>', 0)->orderBy('name')->get(),
        ]);
    }

    public function edit(WorkOrder $ordem)
    {
        $this->authorize('update', $ordem);

        return view('ordens.form', $this->dadosDoFormulario($ordem));
    }

    public function update(WorkOrderRequest $request, WorkOrder $ordem)
    {
        $dados = $request->validated();
        DB::transaction(function () use ($ordem, $dados) {
            $ordem->update([
                'complaint' => $dados['complaint'],
                'due_date' => $dados['due_date'],
                'mechanic_id' => $dados['mechanic_id'] ?? null,
            ]);
            $this->sincronizarServicos($ordem, $dados['services'] ?? []);
        });

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Ordem atualizada.');
    }

    private function dadosDoFormulario(WorkOrder $ordem): array
    {
        $jaNaOrdem = $ordem->exists ? $ordem->services()->pluck('services.id')->all() : [];

        return [
            'ordem' => $ordem,
            'veiculos' => Vehicle::with('customer')->orderBy('plate')->get(),
            'mecanicos' => User::where('role', 'mecanico')->where('active', 1)->orderBy('name')->get(),
            // ativos + os inativos que já estão nesta ordem
            'servicos' => Service::where('active', 1)->orWhereIn('id', $jaNaOrdem)->orderBy('name')->get(),
            'marcados' => $jaNaOrdem,
        ];
    }

    public function apagar(WorkOrder $ordem)
    {
        $this->authorize('delete', $ordem);

        return view('ordens.apagar', compact('ordem'));
    }

    public function destroy(WorkOrder $ordem)
    {
        $this->authorize('delete', $ordem);

        // Serviços, peças, histórico e fotos saem por ON DELETE CASCADE no banco;
        // os ARQUIVOS das fotos precisam ser apagados à mão.
        Storage::disk('public')->deleteDirectory('ordens/' . $ordem->id);
        $ordem->delete();

        return redirect()->route('ordens.index')->with('ok', "Ordem {$ordem->code} apagada.");
    }
}
