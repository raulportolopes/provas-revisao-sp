<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'form'])->name('login');
    Route::post('/login', [AuthController::class, 'entrar'])->name('login.entrar');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'sair'])->name('logout');
    Route::get('/', DashboardController::class)->name('painel');

    // ---------- Turmas: listar/ver para todos (Policy filtra o professor); criar/editar/apagar só coordenação ----------
    Route::get('/turmas/{turma}/apagar', [SchoolClassController::class, 'apagar'])->name('turmas.apagar');
    Route::resource('turmas', SchoolClassController::class)->parameters(['turmas' => 'turma'])->names('turmas');

    // ---------- Alunos e matrículas (secretaria e coordenação) ----------
    Route::middleware('can:alunos')->group(function () {
        Route::get('/alunos/{aluno}/apagar', [StudentController::class, 'apagar'])->name('alunos.apagar');
        Route::resource('alunos', StudentController::class)->parameters(['alunos' => 'aluno'])->names('alunos');
        Route::post('/alunos/{aluno}/matriculas', [EnrollmentController::class, 'store'])->name('matriculas.store');
        Route::post('/matriculas/{matricula}/cancelar', [EnrollmentController::class, 'cancelar'])->name('matriculas.cancelar');
    });

    // ---------- Mensalidades ----------
    Route::middleware('can:financeiro')->group(function () {
        Route::get('/mensalidades', [InvoiceController::class, 'index'])->name('mensalidades.index');
        Route::post('/mensalidades/{mensalidade}/pagar', [InvoiceController::class, 'pagar'])->name('mensalidades.pagar');
    });
    Route::middleware('can:coordenacao')->group(function () {
        Route::get('/mensalidades/exportar', [InvoiceController::class, 'exportar'])->name('mensalidades.exportar');
        Route::post('/mensalidades/{mensalidade}/estornar', [InvoiceController::class, 'estornar'])->name('mensalidades.estornar');
        Route::get('/relatorios/inadimplencia', [ReportController::class, 'inadimplencia'])->name('relatorios.inadimplencia');
    });
});
