<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('titulo') · Garagem 47</title>
    {{-- asset() monta a URL a partir do APP_URL: funciona em /XX_modulo_b/ --}}
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
<header class="topo">
    <div class="wrap">
        <a class="marca" href="{{ route('painel') }}">GARAGEM <span>47</span></a>
        @auth
            <nav class="menu" aria-label="Menu principal">
                <span class="quem">{{ auth()->user()->name }} · {{ auth()->user()->cargo() }}</span>
                <a href="{{ route('painel') }}" @if(request()->routeIs('painel')) aria-current="page" @endif>Painel</a>
                <a href="{{ route('ordens.index') }}" @if(request()->routeIs('ordens.*')) aria-current="page" @endif>Ordens</a>
                {{-- @can esconde o link; a rota continua protegida pelo middleware can:clientes --}}
                @can('clientes')
                    <a href="{{ route('clientes.index') }}" @if(request()->routeIs('clientes.*', 'veiculos.*')) aria-current="page" @endif>Clientes</a>
                @endcan
                @can('servicos')
                    <a href="{{ route('servicos.index') }}" @if(request()->routeIs('servicos.*')) aria-current="page" @endif>Serviços</a>
                @endcan
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit">Sair</button>
                </form>
            </nav>
        @endauth
    </div>
</header>
<main class="wrap">
    {{-- Mensagens "flash": duram só uma requisição (with('ok', ...) no controller) --}}
    @if (session('ok'))
        <div class="alerta ok" role="status">{{ session('ok') }}</div>
    @endif
    @if (session('erro'))
        <div class="alerta erro" role="alert">{{ session('erro') }}</div>
    @endif
    @if ($errors->any())
        <div class="alerta erro" role="alert">
            <strong>Corrija os campos abaixo:</strong>
            <ul>@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
        </div>
    @endif
    @yield('conteudo')
</main>
</body>
</html>
