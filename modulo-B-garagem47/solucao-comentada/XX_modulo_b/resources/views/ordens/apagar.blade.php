@extends('layout')
@section('titulo', 'Apagar ordem')
@section('conteudo')
    <div class="card">
        <h1>Apagar a ordem {{ $ordem->code }}?</h1>
        <p>Serviços, peças, fotos e histórico desta ordem cancelada serão apagados definitivamente.</p>
        <form method="POST" action="{{ route('ordens.destroy', $ordem) }}" class="acoes">
            @csrf @method('DELETE')
            <button class="botao perigo" type="submit">Confirmar exclusão</button>
            <a class="botao" href="{{ route('ordens.show', $ordem) }}">Cancelar</a>
        </form>
    </div>
@endsection
