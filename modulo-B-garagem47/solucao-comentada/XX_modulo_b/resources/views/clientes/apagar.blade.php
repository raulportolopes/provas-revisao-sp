@extends('layout')
@section('titulo', 'Apagar cliente')
@section('conteudo')
    <div class="card">
        <h1>Apagar o cliente {{ $cliente->name }}?</h1>
        <p>Os veículos do cliente também serão apagados. Clientes com ordens de serviço não podem ser apagados.</p>
        <form method="POST" action="{{ route('clientes.destroy', $cliente) }}" class="acoes">
            @csrf @method('DELETE')
            <button class="botao perigo" type="submit">Confirmar exclusão</button>
            <a class="botao" href="{{ route('clientes.show', $cliente) }}">Cancelar</a>
        </form>
    </div>
@endsection
