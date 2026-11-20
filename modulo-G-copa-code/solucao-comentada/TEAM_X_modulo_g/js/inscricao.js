/*
 * inscricao.js – Pacote P2: formulário de inscrição com lista dinâmica de jogadores
 * ---------------------------------------------------------------------------------
 * O que treina: v-for com objetos, v-model em lista, computed para
 * validação ao vivo, erros do servidor com chave "players.2.nickname",
 * <TransitionGroup> para a linha do reserva entrar e sair.
 */
const novoJogador = (role = 'player') => ({ uid: crypto.getRandomValues(new Uint32Array(1))[0], nickname: '', full_name: '', birth_date: '', role });

const PaginaInscricao = {
  name: 'PaginaInscricao',
  components: { SeloEquipe },
  setup() {
    const router = VueRouter.useRouter();
    const form = reactive({
      name: '', tag: '', school_id: '',
      players: [novoJogador('captain'), novoJogador(), novoJogador(), novoJogador(), novoJogador()],
    });
    const tocados = reactive({});          // campo => true depois do blur (ou do envio)
    const errosServidor = ref({});
    const enviando = ref(false);
    const criada = ref(null);

    // tag sempre em maiúsculas, sem espaço
    watch(() => form.tag, (v) => { form.tag = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); });

    const temReserva = computed(() => form.players.some((p) => p.role === 'substitute'));
    const capitao = computed({
      get: () => form.players.findIndex((p) => p.role === 'captain'),
      set: (i) => form.players.forEach((p, k) => { if (p.role !== 'substitute') p.role = k === i ? 'captain' : 'player'; }),
    });
    // escolas que já têm 2 equipes ficam desabilitadas no select
    const equipesPorEscola = computed(() => store.teams.reduce((acc, t) => ({ ...acc, [t.school.id]: (acc[t.school.id] || 0) + 1 }), {}));
    const escola = computed(() => store.schools.find((s) => s.id === Number(form.school_id)));

    /* mesmas regras da API, num computed: recalcula sozinho a cada tecla */
    const erros = computed(() => {
      const e = {};
      if (form.name.trim().length < 3 || form.name.trim().length > 40) e.name = 'O nome da equipe deve ter entre 3 e 40 caracteres.';
      else if (store.teams.some((t) => semAcento(t.name) === semAcento(form.name.trim()))) e.name = 'Já existe uma equipe com esse nome.';
      if (!/^[A-Z0-9]{2,4}$/.test(form.tag)) e.tag = 'A tag deve ter de 2 a 4 letras ou números.';
      else if (store.teams.some((t) => t.tag === form.tag)) e.tag = 'Já existe uma equipe com essa tag.';
      if (!form.school_id) e.school_id = 'Escolha uma escola válida.';
      const vistos = new Set(store.teams.flatMap((t) => t.players.map((p) => p.nickname.toLowerCase())));
      const naEquipe = new Set();
      form.players.forEach((p, i) => {
        const nick = p.nickname.trim();
        if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) e[`players.${i}.nickname`] = 'Nick com 3 a 20 letras, números ou _.';
        else if (naEquipe.has(nick.toLowerCase())) e[`players.${i}.nickname`] = 'Nick repetido na equipe.';
        else if (vistos.has(nick.toLowerCase())) e[`players.${i}.nickname`] = 'Nick já inscrito em outra equipe.';
        naEquipe.add(nick.toLowerCase());
        if (p.full_name.trim().length < 5 || !p.full_name.trim().includes(' ')) e[`players.${i}.full_name`] = 'Informe nome e sobrenome.';
        const idade = idadeNoTorneio(p.birth_date);
        if (idade === null) e[`players.${i}.birth_date`] = 'Informe a data de nascimento.';
        else if (idade < 14 || idade > 19) e[`players.${i}.birth_date`] = 'A idade no dia do torneio deve ser de 14 a 19 anos.';
      });
      return e;
    });
    // mostra o erro do cliente só depois de o campo ser tocado; o do servidor sempre
    const erro = (campo) => errosServidor.value[campo] || (tocados[campo] ? erros.value[campo] : '');
    const tocar = (campo) => { tocados[campo] = true; delete errosServidor.value[campo]; };

    function adicionarReserva() {
      form.players.push(novoJogador('substitute'));
      nextTick(() => document.getElementById('nick-5')?.focus());
    }
    function removerReserva() {
      form.players.pop();
      Object.keys(tocados).filter((k) => k.startsWith('players.5.')).forEach((k) => delete tocados[k]);
      nextTick(() => document.getElementById('btn-reserva')?.focus());
    }

    async function enviar() {
      // marca tudo como tocado para todos os erros aparecerem juntos
      ['name', 'tag', 'school_id'].forEach((c) => (tocados[c] = true));
      form.players.forEach((_, i) => ['nickname', 'full_name', 'birth_date'].forEach((c) => (tocados[`players.${i}.${c}`] = true)));
      if (Object.keys(erros.value).length) {
        nextTick(() => document.querySelector('.inscricao [aria-invalid="true"]')?.focus());
        return;
      }
      enviando.value = true;
      try {
        const dados = { name: form.name.trim(), tag: form.tag, school_id: Number(form.school_id),
          players: form.players.map(({ uid, ...p }) => ({ ...p, nickname: p.nickname.trim(), full_name: p.full_name.trim() })) };
        criada.value = await API.createTeam(dados);
        await recarregarEquipes();
        toast(`Equipe ${criada.value.name} inscrita!`);
        nextTick(() => document.getElementById('inscricao-ok')?.focus());
      } catch (e) {
        if (e.status === 422) {
          errosServidor.value = e.errors;
          nextTick(() => document.querySelector('.inscricao [aria-invalid="true"]')?.focus());
        } else toast(e.message, 'erro');   // 409: nome, tag, nick, escola cheia, inscrições fechadas
      } finally {
        enviando.value = false;
      }
    }

    function novaInscricao() {
      criada.value = null;
      Object.assign(form, { name: '', tag: '', school_id: '', players: [novoJogador('captain'), novoJogador(), novoJogador(), novoJogador(), novoJogador()] });
      Object.keys(tocados).forEach((k) => delete tocados[k]);
      errosServidor.value = {};
    }

    return { store, derivados, form, erro, tocar, temReserva, capitao, equipesPorEscola, escola, adicionarReserva, removerReserva, enviar, enviando, criada, novaInscricao, idadeNoTorneio, router };
  },
  template: `
  <section class="tela inscricao" aria-labelledby="t-inscricao">
    <header class="tela__topo">
      <div>
        <p class="sobretitulo">Copa Code 2026 · 28/11/2026</p>
        <h1 id="t-inscricao">Inscrição de equipe</h1>
        <p class="sub">5 titulares e 1 reserva opcional, de 14 a 19 anos no dia do torneio. No máximo 2 equipes por escola.</p>
      </div>
    </header>

    <div v-if="derivados.chaveamentoGerado.value" class="aviso">
      <strong>Inscrições encerradas</strong>
      <span>O chaveamento já foi gerado.</span>
      <router-link class="btn btn--primario" to="/chaveamento">Ver chaveamento</router-link>
    </div>

    <div v-else-if="criada" class="cartao sucesso" id="inscricao-ok" tabindex="-1">
      <selo-equipe :equipe="criada" grande></selo-equipe>
      <h2>{{ criada.name }} está inscrita!</h2>
      <p>{{ criada.school.name }} · {{ criada.players.length }} jogadores · aguardando check-in no dia 28/11.</p>
      <div class="sucesso__acoes">
        <button type="button" class="btn btn--contorno" @click="novaInscricao">Inscrever outra</button>
        <router-link class="btn btn--primario" to="/equipes">Ver equipes</router-link>
      </div>
    </div>

    <form v-else class="inscricao__grade" novalidate @submit.prevent="enviar">
      <fieldset class="cartao">
        <legend>Equipe</legend>
        <div class="campo">
          <label for="f-nome">Nome da equipe *</label>
          <input id="f-nome" v-model="form.name" maxlength="40" @blur="tocar('name')" :aria-invalid="!!erro('name')" aria-describedby="e-nome">
          <p class="erro" id="e-nome">{{ erro('name') }}</p>
        </div>
        <div class="linha-2">
          <div class="campo">
            <label for="f-tag">Tag (2 a 4) *</label>
            <input id="f-tag" v-model="form.tag" class="maiusculo" @blur="tocar('tag')" :aria-invalid="!!erro('tag')" aria-describedby="e-tag">
            <p class="erro" id="e-tag">{{ erro('tag') }}</p>
          </div>
          <div class="campo">
            <label for="f-escola">Escola *</label>
            <select id="f-escola" v-model="form.school_id" @blur="tocar('school_id')" @change="tocar('school_id')" :aria-invalid="!!erro('school_id')" aria-describedby="e-escola">
              <option value="">Escolha…</option>
              <option v-for="s in store.schools" :key="s.id" :value="s.id" :disabled="(equipesPorEscola[s.id] || 0) >= 2">
                {{ s.name }} ({{ s.city }}){{ (equipesPorEscola[s.id] || 0) >= 2 ? ' – 2 equipes, lotada' : '' }}
              </option>
            </select>
            <p class="erro" id="e-escola">{{ erro('school_id') }}</p>
          </div>
        </div>
        <div class="previa" aria-live="polite">
          <selo-equipe :equipe="{ tag: form.tag || '??', color: escola?.color }" grande></selo-equipe>
          <div>
            <strong>{{ form.name || 'Nome da equipe' }}</strong>
            <span>{{ escola?.name || 'Escola' }}</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="cartao jogadores">
        <legend>Jogadores <small>({{ form.players.length }}/6)</small></legend>
        <p class="dica" id="dica-capitao">Marque quem é o capitão (só titulares).</p>
        <TransitionGroup name="linha" tag="ol" class="jogadores__lista">
          <li v-for="(p, i) in form.players" :key="p.uid" class="jogador" :class="{ 'jogador--reserva': p.role === 'substitute' }">
            <span class="jogador__n" aria-hidden="true">{{ p.role === 'substitute' ? 'R' : i + 1 }}</span>
            <div class="campo">
              <label :for="'nick-' + i">Nick {{ p.role === 'substitute' ? '(reserva)' : '' }} *</label>
              <input :id="'nick-' + i" v-model="p.nickname" maxlength="20" autocomplete="off"
                     @blur="tocar('players.' + i + '.nickname')" :aria-invalid="!!erro('players.' + i + '.nickname')" :aria-describedby="'e-nick-' + i">
              <p class="erro" :id="'e-nick-' + i">{{ erro('players.' + i + '.nickname') }}</p>
            </div>
            <div class="campo">
              <label :for="'nome-' + i">Nome completo *</label>
              <input :id="'nome-' + i" v-model="p.full_name" maxlength="80"
                     @blur="tocar('players.' + i + '.full_name')" :aria-invalid="!!erro('players.' + i + '.full_name')" :aria-describedby="'e-nome-' + i">
              <p class="erro" :id="'e-nome-' + i">{{ erro('players.' + i + '.full_name') }}</p>
            </div>
            <div class="campo">
              <label :for="'nasc-' + i">Nascimento * <span class="idade" v-if="idadeNoTorneio(p.birth_date) !== null">{{ idadeNoTorneio(p.birth_date) }} anos em 28/11</span></label>
              <input :id="'nasc-' + i" type="date" v-model="p.birth_date"
                     @blur="tocar('players.' + i + '.birth_date')" :aria-invalid="!!erro('players.' + i + '.birth_date')" :aria-describedby="'e-nasc-' + i">
              <p class="erro" :id="'e-nasc-' + i">{{ erro('players.' + i + '.birth_date') }}</p>
            </div>
            <label class="capitao" v-if="p.role !== 'substitute'">
              <input type="radio" name="capitao" :value="i" v-model="capitao" aria-describedby="dica-capitao">
              <span>Capitão</span>
            </label>
            <span v-else class="capitao capitao--vazio"></span>
          </li>
        </TransitionGroup>
        <p class="erro">{{ erro('players') }}</p>
        <button v-if="!temReserva" id="btn-reserva" type="button" class="btn btn--contorno" @click="adicionarReserva">+ Adicionar reserva</button>
        <button v-else id="btn-reserva" type="button" class="btn btn--texto" @click="removerReserva">Remover reserva</button>
      </fieldset>

      <div class="inscricao__enviar">
        <button type="submit" class="btn btn--primario btn--grande" :disabled="enviando">{{ enviando ? 'Enviando…' : 'Inscrever equipe' }}</button>
      </div>
    </form>
  </section>`,
};
