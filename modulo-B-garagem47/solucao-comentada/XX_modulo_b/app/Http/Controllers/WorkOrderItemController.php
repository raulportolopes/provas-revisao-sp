<?php

namespace App\Http\Controllers;

use App\Models\Part;
use App\Models\WorkOrder;
use App\Models\WorkOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkOrderItemController extends Controller
{
    public function store(Request $request, WorkOrder $ordem)
    {
        $this->authorize('pecas', $ordem);

        $dados = $request->validate([
            'part_id' => ['required', 'integer', 'exists:parts,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        DB::transaction(function () use ($dados, $ordem) {
            // lockForUpdate: trava a linha da peça até o fim da transação (dois mecânicos ao mesmo tempo não "furam" o estoque)
            $peca = Part::whereKey($dados['part_id'])->lockForUpdate()->first();
            if ($peca->stock < $dados['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => "Estoque insuficiente para {$peca->name}: disponível {$peca->stock}.",
                ]);
            }

            // Mesma peça lançada de novo: soma na linha existente (unique work_order_id + part_id)
            $item = WorkOrderItem::firstOrNew(['work_order_id' => $ordem->id, 'part_id' => $peca->id]);
            if (! $item->exists) {
                $item->quantity = 0;
                $item->unit_price = $peca->price; // preço congelado no momento do lançamento
            }
            $item->quantity += $dados['quantity'];
            $item->save();

            $peca->decrement('stock', $dados['quantity']);
        });

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Peça lançada.');
    }

    public function destroy(WorkOrder $ordem, WorkOrderItem $item)
    {
        $this->authorize('pecas', $ordem);

        DB::transaction(function () use ($item) {
            Part::whereKey($item->part_id)->increment('stock', $item->quantity); // devolve ao estoque
            $item->delete();
        });

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Peça retirada e devolvida ao estoque.');
    }
}
