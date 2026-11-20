<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceOrder extends Model
{
    use SoftDeletes;   // delete() só preenche deleted_at; as consultas normais passam a ignorar a OS

    public const LABELS = [
        'aberta' => 'Aberta', 'orcada' => 'Orçada', 'aprovada' => 'Aprovada', 'em_execucao' => 'Em execução',
        'concluida' => 'Concluída', 'entregue' => 'Entregue', 'cancelada' => 'Cancelada',
    ];

    /** Máquina de estados: de onde pode ir para onde. */
    public const TRANSITIONS = [
        'aberta'      => ['orcada', 'cancelada'],
        'orcada'      => ['aberta', 'aprovada', 'cancelada'],
        'aprovada'    => ['em_execucao', 'cancelada'],
        'em_execucao' => ['concluida'],
        'concluida'   => ['entregue'],
        'entregue'    => [],
        'cancelada'   => [],
    ];

    /** Situações em que o estoque já foi baixado. */
    public const STOCK_TAKEN = ['aprovada', 'em_execucao', 'concluida', 'entregue'];

    protected $fillable = ['number', 'vehicle_id', 'mechanic_id', 'status', 'complaint', 'discount_percent', 'opened_at', 'delivered_at'];
    protected function casts(): array
    {
        return ['opened_at' => 'datetime', 'delivered_at' => 'datetime', 'discount_percent' => 'float'];
    }

    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }
    public function mechanic(): BelongsTo { return $this->belongsTo(User::class, 'mechanic_id'); }
    public function items(): HasMany { return $this->hasMany(ServiceOrderItem::class); }
    public function photos(): HasMany { return $this->hasMany(ServiceOrderPhoto::class); }
    public function events(): HasMany { return $this->hasMany(ServiceOrderEvent::class)->orderBy('id'); }

    public function canGoTo(string $status): bool { return in_array($status, self::TRANSITIONS[$this->status], true); }

    /**
     * Totais em CENTAVOS (inteiros): nunca some dinheiro em float.
     * Desconto arredondado "meio para cima" no centavo.
     */
    public function totals(): array
    {
        $pecas = $this->items->whereNotNull('part_id')->sum(fn ($i) => $i->totalCents());
        $servicos = $this->items->whereNotNull('service_id')->sum(fn ($i) => $i->totalCents());
        $sub = $pecas + $servicos;
        $desconto = (int) round($sub * $this->discount_percent / 100, 0, PHP_ROUND_HALF_UP);
        return [
            'parts_cents' => $pecas, 'services_cents' => $servicos, 'subtotal_cents' => $sub,
            'discount_percent' => $this->discount_percent, 'discount_cents' => $desconto,
            'total_cents' => $sub - $desconto, 'total_formatted' => self::brl($sub - $desconto),
        ];
    }

    /** 123456 -> "R$ 1.234,56" */
    public static function brl(int $centavos): string
    {
        return 'R$ ' . number_format($centavos / 100, 2, ',', '.');
    }
}
