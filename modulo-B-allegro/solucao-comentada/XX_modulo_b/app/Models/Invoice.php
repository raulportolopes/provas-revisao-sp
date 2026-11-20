<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/** Mensalidade. Situação calculada: paga, aberta (não venceu) ou vencida. */
class Invoice extends Model
{
    public const SITUACOES = ['paga' => 'Paga', 'aberta' => 'Em aberto', 'vencida' => 'Vencida'];

    public const MULTA = 0.02;      // 2% uma vez
    public const JUROS_MES = 0.01;  // 1% ao mês, proporcional aos dias (dias / 30)

    protected $fillable = ['enrollment_id', 'reference_month', 'due_date', 'amount', 'paid_at', 'paid_amount'];

    protected function casts(): array
    {
        return ['reference_month' => 'date', 'due_date' => 'date', 'paid_at' => 'date',
            'amount' => 'decimal:2', 'paid_amount' => 'decimal:2'];
    }

    public function enrollment() { return $this->belongsTo(Enrollment::class); }

    public function situacao(): string
    {
        if ($this->paid_at) {
            return 'paga';
        }

        return $this->due_date->lt(Carbon::today()) ? 'vencida' : 'aberta';
    }

    // Dias de atraso na data informada (pagamento) ou hoje. Pagar NO vencimento = 0 dias.
    public function diasDeAtraso(?Carbon $em = null): int
    {
        $em ??= Carbon::today();

        return $em->gt($this->due_date) ? (int) $this->due_date->diffInDays($em) : 0;
    }

    // Valor com multa de 2% + juros de 1% ao mês pro rata dia, arredondado em centavos.
    // Ex.: R$ 200,00 com 9 dias de atraso = 200 × (1 + 0,02 + 0,01 × 9/30) = R$ 204,60
    public function valorAtualizado(?Carbon $em = null): float
    {
        $dias = $this->diasDeAtraso($em);
        $valor = (float) $this->amount;
        if ($dias === 0) {
            return round($valor, 2);
        }

        return round($valor * (1 + self::MULTA + self::JUROS_MES * $dias / 30), 2);
    }

    // ---------- scopes para os filtros ----------
    public function scopeNaSituacao(Builder $q, string $s): Builder
    {
        return match ($s) {
            'paga' => $q->whereNotNull('paid_at'),
            'aberta' => $q->whereNull('paid_at')->whereDate('due_date', '>=', Carbon::today()),
            'vencida' => $q->whereNull('paid_at')->whereDate('due_date', '<', Carbon::today()),
            default => $q,
        };
    }
}
