@extends('layout')
@section('titulo', 'Mensalidades')
@section('conteudo')
    <div class="barra">
        <h1>Mensalidades</h1>
        @can('coordenacao')<a class="botao" href="{{ route('mensalidades.exportar', request()->query()) }}">Exportar CSV</a>@endcan
    </div>
    <form method="GET" action="{{ route('mensalidades.index') }}" class="card filtros">
        <label>Mês de referência <input type="month" name="mes" value="{{ $f['mes'] }}"></label>
        <label>Situação
            <select name="situacao"><option value="">Todas</option>
                @foreach (\App\Models\Invoice::SITUACOES as $k => $s)<option value="{{ $k }}" @selected($f['situacao'] === $k)>{{ $s }}</option>@endforeach
            </select></label>
        <label>Turma
            <select name="turma"><option value="">Todas</option>
                @foreach ($turmas as $t)<option value="{{ $t->id }}" @selected((string) $f['turma'] === (string) $t->id)>{{ $t->code }}</option>@endforeach
            </select></label>
        <label>Aluno <input type="search" name="busca" value="{{ $f['busca'] }}"></label>
        <button class="botao primario" type="submit">Filtrar</button>
        <a class="botao" href="{{ route('mensalidades.index') }}">Limpar</a>
    </form>

    <div class="grade">
        <div class="card"><div class="numero verde">{{ Formato::moeda($totais['recebido']) }}</div><div class="rotulo">Recebido (filtro atual)</div></div>
        <div class="card"><div class="numero">{{ Formato::moeda($totais['aberto']) }}</div><div class="rotulo">Em aberto, a vencer</div></div>
        <div class="card"><div class="numero vermelho">{{ Formato::moeda($totais['vencido']) }}</div><div class="rotulo">Vencido (com multa e juros até hoje)</div></div>
    </div>

    <div class="tabela">
        <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Referência</th><th>Vencimento</th><th class="num">Valor</th><th>Situação</th><th></th></tr></thead>
            <tbody>
            @forelse ($mensalidades as $i)
                <tr>
                    <td><a href="{{ route('alunos.show', $i->enrollment->student) }}">{{ $i->enrollment->student->name }}</a></td>
                    <td>{{ $i->enrollment->schoolClass->code }}</td>
                    <td>{{ $i->reference_month->format('m/Y') }}</td>
                    <td>{{ Formato::data($i->due_date) }}</td>
                    <td class="num">{{ Formato::moeda($i->amount) }}</td>
                    <td>@include('partials.mensalidade-situacao', ['i' => $i])</td>
                    <td>@include('partials.mensalidade-acoes', ['i' => $i])</td>
                </tr>
            @empty
                <tr><td colspan="7">Nenhuma mensalidade com estes filtros.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('partials.paginacao', ['p' => $mensalidades])
@endsection
