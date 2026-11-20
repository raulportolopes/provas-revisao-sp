<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    // Controller de uma ação só (__invoke): a rota aponta direto para a classe.
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Contagem por situação em UMA consulta (GROUP BY), respeitando o que o usuário pode ver
        $porSituacao = WorkOrder::visiveisPara($user)
            ->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        $atrasadas = WorkOrder::visiveisPara($user)->atrasadas()->count();

        $faturado = null;
        $entreguesNoMes = 0;
        if ($user->ehGerente()) {
            // Faturado no mês = soma do total das ordens ENTREGUES no mês corrente
            $doMes = WorkOrder::with(['services', 'items'])->where('status', 'entregue')
                ->whereBetween('delivered_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])->get();
            $entreguesNoMes = $doMes->count();
            $faturado = $doMes->sum(fn ($o) => $o->total());
        }

        return view('painel', compact('porSituacao', 'atrasadas', 'faturado', 'entreguesNoMes'));
    }
}
