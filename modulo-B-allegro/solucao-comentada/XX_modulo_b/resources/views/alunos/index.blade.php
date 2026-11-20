@extends('layout')
@section('titulo', 'Alunos')
@section('conteudo')
    <div class="barra"><h1>Alunos</h1><a class="botao primario" href="{{ route('alunos.create') }}">Cadastrar aluno</a></div>
    <form method="GET" action="{{ route('alunos.index') }}" class="card filtros">
        <label>Nome <input type="search" name="busca" value="{{ $f['busca'] }}"></label>
        <label>Turma (ativos)
            <select name="turma"><option value="">Todas</option>
                @foreach ($turmas as $t)<option value="{{ $t->id }}" @selected((string) $f['turma'] === (string) $t->id)>{{ $t->code }}</option>@endforeach
            </select></label>
        <label class="inline"><input type="checkbox" name="debito" value="1" @checked($f['debito'])> Só em débito</label>
        <button class="botao primario" type="submit">Filtrar</button>
        <a class="botao" href="{{ route('alunos.index') }}">Limpar</a>
    </form>
    <div class="tabela">
        <table>
            <thead><tr><th>Nome</th><th>Idade</th><th>Telefone</th><th>Turmas ativas</th><th>Financeiro</th><th></th></tr></thead>
            <tbody>
            @forelse ($alunos as $a)
                <tr>
                    <td>{{ $a->name }}</td>
                    <td>{{ $a->idade() }} anos @if ($a->ehMenor())<span class="muted">(menor)</span>@endif</td>
                    <td>{{ Formato::telefone($a->phone) }}</td>
                    <td>{{ $a->enrollments->map(fn ($m) => $m->schoolClass->code)->implode(', ') ?: '-' }}</td>
                    <td>@if ($a->em_debito)<span class="situacao st-vencida">Em débito</span>@else <span class="muted">Em dia</span> @endif</td>
                    <td class="acoes"><a class="botao pequeno" href="{{ route('alunos.show', $a) }}">Detalhes</a>
                        <a class="botao pequeno" href="{{ route('alunos.edit', $a) }}">Editar</a></td>
                </tr>
            @empty
                <tr><td colspan="6">Nenhum aluno encontrado.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('partials.paginacao', ['p' => $alunos])
@endsection
