<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DonorController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\Staff\AppointmentController;
use App\Http\Controllers\Api\Staff\ReportController;
use Illuminate\Support\Facades\Route;

// ---------- público
Route::get('/', [PublicController::class, 'index']);
Route::get('/blood-stock', [PublicController::class, 'stock']);
Route::get('/centers', [PublicController::class, 'centers']);
Route::get('/centers/{center}/slots', [PublicController::class, 'slots'])->whereNumber('center');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);

// ---------- qualquer token
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ---------- doador (habilidade "donor"; token da equipe recebe 403)
Route::middleware(['auth:sanctum', 'abilities:donor'])->prefix('me')->group(function () {
    Route::get('/', [DonorController::class, 'me']);
    Route::get('/appointments', [DonorController::class, 'index']);
    Route::post('/appointments', [DonorController::class, 'store']);
    Route::delete('/appointments/{appointment}', [DonorController::class, 'cancel'])->whereNumber('appointment');
    Route::post('/guardian-document', [DonorController::class, 'guardianDocument']);
});

// ---------- equipe (habilidade "staff"; token de doador recebe 403)
Route::middleware(['auth:sanctum', 'abilities:staff'])->prefix('staff')->group(function () {
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/export', [AppointmentController::class, 'export']);
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'status'])->whereNumber('appointment');
    Route::get('/appointments/{appointment}/history', [AppointmentController::class, 'history'])->whereNumber('appointment');
    Route::get('/reports/monthly', [ReportController::class, 'monthly']);
});
