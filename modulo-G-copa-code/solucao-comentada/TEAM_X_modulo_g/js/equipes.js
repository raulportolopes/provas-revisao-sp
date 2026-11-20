/*
 * equipes.js – Pacote P3: lista de equipes, filtros na URL, check-in, exclusão e geração do chaveamento
 * ------------------------------------------------------------------------------------------------------
 * O que treina: filtros combinados guardados na query da rota (router.replace),
 * acordeão com um aberto por vez, modal de confirmação que exige digitar a tag,
 * botão que só habilita quando a regra permite (8 confirmadas).
 */
const PaginaEquipes = {
  name: 'PaginaEquipes',
  components: { SeloEquipe, ModalBase },
  setup() {
    const route = VueRouter.useRoute();
    const router = VueRouter.useRouter();

    // os filtros LEEM da URL e ESCREVEM na URL: F5 e link colado funcionam sozinhos
    const filtro = (nome) => computed({
      get: () => route.query[nome] || '',
      set: (v) => router.replace({ query: { ...route.query, [nome]: v || undefined } }),
    });
    const busca = filtro('busca');
    const escola = filtro('escola');
    const status = filtro('status');

    const lista = computed(() => {
      const b = semAcento(busca.value.trim());
      return store.teams.filter((t) =>
        (!b || semAcento([t.name, t.tag, ...t.players.map((p) => p.nickname)].join(' ')).includes(b)) &&
        (!escola.value || t.school.id === Number(escola.value)) &&
        (!status.value || t.status === status.value));
    });

    const aberta = ref(null);  // acordeão: id da equipe com jogadores à mostra (só uma)
    const alternar = (id) => { aberta.value = aberta.value === id ? null : id; };

    const ocupado = ref(null);
    async function checkIn(t) {
      ocupado.value = t.id;
      try {
        await API.checkIn(t.id);
        await recarregarEquipes();
        toast(`Check-in de ${t.name} confirmado.`);
      } catch (e) { toast(e.message, 'erro'); } finally { ocupado.value = null; }
    }

    // exclusão: só confirma digitando a tag
    const excluindo = ref(null);
    const confirmacao = ref('');
    const abrirExcluir = (t) => { excluindo.value = t; confirmacao.value = ''; };
    async function excluir() {
      const t = excluindo.value;
      try {
        await API.deleteTeam(t.id);
        excluindo.value = null;
        await recarregarEquipes();
        toast(`${t.name} foi excluída.`);
      } catch (e) { toast(e.message, 'erro'); }
    }

    async function gerar() {
      try {
        store.matches = await API.bracket();
        await recarregarEquipes();
        toast('Chaveamento gerado!');
        router.push('/chaveamento');
      } catch (e) { toast(e.message, 'erro'); }
    }

    const limpar = () => router.replace({ query: {} });
    const pct = computed(() => Math.min(100, (derivados.confirmadas.value / 8) * 100));
    return { store, derivados, busca, escola, status, lista, aberta, alternar, checkIn, ocupado, excluindo, confirmacao, abrirExcluir, excluir, gerar, limpar, pct, dataHoraBR };
  },
  template: `
  <section class="tela" aria-labelledby="t-equipes">
    <header class="tela__topo">
      <div>
        <h1 id="t-equipes">Equipes</h1>
        <p class="sub">{{ store.teams.length }} inscritas · as 8 primeiras com check-in entram no chaveamento</p>
      </div>
      <button v-if="store.org && !derivados.chaveamentoGerado.value" type="button" class="btn btn--primario"
              :disabled="derivados.confirmadas.value !== 8" @click="gerar"
              :title="derivados.confirmadas.value !== 8 ? 'Precisa de 8 equipes confirmadas' : ''">
        Gerar chaveamento
      </button>
    </header>

    <div class="progresso" role="progressbar" aria-label="Equipes confirmadas" aria-valuemin="0" aria-valuemax="8" :aria-valuenow="derivados.confirmadas.value">
      <div class="progresso__barra" :style="{ width: pct + '%' }"></div>
      <span class="progresso__txt"><strong>{{ derivados.confirmadas.value }}</strong> de 8 confirmadas</span>
    </div>

    <form class="filtros" role="search" @submit.prevent>
      <label class="campo campo--busca">
        <span class="sr">Buscar</span>
        <input type="search" v-model="busca" placeholder="Buscar equipe, tag ou nick">
      </label>
      <label class="campo">
        <span class="sr">Escola</span>
        <select v-model="escola">
          <option value="">Todas as escolas</option>
          <option v-for="s in store.schools" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
        </select>
      </label>
      <div class="chips" role="group" aria-label="Situação">
        <button v-for="op in [['', 'Todas'], ['confirmed', 'Confirmadas'], ['registered', 'Aguardando check-in']]" :key="op[0]"
                type="button" class="chip" :class="{ 'chip--ativo': status === op[0] }" :aria-pressed="status === op[0]" @click="status = op[0]">{{ op[1] }}</button>
      </div>
    </form>

    <p class="contador" aria-live="polite">{{ lista.length }} equipe{{ lista.length === 1 ? '' : 's' }}</p>

    <TransitionGroup v-if="lista.length" name="cartao" tag="ul" class="grade-equipes">
      <li v-for="t in lista" :key="t.id" class="equipe" :style="{ '--cor': t.school.color }">
        <div class="equipe__topo">
          <selo-equipe :equipe="t"></selo-equipe>
          <div class="equipe__nome">
            <h2>{{ t.name }}</h2>
            <p>{{ t.school.name }} · {{ t.school.city }}</p>
          </div>
          <span class="situacao" :class="'situacao--' + t.status">{{ t.status === 'confirmed' ? 'Confirmada' : 'Aguardando' }}</span>
        </div>
        <p class="equipe__info">
          <span v-if="t.seed">Cabeça de chave nº {{ t.seed }}</span>
          <span v-else-if="t.checked_in_at">Check-in {{ dataHoraBR(t.checked_in_at) }}</span>
          <span v-else>Sem check-in</span>
        </p>
        <button type="button" class="equipe__abrir" :aria-expanded="aberta === t.id" :aria-controls="'jog-' + t.id" @click="alternar(t.id)">
          {{ t.players.length }} jogadores <span aria-hidden="true" class="seta">▾</span>
        </button>
        <div class="equipe__jogadores" :id="'jog-' + t.id" :class="{ aberto: aberta === t.id }">
          <ul>
            <li v-for="p in t.players" :key="p.id">
              <strong>{{ p.nickname }}</strong> <span>{{ p.full_name }} · {{ p.age }} anos</span>
              <em v-if="p.role === 'captain'" class="papel">Capitão</em>
              <em v-else-if="p.role === 'substitute'" class="papel papel--reserva">Reserva</em>
            </li>
          </ul>
        </div>
        <div class="equipe__acoes" v-if="store.org && !derivados.chaveamentoGerado.value">
          <button v-if="t.status !== 'confirmed'" type="button" class="btn btn--primario btn--peq" :disabled="ocupado === t.id || derivados.confirmadas.value >= 8" @click="checkIn(t)">
            {{ derivados.confirmadas.value >= 8 ? 'Lista de espera' : 'Fazer check-in' }}
          </button>
          <button type="button" class="btn btn--texto btn--peq" @click="abrirExcluir(t)">Excluir</button>
        </div>
      </li>
    </TransitionGroup>
    <div v-else class="aviso">
      <strong>Nenhuma equipe encontrada</strong>
      <button type="button" class="btn btn--contorno" @click="limpar">Limpar filtros</button>
    </div>

    <modal-base :aberto="!!excluindo" titulo="Excluir equipe" @fechar="excluindo = null">
      <template v-if="excluindo">
        <p>A equipe <strong>{{ excluindo.name }}</strong> e os {{ excluindo.players.length }} jogadores serão apagados. Para confirmar, digite a tag <strong>{{ excluindo.tag }}</strong>.</p>
        <div class="campo">
          <label for="confirma-tag">Tag da equipe</label>
          <input id="confirma-tag" v-model="confirmacao" autocomplete="off" class="maiusculo">
        </div>
        <footer class="modal__rodape">
          <button type="button" class="btn btn--texto" @click="excluindo = null">Cancelar</button>
          <button type="button" class="btn btn--perigo" :disabled="confirmacao.toUpperCase() !== excluindo.tag" @click="excluir">Excluir</button>
        </footer>
      </template>
    </modal-base>
  </section>`,
};
