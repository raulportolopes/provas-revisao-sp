/*
 * Tela AGENDA (#/agenda) – o coração da prova.
 *
 * Fluxo de dados:
 *   URL (#/agenda?data=...&pagina=2)  ->  estado  ->  GET /aulas?...  ->  desenhar()
 *   usuário mexe num filtro           ->  estado  ->  URL (replaceState) + nova requisição
 *
 * Pontos difíceis resolvidos aqui:
 *  - Abas de dias (14 dias a partir de hoje) com teclado.
 *  - Filtros combinados enviados para a API (o filtro é feito no SERVIDOR, não no array).
 *  - Busca com debounce (espera o usuário parar de digitar 300 ms antes de pedir).
 *  - Corrida de requisições: a API responde fora de ordem de propósito. AbortController cancela
 *    a anterior, então só a resposta do ÚLTIMO pedido é desenhada.
 *  - Paginação do servidor (meta.total_paginas) e estado completo na URL (F5 volta igual).
 *  - Modal de detalhes com reservar / cancelar / lista de espera e os códigos 409/422 da API.
 */
import { api, sessao } from '../api.js';
import { cat, carregarCatalogos } from '../dados.js';
import { substituirParams } from '../navegacao.js';
import * as f from '../formatos.js';
import { esc } from '../formatos.js';
import { ligarAbas, marcarAba } from '../componentes/abas.js';
import { paginacaoHTML } from '../componentes/paginacao.js';
import { abrirModal, confirmar } from '../componentes/modal.js';
import { toast } from '../componentes/toast.js';

const DIAS = 14;
const ORDENS = { horario: 'Horário', vagas: 'Mais vagas livres', modalidade: 'Modalidade (A–Z)' };
const PERIODOS = { '': 'Todos', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

export function montar(raiz, params) {
  /* ---------- 1. Estado inicial vindo da URL (com valores padrão e validação) ---------- */
  const hoje = new Date();
  const dias = Array.from({ length: DIAS }, (_, i) => { const d = new Date(hoje); d.setDate(d.getDate() + i); return f.isoDia(d); });
  const estado = {
    data: dias.includes(params.get('data')) ? params.get('data') : dias[0],
    unidade: params.get('unidade') || '',
    modalidades: (params.get('modalidades') || '').split(',').filter(Boolean).map(Number),
    periodo: PERIODOS[params.get('periodo')] ? params.get('periodo') : '',
    vagas: params.get('vagas') === '1',
    busca: params.get('busca') || '',
    ordem: ORDENS[params.get('ordem')] ? params.get('ordem') : 'horario',
    pagina: Math.max(1, parseInt(params.get('pagina'), 10) || 1),
  };
  let controlador = null;   // AbortController da requisição em andamento
  let timerBusca = null;
  let ultimaResposta = null;

  /* ---------- 2. Esqueleto da tela ---------- */
  const nome = sessao.usuario?.nome.split(' ')[0] || '';
  const h = hoje.getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  raiz.innerHTML = `
  <div class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="sobretitulo">${saudacao}, ${esc(nome)}!</p>
        <h1>Agenda de aulas</h1>
      </div>
      <p class="texto-suave">Reserve até 2 aulas por dia. Cancelamento até 2 horas antes.</p>
    </header>

    <div class="dias" role="tablist" aria-label="Dia da agenda">
      ${dias.map((iso, i) => {
        const d = f.dataLocal(iso);
        const topo = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : f.diaCurto(d).split(',')[0];
        return `<button type="button" role="tab" class="dia" id="aba-dia-${iso}" data-data="${iso}" aria-controls="painel-agenda"
                  aria-label="${esc(f.extenso(d))}" aria-selected="false" tabindex="-1">
                  <span class="dia__semana">${esc(topo)}</span>
                  <span class="dia__num">${String(d.getDate()).padStart(2, '0')}</span>
                  <span class="dia__mes">${esc(f.mesCurto(iso.slice(0, 7)))}</span>
                </button>`;
      }).join('')}
    </div>

    <div class="agenda">
      <form class="filtros cartao" role="search" aria-label="Filtrar aulas">
        <div class="campo filtros__busca">
          <label for="f-busca">Buscar</label>
          <input id="f-busca" type="search" placeholder="Modalidade ou instrutor" autocomplete="off">
        </div>
        <div class="campo">
          <label for="f-unidade">Unidade</label>
          <select id="f-unidade"><option value="">Todas as unidades</option></select>
        </div>
        <fieldset class="segmentado">
          <legend>Período</legend>
          ${Object.entries(PERIODOS).map(([v, t]) => `
            <label><input type="radio" name="periodo" value="${v}"><span>${t}</span></label>`).join('')}
        </fieldset>
        <div class="campo">
          <label for="f-ordem">Ordenar por</label>
          <select id="f-ordem">${Object.entries(ORDENS).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
        </div>
        <label class="interruptor"><input type="checkbox" id="f-vagas" role="switch"><span>Só aulas com vaga</span></label>
        <fieldset class="chips-modalidades">
          <legend>Modalidades</legend>
          <div class="chips" id="f-modalidades"></div>
        </fieldset>
        <button type="button" class="btn btn--fantasma" id="limpar">Limpar filtros</button>
      </form>

      <section class="agenda__resultado" id="painel-agenda" role="tabpanel">
        <p class="contador" id="contador" aria-live="polite"></p>
        <div class="grade-aulas" id="lista"></div>
        <div id="paginacao"></div>
      </section>
    </div>
  </div>`;

  const $ = (s) => raiz.querySelector(s);
  const form = $('.filtros');
  const abasDias = $('.dias');
  const lista = $('#lista');

  /* ---------- 3. Catálogos (unidades e modalidades) antes de tudo ---------- */
  carregarCatalogos().then(() => {
    $('#f-unidade').insertAdjacentHTML('beforeend',
      [...cat.unidades.values()].map((u) => `<option value="${u.id}">${esc(u.nome)}</option>`).join(''));
    $('#f-modalidades').innerHTML = [...cat.modalidades.values()].map((m) => `
      <button type="button" class="chip" data-id="${m.id}" style="--cor:${m.cor}" aria-pressed="false">
        <span class="chip__ponto" aria-hidden="true"></span>${esc(m.nome)}
      </button>`).join('');
    preencherControles();
    carregar();
  }).catch(() => mostrarErro());

  /** Estado -> controles (usado no início e no "Limpar filtros"). */
  function preencherControles() {
    $('#f-busca').value = estado.busca;
    $('#f-unidade').value = estado.unidade;
    $('#f-ordem').value = estado.ordem;
    $('#f-vagas').checked = estado.vagas;
    form.querySelector(`[name="periodo"][value="${estado.periodo}"]`).checked = true;
    for (const c of $('#f-modalidades').children) c.setAttribute('aria-pressed', estado.modalidades.includes(+c.dataset.id));
    const aba = $(`#aba-dia-${estado.data}`);
    marcarAba(abasDias, aba);
    $('#painel-agenda').setAttribute('aria-labelledby', aba.id);
    aba.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /** Estado -> URL. Só grava o que é diferente do padrão (URL curta e legível). */
  function gravarURL() {
    const p = new URLSearchParams();
    if (estado.data !== dias[0]) p.set('data', estado.data);
    if (estado.unidade) p.set('unidade', estado.unidade);
    if (estado.modalidades.length) p.set('modalidades', estado.modalidades.join(','));
    if (estado.periodo) p.set('periodo', estado.periodo);
    if (estado.vagas) p.set('vagas', '1');
    if (estado.busca) p.set('busca', estado.busca);
    if (estado.ordem !== 'horario') p.set('ordem', estado.ordem);
    if (estado.pagina > 1) p.set('pagina', estado.pagina);
    substituirParams('agenda', p);
  }

  /** Qualquer filtro mudou: volta para a página 1, grava a URL e pede de novo. */
  function filtrosMudaram() { estado.pagina = 1; gravarURL(); carregar(); }

  /* ---------- 4. Eventos dos controles ---------- */
  ligarAbas(abasDias, (aba) => {
    if (aba.dataset.data === estado.data) return;
    estado.data = aba.dataset.data;
    marcarAba(abasDias, aba);
    $('#painel-agenda').setAttribute('aria-labelledby', aba.id);
    aba.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    filtrosMudaram();
  });
  $('#f-busca').addEventListener('input', (e) => {
    clearTimeout(timerBusca);                       // DEBOUNCE: cada tecla reinicia o relógio
    timerBusca = setTimeout(() => { estado.busca = e.target.value.trim(); filtrosMudaram(); }, 300);
  });
  form.addEventListener('submit', (e) => e.preventDefault()); // Enter na busca não recarrega a página
  $('#f-unidade').addEventListener('change', (e) => { estado.unidade = e.target.value; filtrosMudaram(); });
  $('#f-ordem').addEventListener('change', (e) => { estado.ordem = e.target.value; filtrosMudaram(); });
  $('#f-vagas').addEventListener('change', (e) => { estado.vagas = e.target.checked; filtrosMudaram(); });
  form.addEventListener('change', (e) => { if (e.target.name === 'periodo') { estado.periodo = e.target.value; filtrosMudaram(); } });
  $('#f-modalidades').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    const id = +chip.dataset.id;
    // Seleção MÚLTIPLA: o chip liga e desliga; a API recebe a lista separada por vírgula.
    estado.modalidades = estado.modalidades.includes(id) ? estado.modalidades.filter((x) => x !== id) : [...estado.modalidades, id];
    chip.setAttribute('aria-pressed', estado.modalidades.includes(id));
    filtrosMudaram();
  });
  $('#limpar').addEventListener('click', () => {
    Object.assign(estado, { unidade: '', modalidades: [], periodo: '', vagas: false, busca: '', ordem: 'horario' });
    preencherControles(); filtrosMudaram();
  });
  $('#paginacao').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pagina]'); if (!b || b.disabled) return;
    estado.pagina = +b.dataset.pagina; gravarURL(); carregar();
    $('#painel-agenda').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-detalhes]');
    if (b) abrirDetalhes(+b.dataset.detalhes);
  });
  ligarEfeito3D(lista);

  /* ---------- 5. Requisição com cancelamento da anterior ---------- */
  async function carregar({ silencioso = false } = {}) {
    controlador?.abort();                           // cancela o pedido anterior, se ainda não voltou
    const meu = controlador = new AbortController();
    if (!silencioso) {
      lista.setAttribute('aria-busy', 'true');
      lista.innerHTML = Array.from({ length: 6 }, () => '<div class="aula aula--esqueleto" aria-hidden="true"></div>').join('');
      $('#contador').textContent = 'Carregando aulas…';
      $('#paginacao').innerHTML = '';
    }
    try {
      const r = await api('/aulas', {
        sinal: controlador.signal,
        query: { data: estado.data, unidade_id: estado.unidade, modalidade_id: estado.modalidades.join(','),
                 periodo: estado.periodo, somente_vagas: estado.vagas ? 1 : '', busca: estado.busca,
                 ordem: estado.ordem, pagina: estado.pagina, por_pagina: 6 },
      });
      // Página pedida não existe mais (ex.: URL antiga com pagina=9)? Vai para a última que existe.
      if (r.meta.total > 0 && estado.pagina > r.meta.total_paginas) { estado.pagina = r.meta.total_paginas; gravarURL(); return carregar(); }
      ultimaResposta = r;
      desenhar(r);
    } catch (err) {
      if (err.name === 'AbortError') return;       // fomos cancelados por um pedido mais novo: ignorar
      if (err.status === 401) return;               // app.js já está levando para o login
      mostrarErro(err.message);
    } finally {
      // Só o pedido MAIS NOVO desliga o "ocupado": um pedido cancelado não pode apagar o estado do atual.
      if (meu === controlador) lista.removeAttribute('aria-busy');
    }
  }

  function desenhar({ dados, meta }) {
    const { total, pagina, total_paginas } = meta;
    $('#contador').textContent = total === 0 ? 'Nenhuma aula encontrada'
      : `${total} ${total === 1 ? 'aula encontrada' : 'aulas encontradas'} · página ${pagina} de ${total_paginas}`;
    // Redesenhar com innerHTML destrói os botões. Se o foco estava num "Ver detalhes",
    // guardamos qual era e devolvemos o foco ao botão novo da mesma aula (quem usa teclado não se perde).
    const focado = lista.contains(document.activeElement) ? document.activeElement.dataset.detalhes : null;
    lista.innerHTML = dados.length ? dados.map(cardAula).join('') : `
      <div class="vazio">
        <img src="img/vazio.svg" alt="" width="120" height="120">
        <p class="vazio__titulo">Nenhuma aula com esses filtros</p>
        <p class="texto-suave">Troque o dia ou limpe os filtros para ver mais opções.</p>
      </div>`;
    $('#paginacao').innerHTML = paginacaoHTML(meta, 'Páginas da agenda');
    if (focado) lista.querySelector(`[data-detalhes="${focado}"]`)?.focus({ preventScroll: true });
  }

  function mostrarErro(msg = 'Não foi possível carregar a agenda.') {
    $('#contador').textContent = '';
    $('#paginacao').innerHTML = '';
    lista.innerHTML = `
      <div class="vazio vazio--erro" role="alert">
        <p class="vazio__titulo">Não foi possível carregar a agenda</p>
        <p class="texto-suave">${esc(msg)}</p>
        <button type="button" class="btn btn--primario" id="tentar">Tentar novamente</button>
      </div>`;
    $('#tentar').addEventListener('click', () => carregarCatalogos().then(() => {
      if (!$('#f-modalidades').children.length) { raiz.innerHTML = ''; montar(raiz, new URLSearchParams(location.hash.split('?')[1])); }
      else carregar();
    }).catch(() => mostrarErro()));
  }

  /* ---------- 6. Modal de detalhes ---------- */
  async function abrirDetalhes(id) {
    const m = abrirModal({
      titulo: 'Detalhes da aula', classe: 'modal--aula', conteudo: '<div class="modal__carregando">Carregando…</div>',
      // Depois de reservar, a lista é redesenhada e o botão que abriu o modal deixa de existir.
      // Então devolvemos o foco ao botão NOVO da mesma aula (mesmo data-detalhes).
      aoFechar: () => { if (!lista.contains(document.activeElement)) lista.querySelector(`[data-detalhes="${id}"]`)?.focus(); },
    });
    let aula;
    async function buscar() {
      try {
        aula = (await api(`/aulas/${id}`)).dados;
        m.definirConteudo(detalhesHTML(aula));
        m.el.querySelector('.modal__titulo').textContent = cat.modalidades.get(aula.modalidade_id).nome + ' · ' + f.hora(aula.inicio);
      } catch (err) {
        if (err.status !== 401) m.definirConteudo(`<p class="alerta alerta--erro" role="alert">${esc(err.message)}</p>`);
      }
    }
    await buscar();

    m.corpo.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-acao]'); if (!b) return;
      const msg = m.corpo.querySelector('.modal__mensagem');
      msg.hidden = true;
      b.disabled = true; b.classList.add('carregando');
      try {
        if (b.dataset.acao === 'reservar') {
          await api('/reservas', { metodo: 'POST', corpo: { aula_id: aula.id } });
          toast('Reserva confirmada! Até lá 💪');
        } else if (b.dataset.acao === 'cancelar') {
          const ok = await confirmar({ titulo: 'Cancelar reserva?', texto: `Sua vaga em ${cat.modalidades.get(aula.modalidade_id).nome} de ${f.dataHora(aula.inicio)} será liberada para outra pessoa.`, sim: 'Cancelar reserva', nao: 'Manter', perigo: true });
          if (!ok) { b.disabled = false; b.classList.remove('carregando'); return; }
          await api(`/reservas/${aula.minha_reserva_id}`, { metodo: 'DELETE' });
          toast('Reserva cancelada.');
        } else if (b.dataset.acao === 'espera') {
          const r = await api(`/aulas/${aula.id}/espera`, { metodo: 'POST' });
          toast(`Você entrou na lista de espera (${r.dados.posicao}º lugar).`);
        } else if (b.dataset.acao === 'sair-espera') {
          await api(`/aulas/${aula.id}/espera`, { metodo: 'DELETE' });
          toast('Você saiu da lista de espera.');
        }
        await buscar();                    // redesenha o modal com o estado novo
        m.focarPrimeiro();                 // o botão antigo sumiu: o foco vai para o novo botão de ação
        carregar({ silencioso: true });    // e atualiza o card na lista sem piscar o esqueleto
      } catch (err) {
        if (err.status === 401) { m.fechar(); return; }
        // 409 com código: a API explica o motivo; para AULA_LOTADA trocamos o botão para "lista de espera".
        msg.textContent = err.message;
        msg.hidden = false;
        if (err.codigo === 'AULA_LOTADA' || err.codigo === 'AULA_COM_VAGAS') await buscar();
        else { b.disabled = false; b.classList.remove('carregando'); }
        const nova = m.corpo.querySelector('.modal__mensagem');
        if (nova !== msg) { nova.textContent = err.message; nova.hidden = false; }
      }
    });
  }

  return () => { controlador?.abort(); clearTimeout(timerBusca); };
}

/* ======================= HTML dos componentes ======================= */

/** Situação da aula para o aluno: define a etiqueta e a cor do card. */
function situacao(a) {
  if (a.minha_reserva_id) return { classe: 'ok', texto: 'Reservada' };
  if (a.minha_posicao_espera) return { classe: 'fila', texto: `Na fila · ${a.minha_posicao_espera}º` };
  if (a.status === 'encerrada') return { classe: 'off', texto: 'Encerrada' };
  if (a.status === 'em_andamento') return { classe: 'off', texto: 'Em andamento' };
  if (a.lotada) return { classe: 'lotada', texto: a.fila_espera ? `Lotada · ${a.fila_espera} na fila` : 'Lotada' };
  if (a.vagas_livres <= 3) return { classe: 'alerta', texto: `Últimas ${a.vagas_livres === 1 ? 'vaga' : a.vagas_livres + ' vagas'}` };
  return { classe: 'livre', texto: `${a.vagas_livres} vagas` };
}
function nivelOcupacao(a) {
  const p = a.vagas_ocupadas / a.capacidade;
  return p >= 1 ? 'cheia' : p >= 0.75 ? 'alta' : 'normal';
}

function cardAula(a) {
  const m = cat.modalidades.get(a.modalidade_id);
  const i = cat.instrutores.get(a.instrutor_id);
  const u = cat.unidades.get(a.unidade_id);
  const s = situacao(a);
  const pct = Math.round((a.vagas_ocupadas / a.capacidade) * 100);
  const breve = a.status === 'agendada' && new Date(a.inicio) - Date.now() < 3600000;
  return `
  <article class="aula aula--${s.classe}" style="--cor:${m.cor}">
    <div class="aula__brilho" aria-hidden="true"></div>
    <div class="aula__imagem">
      <img src="${esc(m.imagem)}" alt="" loading="lazy" width="400" height="225">
      <p class="aula__hora"><time datetime="${a.inicio}">${f.hora(a.inicio)}</time><span> – ${f.hora(a.fim)}</span></p>
      <span class="etiqueta etiqueta--${s.classe}">${esc(s.texto)}</span>
    </div>
    <div class="aula__corpo">
      <h3 class="aula__titulo">${esc(m.nome)}</h3>
      <p class="aula__instrutor"><img src="${esc(i.foto)}" alt="" width="28" height="28">${esc(i.nome)}</p>
      <p class="aula__local">${esc(u.nome)} · ${esc(a.sala)}</p>
      <p class="aula__nivel">${esc(a.nivel)} · ${a.duracao_min} min${breve ? ` · <strong class="aula__breve">começa ${f.quanto(a.inicio)}</strong>` : ''}</p>
      <div class="ocupacao ocupacao--${nivelOcupacao(a)}" style="--p:${pct}%">
        <div class="ocupacao__barra" aria-hidden="true"><span></span></div>
        <p class="ocupacao__texto">${a.vagas_ocupadas} de ${a.capacidade} vagas ocupadas</p>
      </div>
      <button type="button" class="btn btn--contorno aula__botao" data-detalhes="${a.id}"
        aria-label="Ver detalhes: ${esc(m.nome)} às ${f.hora(a.inicio)}, ${esc(u.nome)}">Ver detalhes</button>
    </div>
  </article>`;
}

function detalhesHTML(a) {
  const m = cat.modalidades.get(a.modalidade_id);
  const i = cat.instrutores.get(a.instrutor_id);
  const u = cat.unidades.get(a.unidade_id);
  const s = situacao(a);
  let acao;
  if (a.minha_reserva_id) acao = `<button type="button" class="btn btn--perigo" data-acao="cancelar" data-foco-inicial>Cancelar reserva</button>`;
  else if (a.minha_posicao_espera) acao = `<button type="button" class="btn btn--fantasma" data-acao="sair-espera" data-foco-inicial>Sair da lista de espera</button>`;
  else if (a.status !== 'agendada') acao = `<button type="button" class="btn" disabled>Aula ${a.status === 'encerrada' ? 'encerrada' : 'em andamento'}</button>`;
  else if (a.lotada) acao = `<button type="button" class="btn btn--secundario" data-acao="espera" data-foco-inicial>Entrar na lista de espera</button>`;
  else acao = `<button type="button" class="btn btn--primario" data-acao="reservar" data-foco-inicial>Reservar vaga</button>`;
  const intensidade = '<span class="ponto cheio"></span>'.repeat(m.intensidade) + '<span class="ponto"></span>'.repeat(3 - m.intensidade);
  return `
  <div class="detalhe" style="--cor:${m.cor}">
    <img class="detalhe__imagem" src="${esc(m.imagem)}" alt="Ilustração da aula de ${esc(m.nome)}" width="640" height="360">
    <span class="etiqueta etiqueta--${s.classe}">${esc(s.texto)}</span>
    <p class="detalhe__quando"><time datetime="${a.inicio}">${esc(f.extenso(a.inicio))}</time>, das ${f.hora(a.inicio)} às ${f.hora(a.fim)}</p>
    <p>${esc(a.descricao)}</p>
    <dl class="detalhe__dados">
      <div><dt>Instrutor</dt><dd><img src="${esc(i.foto)}" alt="" width="32" height="32">${esc(i.nome)}</dd></div>
      <div><dt>Local</dt><dd>${esc(u.nome)} · ${esc(a.sala)}<br><small>${esc(u.endereco)}</small></dd></div>
      <div><dt>Nível</dt><dd>${esc(a.nivel)}</dd></div>
      <div><dt>Intensidade</dt><dd><span class="intensidade" role="img" aria-label="Intensidade ${m.intensidade} de 3">${intensidade}</span></dd></div>
      <div><dt>Gasto médio</dt><dd>${f.numero(m.calorias_media)} kcal</dd></div>
      <div><dt>Ocupação</dt><dd>${a.vagas_ocupadas} de ${a.capacidade}${a.fila_espera ? ` · ${a.fila_espera} na fila` : ''}</dd></div>
    </dl>
    <p class="alerta alerta--erro modal__mensagem" role="alert" hidden></p>
    <div class="modal__acoes">${acao}</div>
  </div>`;
}

/*
 * Efeito 3D que segue o cursor: o card inclina para o lado do mouse e um brilho acompanha o ponteiro.
 * O JS só calcula a posição e grava em variáveis CSS (--rx, --ry, --mx, --my); quem desenha é o CSS.
 * Desligado em telas de toque e quando o sistema pede menos movimento.
 */
function ligarEfeito3D(lista) {
  const podeAnimar = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!podeAnimar) return;
  lista.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.aula:not(.aula--esqueleto)'); if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0 = borda esquerda, 1 = borda direita
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
    card.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
  });
  lista.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.aula');
    if (card && !card.contains(e.relatedTarget)) ['--rx', '--ry', '--mx', '--my'].forEach((p) => card.style.removeProperty(p));
  });
}
