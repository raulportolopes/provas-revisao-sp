/*
 * chaveamento.js – Pacote P4: chave visual, caminho da equipe, campeão e modo telão
 * ---------------------------------------------------------------------------------
 * O que treina: agrupar dados com computed (quartas em pares), classes
 * condicionais (:class), <Transition> com :key para animar quem chega
 * na próxima fase, Fullscreen API com evento fullscreenchange.
 */
const PaginaChaveamento = {
  name: 'PaginaChaveamento',
  components: { SeloEquipe },
  setup() {
    const area = ref(null);
    const foco = ref(null);         // id da equipe sob o mouse/foco: destaca o caminho dela
    const telao = ref(false);

    const fase = (chave) => store.matches.filter((m) => m.stage === chave).sort((a, b) => a.position - b.position);
    // pares de partidas que alimentam a mesma partida seguinte (para desenhar a "chave")
    const pares = (lista) => lista.reduce((acc, m, i) => (i % 2 ? acc[acc.length - 1].push(m) : acc.push([m]), acc), []);
    const colunas = computed(() => [
      { nome: 'Quartas', pares: pares(fase('quarterfinal')) },
      { nome: 'Semifinais', pares: pares(fase('semifinal')) },
      { nome: 'Final', pares: [fase('final')] },
    ]);

    const classeLado = (m, lado) => {
      const t = m[`team_${lado}`];
      return {
        vazio: !t,
        venceu: t && m.winner_id === t.id,
        perdeu: t && m.winner_id && m.winner_id !== t.id,
        caminho: t && foco.value === t.id,
        apagado: foco.value && (!t || foco.value !== t.id),
      };
    };
    const placar = (m, lado) => (m[`score_${lado}`] ?? '');
    const rotaFase = (chave) => '/partidas/' + FASES.find((f) => f.chave === chave).rota;

    async function alternarTelao() {
      if (!document.fullscreenElement) await area.value.requestFullscreen?.();
      else await document.exitFullscreen();
    }
    const aoMudarTela = () => { telao.value = document.fullscreenElement === area.value; };
    onMounted(() => document.addEventListener('fullscreenchange', aoMudarTela));
    onUnmounted(() => document.removeEventListener('fullscreenchange', aoMudarTela));

    // 14 pedaços de confete com posição, atraso e cor variando por variável CSS
    const confetes = Array.from({ length: 14 }, (_, i) => ({ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 7) * 0.25}s`, '--c': ['#A3E635', '#F0389A', '#38BDF8', '#FACC15'][i % 4] }));

    return { store, derivados, area, foco, telao, colunas, classeLado, placar, rotaFase, alternarTelao, confetes, dataHoraBR, nomeFase };
  },
  template: `
  <section class="tela" aria-labelledby="t-chave">
    <header class="tela__topo">
      <div>
        <h1 id="t-chave">Chaveamento</h1>
        <p class="sub">Passe o mouse (ou o foco) numa equipe para ver o caminho dela.</p>
      </div>
      <button v-if="derivados.chaveamentoGerado.value" type="button" class="btn btn--contorno" @click="alternarTelao" :aria-pressed="telao">
        {{ telao ? 'Sair do telão' : 'Modo telão' }}
      </button>
    </header>

    <div v-if="!derivados.chaveamentoGerado.value" class="aviso">
      <strong>O chaveamento ainda não foi gerado</strong>
      <span>Ele aparece quando as 8 equipes fizerem check-in e a organização gerar a chave.</span>
      <router-link class="btn btn--primario" to="/equipes?status=confirmed">Ver confirmadas ({{ derivados.confirmadas.value }}/8)</router-link>
    </div>

    <div v-else ref="area" class="chave" :class="{ 'chave--telao': telao }">
      <p v-if="telao" class="chave__titulo">COPA CODE 2026</p>
      <div class="chave__grade">
        <div v-for="(col, ci) in colunas" :key="col.nome" class="chave__coluna" :class="'chave__coluna--' + ci">
          <h2 class="chave__fase">{{ col.nome }}</h2>
          <div v-for="(par, pi) in col.pares" :key="pi" class="chave__par" :class="{ 'chave__par--duplo': par.length === 2 }">
            <router-link v-for="m in par" :key="m.id" :to="rotaFase(m.stage)" class="partida-chave" :class="'partida-chave--' + m.status"
                         :aria-label="nomeFase(m.stage) + ': ' + (m.team_a?.name || 'a definir') + ' contra ' + (m.team_b?.name || 'a definir')">
              <time class="partida-chave__hora" :datetime="m.starts_at.replace(' ', 'T')">{{ dataHoraBR(m.starts_at) }}</time>
              <div v-for="lado in ['a', 'b']" :key="lado" class="lado" :class="classeLado(m, lado)"
                   @mouseenter="foco = m['team_' + lado]?.id || null" @mouseleave="foco = null"
                   @focusin="foco = m['team_' + lado]?.id || null" @focusout="foco = null">
                <Transition name="chegar" mode="out-in">
                  <span :key="m['team_' + lado]?.id || 'vazio-' + lado" class="lado__equipe">
                    <selo-equipe v-if="m['team_' + lado]" :equipe="m['team_' + lado]"></selo-equipe>
                    <span>{{ m['team_' + lado]?.name || 'A definir' }}</span>
                  </span>
                </Transition>
                <span class="lado__placar">{{ placar(m, lado) }}</span>
              </div>
            </router-link>
          </div>
        </div>
        <div class="chave__coluna chave__coluna--campeao">
          <h2 class="chave__fase">Campeão</h2>
          <div class="campeao" :class="{ 'campeao--definido': derivados.campeao.value }" aria-live="polite">
            <svg class="trofeu" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 6h28v8h10v6c0 8-6 14-13 15-2 5-6 8-9 9v8h10v6H20v-6h10v-8c-3-1-7-4-9-9C14 34 8 28 8 20v-6h10zm-4 14c0 4 3 8 7 9-1-3-1-6-1-9zm36 0h-6c0 3 0 6-1 9 4-1 7-5 7-9z"/></svg>
            <template v-if="derivados.campeao.value">
              <selo-equipe :equipe="derivados.campeao.value" grande></selo-equipe>
              <strong>{{ derivados.campeao.value.name }}</strong>
              <span v-for="(c, i) in confetes" :key="i" class="confete" :style="c" aria-hidden="true"></span>
            </template>
            <span v-else class="campeao__espera">Final em 28/11 às 17:00</span>
          </div>
        </div>
      </div>
    </div>
  </section>`,
};
