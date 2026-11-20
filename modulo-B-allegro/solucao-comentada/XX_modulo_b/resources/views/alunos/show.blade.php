@extends('layout')
@section('titulo', $aluno->name)
@section('conteudo')
    <div class="barra">
        <h1>Aluno {{ $aluno->id }} - {{ $aluno->name }}</h1>
        <div class="acoes">
            <a class="botao" href="{{ route('alunos.edit', $aluno) }}">Editar</a>
            <a class="botao perigo" href="{{ route('alunos.apagar', $aluno) }}">Apagar</a>
            <a class="botao" href="{{ route('alunos.index') }}">Voltar</a>
        </div>
    </div>
    <div class="card">
        <dl class="dados">
            <dt>Nascimento</dt><dd>{{ Formato::data($aluno->birth_date) }} ({{ $aluno->idade() }} anos)</dd>
            <dt>Telefone</dt><dd>{{ Formato::telefone($aluno->phone) }}</dd>
            <dt>E-mail</dt><dd>{{ $aluno->email ?: '-' }}</dd>
            @if ($aluno->guardian_name)
                <dt>Responsável</dt><dd>{{ $aluno->guardian_name }} · {{ Formato::telefone($aluno->guardian_phone) }}</dd>
            @endif
        </dl>
    </div>

    <h2>Matrículas</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Turma</th><th>Dia e horário</th><th>Situação</th><th></th></tr></thead>
            <tbody>
            @forelse ($matriculas as $m)
                <tr>
                    <td><a href="{{ route('turmas.show', $m->schoolClass) }}">{{ $m->schoolClass->code }}</a> · {{ $m->schoolClass->instrument->name }}</td>
                    <td>{{ $m->schoolClass->horario() }}</td>
                    <td>
                        @if ($m->status === 'ativa') <span class="situacao st-ativa">Ativa</span> desde {{ Formato::data($m->enrolled_at) }}
                        @elseif ($m->status === 'espera') <span class="situacao st-espera">Lista de espera</span> · posição {{ $m->posicao() }}
                        @else <span class="situacao st-cancelada">Cancelada</span> em {{ Formato::data($m->cancelled_at) }} @endif
                    </td>
                    <td>
                        @if ($m->status !== 'cancelada')
                            <form method="POST" action="{{ route('matriculas.cancelar', $m) }}" onsubmit="return confirm('Cancelar a matrícula na turma {{ $m->schoolClass->code }}?')">
                                @csrf
                                <button class="botao pequeno perigo" type="submit">Cancelar matrícula</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="4">Nenhuma matrícula.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <form method="POST" action="{{ route('matriculas.store', $aluno) }}" class="card filtros" style="margin-top:.75rem">
        @csrf
        <label>Nova matrícula
            <select name="school_class_id" required>
                <option value="">Escolha a turma...</option>
                @foreach ($turmas as $t)
                    <option value="{{ $t->id }}" @selected((string) old('school_class_id') === (string) $t->id)>
                        {{ $t->code }} · {{ $t->instrument->name }} · {{ $t->horario() }} ·
                        {{ $t->ativas_count >= $t->capacity ? 'cheia (lista de espera)' : ($t->capacity - $t->ativas_count) . ' vaga(s)' }}
                    </option>
                @endforeach
            </select>
        </label>
        <button class="botao primario" type="submit">Matricular</button>
    </form>

    <h2>Mensalidades</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Turma</th><th>Referência</th><th>Vencimento</th><th class="num">Valor</th><th>Situação</th><th></th></tr></thead>
            <tbody>
            @forelse ($mensalidades as $i)
                <tr>
                    <td>{{ $i->enrollment->schoolClass->code }}</td>
                    <td>{{ $i->reference_month->format('m/Y') }}</td>
                    <td>{{ Formato::data($i->due_date) }}</td>
                    <td class="num">{{ Formato::moeda($i->amount) }}</td>
                    <td>@include('partials.mensalidade-situacao', ['i' => $i])</td>
                    <td>@include('partials.mensalidade-acoes', ['i' => $i])</td>
                </tr>
            @empty
                <tr><td colspan="6">Nenhuma mensalidade.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
@endsection
