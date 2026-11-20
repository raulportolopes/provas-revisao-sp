<?php

namespace App\Services;

use App\Models\Part;
use App\Models\User;
use App\Models\WorkOrder;
use Illuminate\Support\Facades\DB;

/**
 * Máquina de estados da ordem de serviço. TODA mudança de situação passa por aqui.
 *
 *   aberta ──> em_execucao <──> aguardando_peca
 *                  │
 *                  v
 *              concluida ──> entregue
 *   aberta / aguardando_peca ──> cancelada
 *
 * "quem": oficina = gerente ou mecânico responsável; balcao = atendente ou gerente.
 */
class FluxoOrdem
{
    public const TRANSICOES = [
        'em_execucao' => ['de' => ['aberta', 'aguardando_peca'], 'quem' => 'oficina', 'botao' => 'Iniciar execução'],
        'aguardando_peca' => ['de' => ['em_execucao'], 'quem' => 'oficina', 'botao' => 'Aguardar peça'],
        'concluida' => ['de' => ['em_execucao'], 'quem' => 'oficina', 'botao' => 'Concluir serviço'],
        'entregue' => ['de' => ['concluida'], 'quem' => 'balcao', 'botao' => 'Registrar entrega'],
        'cancelada' => ['de' => ['aberta', 'aguardando_peca'], 'quem' => 'balcao', 'botao' => 'Cancelar ordem'],
    ];

    // O CARGO pode pedir essa transição nesta ordem? (false = 403)
    public function cargoPode(User $user, WorkOrder $ordem, string $para): bool
    {
        $regra = self::TRANSICOES[$para] ?? null;
        if (! $regra) {
            return false;
        }

        return match ($regra['quem']) {
            'oficina' => $user->ehGerente() || ($user->ehMecanico() && $ordem->mechanic_id === $user->id),
            'balcao' => $user->ehBalcao(),
        };
    }

    // A ordem, do jeito que está, aceita a transição? Devolve a mensagem de erro ou null.
    public function problema(WorkOrder $ordem, string $para): ?string
    {
        $regra = self::TRANSICOES[$para];
        if (! in_array($ordem->status, $regra['de'], true)) {
            return 'Não é possível passar de "' . $ordem->situacao() . '" para "' . WorkOrder::SITUACOES[$para] . '".';
        }
        if ($para === 'em_execucao' && ! $ordem->mechanic_id) {
            return 'Defina o mecânico responsável antes de iniciar a execução.';
        }
        if ($para === 'concluida' && $ordem->services()->count() === 0) {
            return 'A ordem precisa ter pelo menos um serviço para ser concluída.';
        }

        return null;
    }

    // Botões que aparecem para este usuário na tela de detalhes
    public function opcoes(User $user, WorkOrder $ordem): array
    {
        $lista = [];
        foreach (self::TRANSICOES as $para => $regra) {
            if (in_array($ordem->status, $regra['de'], true) && $this->cargoPode($user, $ordem, $para)) {
                $lista[$para] = $regra['botao'];
            }
        }

        return $lista;
    }

    // Executa a transição com os efeitos colaterais, tudo numa transação.
    public function executar(User $user, WorkOrder $ordem, string $para, ?string $nota): void
    {
        DB::transaction(function () use ($user, $ordem, $para, $nota) {
            $de = $ordem->status;
            $ordem->status = $para;

            if ($para === 'concluida') {
                $ordem->finished_at = now();
            }
            if ($para === 'entregue') {
                $ordem->delivered_at = now();
            }
            if ($para === 'cancelada') {
                $ordem->cancel_reason = $nota;
                // Peças lançadas voltam para o estoque (os itens ficam na ordem como histórico)
                foreach ($ordem->items as $item) {
                    Part::whereKey($item->part_id)->increment('stock', $item->quantity);
                }
            }
            $ordem->save();

            $ordem->logs()->create([
                'user_id' => $user->id,
                'from_status' => $de,
                'to_status' => $para,
                'note' => $nota,
            ]);
        });
    }
}
