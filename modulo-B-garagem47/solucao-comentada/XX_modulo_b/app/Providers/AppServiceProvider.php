<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        // Route::resource passa a gerar /clientes/criar e /clientes/{id}/editar (em vez de create/edit)
        Route::resourceVerbs(['create' => 'criar', 'edit' => 'editar']);

        // Gates simples, por cargo. Usados como middleware "can:clientes" nas rotas
        // e com @can('clientes') nas views (para esconder links e botões).
        Gate::define('clientes', fn (User $u) => $u->ehBalcao());
        Gate::define('servicos', fn (User $u) => $u->ehGerente());
        Gate::define('exportar', fn (User $u) => $u->ehGerente());

        // As regras que dependem do REGISTRO (ex.: mecânico só mexe na ordem dele)
        // ficam em app/Policies/WorkOrderPolicy.php e PhotoPolicy.php.
        // O Laravel acha as policies sozinho pelo nome (WorkOrder -> WorkOrderPolicy).
    }
}
