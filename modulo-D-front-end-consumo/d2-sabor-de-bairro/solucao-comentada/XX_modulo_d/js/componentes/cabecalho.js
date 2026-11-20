/* Cabeçalho fixo + barra do carrinho no celular. */
import { sessao, carrinho, totalItens, subtotal, tema, avisos } from '../estado.js';
import { api } from '../api.js';
import { brl, plural } from '../formatos.js';
const { useRouter, useRoute } = VueRouter;
const { computed } = Vue;

export default {
  setup() {
    const router = useRouter();
    const rota = useRoute();
    const primeiroNome = computed(() => sessao.usuario?.nome.split(' ')[0] || '');
    // Na finalização e no acompanhamento a barra de baixo atrapalharia.
    const mostrarBarra = computed(() => totalItens.value > 0 && !['checkout', 'pedido'].includes(rota.name));
    async function sair() {
      try { await api('/logout', { metodo: 'POST' }); } catch { /* token já vencido: tudo bem */ }
      sessao.sair();
      avisos.mostrar('Você saiu da sua conta.');
      router.push('/');
    }
    return { sessao, carrinho, totalItens, subtotal, tema, primeiroNome, mostrarBarra, sair, brl, plural };
  },
  template: `
  <header class="topo">
    <div class="topo__dentro">
      <router-link to="/" class="marca" aria-label="Sabor de Bairro, início">
        <img src="img/logo-sabor.svg" alt="" width="40" height="40"><span>Sabor<b> de Bairro</b></span>
      </router-link>
      <nav class="topo__nav" aria-label="Principal">
        <router-link to="/" class="topo__link" exact-active-class="ativo">Restaurantes</router-link>
        <router-link to="/pedidos" class="topo__link" active-class="ativo">Meus pedidos</router-link>
      </nav>
      <div class="topo__acoes">
        <button type="button" class="botao-icone" :aria-pressed="tema.atual === 'escuro'" aria-label="Tema escuro" @click="tema.alternar()">
          <svg v-if="tema.atual === 'escuro'" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <svg v-else aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" fill="currentColor"/></svg>
        </button>
        <template v-if="sessao.logado">
          <span class="topo__ola">Olá, {{ primeiroNome }}</span>
          <button type="button" class="botao botao--fantasma botao--p" @click="sair">Sair</button>
        </template>
        <router-link v-else to="/entrar" class="botao botao--fantasma botao--p">Entrar</router-link>
        <button type="button" class="botao-carrinho" :aria-label="'Abrir carrinho, ' + plural(totalItens, 'item', 'itens')" @click="carrinho.aberto = true">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="10" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17" cy="20.5" r="1.4" fill="currentColor"/></svg>
          <!-- :key muda a cada item: o Vue recria o span e a animação "pulo" roda de novo -->
          <span v-if="totalItens" :key="totalItens" class="botao-carrinho__n" aria-hidden="true">{{ totalItens }}</span>
        </button>
      </div>
    </div>
  </header>
  <button v-if="mostrarBarra" type="button" class="barra-carrinho" @click="carrinho.aberto = true">
    <span class="barra-carrinho__n">{{ totalItens }}</span>
    <span>Ver carrinho</span>
    <strong>{{ brl(subtotal) }}</strong>
  </button>`,
};
