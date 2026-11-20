/*
 * Meus pedidos: lista paginada NO SERVIDOR (?pagina=2 na URL, F5 mantém a página).
 * A paginação numerada usa aria-current="page" e botões anterior/próxima desabilitados nas pontas.
 */
import { api } from '../api.js';
import { brl, dataHora, NOME_STATUS, plural } from '../formatos.js';
const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;
const { useRoute, useRouter } = VueRouter;

export default {
  setup() {
    const rota = useRoute();
    const router = useRouter();
    const lista = ref([]);
    const meta = ref(null);
    const carregando = ref(true);
    const erro = ref('');
    const pagina = computed(() => Math.max(1, Number(rota.query.pagina) || 1));

    let ctrl;
    async function carregar() {
      ctrl?.abort();
      const meu = (ctrl = new AbortController());
      carregando.value = true; erro.value = '';
      try {
        const r = await api('/pedidos', { params: { pagina: pagina.value }, signal: meu.signal });
        // Página além do fim (ex.: ?pagina=9): volta para a última que existe.
        if (r.meta.total_paginas && pagina.value > r.meta.total_paginas) return router.replace({ query: { pagina: r.meta.total_paginas } });
        lista.value = r.dados; meta.value = r.meta;
      } catch (e) { if (e.name !== 'AbortError') erro.value = e.message; }
      finally { if (meu === ctrl) carregando.value = false; }
    }
    const ir = (n) => router.push({ query: n > 1 ? { pagina: n } : {} });
    watch(pagina, carregar);
    onMounted(carregar);
    onBeforeUnmount(() => ctrl?.abort());

    const numeros = computed(() => Array.from({ length: meta.value?.total_paginas || 0 }, (_, i) => i + 1));
    const resumoItens = (p) => p.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(', ');
    return { lista, meta, carregando, erro, pagina, ir, numeros, carregar, resumoItens, brl, dataHora, NOME_STATUS, plural };
  },
  template: `
  <section class="pagina pagina--estreita">
    <h1>Meus pedidos</h1>
    <div v-if="erro" class="alerta alerta--erro" role="alert"><p>{{ erro }}</p><button type="button" class="botao botao--p" @click="carregar">Tentar de novo</button></div>
    <p v-else-if="!carregando && !lista.length" class="vazio">Você ainda não fez pedidos. <router-link to="/">Escolha um restaurante</router-link>.</p>

    <ul class="pedidos" :aria-busy="carregando ? 'true' : 'false'" :class="{ 'pedidos--carregando': carregando }">
      <li v-for="p in lista" :key="p.id" class="pedido-linha">
        <router-link :to="'/pedidos/' + p.id" class="pedido-linha__link">
          <span class="pedido-linha__topo">
            <strong>Pedido #{{ p.id }}</strong>
            <span class="status" :class="'status--' + p.status">{{ NOME_STATUS[p.status] }}</span>
          </span>
          <span class="suave">{{ dataHora(p.criado_em) }}</span>
          <span class="pedido-linha__itens">{{ resumoItens(p) }}</span>
          <span class="pedido-linha__total">{{ brl(p.total) }}</span>
        </router-link>
      </li>
    </ul>

    <nav v-if="meta && meta.total_paginas > 1" class="paginacao" aria-label="Páginas de pedidos">
      <button type="button" class="paginacao__botao" :disabled="pagina <= 1" @click="ir(pagina - 1)">‹ <span class="so-leitor">Página</span> anterior</button>
      <button v-for="n in numeros" :key="n" type="button" class="paginacao__botao" :aria-current="n === pagina ? 'page' : null"
              :aria-label="'Página ' + n" @click="ir(n)">{{ n }}</button>
      <button type="button" class="paginacao__botao" :disabled="pagina >= meta.total_paginas" @click="ir(pagina + 1)">Próxima <span class="so-leitor">página</span> ›</button>
    </nav>
    <p v-if="meta" class="suave paginacao__info">{{ plural(meta.total, 'pedido', 'pedidos') }} · página {{ meta.pagina }} de {{ meta.total_paginas }}</p>
  </section>`,
};
