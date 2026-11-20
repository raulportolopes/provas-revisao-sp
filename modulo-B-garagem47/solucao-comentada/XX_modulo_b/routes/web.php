<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\WorkOrderController;
use App\Http\Controllers\WorkOrderItemController;
use App\Http\Controllers\WorkOrderStatusController;
use Illuminate\Support\Facades\Route;

/*
 * Rotas em português (é o que o enunciado pede), tabelas em inglês (é o banco fornecido).
 * Route::resource gera index/create/store/show/edit/update/destroy. Com ->names() e ->parameters()
 * as URLs ficam em português sem perder os nomes das rotas.
 */

// Visitante (não logado)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'form'])->name('login');
    Route::post('/login', [AuthController::class, 'entrar'])->name('login.entrar');
});

// Logado. O middleware "auth" manda o visitante para a rota de nome "login".
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'sair'])->name('logout');
    Route::get('/', DashboardController::class)->name('painel');

    // ---------- Clientes e veículos (atendente e gerente; o Gate "clientes" está no AppServiceProvider) ----------
    Route::middleware('can:clientes')->group(function () {
        Route::get('/clientes/{cliente}/apagar', [CustomerController::class, 'apagar'])->name('clientes.apagar');
        Route::resource('clientes', CustomerController::class)->parameters(['clientes' => 'cliente'])
            ->names('clientes');

        // Veículo é criado dentro do cliente: /clientes/3/veiculos/criar
        Route::get('/clientes/{cliente}/veiculos/criar', [VehicleController::class, 'create'])->name('veiculos.create');
        Route::post('/clientes/{cliente}/veiculos', [VehicleController::class, 'store'])->name('veiculos.store');
        Route::get('/veiculos/{veiculo}/editar', [VehicleController::class, 'edit'])->name('veiculos.edit');
        Route::put('/veiculos/{veiculo}', [VehicleController::class, 'update'])->name('veiculos.update');
        Route::delete('/veiculos/{veiculo}', [VehicleController::class, 'destroy'])->name('veiculos.destroy');
    });

    // ---------- Ordens de serviço (permissões finas ficam na WorkOrderPolicy) ----------
    Route::get('/ordens/exportar', [WorkOrderController::class, 'exportar'])->name('ordens.exportar');
    Route::get('/ordens/{ordem}/apagar', [WorkOrderController::class, 'apagar'])->name('ordens.apagar');
    Route::resource('ordens', WorkOrderController::class)->parameters(['ordens' => 'ordem'])->names('ordens');

    Route::post('/ordens/{ordem}/situacao', [WorkOrderStatusController::class, 'store'])->name('ordens.situacao');

    // scopeBindings(): /ordens/5/pecas/9 só funciona se a peça 9 for DA ordem 5 (senão 404)
    Route::scopeBindings()->group(function () {
        Route::post('/ordens/{ordem}/pecas', [WorkOrderItemController::class, 'store'])->name('ordens.pecas.store');
        Route::delete('/ordens/{ordem}/pecas/{item}', [WorkOrderItemController::class, 'destroy'])->name('ordens.pecas.destroy');
        Route::post('/ordens/{ordem}/fotos', [PhotoController::class, 'store'])->name('ordens.fotos.store');
        Route::delete('/ordens/{ordem}/fotos/{photo}', [PhotoController::class, 'destroy'])->name('ordens.fotos.destroy');
    });

    // ---------- Catálogo de serviços (só gerente) ----------
    Route::middleware('can:servicos')->group(function () {
        Route::get('/servicos/{servico}/apagar', [ServiceController::class, 'apagar'])->name('servicos.apagar');
        Route::resource('servicos', ServiceController::class)->except('show')
            ->parameters(['servicos' => 'servico'])->names('servicos');
    });
});
