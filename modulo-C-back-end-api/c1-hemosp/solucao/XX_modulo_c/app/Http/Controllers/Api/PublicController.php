<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BloodType;
use App\Models\Center;
use App\Services\Grade;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    public function index()
    {
        return ['api' => 'HemoSP', 'version' => '1.0', 'now' => now()->toIso8601String()];
    }

    /** GET /api/blood-stock – volume doado nos últimos 35 dias por tipo, comparado com a meta. */
    public function stock()
    {
        $desde = Carbon::today()->subDays(34);   // hoje + 34 dias antes = 35 dias
        // soma no banco: doações efetivadas, agrupadas pelo tipo sanguíneo do doador
        $volumes = Appointment::donated()
            ->join('donors', 'donors.id', '=', 'appointments.donor_id')
            ->whereBetween('starts_at', [$desde, Carbon::today()->endOfDay()])
            ->groupBy('donors.blood_type_id')
            ->select('donors.blood_type_id', DB::raw('SUM(volume_ml) as total'))
            ->pluck('total', 'blood_type_id');

        return BloodType::all()->map(function ($bt) use ($volumes) {
            $ml = (int) ($volumes[$bt->id] ?? 0);
            $pct = round($ml * 100 / $bt->stock_goal_ml, 1);
            return [
                'blood_type' => $bt->code,
                'volume_ml' => $ml,
                'goal_ml' => $bt->stock_goal_ml,
                'percent' => $pct,
                'level' => $pct < 25 ? 'critico' : ($pct < 50 ? 'alerta' : 'ok'),
            ];
        })->sortBy([['percent', 'asc'], ['blood_type', 'asc']])->values();
    }

    /** GET /api/centers?neighborhood=&open_on=Y-m-d */
    public function centers(Request $request, Grade $grade)
    {
        $request->validate(['neighborhood' => 'nullable|string|max:100', 'open_on' => 'nullable|date_format:Y-m-d']);

        $lista = Center::active()
            ->when($request->neighborhood, fn ($q, $b) => $q->where('neighborhood', 'like', "%{$b}%"))
            ->orderBy('name')->get();

        if ($request->open_on) {
            $dia = Carbon::parse($request->open_on);
            $lista = $lista->filter(fn ($c) => is_array($grade->expediente($c, $dia)))->values();
        }

        return $lista->map(fn ($c) => [
            'id' => $c->id, 'name' => $c->name, 'neighborhood' => $c->neighborhood, 'address' => $c->address,
            'slot_capacity' => $c->slot_capacity,
            'hours' => [
                'weekdays' => substr($c->weekday_opens_at, 0, 5) . '-' . substr($c->weekday_closes_at, 0, 5),
                'saturday' => $c->saturday_opens_at ? substr($c->saturday_opens_at, 0, 5) . '-' . substr($c->saturday_closes_at, 0, 5) : null,
            ],
        ]);
    }

    /** GET /api/centers/{center}/slots?date=Y-m-d – vagas de 20 em 20 minutos. */
    public function slots(Request $request, Center $center, Grade $grade)
    {
        abort_unless($center->active, 404);   // unidade inativa não "existe" para o público
        $request->validate(['date' => 'required|date_format:Y-m-d']);
        $dia = Carbon::parse($request->date)->startOfDay();
        if ($erro = $grade->erroDeData($dia)) {
            return response()->json(['message' => 'Dados inválidos.', 'errors' => ['date' => [$erro]]], 422);
        }

        $exp = $grade->expediente($center, $dia);
        if (is_string($exp)) {
            return ['center_id' => $center->id, 'date' => $dia->toDateString(), 'open' => false, 'reason' => $exp, 'slots' => []];
        }
        $ocupados = $grade->ocupacao($center, $dia);
        $slots = collect($grade->inicios($center, $dia))
            ->filter(fn ($t) => $t->gt(now()))              // hoje: esconde horários que já começaram
            ->map(fn ($t) => [
                'time' => $t->format('H:i'),
                'starts_at' => $t->toIso8601String(),
                'available' => max(0, $center->slot_capacity - ($ocupados[$t->format('H:i')] ?? 0)),
            ])->values();

        return ['center_id' => $center->id, 'date' => $dia->toDateString(), 'open' => true, 'reason' => null, 'slots' => $slots];
    }
}
