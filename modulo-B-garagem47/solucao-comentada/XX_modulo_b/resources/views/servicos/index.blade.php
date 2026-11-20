@extends('layout')
@section('titulo', 'Serviços')
@section('conteudo')
    <div class="barra"><h1>Catálogo de serviços</h1>
        <a class="botao primario" href="{{ route('servicos.create') }}">Cadastrar serviço</a></div>
    <div class="tabela">
        <table>
            <thead><tr><th>Serviço</th><th class="num">Preço</th><th>Situação</th><th class="num">Usado em</th><th>Ações</th></tr></thead>
            <tbody>
            @foreach ($servicos as $s)
                <tr>
                    <td>{{ $s->name }}</td>
                    <td class="num">{{ Formato::moeda($s->price) }}</td>
                    <td>{!! $s->active ? '<span class="verde">Ativo</span>' : '<span class="muted">Inativo</span>' !!}</td>
                    <td class="num">{{ $s->work_orders_count }} ordem(ns)</td>
                    <td class="acoes">
                        <a class="botao pequeno" href="{{ route('servicos.edit', $s) }}">Editar</a>
                        <a class="botao pequeno perigo" href="{{ route('servicos.apagar', $s) }}">Apagar</a>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
