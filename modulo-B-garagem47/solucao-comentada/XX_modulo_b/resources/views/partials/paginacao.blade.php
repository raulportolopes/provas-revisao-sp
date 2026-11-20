{{-- Paginação própria (o Laravel usa Tailwind por padrão). $p = resultado do paginate(). --}}
@if ($p->total() > 0)
    <nav class="paginacao" aria-label="Paginação">
        <span class="muted">Mostrando {{ $p->firstItem() }}–{{ $p->lastItem() }} de {{ $p->total() }}</span>
        @if ($p->onFirstPage())
            <span class="desabilitado">Anterior</span>
        @else
            <a href="{{ $p->previousPageUrl() }}" rel="prev">Anterior</a>
        @endif
        @foreach ($p->getUrlRange(1, $p->lastPage()) as $n => $url)
            @if ($n === $p->currentPage())
                <span class="atual" aria-current="page">{{ $n }}</span>
            @else
                <a href="{{ $url }}">{{ $n }}</a>
            @endif
        @endforeach
        @if ($p->hasMorePages())
            <a href="{{ $p->nextPageUrl() }}" rel="next">Próxima</a>
        @else
            <span class="desabilitado">Próxima</span>
        @endif
    </nav>
@endif
