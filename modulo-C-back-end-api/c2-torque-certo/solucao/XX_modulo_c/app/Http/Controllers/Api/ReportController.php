<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Models\ServiceOrder;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /** GET /api/reports/revenue?year=2025 – só admin. 12 meses, inclusive os zerados. */
    public function revenue(Request $request)
    {
        $request->validate(['year' => 'required|integer|between:2000,2100']);
        $ano = (int) $request->year;

        // o total tem desconto e arredondamento: calcular em PHP com o mesmo método do detalhe (totals())
        $porMes = ServiceOrder::with('items')->where('status', 'entregue')->whereYear('delivered_at', $ano)->get()
            ->groupBy(fn ($os) => $os->delivered_at->format('m'));

        $meses = collect(range(1, 12))->map(function ($m) use ($ano, $porMes) {
            $lista = $porMes[sprintf('%02d', $m)] ?? collect();
            $receita = $lista->sum(fn ($os) => $os->totals()['total_cents']);
            $media = $lista->count() ? (int) round($receita / $lista->count()) : 0;
            return [
                'month' => sprintf('%d-%02d', $ano, $m), 'orders' => $lista->count(),
                'revenue_cents' => $receita, 'revenue_formatted' => ServiceOrder::brl($receita),
                'average_ticket_cents' => $media,
            ];
        });
        $total = $meses->sum('revenue_cents');
        return ['year' => $ano, 'months' => $meses,
                'totals' => ['orders' => $meses->sum('orders'), 'revenue_cents' => $total, 'revenue_formatted' => ServiceOrder::brl($total)]];
    }

    /** GET /api/reports/low-stock – peças abaixo do mínimo, da mais crítica para a menos crítica. */
    public function lowStock()
    {
        return Part::lowStock()->get()
            ->sortBy([fn ($a, $b) => $a->stock_qty / $a->min_stock <=> $b->stock_qty / $b->min_stock, ['sku', 'asc']])
            ->values()
            ->map(fn ($p) => ['id' => $p->id, 'sku' => $p->sku, 'name' => $p->name, 'stock_qty' => $p->stock_qty,
                              'min_stock' => $p->min_stock, 'suggested_purchase' => 2 * $p->min_stock - $p->stock_qty]);
    }
}
