@extends('layout')
@section('titulo', $cliente->name)
@section('conteudo')
    <h1>Cliente {{ $cliente->id }} - {{ $cliente->name }}</h1>
    <div class="card">
        <dl class="dados">
            <dt>CPF</dt><dd>{{ Formato::cpf($cliente->cpf) }}</dd>
            <dt>Telefone</dt><dd>{{ Formato::telefone($cliente->phone) }}</dd>
            <dt>E-mail</dt><dd>{{ $cliente->email ?: '-' }}</dd>
            <dt>Cliente desde</dt><dd>{{ Formato::data($cliente->created_at) }}</dd>
        </dl>
        <div class="acoes" style="margin-top:1rem">
            <a class="botao" href="{{ route('clientes.edit', $cliente) }}">Editar</a>
            <a class="botao perigo" href="{{ route('clientes.apagar', $cliente) }}">Apagar</a>
            <a class="botao" href="{{ route('clientes.index') }}">Voltar</a>
        </div>
    </div>

    <div class="barra"><h2>Veículos</h2>
        <a class="botao primario" href="{{ route('veiculos.create', $cliente) }}">Cadastrar veículo</a></div>
    <div class="tabela">
        <table>
            <thead><tr><th>Placa</th><th>Veículo</th><th>Ano</th><th class="num">Ordens</th><th>Ações</th></tr></thead>
            <tbody>
            @forelse ($cliente->vehicles as $v)
                <tr>
                    <td><strong>{{ $v->plate }}</strong></td>
                    <td>{{ $v->brand }} {{ $v->model }}</td>
                    <td>{{ $v->year }}</td>
                    <td class="num">{{ $v->work_orders_count }}</td>
                    <td class="acoes">
                        <a class="botao pequeno primario" href="{{ route('ordens.create', ['veiculo' => $v->id]) }}">Nova ordem</a>
                        <a class="botao pequeno" href="{{ route('veiculos.edit', $v) }}">Editar</a>
                        <form method="POST" action="{{ route('veiculos.destroy', $v) }}"
                              onsubmit="return confirm('Apagar o veículo {{ $v->plate }}?')">
                            @csrf @method('DELETE')
                            <button class="botao pequeno perigo" type="submit">Apagar</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5">Nenhum veículo cadastrado.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <h2>Histórico de ordens</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Código</th><th>Placa</th><th>Abertura</th><th>Situação</th><th class="num">Total</th></tr></thead>
            <tbody>
            @forelse ($ordens as $o)
                <tr>
                    <td><a href="{{ route('ordens.show', $o) }}">{{ $o->code }}</a></td>
                    <td>{{ $o->vehicle->plate }}</td>
                    <td>{{ Formato::data($o->opened_at) }}</td>
                    <td>@include('partials.situacao', ['o' => $o])</td>
                    <td class="num">{{ Formato::moeda($o->total()) }}</td>
                </tr>
            @empty
                <tr><td colspan="5">Nenhuma ordem de serviço.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
@endsection
