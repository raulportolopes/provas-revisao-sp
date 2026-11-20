/*
 * Cardápio do restaurante.
 *  - Abas de seção "grudadas" no topo com SCROLLSPY (posição na rolagem): a aba acende
 *    sozinha conforme a rolagem; clicar na aba rola até a seção.
 *  - O prato aberto fica na URL (?item=12): F5 reabre o modal e o botão Voltar fecha.
 *  - Busca DENTRO do cardápio é local (o cardápio inteiro já veio numa resposta só).
 */
import { api } from '../api.js';
import { brl, quandoAbre } from '../formatos.js';
import ModalItem from '../componentes/modal-item.js';
const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useRoute, useRouter } = VueRouter;

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default {
  components: { ModalItem },
  setup() {
    const rota = useRoute();
    const router = useRouter();
    const rest = ref(null);
    const erro = ref(null);
    const carregando = ref(true);
    const filtro = ref('');
    const secaoAtiva = ref(null);
    const barraAbas = ref(null);

    let controlador;
    async function carregar() {
      controlador?.abort();
      const meu = (controlador = new AbortController());
      carregando.value = true; erro.value = null; rest.value = null;
      try {
        rest.value = (await api('/restaurantes/' + rota.params.slug, { signal: meu.signal })).dados;
        document.title = `${rest.value.nome} · Sabor de Bairro`;
        secaoAtiva.value = rest.value.cardapio[0]?.id;
        await nextTick();
        observar();
      } catch (e) {
        if (e.name !== 'AbortError') erro.value = e;
      } finally {
        if (meu === controlador) carregando.value = false;
      }
    }

    // Seções já filtradas pela busca local (seção sem prato some, e a aba dela também).
    const secoes = computed(() => {
      if (!rest.value) return [];
      const f = semAcento(filtro.value.trim());
      return rest.value.cardapio
        .map((s) => ({ ...s, itens: f ? s.itens.filter((i) => semAcento(i.nome + ' ' + i.descricao).includes(f)) : s.itens }))
        .filter((s) => s.itens.length);
    });
    const destaques = computed(() => rest.value?.cardapio.flatMap((s) => s.itens).filter((i) => i.destaque && i.disponivel).slice(0, 3) || []);

    /* ---------- Scrollspy ----------
     * Regra: a seção ativa é a ÚLTIMA cujo topo já passou da "linha de leitura" (metade da tela).
     * No fim da página, a última seção vence (ela pode ser curta demais para chegar à linha).
     * requestAnimationFrame: no máximo um cálculo por quadro, mesmo com centenas de eventos de scroll.
     */
    let quadro = 0;
    function calcular() {
      quadro = 0;
      const els = [...document.querySelectorAll('[data-secao]')];
      if (!els.length) return;
      const linha = innerHeight * 0.5;
      let atual = els[0];
      for (const el of els) if (el.getBoundingClientRect().top <= linha) atual = el;
      // Fim da página: a última seção inteira já está à vista (não use scrollHeight: o sticky distorce).
      const ultima = els[els.length - 1].getBoundingClientRect();
      if (scrollY > 0 && ultima.bottom <= innerHeight) atual = els[els.length - 1];
      secaoAtiva.value = Number(atual.dataset.secao);
    }
    const aoRolar = () => { if (!quadro) quadro = requestAnimationFrame(calcular); };
    addEventListener('scroll', aoRolar, { passive: true });
    const observar = () => calcular();
    watch(secoes, async () => { await nextTick(); observar(); });
    // A aba ativa sempre visível na barra (no celular a barra rola de lado).
    watch(secaoAtiva, async (id) => {
      await nextTick();
      // scrollTo NO TRILHO, e não scrollIntoView na aba: scrollIntoView também rola a JANELA
      // e cancela a rolagem suave que o clique na aba tinha começado.
      const trilho = barraAbas.value, aba = trilho?.querySelector(`[data-aba="${id}"]`);
      if (aba) trilho.scrollTo({ left: aba.offsetLeft - trilho.clientWidth / 2 + aba.offsetWidth / 2, behavior: 'smooth' });
    });
    function irPara(id) {
      const alvo = document.getElementById('secao-' + id);
      const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
      alvo.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
      alvo.querySelector('h2').focus({ preventScroll: true }); // teclado continua dali
    }

    /* ---------- Prato aberto pela URL ---------- */
    const itemAberto = computed(() => {
      const id = Number(rota.query.item);
      return id && rest.value ? rest.value.cardapio.flatMap((s) => s.itens).find((i) => i.id === id && i.disponivel) : null;
    });
    const abrir = (item) => router.push({ query: { ...rota.query, item: item.id } });
    function fechar() {
      // Se viemos da própria lista (push), voltar no histórico; se foi F5/link, só tirar o ?item.
      const { item, ...resto } = rota.query;
      if (window.history.state?.back === router.resolve({ query: resto }).fullPath) router.back();
      else router.replace({ query: resto });
    }

    watch(() => rota.params.slug, (s) => { if (s) carregar(); });
    onMounted(carregar);
    onBeforeUnmount(() => { controlador?.abort(); removeEventListener('scroll', aoRolar); cancelAnimationFrame(quadro); });

    return { rest, erro, carregando, filtro, secoes, destaques, secaoAtiva, barraAbas, irPara, itemAberto, abrir, fechar, brl, quandoAbre };
  },
  template: `
  <div v-if="carregando" class="pagina" aria-busy="true">
    <div class="capa capa--esqueleto"></div>
    <p class="so-leitor">Carregando cardápio…</p>
  </div>

  <section v-else-if="erro" class="pagina pagina--estreita vazio">
    <h1>{{ erro.status === 404 ? 'Restaurante não encontrado' : 'Não deu para abrir o cardápio' }}</h1>
    <p class="suave">{{ erro.message }}</p>
    <router-link to="/" class="botao">Ver todos os restaurantes</router-link>
  </section>

  <template v-else-if="rest">
    <section class="capa">
      <!-- <img> e não background: URL relativa dentro de var() no CSS seria resolvida a partir da pasta css/ -->
      <img class="capa__foto" :src="rest.imagem" alt="" width="1200" height="520" fetchpriority="high">
      <div class="capa__dentro">
        <router-link to="/" class="voltar">← Restaurantes</router-link>
        <h1 class="capa__nome">{{ rest.nome }}</h1>
        <p class="capa__meta">
          <span class="nota">★ {{ rest.avaliacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) }} <small>({{ rest.avaliacoes_total.toLocaleString('pt-BR') }})</small></span>
          <span>{{ rest.tempo_min }}–{{ rest.tempo_max }} min</span>
          <span>Entrega {{ rest.taxa_entrega ? brl(rest.taxa_entrega) : 'grátis' }}</span>
          <span>Mínimo {{ brl(rest.pedido_minimo) }}</span>
        </p>
        <p class="capa__status" :class="rest.aberto_agora ? 'capa__status--aberto' : 'capa__status--fechado'">
          {{ rest.aberto_agora ? 'Aberto agora' : 'Fechado · ' + quandoAbre(rest.abre_em) }}
        </p>
        <p class="suave capa__end">{{ rest.endereco }}</p>
      </div>
    </section>

    <div v-if="!rest.aberto_agora" class="pagina"><p class="alerta" role="note">Você pode olhar o cardápio, mas os pedidos abrem só quando o restaurante abrir.</p></div>

    <nav class="abas-secao" aria-label="Seções do cardápio">
      <div ref="barraAbas" class="abas-secao__trilho">
        <a v-for="s in secoes" :key="s.id" :href="'#secao-' + s.id" :data-aba="s.id" class="aba-secao"
           :aria-current="secaoAtiva === s.id ? 'true' : null" @click.prevent="irPara(s.id)">{{ s.nome }}</a>
      </div>
      <label class="busca-cardapio">
        <span class="so-leitor">Buscar no cardápio</span>
        <input type="search" v-model="filtro" placeholder="Buscar no cardápio">
      </label>
    </nav>

    <div class="pagina cardapio">
      <section v-if="destaques.length && !filtro" class="destaques" aria-labelledby="t-dest">
        <h2 id="t-dest" class="secao__titulo">Mais pedidos</h2>
        <div class="destaques__linha">
          <button v-for="i in destaques" :key="i.id" type="button" class="destaque" :data-item="i.id" @click="abrir(i)">
            <img :src="i.imagem" alt="" width="320" height="200" loading="lazy">
            <span class="destaque__nome">{{ i.nome }}</span>
            <span class="destaque__preco">{{ brl(i.preco) }}</span>
          </button>
        </div>
      </section>

      <p v-if="!secoes.length" class="vazio">Nenhum prato com “{{ filtro }}”.</p>

      <section v-for="s in secoes" :key="s.id" :id="'secao-' + s.id" :data-secao="s.id" class="secao" :aria-labelledby="'t-sec-' + s.id">
        <h2 :id="'t-sec-' + s.id" class="secao__titulo" tabindex="-1">{{ s.nome }}</h2>
        <ul class="itens">
          <li v-for="i in s.itens" :key="i.id">
            <button type="button" class="item" :data-item="i.id" :disabled="!i.disponivel" @click="abrir(i)"
                    :aria-label="i.nome + ', ' + brl(i.preco) + (i.disponivel ? '' : ', esgotado')">
              <span class="item__texto">
                <strong class="item__nome">{{ i.nome }}</strong>
                <span class="item__desc">{{ i.descricao }}</span>
                <span class="item__preco">{{ i.grupos.length ? 'A partir de ' : '' }}{{ brl(i.preco) }}</span>
              </span>
              <span class="item__foto"><img :src="i.imagem" alt="" width="120" height="120" loading="lazy"><span v-if="!i.disponivel" class="selo selo--fechado">Esgotado</span></span>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <modal-item v-if="itemAberto" :key="itemAberto.id" :item="itemAberto" :restaurante="rest" @fechar="fechar"></modal-item>
  </template>`,
};
