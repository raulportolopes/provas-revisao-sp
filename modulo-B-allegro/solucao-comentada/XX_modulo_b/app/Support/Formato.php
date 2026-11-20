<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Formatação no padrão brasileiro, usada em todas as views.
 * Registrada como alias "Formato" em config/app.php, então na Blade basta
 * escrever {{ Formato::moeda($valor) }}.
 */
class Formato
{
    // 1057.98 -> "R$ 1.057,98" (separador de milhar ponto, decimal vírgula, sempre 2 casas)
    public static function moeda($valor): string
    {
        $valor = (float) $valor;
        $texto = 'R$ ' . number_format(abs($valor), 2, ',', '.');

        return $valor < 0 ? '-' . $texto : $texto;
    }

    // Carbon ou string "2026-11-19" -> "19/11/2026". Nulo vira "-".
    public static function data($data): string
    {
        if (! $data) {
            return '-';
        }

        return ($data instanceof CarbonInterface ? $data : \Illuminate\Support\Carbon::parse($data))->format('d/m/Y');
    }

    // "19/11/2026 14:05"
    public static function dataHora($data): string
    {
        if (! $data) {
            return '-';
        }

        return ($data instanceof CarbonInterface ? $data : \Illuminate\Support\Carbon::parse($data))->format('d/m/Y H:i');
    }

    // "12345678909" -> "123.456.789-09"
    public static function cpf(?string $cpf): string
    {
        if (! $cpf || strlen($cpf) !== 11) {
            return (string) $cpf;
        }

        return substr($cpf, 0, 3) . '.' . substr($cpf, 3, 3) . '.' . substr($cpf, 6, 3) . '-' . substr($cpf, 9, 2);
    }

    // "15991234567" -> "(15) 99123-4567"; "1532345678" -> "(15) 3234-5678"
    public static function telefone(?string $tel): string
    {
        if (! $tel) {
            return '-';
        }
        $meio = strlen($tel) === 11 ? 5 : 4;

        return '(' . substr($tel, 0, 2) . ') ' . substr($tel, 2, $meio) . '-' . substr($tel, 2 + $meio);
    }

    // Converte o que o usuário digitou ("1.234,56", "1234,56" ou "1234.56") em "1234.56".
    // Usado no prepareForValidation dos Form Requests, ANTES das regras numeric/decimal.
    public static function numeroDigitado($valor)
    {
        if (! is_string($valor)) {
            return $valor;
        }
        $valor = trim(str_replace(['R$', ' '], '', $valor));
        if (str_contains($valor, ',')) {
            $valor = str_replace(',', '.', str_replace('.', '', $valor));
        }

        return $valor;
    }

    // Só os dígitos ("123.456.789-09" -> "12345678909")
    public static function digitos($valor): string
    {
        return preg_replace('/\D/', '', (string) $valor);
    }
}
