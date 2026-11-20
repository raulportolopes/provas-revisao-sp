<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // "role:admin,atendente" nas rotas = só esses perfis passam (senão 403)
        $middleware->alias(['role' => \App\Http\Middleware\Role::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Na API, TODO erro sai em JSON com a mensagem em português (nunca a página HTML do Laravel)
        $api = fn (Request $r) => $r->is('api') || $r->is('api/*');
        $exceptions->shouldRenderJsonWhen(fn (Request $r) => $api($r) || $r->expectsJson());
        $exceptions->render(fn (AuthenticationException $e, Request $r) =>
            $api($r) ? response()->json(['message' => 'Não autenticado.'], 401) : null);
        $exceptions->render(fn (AccessDeniedHttpException $e, Request $r) =>
            $api($r) ? response()->json(['message' => $e->getMessage() ?: 'Acesso negado.'], 403) : null);
        $exceptions->render(fn (NotFoundHttpException $e, Request $r) =>
            $api($r) ? response()->json(['message' => 'Recurso não encontrado.'], 404) : null);
        $exceptions->render(fn (MethodNotAllowedHttpException $e, Request $r) =>
            $api($r) ? response()->json(['message' => 'Método não permitido.'], 405, $e->getHeaders()) : null);
        $exceptions->render(fn (ValidationException $e, Request $r) =>
            $api($r) ? response()->json(['message' => 'Dados inválidos.', 'errors' => $e->errors()], 422) : null);
    })->create();
