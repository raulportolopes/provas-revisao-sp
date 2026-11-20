@extends('layout')
@section('titulo', $ordem->code)
@section('conteudo')
    <div class="barra">
        <h1>Ordem {{ $ordem->code }} @include('partials.situacao', ['o' => $ordem])</h1>
        <div class="acoes">
            @can('update', $ordem) <a class="botao" href="{{ route('ordens.edit', $ordem) }}">Editar</a> @endcan
            @can('delete', $ordem) <a class="botao perigo" href="{{ route('ordens.apagar', $ordem) }}">Apagar</a> @endcan
            <a class="botao" href="{{ route('ordens.index') }}">Voltar</a>
        </div>
    </div>

    <div class="card">
        <dl class="dados">
            <dt>Veículo</dt><dd>{{ $ordem->vehicle->descricao() }}</dd>
            <dt>Cliente</dt><dd>{{ $ordem->vehicle->customer->name }} · {{ Formato::telefone($ordem->vehicle->customer->phone) }}</dd>
            <dt>Quilometragem</dt><dd>{{ number_format($ordem->km, 0, ',', '.') }} km</dd>
            <dt>Relato</dt><dd>{{ $ordem->complaint }}</dd>
            <dt>Mecânico</dt><dd>{{ $ordem->mechanic?->name ?? '-' }}</dd>
            <dt>Aberta em</dt><dd>{{ Formato::dataHora($ordem->opened_at) }} por {{ $ordem->creator->name }}</dd>
            <dt>Prazo</dt>
            <dd>{{ Formato::data($ordem->due_date) }}
                @if ($ordem->estaAtrasada()) <span class="atraso">Atrasada há {{ $ordem->diasDeAtraso() }} {{ $ordem->diasDeAtraso() === 1 ? 'dia' : 'dias' }}</span> @endif
            </dd>
            <dt>Concluída em</dt><dd>{{ Formato::dataHora($ordem->finished_at) }}</dd>
            <dt>Entregue em</dt><dd>{{ Formato::dataHora($ordem->delivered_at) }}</dd>
            @if ($ordem->status === 'cancelada')
                <dt>Motivo do cancelamento</dt><dd class="vermelho">{{ $ordem->cancel_reason }}</dd>
            @endif
        </dl>
    </div>

    {{-- Botões de situação: só aparecem os que este usuário pode usar AGORA (FluxoOrdem::opcoes) --}}
    @if ($opcoes)
        <div class="card">
            <h2 style="margin-top:0">Mudar situação</h2>
            <div class="acoes">
                @foreach ($opcoes as $para => $rotulo)
                    <form method="POST" action="{{ route('ordens.situacao', $ordem) }}" class="acoes">
                        @csrf
                        <input type="hidden" name="para" value="{{ $para }}">
                        @if (in_array($para, ['aguardando_peca', 'cancelada']))
                            <input name="note" placeholder="{{ $para === 'cancelada' ? 'Motivo (mín. 10 caracteres)' : 'Qual peça?' }}" required>
                        @endif
                        <button class="botao {{ $para === 'cancelada' ? 'perigo' : 'primario' }}" type="submit">{{ $rotulo }}</button>
                    </form>
                @endforeach
            </div>
        </div>
    @endif

    <h2>Serviços</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Serviço</th><th class="num">Preço na ordem</th></tr></thead>
            <tbody>
            @forelse ($ordem->services as $s)
                {{-- pivot->price: preço congelado quando o serviço entrou na ordem --}}
                <tr><td>{{ $s->name }}</td><td class="num">{{ Formato::moeda($s->pivot->price) }}</td></tr>
            @empty
                <tr><td colspan="2">Nenhum serviço.</td></tr>
            @endforelse
            </tbody>
            <tfoot><tr><td>Subtotal serviços</td><td class="num">{{ Formato::moeda($ordem->totalServicos()) }}</td></tr></tfoot>
        </table>
    </div>

    <h2>Peças</h2>
    @if ($ordem->status === 'cancelada' && $ordem->items->isNotEmpty())
        <p class="muted">Ordem cancelada: as peças abaixo foram devolvidas ao estoque.</p>
    @endif
    <div class="tabela">
        <table>
            <thead><tr><th>Peça</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Subtotal</th><th></th></tr></thead>
            <tbody>
            @forelse ($ordem->items as $item)
                <tr>
                    <td>{{ $item->part->sku }} · {{ $item->part->name }}</td>
                    <td class="num">{{ $item->quantity }}</td>
                    <td class="num">{{ Formato::moeda($item->unit_price) }}</td>
                    <td class="num">{{ Formato::moeda($item->subtotal()) }}</td>
                    <td>
                        @can('pecas', $ordem)
                            <form method="POST" action="{{ route('ordens.pecas.destroy', [$ordem, $item]) }}">
                                @csrf @method('DELETE')
                                <button class="botao pequeno perigo" type="submit">Retirar</button>
                            </form>
                        @endcan
                    </td>
                </tr>
            @empty
                <tr><td colspan="5">Nenhuma peça.</td></tr>
            @endforelse
            </tbody>
            <tfoot>
                <tr><td colspan="3">Subtotal peças</td><td class="num">{{ Formato::moeda($ordem->totalPecas()) }}</td><td></td></tr>
                <tr><td colspan="3">TOTAL DA ORDEM</td><td class="num">{{ Formato::moeda($ordem->total()) }}</td><td></td></tr>
            </tfoot>
        </table>
    </div>
    @can('pecas', $ordem)
        <form method="POST" action="{{ route('ordens.pecas.store', $ordem) }}" class="card filtros" style="margin-top:.75rem">
            @csrf
            <label>Peça
                <select name="part_id" required>
                    @foreach ($pecas as $p)
                        <option value="{{ $p->id }}" @selected((string) old('part_id') === (string) $p->id)>{{ $p->name }} · {{ Formato::moeda($p->price) }} · estoque {{ $p->stock }}</option>
                    @endforeach
                </select>
            </label>
            <label>Quantidade <input type="number" name="quantity" min="1" value="{{ old('quantity', 1) }}" required></label>
            <button class="botao primario" type="submit">Lançar peça</button>
        </form>
    @endcan

    <h2>Fotos ({{ $ordem->photos->count() }}/{{ \App\Http\Controllers\PhotoController::MAX_FOTOS }})</h2>
    <div class="fotos">
        @forelse ($ordem->photos as $foto)
            <figure>
                <a href="{{ $foto->url() }}" target="_blank"><img src="{{ $foto->url() }}" alt="Foto {{ $loop->iteration }} da ordem {{ $ordem->code }}"></a>
                <figcaption>{{ $foto->user->name }} · {{ Formato::dataHora($foto->created_at) }}
                    @can('delete', $foto)
                        <form method="POST" action="{{ route('ordens.fotos.destroy', [$ordem, $foto]) }}">
                            @csrf @method('DELETE')
                            <button class="botao pequeno perigo" type="submit">Apagar</button>
                        </form>
                    @endcan
                </figcaption>
            </figure>
        @empty
            <p class="muted">Nenhuma foto.</p>
        @endforelse
    </div>
    @can('fotos', $ordem)
        {{-- enctype multipart é OBRIGATÓRIO para enviar arquivo --}}
        <form method="POST" action="{{ route('ordens.fotos.store', $ordem) }}" enctype="multipart/form-data" class="card filtros" style="margin-top:.75rem">
            @csrf
            <label>Fotos (JPG, PNG ou WEBP, até 2 MB cada)
                <input type="file" name="fotos[]" accept=".jpg,.jpeg,.png,.webp" multiple required>
            </label>
            <button class="botao primario" type="submit">Enviar</button>
        </form>
    @endcan

    <h2>Histórico</h2>
    <div class="tabela">
        <table>
            <thead><tr><th>Data</th><th>Usuário</th><th>De</th><th>Para</th><th>Observação</th></tr></thead>
            <tbody>
            @foreach ($ordem->logs as $log)
                <tr>
                    <td>{{ Formato::dataHora($log->created_at) }}</td>
                    <td>{{ $log->user->name }}</td>
                    <td>{{ $log->from_status ? \App\Models\WorkOrder::SITUACOES[$log->from_status] : '-' }}</td>
                    <td>{{ \App\Models\WorkOrder::SITUACOES[$log->to_status] }}</td>
                    <td>{{ $log->note ?: '-' }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
