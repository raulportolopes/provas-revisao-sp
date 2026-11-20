/*
 * Gaveta do carrinho (abre pela direita; no celular ocupa a tela).
 * Mostra a barra do pedido mínimo: o botão "Finalizar" só libera quando o mínimo é atingido.
 */
import JanelaModal from './modal.js';
import { confirmar } from './confirmar.js';
import { brl, plural } from '../formatos.js';
import { carrinho, subtotal, totalItens, faltaMinimo, mudarQuantidade, remover, esvaziar } from '../estado.js';
const { computed, nextTick } = Vue;
const { useRouter } = VueRouter;

export default {
  components: { JanelaModal },
  setup() {
    const router = useRouter();
    const progresso = computed(() =>
      carrinho.restaurante ? Math.min(100, Math.round((subtotal.value / carrinho.restaurante.pedido_minimo) * 100)) : 0);
    async function limpar() {
      if (await confirmar('Esvaziar o carrinho?', { sim: 'Esvaziar', perigo: true })) esvaziar();
    }
    // Diminuir até remover a linha apaga o botão focado: o foco precisa ir para algum lugar.
    async function mudar(chave, delta) {
      const ia = carrinho.linhas.findIndex((l) => l.chave === chave);
      mudarQuantidade(chave, delta);
      await nextTick();
      if (!carrinho.linhas.some((l) => l.chave === chave)) {
        const botoes = document.querySelectorAll('.linha .quantidade button:first-child');
        (botoes[Math.min(ia, botoes.length - 1)] || document.querySelector('.modal--gaveta'))?.focus();
      }
    }
    function finalizar() { carrinho.aberto = false; router.push('/checkout'); }
    return { carrinho, subtotal, totalItens, faltaMinimo, progresso, mudar, remover, limpar, finalizar, brl, plural };
  },
  template: `
  <janela-modal v-if="carrinho.aberto" titulo="Seu carrinho" variante="gaveta" @fechar="carrinho.aberto = false">
    <div v-if="!carrinho.linhas.length" class="vazio">
      <img src="img/vazio-carrinho.svg" alt="" width="160" height="120">
      <p><strong>Seu carrinho está vazio.</strong></p>
      <p class="suave">Escolha um restaurante e adicione pratos.</p>
    </div>
    <template v-else>
      <p class="gaveta__rest">Pedido em <router-link :to="'/restaurante/' + carrinho.restaurante.slug" @click="carrinho.aberto = false">{{ carrinho.restaurante.nome }}</router-link></p>
      <ul class="linhas">
        <li v-for="l in carrinho.linhas" :key="l.chave" class="linha">
          <img :src="l.imagem" alt="" width="56" height="56" class="linha__foto">
          <div class="linha__info">
            <strong>{{ l.nome }}</strong>
            <small v-if="l.opcoes.length">{{ l.opcoes.map(o => o.nome).join(', ') }}</small>
            <small v-if="l.observacao" class="suave">“{{ l.observacao }}”</small>
            <span class="linha__preco">{{ brl(l.preco_unitario * l.quantidade) }}</span>
          </div>
          <div class="quantidade quantidade--p" role="group" :aria-label="'Quantidade de ' + l.nome">
            <button type="button" class="botao-icone botao-icone--p" :aria-label="l.quantidade === 1 ? 'Remover ' + l.nome : 'Diminuir'" @click="mudar(l.chave, -1)">{{ l.quantidade === 1 ? '🗑' : '−' }}</button>
            <output class="quantidade__n">{{ l.quantidade }}</output>
            <button type="button" class="botao-icone botao-icone--p" aria-label="Aumentar" :disabled="l.quantidade >= 20" @click="mudar(l.chave, 1)">+</button>
          </div>
        </li>
      </ul>
      <button type="button" class="link-botao" @click="limpar">Esvaziar carrinho</button>
    </template>
    <template v-if="carrinho.linhas.length" #rodape>
      <div class="minimo" :class="{ 'minimo--ok': !faltaMinimo }">
        <div class="minimo__barra" role="progressbar" aria-label="Pedido mínimo" :aria-valuenow="progresso" aria-valuemin="0" aria-valuemax="100">
          <span :style="{ '--p': progresso + '%' }"></span>
        </div>
        <small>{{ faltaMinimo ? 'Faltam ' + brl(faltaMinimo) + ' para o pedido mínimo de ' + brl(carrinho.restaurante.pedido_minimo) : 'Pedido mínimo atingido' }}</small>
      </div>
      <div class="gaveta__total"><span>Subtotal · {{ plural(totalItens, 'item', 'itens') }}</span><strong>{{ brl(subtotal) }}</strong></div>
      <button type="button" class="botao botao--largo" :disabled="faltaMinimo > 0" @click="finalizar">Finalizar pedido</button>
    </template>
  </janela-modal>`,
};
