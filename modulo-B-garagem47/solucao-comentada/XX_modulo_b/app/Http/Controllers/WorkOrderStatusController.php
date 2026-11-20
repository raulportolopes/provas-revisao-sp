<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Services\FluxoOrdem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkOrderStatusController extends Controller
{
    public function store(Request $request, WorkOrder $ordem, FluxoOrdem $fluxo)
    {
        $this->authorize('view', $ordem);

        $dados = $request->validate([
            'para' => ['required', Rule::in(array_keys(FluxoOrdem::TRANSICOES))],
            // Observação obrigatória para "aguardando peça" (qual peça) e motivo para cancelar
            'note' => [
                Rule::requiredIf(in_array($request->input('para'), ['aguardando_peca', 'cancelada'], true)),
                'nullable', 'string', 'max:255',
                $request->input('para') === 'cancelada' ? 'min:10' : 'min:3',
            ],
        ], ['note.required' => 'Informe o motivo / a observação.']);

        // 1) o CARGO pode? Se não, 403 (mesmo que o botão nem apareça na tela)
        abort_unless($fluxo->cargoPode($request->user(), $ordem, $dados['para']), 403, 'Seu cargo não pode fazer esta mudança de situação.');

        // 2) a ORDEM aceita? Se não, volta com a mensagem e não muda nada
        if ($erro = $fluxo->problema($ordem, $dados['para'])) {
            return back()->with('erro', $erro);
        }

        $fluxo->executar($request->user(), $ordem, $dados['para'], $dados['note'] ?? null);

        return redirect()->route('ordens.show', $ordem)->with('ok', 'Situação alterada para "' . $ordem->situacao() . '".');
    }
}
