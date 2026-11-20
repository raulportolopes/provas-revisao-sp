/*
 * Tela inicial: busca, categorias, filtros, ordem e "Carregar mais".
 *
 * PADRÃO CENTRAL: a URL é a fonte da verdade dos filtros.
 *   clique/digitação -> router.replace({ query })   (só muda a URL)
 *   watch(route.query) -> carregar()                 (a URL mudou: busca na API)
 * Assim F5, voltar do navegador e link compartilhado funcionam sem código extra.
 *
 * CORRIDA: a API responde fora de ordem de propósito. Cada carga nova ABORTA a anterior
 * (AbortController) e só a carga "dona" do controlador mexe em carregando/lista.
 */
import { api } from '../api.js';
import { brl, quandoAbre } from '../formatos.js';
const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;
const { useRoute, useRouter } = VueRouter;

const ORDENS = [
  ['relevancia', 'Relevância'], ['avaliacao', 'Melhor avaliados'], ['tempo', 'Entrega mais rápida'],
  ['taxa', 'Menor taxa'], ['nome', 'Nome (A–Z)'],
];

export default {
  setup() {
    const rota = useRoute();
    const router = useRouter();

    const categorias = ref([]);
    const lista = ref([]);
    const meta = ref(null);
    const carregando = ref(false);
    const carregandoMais = ref(false);
    const erro = ref('');
    const texto = ref(rota.query.busca || '');   // o que está no campo (antes do debounce)

    // Filtros LIDOS da URL (computed: nunca ficam fora de sincronia).
    const filtros = computed(() => ({
      busca: rota.query.busca || '',
      categoria_id: rota.query.categoria || '',
      aberto: rota.query.aberto === '1',
      entrega_gratis: rota.query.gratis === '1',
      ordem: ORDENS.some(([v]) => v === rota.query.ordem) ? rota.query.ordem : 'relevancia',
    }));
    const temFiltro = computed(() => filtros.value.busca || filtros.value.categoria_id || filtros.value.aberto || filtros.value.entrega_gratis);

    /** Escreve na URL. Valores "vazios" saem da query para a URL ficar limpa. */
    function mudar(parcial) {
      const q = { ...rota.query, ...parcial };
      for (const k of Object.keys(q)) if (q[k] === '' || q[k] == null || q[k] === false) delete q[k];
      router.replace({ query: q });
    }

    let controlador = null;
    async function carregar(pagina = 1) {
      controlador?.abort();
      const meu = (controlador = new AbortController());
      const params = { ...filtros.value, aberto: filtros.value.aberto ? 1 : '', entrega_gratis: filtros.value.entrega_gratis ? 1 : '', pagina };
      if (pagina === 1) { carregando.value = true; erro.value = ''; } else carregandoMais.value = true;
      try {
        const r = await api('/restaurantes', { params, signal: meu.signal });
        lista.value = pagina === 1 ? r.dados : [...lista.value, ...r.dados];
        meta.value = r.meta;
      } catch (e) {
        if (e.name === 'AbortError') return;
        erro.value = e.message;
      } finally {
        if (meu === controlador) { carregando.value = false; carregandoMais.value = false; }
      }
    }
    const temMais = computed(() => meta.value && meta.value.pagina < meta.value.total_paginas);

    // Debounce da busca: espera 350 ms parado antes de mexer na URL.
    let espera;
    watch(texto, (v) => { clearTimeout(espera); espera = setTimeout(() => mudar({ busca: v.trim() }), 350); });
    // Se a URL mudar por fora (voltar do navegador), o campo acompanha.
    watch(() => rota.query.busca, (v) => { if ((v || '') !== texto.value.trim()) texto.value = v || ''; });
    watch(() => rota.query, () => { if (rota.name === 'inicio') carregar(1); });

    onMounted(async () => {
      carregar(1);
      try { categorias.value = (await api('/categorias')).dados; } catch { /* sem chips: a tela segue */ }
    });
    onBeforeUnmount(() => { controlador?.abort(); clearTimeout(espera); });

    // Brilho que segue o cursor no topo: o JS só escreve --x/--y; o CSS desenha.
    function seguir(e) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
    }

    const nomeCategoria = (id) => categorias.value.find((c) => c.id === id)?.nome || '';
    function limpar() { texto.value = ''; router.replace({ query: filtros.value.ordem !== 'relevancia' ? { ordem: filtros.value.ordem } : {} }); }

    return { ORDENS, categorias, lista, meta, carregando, carregandoMais, erro, texto, filtros, temFiltro, temMais, mudar, carregar, seguir, nomeCategoria, limpar, brl, quandoAbre };
  },
  template: `
  <section class="vitrine" @pointermove="seguir">
    <div class="vitrine__texto">
      <p class="sobretitulo">Delivery da Mooca e região</p>
      <h1 class="vitrine__titulo">A comida do seu bairro,<br><em>quentinha</em> na sua porta.</h1>
      <form class="busca" role="search" @submit.prevent>
        <label for="busca" class="so-leitor">Buscar restaurante ou prato</label>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="busca" type="search" v-model="texto" placeholder="Busque por restaurante ou prato (ex.: temaki)" autocomplete="off">
      </form>
    </div>
    <img class="vitrine__foto" src="img/vitrine.jpg" alt="" width="560" height="420" fetchpriority="high">
  </section>

  <section class="pagina" aria-labelledby="t-rest">
    <h2 id="t-rest" class="so-leitor">Restaurantes</h2>
    <div class="chips" role="group" aria-label="Categorias">
      <button type="button" class="chip" :aria-pressed="!filtros.categoria_id" @click="mudar({ categoria: '' })">Todas</button>
      <button v-for="c in categorias" :key="c.id" type="button" class="chip" :style="{ '--cor': c.cor }"
              :aria-pressed="String(c.id) === String(filtros.categoria_id)"
              @click="mudar({ categoria: String(c.id) === String(filtros.categoria_id) ? '' : c.id })">{{ c.nome }}</button>
    </div>

    <div class="filtros">
      <label class="interruptor"><input type="checkbox" :checked="filtros.aberto" @change="mudar({ aberto: $event.target.checked ? '1' : '' })"><span>Abertos agora</span></label>
      <label class="interruptor"><input type="checkbox" :checked="filtros.entrega_gratis" @change="mudar({ gratis: $event.target.checked ? '1' : '' })"><span>Entrega grátis</span></label>
      <label class="ordem">Ordenar por
        <select :value="filtros.ordem" @change="mudar({ ordem: $event.target.value === 'relevancia' ? '' : $event.target.value })">
          <option v-for="[v, t] in ORDENS" :key="v" :value="v">{{ t }}</option>
        </select>
      </label>
      <p class="filtros__total" aria-live="polite">
        <template v-if="meta && !carregando">{{ meta.total }} {{ meta.total === 1 ? 'restaurante' : 'restaurantes' }}</template>
      </p>
    </div>

    <div v-if="erro" class="alerta alerta--erro" role="alert">
      <p>{{ erro }}</p><button type="button" class="botao botao--p" @click="carregar(1)">Tentar de novo</button>
    </div>

    <ul class="grade-rest" :aria-busy="carregando ? 'true' : 'false'">
      <template v-if="carregando && !lista.length">
        <li v-for="n in 6" :key="'e' + n" class="cartao cartao--esqueleto" aria-hidden="true"><div></div><p></p><p></p></li>
      </template>
      <li v-for="r in lista" :key="r.id" class="cartao" :class="{ 'cartao--fechado': !r.aberto_agora, 'cartao--esmaecido': carregando }">
        <router-link :to="'/restaurante/' + r.slug" class="cartao__link">
          <div class="cartao__foto">
            <img :src="r.imagem" alt="" width="400" height="240" loading="lazy">
            <span v-if="!r.aberto_agora" class="selo selo--fechado">{{ quandoAbre(r.abre_em) }}</span>
            <span v-else-if="!r.taxa_entrega" class="selo selo--gratis">Entrega grátis</span>
          </div>
          <h3 class="cartao__nome">{{ r.nome }}</h3>
          <p class="cartao__meta">
            <span class="nota" :aria-label="'Nota ' + r.avaliacao.toLocaleString('pt-BR') + ' de 5'">★ {{ r.avaliacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) }}</span>
            <span>{{ nomeCategoria(r.categoria_id) }}</span>
          </p>
          <p class="cartao__meta suave">
            <span>{{ r.tempo_min }}–{{ r.tempo_max }} min</span>
            <span>{{ r.taxa_entrega ? brl(r.taxa_entrega) : 'Grátis' }}</span>
          </p>
        </router-link>
      </li>
    </ul>

    <div v-if="!carregando && !erro && meta && !lista.length" class="vazio">
      <img src="img/vazio-busca.svg" alt="" width="160" height="120">
      <p><strong>Nenhum restaurante encontrado{{ filtros.busca ? ' para “' + filtros.busca + '”' : '' }}.</strong></p>
      <button v-if="temFiltro" type="button" class="botao botao--fantasma" @click="limpar">Limpar filtros</button>
    </div>

    <div v-if="temMais && !carregando" class="mais">
      <button type="button" class="botao botao--fantasma" :disabled="carregandoMais" :aria-busy="carregandoMais ? 'true' : 'false'" @click="carregar(meta.pagina + 1)">
        {{ carregandoMais ? 'Carregando…' : 'Carregar mais (' + (meta.total - lista.length) + ')' }}
      </button>
    </div>
  </section>`,
};
