<?php

namespace App\Http\Requests;

use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // middleware can:alunos já checou
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone' => Formato::digitos($this->phone),
            'guardian_phone' => $this->guardian_phone ? Formato::digitos($this->guardian_phone) : null,
            'email' => $this->email ?: null,
            'guardian_name' => trim((string) $this->guardian_name) ?: null,
        ]);
    }

    public function rules(): array
    {
        // Menor de idade = nasceu DEPOIS de (hoje - 18 anos). Quem faz 18 hoje já é maior.
        $limiteMaior = Carbon::today()->subYears(18)->toDateString();
        $menor = $this->filled('birth_date') && strtotime($this->birth_date) && $this->birth_date > $limiteMaior;

        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'birth_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:' . Carbon::today()->subYears(5)->toDateString(), 'after:1900-01-01'],
            'email' => ['nullable', 'email', 'max:150', Rule::unique('students', 'email')->ignore($this->route('aluno')?->id)],
            'phone' => ['required', 'digits_between:10,11'],
            // required_if não sabe calcular idade: usamos Rule::requiredIf com o resultado acima
            'guardian_name' => [Rule::requiredIf($menor), 'nullable', 'string', 'max:100'],
            'guardian_phone' => [Rule::requiredIf($menor), 'nullable', 'digits_between:10,11'],
        ];
    }

    public function messages(): array
    {
        return [
            'birth_date.before_or_equal' => 'O aluno deve ter pelo menos 5 anos.',
            'guardian_name.required' => 'Aluno menor de 18 anos: informe o nome do responsável.',
            'guardian_phone.required' => 'Aluno menor de 18 anos: informe o telefone do responsável.',
            'email.unique' => 'Já existe um aluno com este e-mail.',
        ];
    }
}
