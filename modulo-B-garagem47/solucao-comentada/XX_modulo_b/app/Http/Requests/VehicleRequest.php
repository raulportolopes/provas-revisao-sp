<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // "abc-1234" e "ABC1234" viram "ABC1234" antes de validar (o banco guarda sem hífen, maiúsculo)
    protected function prepareForValidation(): void
    {
        $this->merge(['plate' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $this->plate))]);
    }

    public function rules(): array
    {
        $id = $this->route('veiculo')?->id;

        return [
            // Padrão antigo ABC1234 ou Mercosul ABC1D23: 3 letras, 1 número, letra ou número, 2 números
            'plate' => ['required', 'regex:/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/', Rule::unique('vehicles', 'plate')->ignore($id)],
            'brand' => ['required', 'string', 'max:40'],
            'model' => ['required', 'string', 'max:60'],
            'year' => ['required', 'integer', 'between:1950,' . (now()->year + 1)],
        ];
    }

    public function messages(): array
    {
        return [
            'plate.regex' => 'Placa inválida. Use o padrão ABC1234 ou ABC1D23.',
            'plate.unique' => 'Esta placa já está cadastrada.',
        ];
    }
}
