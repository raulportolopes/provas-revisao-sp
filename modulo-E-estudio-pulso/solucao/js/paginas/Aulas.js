// =====================================================================
// Aulas.js – GRADE SEMANAL com filtros na URL.
//
// Fonte da verdade = a URL (route.query). Os filtros NÃO têm ref() próprio:
// cada controle lê da query e, ao mudar, faz router.replace() com a query nova.
// Vantagens: F5 mantém tudo, o link pode ser compartilhado e não existe
// estado duplicado para ficar dessincronizado.
//
// Parâmetros: semana (0–2), modalidade (ex.: 1,3), professor, intensidade (1–3),
//             vagas=1 (só com vaga), dia (1–6, só no celular)
//
// Layout:
//  - ≥ 768 px: CSS Grid de verdade. Linhas de 15 min (06:00–22:00), colunas
//    de dias com 2 "pistas" cada: aulas que se sobrepõem no mesmo dia ficam
//    lado a lado; as outras ocupam as 2 pistas.
//  - < 768 px: abas por dia (padrão ARIA) e lista da aula do dia escolhido.
// =====================================================================
import { store, ocorrenciasDaSemana, vagas, minhaReserva, agora } from '../store.js';
import { DIAS_CURTOS, DIAS, diaMes, hhmm, isoDia } from '../util.js';
const { computed, ref, onMounted, onBeforeUnmount } = Vue;
const { useRoute, useRouter } = VueRouter;

const INICIO_GRADE = 6 * 60, FIM_GRADE = 22 * 60, PASSO = 15;

export default {
  setup() {
    const route = useRoute(), router = useRouter();
    const max = computed(() => store.dados.config.semanas_a_frente);

    // ---------- leitura da URL (com valores inválidos tratados) ----------
    const q = computed(() => {
      const r = route.query;
      const num = (v, min, maxv, pad) => { const n = parseInt(v, 10); return n >= min && n <= maxv ? n : pad; };
      return {
        semana: num(r.semana, 0, max.value, 0),
        modalidades: String(r.modalidade || '').split(',').map(Number).filter(id => store.dados.modalidades.some(m => m.id === id)),
        professor: num(r.professor, 1, 999, 0),
        intensidade: num(r.intensidade, 1, 3, 0),
        soVagas: r.vagas === '1',
        dia: num(r.dia, 1, 6, 0),
      };
    });
    // ---------- escrita na URL ----------
    function mudar(novo) {
      const atual = { ...q.value, ...novo };
      const query = {};
      if (atual.semana) query.semana = atual.semana;
      if (atual.modalidades.length) query.modalidade = atual.modalidades.join(',');
      if (atual.professor) query.professor = atual.professor;
      if (atual.intensidade) query.intensidade = atual.intensidade;
      if (atual.soVagas) query.vagas = '1';
      if (atual.dia) query.dia = atual.dia;
      router.replace({ path: route.path, query });
    }
    const alternarModalidade = id => {
      const lista = q.value.modalidades.includes(id) ? q.value.modalidades.filter(x => x !== id) : [...q.value.modalidades, id];
      mudar({ modalidades: lista });
    };
    const limpar = () => router.replace({ path: route.path, query: q.value.semana ? { semana: q.value.semana } : {} });
    const temFiltro = computed(() => q.value.modalidades.length || q.value.professor || q.value.intensidade || q.value.soVagas);

    // ---------- dados da semana + filtros ----------
    const ocs = computed(() => ocorrenciasDaSemana(q.value.semana));
    const visiveis = computed(() => ocs.value.filter(o =>
      (!q.value.modalidades.length || q.value.modalidades.includes(o.modalidade.id)) &&
      (!q.value.professor || o.professor.id === q.value.professor) &&
      (!q.value.intensidade || o.modalidade.intensidade === q.value.intensidade) &&
      (!q.value.soVagas || (vagas(o) > 0 && o.inicio > agora()))));

    const dias = computed(() => [1, 2, 3, 4, 5, 6].map(d => {
      const exemplo = ocs.value.find(o => o.aula.dia_semana === d);
      return { d, data: exemplo.data, curto: DIAS_CURTOS[d], longo: DIAS[d], hoje: exemplo.data === isoDia(agora()) };
    }));
    const tituloSemana = computed(() => `${diaMes(dias.value[0].data)} a ${diaMes(dias.value[5].data)}`);

    // ---------- posição na grade (desktop) ----------
    const posicionadas = computed(() => {
      const porDia = {};
      visiveis.value.forEach(o => (porDia[o.aula.dia_semana] ??= []).push(o));
      const saida = [];
      Object.values(porDia).forEach(lista => {
        lista.sort((a, b) => a.ini - b.ini);
        lista.forEach(o => {
          const sobrepostas = lista.filter(x => x !== o && x.ini < o.fimMin && o.ini < x.fimMin);
          // pista 0 para a primeira de um par sobreposto, 1 para a segunda
          const pista = sobrepostas.some(x => x.ini < o.ini || (x.ini === o.ini && x.aula.id < o.aula.id)) ? 1 : 0;
          saida.push({ o, estilo: {
            gridColumn: `${2 + (o.aula.dia_semana - 1) * 2 + (sobrepostas.length ? pista : 0)} / span ${sobrepostas.length ? 1 : 2}`,
            gridRow: `${2 + (o.ini - INICIO_GRADE) / PASSO} / span ${Math.ceil(o.aula.duracao_min / PASSO)}`,
            '--cor': o.modalidade.cor,
          } });
        });
      });
      return saida;
    });
    const horas = [];
    for (let m = INICIO_GRADE; m < FIM_GRADE; m += 60) horas.push({ texto: hhmm(m), linha: 2 + (m - INICIO_GRADE) / PASSO });

    // ---------- celular: abas por dia ----------
    const celular = ref(matchMedia('(max-width: 767px)').matches);
    const mq = matchMedia('(max-width: 767px)');
    const aoMudarTela = e => (celular.value = e.matches);
    onMounted(() => mq.addEventListener('change', aoMudarTela));
    onBeforeUnmount(() => mq.removeEventListener('change', aoMudarTela));
    const diaAtivo = computed(() => q.value.dia || (q.value.semana === 0 ? Math.min(6, Math.max(1, agora().getDay())) : 1));
    const doDia = computed(() => visiveis.value.filter(o => o.aula.dia_semana === diaAtivo.value).sort((a, b) => a.ini - b.ini));
    const abas = ref(null);
    function teclaAba(e) {
      let d = diaAtivo.value;
      if (e.key === 'ArrowRight') d = d === 6 ? 1 : d + 1;
      else if (e.key === 'ArrowLeft') d = d === 1 ? 6 : d - 1;
      else if (e.key === 'Home') d = 1;
      else if (e.key === 'End') d = 6;
      else return;
      e.preventDefault(); mudar({ dia: d });
      Vue.nextTick(() => abas.value.querySelector('[aria-selected="true"]').focus());
    }

    // ---------- estado de cada aula (classes e texto) ----------
    function estadoDe(o) {
      const minha = minhaReserva(o.aula.id, o.data);
      if (o.fim <= agora()) return { classe: 'encerrada', texto: 'Encerrada' };
      if (o.inicio <= agora()) return { classe: 'encerrada', texto: 'Em andamento' };
      if (minha?.status === 'confirmada') return { classe: 'minha', texto: 'Você vai ✓' };
      if (minha?.status === 'espera') return { classe: 'espera', texto: `Você é o ${minha.posicao}º da fila` };
      const v = vagas(o);
      return v ? { classe: v <= 3 ? 'poucas' : 'livre', texto: v === 1 ? '1 vaga' : `${v} vagas` } : { classe: 'cheia', texto: 'Lista de espera' };
    }
    const abrir = o => router.push({ path: `/aulas/${o.aula.id}/${o.data}`, query: route.query });

    return { store, q, max, mudar, alternarModalidade, limpar, temFiltro, visiveis, dias, tituloSemana,
      posicionadas, horas, celular, diaAtivo, doDia, abas, teclaAba, estadoDe, abrir, hhmm };
  },
  template: `<div class="pagina">
    <div class="cabecalho-pagina">
      <h1>Grade de aulas</h1>
      <p>Toque em uma aula para ver detalhes e reservar a sua vaga.</p>
    </div>

    <div class="semana">
      <button type="button" class="botao-redondo" :disabled="q.semana === 0" aria-label="Semana anterior" @click="mudar({ semana: q.semana - 1, dia: 0 })">‹</button>
      <p class="semana__titulo" aria-live="polite"><b>{{ q.semana === 0 ? 'Esta semana' : q.semana === 1 ? 'Próxima semana' : 'Daqui a 2 semanas' }}</b> {{ tituloSemana }}</p>
      <button type="button" class="botao-redondo" :disabled="q.semana === max" aria-label="Próxima semana" @click="mudar({ semana: q.semana + 1, dia: 0 })">›</button>
    </div>

    <section class="filtros-aulas" aria-label="Filtros">
      <div class="chips" role="group" aria-label="Modalidades">
        <button v-for="m in store.dados.modalidades" :key="m.id" type="button" class="chip" :style="{ '--cor': m.cor }"
                :aria-pressed="q.modalidades.includes(m.id)" @click="alternarModalidade(m.id)">{{ m.nome }}</button>
      </div>
      <div class="filtros-aulas__linha">
        <label class="campo campo--linha">Professor
          <select :value="q.professor" @change="mudar({ professor: Number($event.target.value) })">
            <option :value="0">Todos</option>
            <option v-for="p in [...store.dados.professores].sort((a, b) => a.nome.localeCompare(b.nome))" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <fieldset class="segmentado">
          <legend class="sr-only">Intensidade</legend>
          <label v-for="(t, n) in ['Todas', 'Leve', 'Média', 'Forte']" :key="n">
            <input type="radio" name="intensidade" :value="n" :checked="q.intensidade === n" @change="mudar({ intensidade: n })"><span>{{ t }}</span>
          </label>
        </fieldset>
        <label class="interruptor">
          <input type="checkbox" role="switch" :checked="q.soVagas" @change="mudar({ soVagas: $event.target.checked })">
          <span class="interruptor__trilho" aria-hidden="true"></span> Só com vaga
        </label>
        <button v-if="temFiltro" type="button" class="botao botao--texto" @click="limpar">Limpar filtros</button>
      </div>
      <p class="contador" aria-live="polite">{{ visiveis.length }} {{ visiveis.length === 1 ? 'aula' : 'aulas' }} nesta semana</p>
    </section>

    <!-- ===== DESKTOP / TABLET: grade posicionada ===== -->
    <div v-if="!celular" class="grade" role="region" aria-label="Grade semanal de aulas">
      <div class="grade__canto" aria-hidden="true"></div>
      <div v-for="d in dias" :key="d.d" class="grade__dia" :class="{ 'grade__dia--hoje': d.hoje }" :style="{ gridColumn: (2 + (d.d - 1) * 2) + ' / span 2' }">
        <b>{{ d.curto }}</b> {{ d.data.slice(8, 10) }}/{{ d.data.slice(5, 7) }}
      </div>
      <div v-for="h in horas" :key="h.texto" class="grade__hora" :style="{ gridRow: h.linha + ' / span 4' }" aria-hidden="true">{{ h.texto }}</div>
      <div v-for="d in dias" :key="'c' + d.d" class="grade__coluna" :class="{ 'grade__coluna--hoje': d.hoje }" :style="{ gridColumn: (2 + (d.d - 1) * 2) + ' / span 2' }" aria-hidden="true"></div>
      <TransitionGroup name="cartao">
        <button v-for="p in posicionadas" :key="p.o.aula.id" type="button" class="aula" :class="'aula--' + estadoDe(p.o).classe"
                :style="p.estilo" @click="abrir(p.o)"
                :aria-label="p.o.modalidade.nome + ', ' + dias[p.o.aula.dia_semana - 1].longo + ' ' + p.o.aula.inicio + ' a ' + hhmm(p.o.fimMin) + ', ' + p.o.professor.nome + ', ' + estadoDe(p.o).texto">
          <span class="aula__hora">{{ p.o.aula.inicio }}–{{ hhmm(p.o.fimMin) }}</span>
          <span class="aula__nome">{{ p.o.modalidade.nome }}</span>
          <span class="aula__prof">{{ p.o.professor.nome.split(' ')[0] }}</span>
          <span class="aula__estado">{{ estadoDe(p.o).texto }}</span>
        </button>
      </TransitionGroup>
    </div>

    <!-- ===== CELULAR: abas por dia ===== -->
    <template v-else>
      <div class="abas-dias" role="tablist" aria-label="Dia da semana" ref="abas" @keydown="teclaAba">
        <button v-for="d in dias" :key="d.d" type="button" role="tab" :id="'aba-dia-' + d.d" aria-controls="painel-dia"
                :aria-selected="diaAtivo === d.d" :tabindex="diaAtivo === d.d ? 0 : -1" :class="{ hoje: d.hoje }" @click="mudar({ dia: d.d })">
          <b>{{ d.curto }}</b><span>{{ d.data.slice(8, 10) }}</span>
        </button>
      </div>
      <div id="painel-dia" role="tabpanel" :aria-labelledby="'aba-dia-' + diaAtivo">
        <TransitionGroup name="cartao" tag="ul" class="lista-dia">
          <li v-for="o in doDia" :key="o.aula.id">
            <button type="button" class="aula aula--linha" :class="'aula--' + estadoDe(o).classe" :style="{ '--cor': o.modalidade.cor }" @click="abrir(o)">
              <span class="aula__hora">{{ o.aula.inicio }}<small>{{ hhmm(o.fimMin) }}</small></span>
              <span><span class="aula__nome">{{ o.modalidade.nome }}</span><span class="aula__prof">{{ o.professor.nome }} · {{ o.aula.sala }}</span></span>
              <span class="aula__estado">{{ estadoDe(o).texto }}</span>
            </button>
          </li>
        </TransitionGroup>
        <p v-if="!doDia.length" class="vazio">Nenhuma aula neste dia com os filtros escolhidos.</p>
      </div>
    </template>

    <p v-if="!visiveis.length && !celular" class="vazio">Nenhuma aula encontrada. <button type="button" class="botao botao--texto" @click="limpar">Limpar filtros</button></p>

    <!-- A rota filha (modal da aula) aparece aqui -->
    <RouterView />
  </div>`,
};
