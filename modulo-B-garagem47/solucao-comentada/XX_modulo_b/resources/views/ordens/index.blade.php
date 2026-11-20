@extends('layout')
@section('titulo', 'Ordens de serviço')
@section('conteudo')
    <div class="barra">
        <h1>Ordens de serviço</h1>
        <div class="acoes">
            @can('exportar')
                {{-- request()->query() repassa os filtros atuais para a exportação --}}
                <a class="botao" href="{{ route('ordens.exportar', request()->query()) }}">Exportar CSV</a>
            @endcan
            @can('create', \App\Models\WorkOrder::class)
                <a class="botao primario" href="{{ route('ordens.create') }}">Abrir ordem</a>
            @endcan
        </div>
    </div>

    {{-- Filtros por GET: tudo vai para a URL e os campos voltam preenchidos com $f --}}
    <form method="GET" action="{{ route('ordens.index') }}" class="card filtros">
        <label>Busca (código, placa ou cliente)
            <input type="search" name="busca" value="{{ $f['busca'] }}">
        </label>
        <label>Situação
            <select name="status">
                <option value="">Todas</option>
                @foreach (\App\Models\WorkOrder::SITUACOES as $chave => $rotulo)
                    <option value="{{ $chave }}" @selected($f['status'] === $chave)>{{ $rotulo }}</option>
                @endforeach
            </select>
        </label>
        @unless (auth()->user()->ehMecanico())
            <label>Mecânico
                <select name="mecanico">
                    <option value="">Todos</option>
                    <option value="nenhum" @selected($f['mecanico'] === 'nenhum')>Sem mecânico</option>
                    @foreach ($mecanicos as $m)
                        <option value="{{ $m->id }}" @selected((string) $f['mecanico'] === (string) $m->id)>{{ $m->name }}</option>
                    @endforeach
                </select>
            </label>
        @endunless
        <label>Aberta de <input type="date" name="de" value="{{ $f['de'] }}"></label>
        <label>até <input type="date" name="ate" value="{{ $f['ate'] }}"></label>
        <label>Ordenar por
            <select name="ordem">
                @foreach (\App\Http\Controllers\WorkOrderController::ORDENACOES as $chave => $rotulo)
                    <option value="{{ $chave }}" @selected($f['ordem'] === $chave)>{{ $rotulo }}</option>
                @endforeach
            </select>
        </label>
        <label class="inline"><input type="checkbox" name="atrasadas" value="1" @checked($f['atrasadas'])> Só atrasadas</label>
        <button class="botao primario" type="submit">Filtrar</button>
        <a class="botao" href="{{ route('ordens.index') }}">Limpar</a>
    </form>

    <div class="tabela">
        <table>
            <thead>
            <tr><th>Código</th><th>Veículo</th><th>Cliente</th><th>Mecânico</th><th>Situação</th><th>Abertura</th><th>Prazo</th><th class="num">Total</th><th></th></tr>
            </thead>
            <tbody>
            @forelse ($ordens as $o)
                <tr>
                    <td><strong>{{ $o->code }}</strong></td>
                    <td>{{ $o->vehicle->plate }}<br><span class="muted">{{ $o->vehicle->brand }} {{ $o->vehicle->model }}</span></td>
                    <td>{{ $o->vehicle->customer->name }}</td>
                    <td>{{ $o->mechanic?->name ?? '-' }}</td>
                    <td>@include('partials.situacao', ['o' => $o])</td>
                    <td>{{ Formato::dataHora($o->opened_at) }}</td>
                    <td>
                        {{ Formato::data($o->due_date) }}
                        @if ($o->estaAtrasada())
                            <span class="atraso">Atrasada há {{ $o->diasDeAtraso() }} {{ $o->diasDeAtraso() === 1 ? 'dia' : 'dias' }}</span>
                        @endif
                    </td>
                    <td class="num">{{ Formato::moeda($o->total()) }}</td>
                    <td><a class="botao pequeno" href="{{ route('ordens.show', $o) }}">Detalhes</a></td>
                </tr>
            @empty
                <tr><td colspan="9">Nenhuma ordem encontrada com estes filtros.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('partials.paginacao', ['p' => $ordens])
@endsection
