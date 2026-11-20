@extends('layout')
@section('titulo', $turma->code)
@section('conteudo')
    <div class="barra">
        <h1>Turma {{ $turma->code }} @unless ($turma->active)<span class="situacao st-inativa">Inativa</span>@endunless</h1>
        <div class="acoes">
            @can('update', $turma)<a class="botao" href="{{ route('turmas.edit', $turma) }}">Editar</a>@endcan
            @can('delete', $turma)<a class="botao perigo" href="{{ route('turmas.apagar', $turma) }}">Apagar</a>@endcan
            <a class="botao" href="{{ route('turmas.index') }}">Voltar</a>
        </div>
    </div>
    <div class="card">
        <dl class="dados">
            <dt>Instrumento</dt><dd>{{ $turma->instrument->name }} · {{ $turma->nivel() }}</dd>
            <dt>Professor(a)</dt><dd>{{ $turma->teacher->name }}</dd>
            <dt>Sala</dt><dd>{{ $turma->room->name }} ({{ $turma->room->capacity }} lugares)</dd>
            <dt>Dia e horário</dt><dd>{{ $turma->horario() }}</dd>
            <dt>Vagas</dt>
            <dd>{{ $ativas->count() }} de {{ $turma->capacity }} ocupadas ·
                @if ($ativas->count() >= $turma->capacity) <span class="cheia">Turma cheia</span>
                @else {{ $turma->capacity - $ativas->count() }} livre(s) @endif</dd>
            @unless (auth()->user()->ehProfessor())
                <dt>Mensalidade</dt><dd>{{ Formato::moeda($turma->monthly_fee) }}</dd>
            @endunless
        </dl>
    </div>

    <h2>Alunos ativos</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Aluno</th><th>Idade</th><th>Matriculado em</th></tr></thead>
            <tbody>
            @forelse ($ativas as $m)
                <tr>
                    <td>@can('alunos')<a href="{{ route('alunos.show', $m->student) }}">{{ $m->student->name }}</a>@else {{ $m->student->name }} @endcan</td>
                    <td>{{ $m->student->idade() }} anos</td>
                    <td>{{ Formato::data($m->enrolled_at) }}</td>
                </tr>
            @empty
                <tr><td colspan="3">Nenhum aluno ativo.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <h2>Lista de espera</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Posição</th><th>Aluno</th><th>Desde</th></tr></thead>
            <tbody>
            @forelse ($espera as $m)
                <tr><td>{{ $loop->iteration }}º</td><td>{{ $m->student->name }}</td><td>{{ Formato::dataHora($m->waitlisted_at) }}</td></tr>
            @empty
                <tr><td colspan="3">Ninguém na lista de espera.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
@endsection
