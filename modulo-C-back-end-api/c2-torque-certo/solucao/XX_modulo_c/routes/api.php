<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PartController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => ['api' => 'Torque Certo', 'version' => '1.0']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ---------- todos os perfis
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/parts', [PartController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show'])->whereNumber('order');
    Route::post('/orders/{order}/transition', [OrderController::class, 'transition'])->whereNumber('order');
    Route::post('/orders/{order}/photos', [PhotoController::class, 'store'])->whereNumber('order');

    // ---------- balcão (admin e atendente)
    Route::middleware('role:admin,atendente')->group(function () {
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::post('/customers/{customer}/vehicles', [CustomerController::class, 'storeVehicle'])->whereNumber('customer');
        Route::post('/orders', [OrderController::class, 'store']);
        Route::post('/orders/{order}/items', [OrderController::class, 'addItem'])->whereNumber('order');
        Route::delete('/orders/{order}/items/{item}', [OrderController::class, 'removeItem'])->whereNumber(['order', 'item'])->scopeBindings();
        Route::patch('/orders/{order}/discount', [OrderController::class, 'discount'])->whereNumber('order');
        Route::get('/reports/low-stock', [ReportController::class, 'lowStock']);
    });

    // ---------- só admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/orders/trash', [OrderController::class, 'trash']);
        Route::delete('/orders/{order}', [OrderController::class, 'destroy'])->whereNumber('order');
        Route::post('/orders/{id}/restore', [OrderController::class, 'restore'])->whereNumber('id');
        Route::get('/reports/revenue', [ReportController::class, 'revenue']);
    });
});
