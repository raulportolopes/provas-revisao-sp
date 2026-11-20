// =====================================================================
// Inicio.js – hero, contadores animados, modalidades, próximas aulas
// e CARROSSEL DE PROFESSORES feito com scroll-snap.
//
// Carrossel com scroll-snap (diferente do Órbita, que troca slides):
//  - a trilha rola de verdade (dedo, trackpad, Shift+roda) e o CSS "encaixa"
//  - botões ‹ › rolam um card; ficam desabilitados nas pontas
//  - as bolinhas acompanham a rolagem (evento scroll) e levam ao card
//  - setas ← → com foco na trilha
// =====================================================================
import { store, ocorrenciasDaSemana, vagas, agora } from '../store.js';
import { menosMovimento, isoDia } from '../util.js';
const { ref, computed, onMounted, onBeforeUnmount } = Vue;

export default {
  setup() {
    const ocs = computed(() => ocorrenciasDaSemana(0));
    const hoje = computed(() => isoDia(agora()));
    const proximas = computed(() => ocs.value
      .filter(o => o.data === hoje.value && o.inicio > agora())
      .sort((a, b) => a.ini - b.ini).slice(0, 4));
    const vagasHoje = computed(() => ocs.value.filter(o => o.data === hoje.value && o.inicio > agora()).reduce((s, o) => s + vagas(o), 0));

    // ---------- contadores que sobem de 0 até o valor quando aparecem na tela ----------
    const numeros = computed(() => [
      { valor: store.dados.aulas.length, texto: 'aulas por semana' },
      { valor: store.dados.modalidades.length, texto: 'modalidades' },
      { valor: store.dados.professores.length, texto: 'professores' },
      { valor: vagasHoje.value, texto: 'vagas livres hoje' },
    ]);
    const mostrados = ref(numeros.value.map(() => 0));
    const blocoNumeros = ref(null);
    let observador;
    function animarNumeros() {
      if (menosMovimento()) { mostrados.value = numeros.value.map(n => n.valor); return; }
      const t0 = performance.now(), dur = 1200;
      const passo = t => {
        const p = Math.min(1, (t - t0) / dur);
        const suave = 1 - Math.pow(1 - p, 3);                // easeOutCubic
        mostrados.value = numeros.value.map(n => Math.round(n.valor * suave));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }

    // ---------- carrossel de professores ----------
    const trilha = ref(null);
    const atual = ref(0);
    const noInicio = ref(true), noFim = ref(false);
    function aoRolar() {
      const t = trilha.value; if (!t) return;
      const largura = t.firstElementChild.getBoundingClientRect().width + 20;   // card + gap
      atual.value = Math.round(t.scrollLeft / largura);
      noInicio.value = t.scrollLeft < 5;
      noFim.value = t.scrollLeft + t.clientWidth >= t.scrollWidth - 5;
    }
    function irPara(i) {
      const card = trilha.value.children[i]; if (!card) return;
      trilha.value.scrollTo({ left: card.offsetLeft - trilha.value.offsetLeft, behavior: menosMovimento() ? 'auto' : 'smooth' });
    }
    const mover = d => irPara(Math.max(0, Math.min(store.dados.professores.length - 1, atual.value + d)));
    function teclas(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    }

    onMounted(() => {
      observador = new IntersectionObserver(([e]) => { if (e.isIntersecting) { animarNumeros(); observador.disconnect(); } }, { threshold: 0.4 });
      observador.observe(blocoNumeros.value);
      aoRolar();
    });
    onBeforeUnmount(() => observador?.disconnect());

    return { store, proximas, numeros, mostrados, blocoNumeros, trilha, atual, noInicio, noFim, aoRolar, irPara, mover, teclas, vagas };
  },
  // Uma única raiz (<div>) porque a <Transition> entre telas exige isso.
  template: `<div class="pagina">
    <section class="hero">
      <img src="img/hero.jpg" alt="" class="hero__img">
      <div class="hero__texto">
        <p class="rotulo">Academia e aulas coletivas · Campinas</p>
        <h1>Seu ritmo.<br><span class="destaque-texto">Nossa energia.</span></h1>
        <p>Spinning, yoga, funcional, pilates, dança e boxe numa grade semanal que cabe na sua rotina. Reserve a vaga pelo celular em segundos.</p>
        <div class="hero__acoes">
          <RouterLink to="/aulas" class="botao">Ver grade de aulas</RouterLink>
          <RouterLink to="/planos" class="botao botao--contorno-claro">Conhecer os planos</RouterLink>
        </div>
      </div>
    </section>

    <section class="numeros" ref="blocoNumeros" aria-label="O estúdio em números">
      <div v-for="(n, i) in numeros" :key="n.texto">
        <strong aria-hidden="true">{{ mostrados[i] }}</strong>
        <span class="sr-only">{{ n.valor }}</span>
        <span>{{ n.texto }}</span>
      </div>
    </section>

    <section class="secao" aria-labelledby="t-proximas">
      <div class="secao__topo">
        <h2 id="t-proximas">Ainda hoje</h2>
        <RouterLink to="/aulas" class="link-seta">Grade completa</RouterLink>
      </div>
      <ul class="proximas" v-if="proximas.length">
        <li v-for="o in proximas" :key="o.aula.id" :style="{ '--cor': o.modalidade.cor }">
          <RouterLink :to="'/aulas/' + o.aula.id + '/' + o.data" class="proxima">
            <span class="proxima__hora">{{ o.aula.inicio }}</span>
            <span class="proxima__nome">{{ o.modalidade.nome }}</span>
            <span class="proxima__info">{{ o.professor.nome }} · {{ o.aula.sala }}</span>
            <span class="selo" :class="vagas(o) ? 'selo--ok' : 'selo--cheia'">{{ vagas(o) ? vagas(o) + (vagas(o) === 1 ? ' vaga' : ' vagas') : 'Lista de espera' }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="suave">Não há mais aulas hoje.</p>
    </section>

    <section class="secao" aria-labelledby="t-modalidades">
      <h2 id="t-modalidades">Modalidades</h2>
      <ul class="modalidades">
        <li v-for="m in store.dados.modalidades" :key="m.id" class="modalidade" :style="{ '--cor': m.cor }">
          <RouterLink :to="{ path: '/aulas', query: { modalidade: m.id } }">
            <span class="modalidade__intensidade" :aria-label="'Intensidade ' + m.intensidade + ' de 3'">
              <i v-for="k in 3" :key="k" :class="{ on: k <= m.intensidade }" aria-hidden="true"></i>
            </span>
            <h3>{{ m.nome }}</h3>
            <p>{{ m.descricao }}</p>
            <span class="link-seta">Ver horários</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="secao" aria-labelledby="t-prof" aria-roledescription="carrossel">
      <div class="secao__topo">
        <h2 id="t-prof">Professores</h2>
        <div class="carrossel__botoes">
          <button type="button" class="botao-redondo" :disabled="noInicio" aria-label="Professor anterior" @click="mover(-1)">‹</button>
          <button type="button" class="botao-redondo" :disabled="noFim" aria-label="Próximo professor" @click="mover(1)">›</button>
        </div>
      </div>
      <ul class="trilha" ref="trilha" tabindex="0" aria-label="Lista de professores (use as setas)" @scroll.passive="aoRolar" @keydown="teclas">
        <li v-for="(p, i) in store.dados.professores" :key="p.id" class="professor" :aria-label="(i + 1) + ' de ' + store.dados.professores.length">
          <img :src="p.foto" :alt="'Foto de ' + p.nome" width="300" height="360" loading="lazy">
          <div class="professor__texto">
            <h3>{{ p.nome }}</h3>
            <p class="professor__esp">{{ p.especialidade }}</p>
            <p>{{ p.bio }}</p>
          </div>
        </li>
      </ul>
      <div class="pontos">
        <button v-for="(p, i) in store.dados.professores" :key="p.id" type="button" class="ponto"
                :aria-current="atual === i ? 'true' : null" :aria-label="'Ir para ' + p.nome" @click="irPara(i)"><span></span></button>
      </div>
    </section>
  </div>`,
};
