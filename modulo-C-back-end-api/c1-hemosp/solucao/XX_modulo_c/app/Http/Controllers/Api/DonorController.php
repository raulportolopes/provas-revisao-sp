<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Center;
use App\Services\Agendamento;
use App\Services\Elegibilidade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Rotas do doador logado (token com habilidade "donor"). */
class DonorController extends Controller
{
    /** GET /api/me – perfil + situação para doar hoje. */
    public function me(Request $request, Elegibilidade $eleg)
    {
        $d = $request->user()->load('bloodType');
        $motivos = $eleg->motivos($d, today());
        return [
            'id' => $d->id, 'name' => $d->name, 'email' => $d->email, 'cpf' => $d->maskedCpf(),
            'sex' => $d->sex, 'age' => $d->ageOn(today()), 'weight_kg' => $d->weight_kg,
            'blood_type' => $d->bloodType?->code,
            'guardian_document' => (bool) $d->guardian_document_path,
            'eligibility' => [
                'eligible_today' => $motivos === [],
                'next_eligible_date' => $eleg->proximaData($d)?->toDateString(),
                'reasons' => $motivos,
            ],
        ];
    }

    /** GET /api/me/appointments?status=&page= – 5 por página, mais recentes primeiro. */
    public function index(Request $request)
    {
        $request->validate(['status' => ['nullable', Rule::in(array_keys(Appointment::LABELS))]]);
        $p = $request->user()->appointments()->with('center')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('starts_at')->orderByDesc('id')
            ->paginate(5);

        return [
            'data' => AppointmentResource::collection($p->items()),
            'meta' => ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'per_page' => $p->perPage(), 'total' => $p->total()],
        ];
    }

    /** POST /api/me/appointments {center_id, starts_at: "Y-m-d H:i"} */
    public function store(Request $request, Agendamento $agendamento)
    {
        $dados = $request->validate([
            'center_id' => ['required', 'integer', Rule::exists('centers', 'id')->where('active', true)],
            'starts_at' => ['required', 'date_format:Y-m-d H:i'],
        ], ['center_id.exists' => 'Unidade inexistente ou inativa.']);

        // o service devolve o agendamento criado ou lança a resposta de erro (422/409)
        $a = $agendamento->criar($request->user(), Center::find($dados['center_id']), $dados['starts_at']);
        return (new AppointmentResource($a->load('center')))->response()->setStatusCode(201);
    }

    /** DELETE /api/me/appointments/{appointment} – cancela (não apaga a linha!). */
    public function cancel(Request $request, Appointment $appointment, Agendamento $agendamento)
    {
        if ($appointment->donor_id !== $request->user()->id) {
            return response()->json(['message' => 'Este agendamento não é seu.'], 403);
        }
        if ($appointment->status !== 'scheduled') {
            return response()->json(['message' => 'Só é possível cancelar agendamentos com situação "Agendado".'], 409);
        }
        if ($appointment->starts_at->lt(now()->addHours(2))) {
            return response()->json(['message' => 'O cancelamento precisa ser feito com pelo menos 2 horas de antecedência.'], 409);
        }
        $agendamento->mudarSituacao($appointment, 'cancelled', null, 'Cancelado pelo doador');
        return new AppointmentResource($appointment->fresh()->load('center'));
    }

    /** POST /api/me/guardian-document (multipart, campo "document") – só para menores de 18. */
    public function guardianDocument(Request $request)
    {
        $request->validate(['document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048']]);
        $d = $request->user();
        if ($d->ageOn(today()) >= 18) {
            return response()->json(['message' => 'A autorização só é necessária para menores de 18 anos.'], 409);
        }
        // disco "local" = storage/app/private: documento pessoal NÃO pode ter URL pública
        $nome = Str::uuid() . '.' . $request->file('document')->extension();
        $caminho = $request->file('document')->storeAs('guardians', $nome, 'local');
        if ($d->guardian_document_path) Storage::disk('local')->delete($d->guardian_document_path);
        $d->update(['guardian_document_path' => $caminho]);

        return response()->json(['message' => 'Documento recebido.', 'guardian_document' => true], 201);
    }
}
