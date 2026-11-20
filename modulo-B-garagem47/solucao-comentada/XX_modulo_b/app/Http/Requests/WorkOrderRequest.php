<?php

namespace App\Http\Requests;

use App\Models\Vehicle;
use App\Models\WorkOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação da ordem de serviço. O mesmo Request serve para criar (POST) e editar (PUT):
 * $this->route('ordem') é null na criação e é a ordem na edição.
 */
class WorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ordem = $this->route('ordem');

        // false aqui = 403 automático
        return $ordem ? $this->user()->can('update', $ordem) : $this->user()->can('create', WorkOrder::class);
    }

    public function rules(): array
    {
        $ordem = $this->route('ordem');

        // Mecânico precisa existir, ter cargo mecanico e estar ativo
        $mecanicoValido = Rule::exists('users', 'id')->where('role', 'mecanico')->where('active', 1);

        // Serviço: ativo; na edição também vale um serviço inativo que JÁ estava na ordem
        $jaNaOrdem = $ordem ? $ordem->services()->pluck('services.id')->all() : [];
        $servicoValido = function ($atributo, $valor, $falha) use ($jaNaOrdem) {
            $ok = \App\Models\Service::whereKey($valor)->where('active', 1)->exists() || in_array((int) $valor, $jaNaOrdem, true);
            if (! $ok) {
                $falha('Serviço inválido ou inativo.');
            }
        };

        $regras = [
            'complaint' => ['required', 'string', 'min:10', 'max:500'],
            'services' => ['nullable', 'array'],
            'services.*' => ['integer', $servicoValido],
        ];

        if (! $ordem) {
            // ----- criação -----
            $regras['vehicle_id'] = ['required', 'integer', 'exists:vehicles,id', function ($a, $valor, $falha) {
                // Um veículo não pode ter duas ordens não finalizadas ao mesmo tempo
                $outra = WorkOrder::where('vehicle_id', $valor)
                    ->whereNotIn('status', ['entregue', 'cancelada'])->first();
                if ($outra) {
                    $falha("O veículo já tem a ordem {$outra->code} em andamento.");
                }
            }];
            $regras['km'] = ['required', 'integer', 'min:0', function ($a, $valor, $falha) {
                // A quilometragem não pode ser menor que a última registrada para o veículo
                $ultima = WorkOrder::where('vehicle_id', $this->input('vehicle_id'))->max('km');
                if ($ultima !== null && (int) $valor < $ultima) {
                    $falha('A quilometragem não pode ser menor que a última registrada para o veículo (' . number_format($ultima, 0, ',', '.') . ' km).');
                }
            }];
            $regras['due_date'] = ['required', 'date_format:Y-m-d', 'after_or_equal:today'];
            $regras['mechanic_id'] = ['nullable', 'integer', $mecanicoValido];
        } else {
            // ----- edição -----
            $regras['due_date'] = ['required', 'date_format:Y-m-d', 'after_or_equal:' . $ordem->opened_at->format('Y-m-d')];
            // Depois que a execução começou, a ordem não pode ficar sem mecânico
            $obrigatorio = $ordem->status === 'aberta' ? 'nullable' : 'required';
            $regras['mechanic_id'] = [$obrigatorio, 'integer', $mecanicoValido];
        }

        return $regras;
    }

    public function messages(): array
    {
        return [
            'due_date.after_or_equal' => 'O prazo de entrega não pode ser anterior à data de abertura.',
            'mechanic_id.required' => 'A ordem já está em execução: o mecânico é obrigatório.',
            'mechanic_id.exists' => 'Escolha um mecânico ativo.',
        ];
    }
}
