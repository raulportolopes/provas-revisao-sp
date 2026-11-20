@extends('layout')
@section('titulo', 'Turmas')
@section('conteudo')
    <div class="barra">
        <h1>{{ auth()->user()->ehProfessor() ? 'Minhas turmas' : 'Turmas' }}</h1>
        @can('create', \App\Models\SchoolClass::class)
            <a class="botao primario" href="{{ route('turmas.create') }}">Cadastrar turma</a>
        @endcan
    </div>
    <form method="GET" action="{{ route('turmas.index') }}" class="card filtros">
        <label>Instrumento
            <select name="instrumento"><option value="">Todos</option>
                @foreach ($instrumentos as $i)<option value="{{ $i->id }}" @selected((string) $f['instrumento'] === (string) $i->id)>{{ $i->name }}</option>@endforeach
            </select>
        </label>
        <label>Dia
            <select name="dia"><option value="">Todos</option>
                @foreach (\App\Models\SchoolClass::DIAS as $n => $d)<option value="{{ $n }}" @selected((string) $f['dia'] === (string) $n)>{{ $d }}</option>@endforeach
            </select>
        </label>
        <label>Nível
            <select name="nivel"><option value="">Todos</option>
                @foreach (\App\Models\SchoolClass::NIVEIS as $k => $n)<option value="{{ $k }}" @selected($f['nivel'] === $k)>{{ $n }}</option>@endforeach
            </select>
        </label>
        @unless (auth()->user()->ehProfessor())
            <label>Professor(a)
                <select name="professor"><option value="">Todos</option>
                    @foreach ($professores as $p)<option value="{{ $p->id }}" @selected((string) $f['professor'] === (string) $p->id)>{{ $p->name }}</option>@endforeach
                </select>
            </label>
        @endunless
        <label class="inline"><input type="checkbox" name="vagas" value="1" @checked($f['vagas'])> Só com vaga</label>
        <button class="botao primario" type="submit">Filtrar</button>
        <a class="botao" href="{{ route('turmas.index') }}">Limpar</a>
    </form>
    <div class="tabela">
        <table>
            <thead><tr><th>Turma</th><th>Instrumento</th><th>Nível</th><th>Professor(a)</th><th>Sala</th><th>Dia e horário</th>
                <th class="num">Alunos</th><th class="num">Espera</th>@unless (auth()->user()->ehProfessor())<th class="num">Mensalidade</th>@endunless<th></th></tr></thead>
            <tbody>
            @forelse ($turmas as $t)
                <tr>
                    <td><strong>{{ $t->code }}</strong> @unless ($t->active)<span class="situacao st-inativa">Inativa</span>@endunless</td>
                    <td>{{ $t->instrument->name }}</td>
                    <td>{{ $t->nivel() }}</td>
                    <td>{{ $t->teacher->name }}</td>
                    <td>{{ $t->room->name }}</td>
                    <td>{{ $t->horario() }}</td>
                    <td class="num {{ $t->ativas_count >= $t->capacity ? 'cheia' : '' }}">{{ $t->ativas_count }}/{{ $t->capacity }}</td>
                    <td class="num">{{ $t->espera_count }}</td>
                    @unless (auth()->user()->ehProfessor())<td class="num">{{ Formato::moeda($t->monthly_fee) }}</td>@endunless
                    <td><a class="botao pequeno" href="{{ route('turmas.show', $t) }}">Detalhes</a></td>
                </tr>
            @empty
                <tr><td colspan="10">Nenhuma turma encontrada.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
@endsection
