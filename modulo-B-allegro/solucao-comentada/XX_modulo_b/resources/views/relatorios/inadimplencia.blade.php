@extends('layout')
@section('titulo', 'Inadimplência')
@section('conteudo')
    <h1>Inadimplência</h1>
    <p class="muted">Mensalidades vencidas e não pagas em {{ Formato::data(now()) }}. Valor atualizado com multa de 2% e juros de 1% ao mês, proporcionais aos dias.</p>
    <div class="tabela">
        <table>
            <thead><tr><th>Aluno</th><th>Turmas</th><th class="num">Mensalidades</th><th>Mais antiga</th><th class="num">Valor original</th><th class="num">Valor atualizado</th></tr></thead>
            <tbody>
            @forelse ($linhas as $l)
                <tr>
                    <td><a href="{{ route('alunos.show', $l->aluno) }}">{{ $l->aluno->name }}</a></td>
                    <td>{{ $l->turmas }}</td>
                    <td class="num">{{ $l->quantidade }}</td>
                    <td>{{ Formato::data($l->maisAntiga) }}</td>
                    <td class="num">{{ Formato::moeda($l->original) }}</td>
                    <td class="num vermelho">{{ Formato::moeda($l->atualizado) }}</td>
                </tr>
            @empty
                <tr><td colspan="6">Nenhum aluno em débito.</td></tr>
            @endforelse
            </tbody>
            <tfoot><tr><td colspan="2">TOTAL</td><td class="num">{{ $linhas->sum('quantidade') }}</td><td></td>
                <td class="num">{{ Formato::moeda($linhas->sum('original')) }}</td><td class="num">{{ Formato::moeda($linhas->sum('atualizado')) }}</td></tr></tfoot>
        </table>
    </div>
@endsection
