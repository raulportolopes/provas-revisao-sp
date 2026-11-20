<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Uso na rota: ->middleware('role:admin,atendente'). Outro papel recebe 403. */
class Role
{
    public function handle(Request $request, Closure $next, string ...$papeis)
    {
        if (! in_array($request->user()?->role, $papeis, true)) {
            return response()->json(['message' => 'Seu perfil não tem permissão para esta ação.'], 403);
        }
        return $next($request);
    }
}
