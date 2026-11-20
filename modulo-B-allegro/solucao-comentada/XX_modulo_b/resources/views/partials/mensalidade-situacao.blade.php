{{-- $i = Invoice. Mostra a situação com o valor que importa em cada caso --}}
@php($s = $i->situacao())
@if ($s === 'paga')
    <span class="situacao st-paga">Paga</span> em {{ Formato::data($i->paid_at) }} · {{ Formato::moeda($i->paid_amount) }}
@elseif ($s === 'vencida')
    @php($d = $i->diasDeAtraso())
    <span class="situacao st-vencida">Vencida há {{ $d }} {{ $d === 1 ? 'dia' : 'dias' }}</span> · {{ Formato::moeda($i->valorAtualizado()) }} atualizado
@else
    <span class="situacao st-aberta">Em aberto</span>
@endif
