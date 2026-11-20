@extends('layout')
@section('titulo', 'Apagar serviço')
@section('conteudo')
    <div class="card">
        <h1>Apagar o serviço "{{ $servico->name }}"?</h1>
        @if ($servico->work_orders_count)
            <p class="vermelho">Este serviço está em {{ $servico->work_orders_count }} ordem(ns) e não pode ser apagado. Desative-o na edição.</p>
        @endif
        <form method="POST" action="{{ route('servicos.destroy', $servico) }}" class="acoes">
            @csrf @method('DELETE')
            <button class="botao perigo" type="submit">Confirmar exclusão</button>
            <a class="botao" href="{{ route('servicos.index') }}">Cancelar</a>
        </form>
    </div>
@endsection
