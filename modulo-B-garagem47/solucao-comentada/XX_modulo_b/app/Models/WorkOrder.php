<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class WorkOrder extends Model
{
    // Rótulos para exibir (o banco guarda a chave sem acento)
    public const SITUACOES = [
        'aberta' => 'Aberta',
        'em_execucao' => 'Em execução',
        'aguardando_peca' => 'Aguardando peça',
        'concluida' => 'Concluída',
        'entregue' => 'Entregue',
        'cancelada' => 'Cancelada',
    ];

    // Situações em que a ordem ainda "está na oficina" (podem atrasar, bloqueiam nova ordem do veículo)
    public const EM_ANDAMENTO = ['aberta', 'em_execucao', 'aguardando_peca'];

    // Situações em que dá para editar dados, serviços, peças
    public const EDITAVEIS = ['aberta', 'em_execucao', 'aguardando_peca'];

    protected $fillable = [
        'code', 'vehicle_id', 'mechanic_id', 'created_by', 'status', 'km', 'complaint',
        'opened_at', 'due_date', 'finished_at', 'delivered_at', 'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'due_date' => 'date',
            'finished_at' => 'datetime',
            'delivered_at' => 'datetime',
            'km' => 'integer',
        ];
    }

    // ---------- relações ----------
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function mechanic() { return $this->belongsTo(User::class, 'mechanic_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }

    // N:N com dado extra na pivot (preço congelado no momento em que o serviço entrou)
    public function services() { return $this->belongsToMany(Service::class)->withPivot('price'); }

    public function items() { return $this->hasMany(WorkOrderItem::class); }
    public function logs() { return $this->hasMany(StatusLog::class)->orderBy('created_at')->orderBy('id'); }
    public function photos() { return $this->hasMany(Photo::class); }

    // ---------- regras calculadas ----------
    public function situacao(): string { return self::SITUACOES[$this->status] ?? $this->status; }

    public function totalServicos(): float { return (float) $this->services->sum('pivot.price'); }
    public function totalPecas(): float { return (float) $this->items->sum(fn ($i) => $i->subtotal()); }
    public function total(): float { return round($this->totalServicos() + $this->totalPecas(), 2); }

    public function estaEditavel(): bool { return in_array($this->status, self::EDITAVEIS, true); }

    // Atrasada = ainda na oficina e o prazo já passou (o prazo de hoje ainda não é atraso)
    public function estaAtrasada(): bool
    {
        return in_array($this->status, self::EM_ANDAMENTO, true) && $this->due_date->lt(Carbon::today());
    }

    public function diasDeAtraso(): int
    {
        return $this->estaAtrasada() ? (int) $this->due_date->diffInDays(Carbon::today()) : 0;
    }

    // ---------- scopes (usados na listagem e no painel) ----------

    // O mecânico só enxerga as ordens dele. Os outros cargos veem tudo.
    public function scopeVisiveisPara(Builder $q, User $user): Builder
    {
        return $user->ehMecanico() ? $q->where('mechanic_id', $user->id) : $q;
    }

    public function scopeAtrasadas(Builder $q): Builder
    {
        return $q->whereIn('status', self::EM_ANDAMENTO)->whereDate('due_date', '<', Carbon::today());
    }

    // Total calculado no SQL (para poder ORDENAR por total na listagem).
    // Serviços: soma dos preços da pivot. Peças: soma de quantidade x preço.
    public function scopeComTotal(Builder $q): Builder
    {
        return $q->select('work_orders.*')->selectRaw(
            '(SELECT COALESCE(SUM(sw.price), 0) FROM service_work_order sw WHERE sw.work_order_id = work_orders.id)'
            . ' + (SELECT COALESCE(SUM(pw.quantity * pw.unit_price), 0) FROM part_work_order pw WHERE pw.work_order_id = work_orders.id)'
            . ' AS total_calculado'
        );
    }
}
