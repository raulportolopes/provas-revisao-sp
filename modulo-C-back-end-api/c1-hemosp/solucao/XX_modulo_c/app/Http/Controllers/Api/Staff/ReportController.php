<?php
namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /** GET /api/staff/reports/monthly?month=Y-m – só admin. */
    public function monthly(Request $request)
    {
        if (! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Apenas administradores podem ver relatórios.'], 403);
        }
        $request->validate(['month' => ['required', 'date_format:Y-m']]);
        $ini = Carbon::createFromFormat('Y-m-d', $request->month . '-01')->startOfDay();
        $fim = $ini->copy()->endOfMonth();

        // uma consulta agrupada por unidade e situação (em vez de uma consulta por unidade)
        $contagem = DB::table('appointments')
            ->whereBetween('starts_at', [$ini, $fim])
            ->groupBy('center_id', 'status')
            ->select('center_id', 'status', DB::raw('COUNT(*) as n'), DB::raw('COALESCE(SUM(volume_ml), 0) as ml'))
            ->get()->groupBy('center_id');

        $linhas = Center::orderBy('id')->get()->map(function ($c) use ($contagem) {
            $porStatus = ($contagem[$c->id] ?? collect())->keyBy('status');
            $n = fn ($s) => (int) ($porStatus[$s]->n ?? 0);
            $total = $porStatus->sum('n');
            $validos = $total - $n('cancelled');           // cancelado não entra na taxa de falta
            return [
                'center_id' => $c->id, 'center' => $c->name, 'total' => (int) $total,
                'donated' => $n('donated'), 'unfit' => $n('unfit'), 'no_show' => $n('no_show'), 'cancelled' => $n('cancelled'),
                'no_show_rate' => $validos ? round($n('no_show') * 100 / $validos, 1) : 0.0,
                'volume_liters' => round(((int) ($porStatus['donated']->ml ?? 0)) / 1000, 2),
            ];
        });

        return [
            'month' => $request->month,
            'centers' => $linhas,
            'totals' => [
                'total' => $linhas->sum('total'), 'donated' => $linhas->sum('donated'),
                'no_show' => $linhas->sum('no_show'), 'volume_liters' => round($linhas->sum('volume_liters'), 2),
            ],
        ];
    }
}
