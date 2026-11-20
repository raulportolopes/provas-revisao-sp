@extends('layout')
@section('titulo', 'Acesso negado')
@section('conteudo')
    <div class="card">
        <h1>403 · Acesso negado</h1>
        {{-- $exception->getMessage() traz o texto do abort(403, '...') quando houver --}}
        <p>{{ $exception->getMessage() ?: 'Você não tem permissão para esta ação.' }}</p>
        <a class="botao" href="{{ route('painel') }}">Voltar ao painel</a>
    </div>
@endsection
