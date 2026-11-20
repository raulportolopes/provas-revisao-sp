<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    // No Laravel 11/12 o Controller base vem vazio. Sem este trait, $this->authorize() não existe.
    use AuthorizesRequests;
}
