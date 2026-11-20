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
        Route::resourceVerbs(['create' => 'criar', 'edit' => 'editar']);

        // Gates por cargo (rotas: middleware can:...; views: @can)
        Gate::define('alunos', fn (User $u) => $u->ehAdministrativo());       // alunos e matrículas
        Gate::define('financeiro', fn (User $u) => $u->ehAdministrativo());   // ver mensalidades e registrar pagamento
        Gate::define('coordenacao', fn (User $u) => $u->ehCoordenacao());     // turmas, estorno, relatório, CSV
    }
}
