<?php
use Illuminate\Support\Facades\Route;

// Projeto só de API: a raiz manda para o índice da API.
Route::redirect('/', '/api');
