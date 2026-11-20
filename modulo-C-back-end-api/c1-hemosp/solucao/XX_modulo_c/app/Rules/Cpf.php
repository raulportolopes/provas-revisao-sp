<?php
namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** CPF com dígitos verificadores válidos (aceita com ou sem máscara). */
class Cpf implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $c = preg_replace('/\D/', '', (string) $value);
        if (strlen($c) !== 11 || preg_match('/^(\d)\1{10}$/', $c)) {
            $fail('CPF inválido.');
            return;
        }
        foreach ([9, 10] as $n) {               // calcula o 10º e depois o 11º dígito
            $soma = 0;
            for ($i = 0; $i < $n; $i++) $soma += $c[$i] * ($n + 1 - $i);
            $dv = ($soma * 10) % 11 % 10;
            if ((int) $c[$n] !== $dv) {
                $fail('CPF inválido.');
                return;
            }
        }
    }
}
