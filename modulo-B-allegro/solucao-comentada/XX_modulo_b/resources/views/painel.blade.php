@extends('layout')
@section('titulo', 'Painel')
@section('conteudo')
    <h1>Olá, {{ auth()->user()->name }}!</h1>
    <p class="muted">Hoje é {{ \App\Models\SchoolClass::DIAS[now()->dayOfWeekIso] ?? 'domingo' }}, {{ Formato::data(now()) }}.</p>

    @if (auth()->user()->ehProfessor())
        <h2>Suas aulas de hoje</h2>
        <div class="tabela">
            <table>
                <thead><tr><th>Horário</th><th>Turma</th><th>Instrumento</th><th>Sala</th><th class="num">Alunos</th></tr></thead>
                <tbody>
                @forelse ($aulasHoje as $t)
                    <tr>
                        <td>{{ $t->inicio() }}–{{ $t->fim() }}</td>
                        <td><a href="{{ route('turmas.show', $t) }}">{{ $t->code }}</a></td>
                        <td>{{ $t->instrument->name }}</td>
                        <td>{{ $t->room->name }}</td>
                        <td class="num">{{ $t->ativas_count }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5">Nenhuma aula hoje.</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
        <p><a class="botao" href="{{ route('turmas.index') }}">Minhas turmas ({{ $minhasTurmas }})</a></p>
    @else
        <div class="grade">
            <div class="card"><div class="numero">{{ $alunosAtivos }}</div><div class="rotulo">Alunos com matrícula ativa</div></div>
            <div class="card"><div class="numero">{{ $turmasAtivas }}</div><div class="rotulo">Turmas ativas</div></div>
            <a class="card" href="{{ route('turmas.index', ['vagas' => 1]) }}" style="text-decoration:none;color:inherit">
                <div class="numero">{{ $vagasLivres }}</div><div class="rotulo">Vagas livres</div></a>
            <div class="card"><div class="numero">{{ $naEspera }}</div><div class="rotulo">Na lista de espera</div></div>
            <a class="card" href="{{ route('mensalidades.index', ['situacao' => 'vencida']) }}" style="text-decoration:none;color:inherit">
                <div class="numero {{ $vencidasQtd ? 'vermelho' : '' }}">{{ $vencidasQtd }}</div>
                <div class="rotulo">Mensalidades vencidas · {{ Formato::moeda($vencidasValor) }} atualizado</div></a>
            @isset($recebidoMes)
                <div class="card"><div class="numero">{{ Formato::moeda($recebidoMes) }}</div><div class="rotulo">Recebido em {{ now()->format('m/Y') }}</div></div>
            @endisset
        </div>
    @endif
@endsection
