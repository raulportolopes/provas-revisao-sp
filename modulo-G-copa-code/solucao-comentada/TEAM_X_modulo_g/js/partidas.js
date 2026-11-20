/*
 * partidas.js – Pacote P5: agenda em abas, contagem regressiva e lançamento de placar
 * -----------------------------------------------------------------------------------
 * O que treina: aba ligada ao parâmetro da rota (/partidas/:fase),
 * padrão ARIA de abas com setas, setInterval criado no onMounted e
 * DESTRUÍDO no onUnmounted (senão o relógio continua rodando em outra tela),
 * modal de placar com as 4 opções válidas da melhor de 3.
 */
const PaginaPartidas = {
  name: 'PaginaPartidas',
  components: { SeloEquipe, ModalBase },
  setup() {
    const route = VueRouter.useRoute();
    const router = VueRouter.useRouter();
    const faseAtual = computed(() => FASES.find((f) => f.rota === route.params.fase) || FASES[0]);
    const lista = computed(() => store.matches.filter((m) => m.stage === faseAtual.value.chave).sort((a, b) => a.position - b.position));
    const contagem = (chave) => store.matches.filter((m) => m.stage === chave && m.status === 'finished').length + '/' + store.matches.filter((m) => m.stage === chave).length;

    function teclaAba(e, i) {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!passo) return;
      const nova = FASES[(i + passo + FASES.length) % FASES.length];
      router.replace('/partidas/' + nova.rota);
      nextTick(() => document.getElementById('aba-' + nova.rota)?.focus());
    }

    /* ---------- contagem regressiva para a próxima partida ---------- */
    const agora = ref(Date.now());
    let relogio = null;
    onMounted(() => { relogio = setInterval(() => (agora.value = Date.now()), 1000); });
    onUnmounted(() => clearInterval(relogio));
    const proxima = computed(() => store.matches
      .filter((m) => m.status !== 'finished')
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] || null);
    const falta = computed(() => {
      if (!proxima.value) return null;
      const ms = paraDate(proxima.value.starts_at) - agora.value;
      if (ms <= 0) return { aoVivo: true };
      const s = Math.floor(ms / 1000);
      return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    });
    const dois = (n) => String(n).padStart(2, '0');

    /* ---------- placar ---------- */
    const editando = ref(null);
    const OPCOES = [[2, 0], [2, 1], [1, 2], [0, 2]];
    async function lancar(a, b) {
      const m = editando.value;
      try {
        store.matches = await API.score(m.id, a, b);
        editando.value = null;
        const vencedor = a > b ? m.team_a : m.team_b;
        toast(m.stage === 'final' ? `${vencedor.name} é campeã da Copa Code!` : `${vencedor.name} avança.`);
      } catch (e) {
        toast(e.message, 'erro');
        if (e.status === 401) editando.value = null;
      }
    }
    const podeLancar = (m) => store.org && m.team_a && m.team_b;

    return { store, derivados, FASES, faseAtual, lista, contagem, teclaAba, proxima, falta, dois, editando, OPCOES, lancar, podeLancar, dataHoraBR, nomeFase };
  },
  template: `
  <section class="tela" aria-labelledby="t-partidas">
    <header class="tela__topo">
      <div>
        <h1 id="t-partidas">Partidas</h1>
        <p class="sub">Melhor de 3 · sábado, 28/11/2026</p>
      </div>
    </header>

    <div v-if="!derivados.chaveamentoGerado.value" class="aviso">
      <strong>Ainda não há partidas</strong>
      <span>A agenda aparece depois que o chaveamento for gerado.</span>
    </div>

    <template v-else>
      <div class="contagem" v-if="proxima" aria-live="off">
        <p class="contagem__rotulo">Próxima partida · {{ nomeFase(proxima.stage) }} · {{ dataHoraBR(proxima.starts_at) }}</p>
        <p class="contagem__jogo">{{ proxima.team_a?.name || 'A definir' }} <span>×</span> {{ proxima.team_b?.name || 'A definir' }}</p>
        <p v-if="falta.aoVivo" class="contagem__vivo">AO VIVO</p>
        <p v-else class="contagem__relogio" :aria-label="'Faltam ' + falta.d + ' dias, ' + falta.h + ' horas e ' + falta.m + ' minutos'">
          <span><strong>{{ falta.d }}</strong>dias</span><span><strong>{{ dois(falta.h) }}</strong>h</span>
          <span><strong>{{ dois(falta.m) }}</strong>min</span><span><strong>{{ dois(falta.s) }}</strong>s</span>
        </p>
      </div>
      <div v-else-if="derivados.campeao.value" class="contagem contagem--fim">
        <p class="contagem__rotulo">Torneio encerrado</p>
        <p class="contagem__jogo">Campeã: {{ derivados.campeao.value.name }}</p>
      </div>

      <div class="abas" role="tablist" aria-label="Fases">
        <router-link v-for="(f, i) in FASES" :key="f.chave" :to="'/partidas/' + f.rota" custom v-slot="{ navigate }">
          <button type="button" role="tab" :id="'aba-' + f.rota" :aria-selected="faseAtual.chave === f.chave" aria-controls="painel-fase"
                  :tabindex="faseAtual.chave === f.chave ? 0 : -1" class="aba" :class="{ 'aba--ativa': faseAtual.chave === f.chave }"
                  @click="navigate" @keydown="teclaAba($event, i)">
            {{ f.nome }} <small>{{ contagem(f.chave) }}</small>
          </button>
        </router-link>
      </div>

      <div id="painel-fase" role="tabpanel" :aria-labelledby="'aba-' + faseAtual.rota" class="painel-fase">
        <TransitionGroup name="cartao" tag="ul" class="lista-partidas">
          <li v-for="m in lista" :key="m.id" class="partida" :class="'partida--' + m.status">
            <div class="partida__cab">
              <time :datetime="m.starts_at.replace(' ', 'T')">{{ dataHoraBR(m.starts_at) }}</time>
              <span class="estado" :class="'estado--' + m.status">{{ { waiting: 'Aguardando', scheduled: 'Agendada', finished: 'Encerrada' }[m.status] }}</span>
            </div>
            <div class="partida__placar">
              <div v-for="lado in ['a', 'b']" :key="lado" class="partida__lado" :class="{ venceu: m.winner_id && m['team_' + lado]?.id === m.winner_id }">
                <selo-equipe v-if="m['team_' + lado]" :equipe="m['team_' + lado]" grande></selo-equipe>
                <span v-else class="selo selo--grande selo--vazio">?</span>
                <span class="partida__nome">{{ m['team_' + lado]?.name || 'A definir' }}</span>
              </div>
              <p class="partida__x">
                <template v-if="m.status === 'finished'"><strong>{{ m.score_a }}</strong> × <strong>{{ m.score_b }}</strong></template>
                <template v-else>×</template>
              </p>
            </div>
            <button v-if="podeLancar(m)" type="button" class="btn btn--contorno btn--peq" @click="editando = m">
              {{ m.status === 'finished' ? 'Corrigir placar' : 'Lançar placar' }}
            </button>
          </li>
        </TransitionGroup>
      </div>
    </template>

    <modal-base :aberto="!!editando" titulo="Lançar placar" @fechar="editando = null">
      <template v-if="editando">
        <p>{{ nomeFase(editando.stage) }} · {{ dataHoraBR(editando.starts_at) }}. Escolha o resultado da melhor de 3:</p>
        <div class="opcoes-placar">
          <button v-for="o in OPCOES" :key="o.join()" type="button" class="opcao" @click="lancar(o[0], o[1])">
            <span>{{ editando.team_a.tag }}</span><strong>{{ o[0] }} × {{ o[1] }}</strong><span>{{ editando.team_b.tag }}</span>
            <small>vence {{ o[0] > o[1] ? editando.team_a.name : editando.team_b.name }}</small>
          </button>
        </div>
      </template>
    </modal-base>
  </section>`,
};
