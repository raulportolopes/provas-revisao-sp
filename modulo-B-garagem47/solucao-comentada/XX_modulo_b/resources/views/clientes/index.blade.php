@extends('layout')
@section('titulo', 'Clientes')
@section('conteudo')
    <h1>Clientes</h1>
    <div class="barra">
        {{-- GET: a busca vai para a URL (?busca=...) e o campo continua preenchido --}}
        <form method="GET" action="{{ route('clientes.index') }}" class="filtros">
            <label>Nome ou CPF
                <input type="search" name="busca" value="{{ $busca }}">
            </label>
            <button class="botao" type="submit">Buscar</button>
            @if ($busca !== '') <a class="botao" href="{{ route('clientes.index') }}">Limpar</a> @endif
        </form>
        <a class="botao primario" href="{{ route('clientes.create') }}">Cadastrar cliente</a>
    </div>

    <div class="tabela">
        <table>
            <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th class="num">Veículos</th><th>Ações</th></tr></thead>
            <tbody>
            @forelse ($clientes as $c)
                <tr>
                    <td>{{ $c->name }}</td>
                    <td>{{ Formato::cpf($c->cpf) }}</td>
                    <td>{{ Formato::telefone($c->phone) }}</td>
                    <td class="num">{{ $c->vehicles_count }}</td>
                    <td class="acoes">
                        <a class="botao pequeno" href="{{ route('clientes.show', $c) }}">Detalhes</a>
                        <a class="botao pequeno" href="{{ route('clientes.edit', $c) }}">Editar</a>
                        <a class="botao pequeno perigo" href="{{ route('clientes.apagar', $c) }}">Apagar</a>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5">Nenhum cliente encontrado.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('partials.paginacao', ['p' => $clientes])
@endsection
