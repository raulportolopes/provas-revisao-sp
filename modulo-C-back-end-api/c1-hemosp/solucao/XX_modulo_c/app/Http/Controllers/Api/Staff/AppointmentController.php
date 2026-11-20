<?php
namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\BloodType;
use App\Services\Agendamento;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Rotas da equipe (token com habilidade "staff"). */
class AppointmentController extends Controller
{
    /** Filtros comuns da listagem e da exportação. */
    private function consulta(Request $request)
    {
        return Appointment::query()
            ->with(['donor', 'center'])
            ->when($request->date, fn ($q, $d) => $q->whereBetween('starts_at', [Carbon::parse($d)->startOfDay(), Carbon::parse($d)->endOfDay()]))
            ->when($request->center_id, fn ($q, $c) => $q->where('center_id', $c))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, function ($q, $busca) {
                $digitos = preg_replace('/\D/', '', $busca);
                // só números (com ou sem máscara) = CPF; senão, parte do nome
                $q->whereHas('donor', fn ($d) => preg_match('/^[\d.\-\s]+$/', $busca)
                    ? $d->where('cpf', 'like', "{$digitos}%")
                    : $d->where('name', 'like', "%{$busca}%"));
            });
    }

    /** GET /api/staff/appointments?date=&center_id=&status=&search=&sort=&page= (10 por página) */
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'center_id' => 'nullable|integer',
            'status' => ['nullable', Rule::in(array_keys(Appointment::LABELS))],
            'sort' => ['nullable', Rule::in(['starts_at', '-starts_at', 'donor'])],
            'search' => 'nullable|string|max:100',
        ]);
        $q = $this->consulta($request);
        match ($request->input('sort', 'starts_at')) {
            'starts_at' => $q->orderBy('starts_at')->orderBy('center_id')->orderBy('id'),
            '-starts_at' => $q->orderByDesc('starts_at')->orderBy('center_id')->orderBy('id'),
            // ordenar por coluna de outra tabela: subconsulta com o nome do doador
            'donor' => $q->orderBy(\App\Models\Donor::select('name')->whereColumn('donors.id', 'appointments.donor_id'))->orderBy('starts_at'),
        };
        $p = $q->paginate(10)->withQueryString();

        return [
            'data' => AppointmentResource::collection($p->items()),
            'meta' => ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'per_page' => $p->perPage(), 'total' => $p->total()],
        ];
    }

    /** PATCH /api/staff/appointments/{appointment}/status {status, volume_ml?, unfit_reason?, blood_type?} */
    public function status(Request $request, Appointment $appointment, Agendamento $agendamento)
    {
        $request->validate(['status' => ['required', Rule::in(['attended', 'donated', 'unfit', 'no_show', 'cancelled'])]]);
        $para = $request->status;

        // 1) a transição existe na máquina de estados?
        if (! $appointment->canGoTo($para)) {
            return response()->json([
                'message' => "Transição inválida: {$appointment->status} → {$para}.",
                'allowed' => Appointment::TRANSITIONS[$appointment->status],
            ], 409);
        }
        // 2) regras de tempo
        $inicio = $appointment->starts_at;
        if ($para === 'attended' && now()->lt($inicio->copy()->subMinutes(30))) {
            return response()->json(['message' => 'Presença só pode ser registrada a partir de 30 minutos antes do horário.'], 409);
        }
        if ($para === 'no_show' && now()->lt($inicio->copy()->addMinutes(30))) {
            return response()->json(['message' => 'Falta só pode ser registrada 30 minutos depois do horário.'], 409);
        }
        // 3) campos obrigatórios de cada destino
        $extra = [];
        if ($para === 'donated') {
            $semTipo = ! $appointment->donor->blood_type_id;
            $v = $request->validate([
                'volume_ml' => 'required|integer|between:300,500',
                'blood_type' => [$semTipo ? 'required' : 'nullable', Rule::exists('blood_types', 'code')],
            ], ['blood_type.required' => 'Informe o tipo sanguíneo: o doador ainda não tem tipo cadastrado.']);
            $extra['volume_ml'] = $v['volume_ml'];
            if ($semTipo) {
                $appointment->donor->update(['blood_type_id' => BloodType::where('code', $v['blood_type'])->value('id')]);
            }
        }
        if ($para === 'unfit') {
            $extra['unfit_reason'] = $request->validate(['unfit_reason' => 'required|string|min:5|max:255'])['unfit_reason'];
        }

        $agendamento->mudarSituacao($appointment, $para, $request->user()->id, null, $extra);
        return new AppointmentResource($appointment->fresh()->load(['center', 'donor']));
    }

    /** GET /api/staff/appointments/{appointment}/history */
    public function history(Appointment $appointment)
    {
        return [
            'protocol' => $appointment->protocol,
            'events' => $appointment->events()->with('user')->get()->map(fn ($e) => [
                'from' => $e->from_status, 'to' => $e->to_status,
                'by' => $e->user?->name ?? 'Doador',
                'note' => $e->note,
                'at' => $e->created_at->toIso8601String(),
            ]),
        ];
    }

    /** GET /api/staff/appointments/export?date=Y-m-d – CSV para o Excel (BOM, ;, data brasileira). */
    public function export(Request $request)
    {
        $request->validate(['date' => 'required|date_format:Y-m-d']);
        $linhas = $this->consulta($request)->orderBy('starts_at')->orderBy('center_id')->orderBy('id')->get();

        $csv = "\u{FEFF}Protocolo;Data;Hora;Doador;CPF;Unidade;Situação\r\n";   // BOM: o Excel abre com acento certo
        foreach ($linhas as $a) {
            $campos = [$a->protocol, $a->starts_at->format('d/m/Y'), $a->starts_at->format('H:i'), $a->donor->name,
                       $a->donor->maskedCpf(), $a->center->name, Appointment::LABELS[$a->status]];
            // aspas só quando o texto tem ; ou aspas (regra do CSV)
            $csv .= implode(';', array_map(fn ($c) => preg_match('/[;"]/', $c) ? '"' . str_replace('"', '""', $c) . '"' : $c, $campos)) . "\r\n";
        }
        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="agendamentos-' . $request->date . '.csv"',
        ]);
    }
}
