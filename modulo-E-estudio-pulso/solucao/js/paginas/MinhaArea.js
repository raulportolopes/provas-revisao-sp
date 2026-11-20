// =====================================================================
// MinhaArea.js – rota protegida (guarda no router.js).
//  - FOTO: FileReader + validação de tipo (jpg/png/webp), tamanho (≤ 2 MB)
//    e dimensão mínima (200 × 200, conferida com new Image()); prévia antes
//    de salvar; Trocar e Remover. localStorage cheio = mensagem de erro.
//  - META DO MÊS: anel de progresso com conic-gradient + meta editável.
//  - GRÁFICOS SÓ COM CSS: barras das últimas 8 semanas (--v) e rosca por
//    modalidade (conic-gradient montado no JS com vários pedaços).
//  - MINHAS AULAS: filtro por situação, ordem por data, paginação de 5.
// =====================================================================
import { store, ocorrencia, situacao, cancelar, avisar, rotuloAula, modalidade, agora } from '../store.js';
import { dataLocal, segundaDaSemana, somarDias, isoDia, diaMes, dataBR, DIAS_CURTOS, hhmm } from '../util.js';
const { ref, computed, watch } = Vue;

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const POR_PAGINA = 5;

export default {
  setup() {
    const cfg = computed(() => store.dados.config);
    const u = computed(() => store.usuario);

    // ---------- foto ----------
    const previa = ref(null);
    const erroFoto = ref('');
    function escolherFoto(e) {
      const f = e.target.files[0]; e.target.value = '';
      erroFoto.value = ''; previa.value = null;
      if (!f) return;
      if (!TIPOS.includes(f.type)) { erroFoto.value = 'Formato não aceito. Use JPG, PNG ou WEBP.'; return; }
      if (f.size > cfg.value.avatar_max_mb * 1024 * 1024) { erroFoto.value = `A foto tem ${(f.size / 1048576).toFixed(1).replace('.', ',')} MB; o máximo é ${cfg.value.avatar_max_mb} MB.`; return; }
      const leitor = new FileReader();
      leitor.onload = () => {
        const img = new Image();
        img.onload = () => {
          const min = cfg.value.avatar_min_px;
          if (img.width < min || img.height < min) { erroFoto.value = `A foto tem ${img.width} × ${img.height} px; o mínimo é ${min} × ${min}.`; return; }
          previa.value = leitor.result;              // data:image/...;base64,...
        };
        img.onerror = () => (erroFoto.value = 'Não foi possível abrir a imagem.');
        img.src = leitor.result;
      };
      leitor.readAsDataURL(f);
    }
    function salvarFoto() {
      try {
        localStorage.setItem('pulso:avatar', JSON.stringify(previa.value));
        store.usuario.avatar = previa.value; previa.value = null;
        avisar('Foto atualizada.', { tipo: 'sucesso' });
      } catch {   // QuotaExceededError: localStorage tem ~5 MB
        erroFoto.value = 'Sem espaço para salvar a foto neste navegador. Escolha uma imagem menor.';
      }
    }
    function removerFoto() { localStorage.removeItem('pulso:avatar'); store.usuario.avatar = null; avisar('Foto removida.'); }

    // ---------- meta do mês ----------
    const mesAtual = computed(() => isoDia(agora()).slice(0, 7));          // "2026-12"
    const feitasNoMes = computed(() => u.value.historico.filter(h => h.data.startsWith(mesAtual.value)).length +
      store.reservas.filter(r => r.status === 'confirmada' && r.data.startsWith(mesAtual.value) && ocorrencia(r.aulaId, r.data).fim <= agora()).length);
    const pctMeta = computed(() => Math.min(100, Math.round((feitasNoMes.value / u.value.meta_mensal) * 100)));
    const metaEditada = ref(u.value.meta_mensal);
    const erroMeta = ref('');
    function salvarMeta() {
      const n = Number(metaEditada.value);
      if (!Number.isInteger(n) || n < 4 || n > 30) { erroMeta.value = 'A meta deve ser um número inteiro de 4 a 30.'; return; }
      erroMeta.value = ''; store.usuario.meta_mensal = n; avisar('Meta atualizada.', { tipo: 'sucesso' });
    }

    // ---------- gráficos ----------
    const semanas = computed(() => {
      const seg = segundaDaSemana(agora());
      return Array.from({ length: 8 }, (_, k) => {
        const ini = somarDias(seg, -(8 - k) * 7), fim = somarDias(ini, 7);
        const qtd = u.value.historico.filter(h => { const d = dataLocal(h.data); return d >= ini && d < fim; }).length;
        return { rotulo: diaMes(isoDia(ini)), qtd };
      });
    });
    const maxSemana = computed(() => Math.max(1, ...semanas.value.map(s => s.qtd)));
    const fatias = computed(() => {
      const cont = {};
      u.value.historico.forEach(h => (cont[h.modalidade_id] = (cont[h.modalidade_id] || 0) + 1));
      const total = u.value.historico.length;
      let acumulado = 0;
      return Object.entries(cont).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
        const m = modalidade(Number(id)), pct = (n / total) * 100;
        const fatia = { nome: m.nome, cor: m.cor, n, pct: Math.round(pct), de: acumulado, ate: acumulado + pct };
        acumulado += pct; return fatia;
      });
    });
    // "conic-gradient(#F43F5E 0% 25%, #14B8A6 25% 40%, ...)" – cada modalidade é um pedaço da pizza
    const fundoRosca = computed(() => `conic-gradient(${fatias.value.map(f => `${f.cor} ${f.de}% ${f.ate}%`).join(', ')})`);

    // ---------- minhas aulas ----------
    const filtro = ref('todas');
    const pagina = ref(1);
    const minhas = computed(() => store.reservas
      .map(r => ({ r, oc: ocorrencia(r.aulaId, r.data) }))
      .filter(x => filtro.value === 'todas' || x.r.status === filtro.value)
      .sort((a, b) => a.oc.inicio - b.oc.inicio));
    const paginas = computed(() => Math.max(1, Math.ceil(minhas.value.length / POR_PAGINA)));
    watch([filtro, () => store.reservas.length], () => { pagina.value = Math.min(pagina.value, paginas.value); });
    watch(filtro, () => (pagina.value = 1));
    const daPagina = computed(() => minhas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA));
    function cancelarAqui(oc) {
      const removida = cancelar(oc);
      avisar(`Reserva de ${rotuloAula(oc)} cancelada.`, { tipo: 'sucesso', duracao: 6000, acao: { texto: 'Desfazer', executar: () => store.reservas.push(removida) } });
    }

    return { store, u, previa, erroFoto, escolherFoto, salvarFoto, removerFoto, feitasNoMes, pctMeta, metaEditada, erroMeta, salvarMeta,
      semanas, maxSemana, fatias, fundoRosca, filtro, pagina, paginas, minhas, daPagina, cancelarAqui, situacao, agora, dataBR, DIAS_CURTOS, hhmm,
      planoNome: computed(() => store.dados.planos.find(p => p.id === u.value.plano_id)?.nome) };
  },
  template: `<div class="pagina">
    <div class="cabecalho-pagina"><h1>Olá, {{ u.nome.split(' ')[0] }}!</h1><p>Plano {{ planoNome }} · {{ u.email }}</p></div>

    <div class="painel-grade">
      <section class="painel perfil" aria-labelledby="t-foto">
        <h2 id="t-foto">Foto do perfil</h2>
        <div class="perfil__foto">
          <img v-if="previa || u.avatar" :src="previa || u.avatar" alt="Sua foto de perfil" width="140" height="140">
          <span v-else class="usuario__foto usuario__foto--iniciais usuario__foto--grande" aria-hidden="true">{{ u.nome.split(' ').map(p => p[0]).join('') }}</span>
        </div>
        <p v-if="previa" class="aviso-inline">Prévia: confira e salve.</p>
        <div class="perfil__botoes">
          <label class="botao botao--contorno botao--pequeno">{{ u.avatar ? 'Trocar foto' : 'Escolher foto' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="escolherFoto" aria-describedby="foto-regras"></label>
          <button v-if="previa" type="button" class="botao botao--pequeno" @click="salvarFoto">Salvar</button>
          <button v-if="previa" type="button" class="botao botao--texto" @click="previa = null">Descartar</button>
          <button v-if="u.avatar && !previa" type="button" class="botao botao--texto" @click="removerFoto">Remover</button>
        </div>
        <p id="foto-regras" class="suave">JPG, PNG ou WEBP, até {{ store.dados.config.avatar_max_mb }} MB, mínimo {{ store.dados.config.avatar_min_px }} × {{ store.dados.config.avatar_min_px }} px.</p>
        <p class="erro-campo" role="alert">{{ erroFoto }}</p>
      </section>

      <section class="painel meta" aria-labelledby="t-meta">
        <h2 id="t-meta">Meta do mês</h2>
        <div class="anel" :style="{ '--pct': pctMeta }" role="img" :aria-label="feitasNoMes + ' de ' + u.meta_mensal + ' aulas (' + pctMeta + '%)'">
          <b>{{ feitasNoMes }}<small>/{{ u.meta_mensal }}</small></b>
        </div>
        <form class="meta__form" novalidate @submit.prevent="salvarMeta">
          <label for="meta">Aulas por mês</label>
          <input id="meta" type="number" min="4" max="30" v-model="metaEditada" :aria-invalid="!!erroMeta" aria-describedby="e-meta">
          <button type="submit" class="botao botao--pequeno">Salvar</button>
        </form>
        <p id="e-meta" class="erro-campo">{{ erroMeta }}</p>
      </section>

      <section class="painel" aria-labelledby="t-semanas">
        <h2 id="t-semanas">Aulas nas últimas 8 semanas</h2>
        <div class="barras">
          <div v-for="(s, i) in semanas" :key="s.rotulo" class="barra" :style="{ '--v': s.qtd / maxSemana * 100, '--i': i }" tabindex="0" role="img" :aria-label="'Semana de ' + s.rotulo + ': ' + s.qtd + ' aulas'">
            <span class="barra__valor">{{ s.qtd }}</span><span class="barra__coluna"></span><span class="barra__rotulo">{{ s.rotulo }}</span>
          </div>
        </div>
      </section>

      <section class="painel" aria-labelledby="t-rosca">
        <h2 id="t-rosca">Por modalidade</h2>
        <div class="rosca-area">
          <div class="rosca" :style="{ background: fundoRosca }" role="img" :aria-label="fatias.map(f => f.nome + ' ' + f.pct + '%').join(', ')"><b>{{ u.historico.length }}<small>aulas</small></b></div>
          <ul class="legenda"><li v-for="f in fatias" :key="f.nome" :style="{ '--cor': f.cor }">{{ f.nome }} <b>{{ f.pct }}%</b></li></ul>
        </div>
      </section>
    </div>

    <section class="secao" aria-labelledby="t-minhas">
      <div class="secao__topo">
        <h2 id="t-minhas">Minhas aulas</h2>
        <div class="segmentado segmentado--auto" role="group" aria-label="Filtrar por situação">
          <button v-for="[v, t] in [['todas', 'Todas'], ['confirmada', 'Confirmadas'], ['espera', 'Lista de espera']]" :key="v" type="button" :aria-pressed="filtro === v" @click="filtro = v">{{ t }}</button>
        </div>
      </div>
      <ul v-if="daPagina.length" class="minhas">
        <li v-for="x in daPagina" :key="x.r.aulaId + x.r.data" class="minha" :style="{ '--cor': x.oc.modalidade.cor }">
          <span class="minha__data"><b>{{ DIAS_CURTOS[x.oc.inicio.getDay()] }}</b>{{ dataBR(x.r.data).slice(0, 5) }}</span>
          <span class="minha__info"><b>{{ x.oc.modalidade.nome }}</b> {{ x.oc.aula.inicio }}–{{ hhmm(x.oc.fimMin) }} · {{ x.oc.professor.nome }}</span>
          <span class="selo" :class="x.oc.fim <= agora() ? 'selo--feita' : x.r.status === 'confirmada' ? 'selo--ok' : 'selo--cheia'">
            {{ x.oc.fim <= agora() ? 'Realizada' : x.r.status === 'confirmada' ? 'Confirmada' : x.r.posicao + 'º na espera' }}</span>
          <button v-if="situacao(x.oc).acao === 'cancelar'" type="button" class="botao botao--texto" @click="cancelarAqui(x.oc)">Cancelar</button>
          <span v-else class="suave minha__trava" :title="situacao(x.oc).motivo">Sem cancelamento</span>
        </li>
      </ul>
      <p v-else class="vazio">Nenhuma aula aqui. <RouterLink to="/aulas">Reserve pela grade</RouterLink>.</p>
      <nav v-if="paginas > 1" class="paginacao" aria-label="Páginas de aulas">
        <button type="button" :disabled="pagina === 1" aria-label="Página anterior" @click="pagina--">‹</button>
        <button v-for="n in paginas" :key="n" type="button" :class="{ ativa: n === pagina }" :aria-current="n === pagina ? 'page' : null" @click="pagina = n">{{ n }}</button>
        <button type="button" :disabled="pagina === paginas" aria-label="Próxima página" @click="pagina++">›</button>
      </nav>
    </section>
  </div>`,
};
