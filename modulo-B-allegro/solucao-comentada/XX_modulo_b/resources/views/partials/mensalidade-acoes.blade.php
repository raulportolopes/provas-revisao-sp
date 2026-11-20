@if (! $i->paid_at)
    <form method="POST" action="{{ route('mensalidades.pagar', $i) }}" class="acoes">
        @csrf
        <input type="date" name="paid_at" value="{{ now()->format('Y-m-d') }}" aria-label="Data do pagamento" required>
        <button class="botao pequeno primario" type="submit">Registrar pagamento</button>
    </form>
@else
    @can('coordenacao')
        <form method="POST" action="{{ route('mensalidades.estornar', $i) }}" onsubmit="return confirm('Estornar este pagamento?')">
            @csrf
            <button class="botao pequeno perigo" type="submit">Estornar</button>
        </form>
    @endcan
@endif
