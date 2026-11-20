<?php
namespace App\Services;

use App\Models\Part;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderEvent;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Regras da ordem de serviço em um só lugar: número, itens, desconto, máquina de estados e estoque.
 * Os controllers só validam o formato e chamam estes métodos.
 */
class OrdemServico
{
    private function falha(int $status, array $corpo): never
    {
        throw new HttpResponseException(response()->json($corpo, $status));
    }

    /** OS-2026-0007: sequencial dentro do ano, recomeça em 0001 no ano novo. Conta também as OS na lixeira. */
    public function proximoNumero(): string
    {
        $ano = now()->year;
        $ultimo = ServiceOrder::withTrashed()->where('number', 'like', "OS-{$ano}-%")->max('number');
        return sprintf('OS-%d-%04d', $ano, $ultimo ? (int) substr($ultimo, -4) + 1 : 1);
    }

    /** Itens só podem mudar enquanto a OS está aberta. Mesma peça de novo soma a quantidade. */
    public function adicionarItem(ServiceOrder $os, string $tipo, int $id, int $qtd): void
    {
        if ($os->status !== 'aberta') {
            $this->falha(409, ['message' => 'Itens só podem ser alterados com a OS aberta.']);
        }
        $coluna = $tipo === 'part' ? 'part_id' : 'service_id';
        $preco = $tipo === 'part' ? Part::findOrFail($id)->price_cents : Service::findOrFail($id)->price_cents;

        $existente = $os->items()->where($coluna, $id)->first();
        if ($existente) {
            if ($tipo === 'service') $this->falha(409, ['message' => 'Este serviço já está na OS.']);
            if ($existente->quantity + $qtd > 99) throw ValidationException::withMessages(['quantity' => 'Quantidade máxima por item é 99.']);
            $existente->increment('quantity', $qtd);
            return;
        }
        // o preço é COPIADO para o item: se o catálogo mudar depois, o orçamento não muda
        $os->items()->create([$coluna => $id, 'quantity' => $qtd, 'unit_price_cents' => $preco]);
    }

    public function aplicarDesconto(ServiceOrder $os, float $percentual, User $user): void
    {
        if (! in_array($os->status, ['aberta', 'orcada'], true)) {
            $this->falha(409, ['message' => 'Desconto só pode ser dado antes da aprovação.']);
        }
        if (! $user->isAdmin() && $percentual > 10) {
            $this->falha(403, ['message' => 'Atendente pode dar no máximo 10% de desconto.']);
        }
        $os->update(['discount_percent' => $percentual]);
    }

    /** Muda a situação aplicando permissão, pré-requisitos e estoque. Tudo ou nada (transação). */
    public function transicionar(ServiceOrder $os, string $para, User $user, ?int $mecanicoId = null): ServiceOrder
    {
        // 1) a transição existe?
        if (! $os->canGoTo($para)) {
            $this->falha(409, ['message' => "Transição inválida: {$os->status} → {$para}.", 'allowed' => ServiceOrder::TRANSITIONS[$os->status]]);
        }
        // 2) quem pode? mecânico só conclui, e só a OS dele; admin pode tudo; atendente não conclui
        if ($para === 'concluida') {
            if (! $user->isAdmin() && $os->mechanic_id !== $user->id) {
                $this->falha(403, ['message' => 'Só o mecânico responsável (ou o admin) pode concluir esta OS.']);
            }
        } elseif ($user->isMechanic()) {
            $this->falha(403, ['message' => 'Mecânico só pode concluir as próprias OS.']);
        }
        // 3) pré-requisitos de cada destino
        if ($para === 'orcada' && $os->items()->doesntExist()) {
            $this->falha(409, ['message' => 'Não é possível orçar uma OS sem itens.']);
        }
        if ($para === 'em_execucao') {
            $mec = $mecanicoId ? User::find($mecanicoId) : null;
            if (! $mec || ! $mec->isMechanic()) {
                throw ValidationException::withMessages(['mechanic_id' => 'Informe um usuário com perfil de mecânico.']);
            }
        }

        return DB::transaction(function () use ($os, $para, $user, $mecanicoId) {
            $de = $os->status;
            if ($para === 'aprovada') $this->baixarEstoque($os);
            if ($para === 'cancelada' && in_array($de, ServiceOrder::STOCK_TAKEN, true)) $this->devolverEstoque($os);

            $os->status = $para;
            if ($para === 'em_execucao') $os->mechanic_id = $mecanicoId;
            if ($para === 'entregue') $os->delivered_at = now();
            $os->save();
            ServiceOrderEvent::create(['service_order_id' => $os->id, 'from_status' => $de, 'to_status' => $para, 'user_id' => $user->id]);
            return $os;
        });
    }

    /** Confere TODAS as peças antes de baixar qualquer uma; se faltar alguma, 409 com a lista e nada muda. */
    private function baixarEstoque(ServiceOrder $os): void
    {
        $precisa = $os->items()->whereNotNull('part_id')->get()->groupBy('part_id')->map->sum('quantity');
        // lockForUpdate: outra aprovação ao mesmo tempo espera esta terminar (não vende a mesma peça duas vezes)
        $pecas = Part::whereIn('id', $precisa->keys())->lockForUpdate()->get()->keyBy('id');
        $faltam = $precisa->filter(fn ($q, $id) => $pecas[$id]->stock_qty < $q)
            ->map(fn ($q, $id) => ['sku' => $pecas[$id]->sku, 'name' => $pecas[$id]->name, 'needed' => $q, 'available' => $pecas[$id]->stock_qty])
            ->values();
        if ($faltam->isNotEmpty()) {
            $this->falha(409, ['message' => 'Estoque insuficiente para aprovar a OS.', 'missing' => $faltam]);
        }
        foreach ($precisa as $id => $q) $pecas[$id]->decrement('stock_qty', $q);
    }

    private function devolverEstoque(ServiceOrder $os): void
    {
        foreach ($os->items()->whereNotNull('part_id')->get() as $item) {
            Part::whereKey($item->part_id)->increment('stock_qty', $item->quantity);
        }
    }
}
