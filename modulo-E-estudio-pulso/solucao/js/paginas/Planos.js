// =====================================================================
// Planos.js – interruptor Mensal/Anual com preço animado, tabela
// comparativa e perguntas frequentes (acordeão).
// =====================================================================
import { store, avisar } from '../store.js';
import { reais, centavos, menosMovimento } from '../util.js';
const { ref, computed, watch } = Vue;
const { useRouter } = VueRouter;

const LINHAS = [
  ['musculacao', 'Musculação livre'], ['aulas_por_semana', 'Aulas coletivas por semana'], ['avaliacao_fisica', 'Avaliação física'],
  ['app_treino', 'Montador de treino'], ['convidado', 'Levar um convidado por mês'], ['toalha', 'Toalha e armário'],
];

export default {
  setup() {
    const router = useRouter();
    const anual = ref(false);
    const alvo = p => (anual.value ? p.anual_por_mes : p.mensal);
    // preço exibido: anima do valor antigo até o novo (requestAnimationFrame)
    const exibido = ref(store.dados.planos.map(p => p.mensal));
    watch(anual, () => {
      const de = [...exibido.value], para = store.dados.planos.map(alvo);
      if (menosMovimento()) { exibido.value = para; return; }
      const t0 = performance.now();
      const passo = t => {
        const k = Math.min(1, (t - t0) / 450);
        exibido.value = de.map((v, i) => v + (para[i] - v) * k);
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    const economia = p => centavos((p.mensal - p.anual_por_mes) * 12);
    const valorCelula = (p, chave) => {
      const v = p.beneficios[chave];
      if (chave === 'aulas_por_semana') return v === null ? 'Ilimitadas' : String(v);
      return v ? 'Sim' : 'Não';
    };
    function assinar(p) {
      if (!store.usuario) { router.push({ path: '/entrar', query: { volta: '/planos' } }); return; }
      store.usuario.plano_id = p.id;
      avisar(`Plano ${p.nome} (${anual.value ? 'anual' : 'mensal'}) escolhido!`, { tipo: 'sucesso' });
    }
    const faq = computed(() => store.dados.faq.map(f => ({ titulo: f.pergunta, texto: f.resposta })));
    return { store, anual, exibido, economia, reais, LINHAS, valorCelula, assinar, faq };
  },
  template: `<div class="pagina">
    <div class="cabecalho-pagina cabecalho-pagina--centro">
      <h1>Planos</h1>
      <p>Sem taxa de matrícula. Troque de plano quando quiser.</p>
      <div class="periodo">
        <span :class="{ ligado: !anual }" aria-hidden="true">Mensal</span>
        <button type="button" role="switch" class="periodo__botao" :aria-checked="anual" @click="anual = !anual">
          <span class="sr-only">Cobrança anual</span>
        </button>
        <span :class="{ ligado: anual }" aria-hidden="true">Anual <em>economize até 17%</em></span>
      </div>
    </div>

    <ul class="planos">
      <li v-for="(p, i) in store.dados.planos" :key="p.id" class="plano" :class="{ 'plano--destaque': p.destaque, 'plano--meu': store.usuario?.plano_id === p.id }">
        <span v-if="p.destaque" class="plano__fita">Mais escolhido</span>
        <h2>{{ p.nome }}</h2>
        <p class="plano__preco"><span class="sr-only">{{ reais(anual ? p.anual_por_mes : p.mensal) }} por mês</span>
          <b aria-hidden="true">{{ reais(exibido[i]) }}</b><small aria-hidden="true">/mês</small></p>
        <p class="plano__nota">{{ anual ? 'cobrado anualmente · economia de ' + reais(economia(p)) + ' por ano' : 'sem fidelidade' }}</p>
        <ul class="plano__lista">
          <li v-for="[chave, rotulo] in LINHAS" :key="chave" :class="{ nao: valorCelula(p, chave) === 'Não' }">
            {{ rotulo }}<b v-if="chave === 'aulas_por_semana'">: {{ valorCelula(p, chave) }}</b>
          </li>
        </ul>
        <button type="button" class="botao botao--largo" :class="{ 'botao--contorno': !p.destaque }" @click="assinar(p)" :disabled="store.usuario?.plano_id === p.id">
          {{ store.usuario?.plano_id === p.id ? 'Seu plano atual' : 'Assinar ' + p.nome }}</button>
      </li>
    </ul>

    <section class="secao" aria-labelledby="t-comparar">
      <h2 id="t-comparar">Compare os planos</h2>
      <div class="tabela-rolagem" tabindex="0" role="region" aria-labelledby="t-comparar">
        <table class="comparar">
          <thead><tr><th scope="col">Benefício</th><th v-for="p in store.dados.planos" :key="p.id" scope="col">{{ p.nome }}</th></tr></thead>
          <tbody>
            <tr v-for="[chave, rotulo] in LINHAS" :key="chave">
              <th scope="row">{{ rotulo }}</th>
              <td v-for="p in store.dados.planos" :key="p.id" :class="'v-' + valorCelula(p, chave).toLowerCase()">{{ valorCelula(p, chave) }}</td>
            </tr>
            <tr><th scope="row">Preço por mês</th><td v-for="p in store.dados.planos" :key="p.id"><b>{{ reais(anual ? p.anual_por_mes : p.mensal) }}</b></td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="secao" aria-labelledby="t-faq">
      <h2 id="t-faq">Perguntas frequentes</h2>
      <acordeao :itens="faq" />
    </section>
  </div>`,
};
