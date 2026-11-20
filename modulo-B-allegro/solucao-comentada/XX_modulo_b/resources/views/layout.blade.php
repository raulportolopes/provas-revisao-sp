<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('titulo') · Allegro</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
<header class="topo">
    <div class="wrap">
        <a class="marca" href="{{ url('/') }}">ALLEGRO <span>♪</span></a>
        @auth
            <nav class="menu" aria-label="Menu principal">
                <span class="quem">{{ auth()->user()->name }} · {{ auth()->user()->cargo() }}</span>
                <a href="{{ route('painel') }}" @if(request()->routeIs('painel')) aria-current="page" @endif>Painel</a>
                <a href="{{ route('turmas.index') }}" @if(request()->routeIs('turmas.*')) aria-current="page" @endif>Turmas</a>
                @can('alunos')
                    <a href="{{ route('alunos.index') }}" @if(request()->routeIs('alunos.*')) aria-current="page" @endif>Alunos</a>
                @endcan
                @can('financeiro')
                    <a href="{{ route('mensalidades.index') }}" @if(request()->routeIs('mensalidades.*')) aria-current="page" @endif>Mensalidades</a>
                @endcan
                @can('coordenacao')
                    <a href="{{ route('relatorios.inadimplencia') }}" @if(request()->routeIs('relatorios.*')) aria-current="page" @endif>Inadimplência</a>
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
