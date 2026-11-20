/*
 * Tela MINHAS RESERVAS (#/reservas?aba=historico&pagina=2)
 *
 *  - Três abas (Próximas, Histórico, Canceladas), cada uma com a quantidade no rótulo.
 *    As quantidades vêm do meta.total de 3 requisições feitas EM PARALELO (Promise.all).
 *  - Cada aba tem paginação do servidor (5 por página).
 *  - Cancelar: confirmação -> DELETE /reservas/{id}. A regra das 2 horas existe no servidor (422),
 *    mas o front também desabilita o botão antes, para o aluno nem tentar.
 *  - criada_em e cancelada_em chegam em UTC ("...Z"): exibimos no horário de Brasília.
 */
import { api } from '../api.js';
import { cat, carregarCatalogos } from '../dados.js';
import { substituirParams } from '../navegacao.js';
import * as f from '../formatos.js';
import { esc } from '../formatos.js';
import { ligarAbas, marcarAba } from '../componentes/abas.js';
import { paginacaoHTML } from '../componentes/paginacao.js';
import { confirmar } from '../componentes/modal.js';
import { toast } from '../componentes/toast.js';

const ABAS = { proximas: 'Próximas', historico: 'Histórico', canceladas: 'Canceladas' };
const DUAS_HORAS = 2 * 3600 * 1000;

export function montar(raiz, params) {
  const estado = {
    aba: ABAS[params.get('aba')] ? params.get('aba') : 'proximas',
    pagina: Math.max(1, parseInt(params.get('pagina'), 10) || 1),
  };
  let controlador = null;

  raiz.innerHTML = `
  <div class="pagina pagina--estreita">
    <header class="cabecalho-pagina">
      <div><p class="sobretitulo">Sua agenda pessoal</p><h1>Minhas reservas</h1></div>
      <a class="btn btn--primario" href="#/agenda">Reservar nova aula</a>
    </header>
    <div class="abas" role="tablist" aria-label="Tipo de reserva">
      ${Object.entries(ABAS).map(([k, t]) => `
        <button type="button" role="tab" class="aba" id="aba-${k}" data-aba="${k}" aria-controls="painel-reservas" aria-selected="false" tabindex="-1">
          ${t} <span class="aba__qtd" data-qtd="${k}">–</span>
        </button>`).join('')}
    </div>
    <section id="painel-reservas" role="tabpanel" class="painel-reservas" tabindex="0">
      <ul class="lista-reservas" id="lista"></ul>
      <div id="paginacao"></div>
    </section>
  </div>`;
  const $ = (s) => raiz.querySelector(s);
  const abas = $('.abas');

  function selecionar() {
    const aba = $(`#aba-${estado.aba}`);
    marcarAba(abas, aba);
    $('#painel-reservas').setAttribute('aria-labelledby', aba.id);
  }
  function gravarURL() {
    const p = new URLSearchParams();
    if (estado.aba !== 'proximas') p.set('aba', estado.aba);
    if (estado.pagina > 1) p.set('pagina', estado.pagina);
    substituirParams('reservas', p);
  }

  ligarAbas(abas, (aba) => {
    if (aba.dataset.aba === estado.aba) return;
    estado.aba = aba.dataset.aba; estado.pagina = 1;
    selecionar(); gravarURL(); carregarLista();
  });
  $('#paginacao').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pagina]'); if (!b || b.disabled) return;
    estado.pagina = +b.dataset.pagina; gravarURL(); carregarLista();
  });
  $('#lista').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-cancelar]'); if (!b) return;
    const ok = await confirmar({ titulo: 'Cancelar reserva?', texto: b.dataset.resumo + '. A vaga será liberada para a lista de espera.', sim: 'Cancelar reserva', nao: 'Manter', perigo: true });
    if (!ok) return;
    b.disabled = true;
    try {
      await api(`/reservas/${b.dataset.cancelar}`, { metodo: 'DELETE' });
      toast('Reserva cancelada.');
      await carregarContagens();
      await carregarLista();
    } catch (err) {
      if (err.status === 401) return;
      toast(err.message, 'erro');
      b.disabled = false;
    }
  });

  /** As 3 contagens de uma vez: por_pagina=1 basta, só queremos o meta.total. */
  async function carregarContagens() {
    const rs = await Promise.all(Object.keys(ABAS).map((tipo) => api('/reservas', { query: { tipo, por_pagina: 1 } })));
    Object.keys(ABAS).forEach((tipo, i) => { $(`[data-qtd="${tipo}"]`).textContent = rs[i].meta.total; });
  }

  async function carregarLista() {
    controlador?.abort(); const meu = controlador = new AbortController();
    const ul = $('#lista');
    ul.setAttribute('aria-busy', 'true');
    ul.innerHTML = '<li class="reserva reserva--esqueleto" aria-hidden="true"></li>'.repeat(3);
    try {
      const r = await api('/reservas', { sinal: controlador.signal, query: { tipo: estado.aba, pagina: estado.pagina, por_pagina: 5 } });
      if (r.meta.total > 0 && estado.pagina > r.meta.total_paginas) { estado.pagina = r.meta.total_paginas; gravarURL(); return carregarLista(); }
      ul.innerHTML = r.dados.length ? r.dados.map(itemHTML).join('') : `<li class="vazio"><p class="vazio__titulo">${
        { proximas: 'Você não tem aulas reservadas', historico: 'Nenhuma aula concluída ainda', canceladas: 'Nenhuma reserva cancelada' }[estado.aba]}</p>
        ${estado.aba === 'proximas' ? '<a class="btn btn--primario" href="#/agenda">Ver agenda</a>' : ''}</li>`;
      $('#paginacao').innerHTML = paginacaoHTML(r.meta, 'Páginas de reservas');
    } catch (err) {
      if (err.name === 'AbortError' || err.status === 401) return;
      ul.innerHTML = `<li class="vazio vazio--erro" role="alert"><p class="vazio__titulo">Não foi possível carregar</p><p>${esc(err.message)}</p>
        <button type="button" class="btn btn--primario" id="tentar">Tentar novamente</button></li>`;
      $('#tentar').addEventListener('click', iniciar);
    } finally { if (meu === controlador) ul.removeAttribute('aria-busy'); }
  }

  async function iniciar() {
    selecionar();
    try { await carregarCatalogos(); await carregarContagens(); } catch (e) { /* a lista mostra o erro */ }
    carregarLista();
  }
  iniciar();
  return () => controlador?.abort();
}

function itemHTML(r) {
  const m = cat.modalidades.get(r.modalidade_id);
  const u = cat.unidades.get(r.unidade_id);
  const i = cat.instrutores.get(r.instrutor_id);
  const ini = new Date(r.inicio);
  const resumo = `${m.nome}, ${f.dataHora(r.inicio)}, ${u.nome}`;
  let lado = '';
  if (r.status === 'ativa') {
    const noPrazo = ini - Date.now() > DUAS_HORAS;
    lado = `<span class="etiqueta etiqueta--ok">${esc(f.quanto(r.inicio))}</span>
      <button type="button" class="btn btn--perigo btn--pequeno" data-cancelar="${r.id}" data-resumo="${esc(resumo)}"
        ${noPrazo ? '' : `disabled aria-describedby="prazo-${r.id}"`}>Cancelar</button>
      ${noPrazo ? '' : `<small id="prazo-${r.id}" class="texto-suave">Prazo de cancelamento encerrado</small>`}`;
  } else if (r.status === 'concluida') lado = '<span class="etiqueta etiqueta--livre">✓ Concluída</span>';
  else lado = '<span class="etiqueta etiqueta--off">Cancelada</span>';

  const registro = r.status === 'cancelada' && r.cancelada_em
    ? `Cancelada em ${f.dataHora(r.cancelada_em)}` : `Reservada em ${f.dataHora(r.criada_em)}`;
  return `
  <li class="reserva reserva--${r.status}" style="--cor:${m.cor}">
    <time class="reserva__data" datetime="${r.inicio}">
      <span class="reserva__semana">${esc(f.diaCurto(ini).split(',')[0])}</span>
      <span class="reserva__dia">${f.data(r.inicio).slice(0, 2)}</span>
      <span class="reserva__mes">${esc(f.mesCurto(r.inicio.slice(0, 7)))}</span>
    </time>
    <div class="reserva__info">
      <h2 class="reserva__titulo">${esc(m.nome)}</h2>
      <p>${f.hora(r.inicio)} – ${f.hora(r.fim)} · ${esc(u.nome)} · ${esc(r.sala)} · ${esc(i.nome)}</p>
      <p class="texto-suave texto-pequeno">${registro}</p>
    </div>
    <div class="reserva__lado">${lado}</div>
  </li>`;
}
