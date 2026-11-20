<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderEvent;
use App\Models\ServiceOrderItem;
use App\Services\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private OrdemServico $os) {}

    private const COM = ['vehicle.customer', 'mechanic', 'items.part', 'items.service', 'photos', 'events.user'];

    private function detalhe(ServiceOrder $o, int $status = 200)
    {
        return (new OrderResource($o->fresh(self::COM)))->response()->setStatusCode($status);
    }

    /** Mecânico só enxerga as OS em que é o responsável. */
    private function podeVer(Request $request, ServiceOrder $o): void
    {
        $u = $request->user();
        abort_if($u->isMechanic() && $o->mechanic_id !== $u->id, 403, 'Esta OS não é sua.');
    }

    /** Total da OS calculado no banco, para poder ORDENAR por ele (mesma regra do totals(): desconto arredondado). */
    private function comTotal($q)
    {
        $sub = '(SELECT COALESCE(SUM(quantity * unit_price_cents), 0) FROM service_order_items i WHERE i.service_order_id = service_orders.id)';
        return $q->select('service_orders.*')->selectRaw("$sub - ROUND($sub * discount_percent / 100) as total_sql");
    }

    /** GET /api/orders?status=&search=&from=&to=&sort=&page= */
    public function index(Request $request)
    {
        $request->validate([
            'status' => ['nullable', Rule::in(array_keys(ServiceOrder::LABELS))],
            'search' => 'nullable|string|max:100',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'sort' => ['nullable', Rule::in(['opened_at', '-opened_at', 'total', '-total'])],
        ]);
        $u = $request->user();
        $q = $this->comTotal(ServiceOrder::query())->with(['vehicle.customer', 'mechanic', 'items'])
            ->when($u->isMechanic(), fn ($q) => $q->where('mechanic_id', $u->id))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->from, fn ($q, $d) => $q->where('opened_at', '>=', "$d 00:00:00"))
            ->when($request->to, fn ($q, $d) => $q->where('opened_at', '<=', "$d 23:59:59"))   // inclui o dia inteiro
            ->when($request->search, function ($q, $b) {
                $placa = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $b));
                $q->where(fn ($w) => $w->where('number', 'like', "%{$b}%")
                    ->orWhereHas('vehicle', fn ($v) => $v->where('plate', $placa))
                    ->orWhereHas('vehicle.customer', fn ($c) => $c->where('name', 'like', "%{$b}%")));
            });
        match ($request->input('sort', '-opened_at')) {
            'opened_at' => $q->orderBy('opened_at')->orderBy('id'),
            '-opened_at' => $q->orderByDesc('opened_at')->orderByDesc('id'),
            'total' => $q->orderBy('total_sql')->orderBy('id'),
            '-total' => $q->orderByDesc('total_sql')->orderBy('id'),
        };
        $p = $q->paginate(10)->withQueryString();

        return [
            'data' => collect($p->items())->map(function ($o) { $r = new OrderResource($o); $r->resumo = true; return $r; }),
            'meta' => ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'per_page' => $p->perPage(), 'total' => $p->total()],
        ];
    }

    /** POST /api/orders {vehicle_id, complaint} */
    public function store(Request $request)
    {
        $dados = $request->validate(['vehicle_id' => 'required|integer|exists:vehicles,id', 'complaint' => 'required|string|min:5|max:2000']);
        $o = DB::transaction(function () use ($dados, $request) {
            $o = ServiceOrder::create($dados + ['number' => $this->os->proximoNumero(), 'status' => 'aberta', 'opened_at' => now()]);
            ServiceOrderEvent::create(['service_order_id' => $o->id, 'from_status' => null, 'to_status' => 'aberta', 'user_id' => $request->user()->id]);
            return $o;
        });
        return $this->detalhe($o, 201);
    }

    public function show(Request $request, ServiceOrder $order)
    {
        $this->podeVer($request, $order);
        return $this->detalhe($order);
    }

    /** POST /api/orders/{order}/items {type, item_id, quantity} */
    public function addItem(Request $request, ServiceOrder $order)
    {
        $tipo = $request->input('type');
        $dados = $request->validate([
            'type' => ['required', Rule::in(['part', 'service'])],
            'item_id' => ['required', 'integer', Rule::exists($tipo === 'service' ? 'services' : 'parts', 'id')],
            'quantity' => ['required', 'integer', 'min:1', $tipo === 'service' ? 'max:1' : 'max:99'],
        ]);
        $this->os->adicionarItem($order, $dados['type'], $dados['item_id'], $dados['quantity']);
        return $this->detalhe($order, 201);
    }

    /** DELETE /api/orders/{order}/items/{item} – scopeBindings garante que o item é desta OS (senão 404). */
    public function removeItem(ServiceOrder $order, ServiceOrderItem $item)
    {
        if ($order->status !== 'aberta') {
            return response()->json(['message' => 'Itens só podem ser alterados com a OS aberta.'], 409);
        }
        $item->delete();
        return response()->noContent();
    }

    /** PATCH /api/orders/{order}/discount {percent} */
    public function discount(Request $request, ServiceOrder $order)
    {
        $dados = $request->validate(['percent' => 'required|numeric|between:0,20|decimal:0,1']);
        $this->os->aplicarDesconto($order, (float) $dados['percent'], $request->user());
        return $this->detalhe($order);
    }

    /** POST /api/orders/{order}/transition {to, mechanic_id?} */
    public function transition(Request $request, ServiceOrder $order)
    {
        $this->podeVer($request, $order);
        $dados = $request->validate([
            'to' => ['required', Rule::in(array_keys(ServiceOrder::LABELS))],
            'mechanic_id' => 'nullable|integer',
        ]);
        $this->os->transicionar($order, $dados['to'], $request->user(), $dados['mechanic_id'] ?? null);
        return $this->detalhe($order);
    }

    /** DELETE /api/orders/{order} – exclusão lógica (soft delete), só OS aberta ou cancelada. */
    public function destroy(ServiceOrder $order)
    {
        if (! in_array($order->status, ['aberta', 'cancelada'], true)) {
            return response()->json(['message' => 'Só OS aberta ou cancelada pode ser excluída.'], 409);
        }
        $order->delete();
        return response()->noContent();
    }

    /** GET /api/orders/trash */
    public function trash()
    {
        return ServiceOrder::onlyTrashed()->with('vehicle')->orderByDesc('deleted_at')->get()
            ->map(fn ($o) => ['id' => $o->id, 'number' => $o->number, 'status' => $o->status, 'plate' => $o->vehicle->plate,
                              'deleted_at' => $o->deleted_at->toIso8601String()]);
    }

    /** POST /api/orders/{id}/restore – o binding normal não acha OS excluída, então buscamos com withTrashed. */
    public function restore(int $id)
    {
        $o = ServiceOrder::withTrashed()->findOrFail($id);
        if (! $o->trashed()) {
            return response()->json(['message' => 'Esta OS não está na lixeira.'], 409);
        }
        $o->restore();
        return $this->detalhe($o);
    }
}
