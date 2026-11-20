@extends('layout')
@section('titulo', 'Não encontrado')
@section('conteudo')
    <div class="card">
        <h1>404 · Página não encontrada</h1>
        <p>O registro ou a página que você procurou não existe.</p>
        <a class="botao" href="{{ url('/') }}">Voltar ao início</a>
    </div>
@endsection
