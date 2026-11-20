<?php

namespace App\Http\Requests;

use App\Support\Formato;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // a permissão já foi checada pelo middleware can:clientes
    }

    // Roda ANTES das regras: guardamos só os dígitos de CPF e telefone.
    // Assim "123.456.789-09" e "12345678909" viram a mesma coisa e o unique funciona.
    protected function prepareForValidation(): void
    {
        $this->merge([
            'cpf' => Formato::digitos($this->cpf),
            'phone' => Formato::digitos($this->phone),
            'name' => trim((string) $this->name),
        ]);
    }

    public function rules(): array
    {
        $id = $this->route('cliente')?->id; // na edição, ignora o próprio registro no unique

        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'cpf' => [
                'required', 'digits:11', Rule::unique('customers', 'cpf')->ignore($id),
                // Regra própria em closure: confere os dígitos verificadores
                function ($atributo, $valor, $falha) {
                    if (! self::cpfValido($valor)) {
                        $falha('O CPF informado é inválido.');
                    }
                },
            ],
            'phone' => ['required', 'digits_between:10,11'],
            'email' => ['nullable', 'email', 'max:150'],
        ];
    }

    public function messages(): array
    {
        return ['cpf.unique' => 'Já existe um cliente com este CPF.', 'cpf.digits' => 'O CPF deve ter 11 dígitos.'];
    }

    // Algoritmo do CPF: dois dígitos verificadores calculados com pesos 10..2 e 11..2.
    public static function cpfValido(string $cpf): bool
    {
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false; // tamanho errado ou todos iguais (111.111.111-11)
        }
        for ($t = 9; $t < 11; $t++) {
            $soma = 0;
            for ($i = 0; $i < $t; $i++) {
                $soma += (int) $cpf[$i] * (($t + 1) - $i);
            }
            $dv = ((10 * $soma) % 11) % 10;
            if ((int) $cpf[$t] !== $dv) {
                return false;
            }
        }

        return true;
    }
}
