<?php

namespace App\Http\Requests;

use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // "1.234,50" -> "1234.50"; checkbox desmarcado não é enviado, então vira false
        $this->merge([
            'price' => Formato::numeroDigitado($this->price),
            'active' => $this->boolean('active'),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80', Rule::unique('services', 'name')->ignore($this->route('servico')?->id)],
            'price' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:99999.99'],
            'active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return ['name.unique' => 'Já existe um serviço com este nome.'];
    }
}
