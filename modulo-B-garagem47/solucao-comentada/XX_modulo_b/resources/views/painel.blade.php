@extends('layout')
@section('titulo', 'Painel')
@section('conteudo')
    <h1>Olá, {{ auth()->user()->name }}!</h1>
    <p class="muted">
        @if (auth()->user()->ehMecanico()) Estas são as suas ordens de serviço. @else Situação da oficina hoje, {{ Formato::data(now()) }}. @endif
    </p>

    <div class="grade">
        @foreach (\App\Models\WorkOrder::SITUACOES as $chave => $rotulo)
            <a class="card" href="{{ route('ordens.index', ['status' => $chave]) }}" style="text-decoration:none;color:inherit">
                <div class="numero">{{ $porSituacao[$chave] ?? 0 }}</div>
                <div class="rotulo">{{ $rotulo }}</div>
            </a>
        @endforeach
        <a class="card" href="{{ route('ordens.index', ['atrasadas' => 1]) }}" style="text-decoration:none;color:inherit">
            <div class="numero {{ $atrasadas ? 'vermelho' : '' }}">{{ $atrasadas }}</div>
            <div class="rotulo">Atrasadas</div>
        </a>
    </div>

    @if (! is_null($faturado))
        <div class="grade">
            <div class="card">
                <div class="numero">{{ Formato::moeda($faturado) }}</div>
                <div class="rotulo">Faturado em {{ now()->format('m/Y') }} ({{ $entreguesNoMes }} ordem(ns) entregue(s))</div>
            </div>
            <div class="card">
                <div class="numero">{{ Formato::moeda($entreguesNoMes ? $faturado / $entreguesNoMes : 0) }}</div>
                <div class="rotulo">Ticket médio do mês</div>
            </div>
        </div>
    @endif

    <div class="acoes">
        <a class="botao" href="{{ route('ordens.index') }}">Ver ordens</a>
        @can('create', \App\Models\WorkOrder::class)
            <a class="botao primario" href="{{ route('ordens.create') }}">Abrir ordem de serviço</a>
        @endcan
    </div>
@endsection
