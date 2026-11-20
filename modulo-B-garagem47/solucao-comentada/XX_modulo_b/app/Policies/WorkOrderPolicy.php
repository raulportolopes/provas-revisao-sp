<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkOrder;

/**
 * Quem pode o quê em uma ordem de serviço.
 * Usado com $this->authorize('update', $ordem) nos controllers (gera 403 se negar)
 * e com @can('update', $ordem) nas views (esconde o botão).
 * As duas coisas são obrigatórias: esconder o botão NÃO protege a rota.
 */
class WorkOrderPolicy
{
    // Mecânico só abre as ordens atribuídas a ele; atendente e gerente veem todas.
    public function view(User $user, WorkOrder $ordem): bool
    {
        return ! $user->ehMecanico() || $ordem->mechanic_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->ehBalcao();
    }

    // Editar dados e serviços: balcão, e só enquanto a ordem estiver na oficina.
    public function update(User $user, WorkOrder $ordem): bool
    {
        return $user->ehBalcao() && $ordem->estaEditavel();
    }

    // Lançar e retirar peças: gerente ou o mecânico responsável, com a ordem em execução ou aguardando peça.
    public function pecas(User $user, WorkOrder $ordem): bool
    {
        $quem = $user->ehGerente() || ($user->ehMecanico() && $ordem->mechanic_id === $user->id);

        return $quem && in_array($ordem->status, ['em_execucao', 'aguardando_peca'], true);
    }

    // Enviar fotos: quem pode ver a ordem, até ela ser entregue ou cancelada.
    public function fotos(User $user, WorkOrder $ordem): bool
    {
        return $this->view($user, $ordem) && ! in_array($ordem->status, ['entregue', 'cancelada'], true);
    }

    // Apagar: só gerente, e só ordem cancelada (ordem com histórico financeiro não some).
    public function delete(User $user, WorkOrder $ordem): bool
    {
        return $user->ehGerente() && $ordem->status === 'cancelada';
    }
}
