/*
 * painel.js – Pacote P2: quadro kanban, filtros, apoio, detalhe e mudança de status
 * ---------------------------------------------------------------------------------
 * Fluxo: evento -> muda Estado -> renderPainel(). Nunca mexemos num
 * card isolado "na mão"; sempre redesenhamos a partir do Estado.
 */
const COLUNAS = ['aberto', 'triagem', 'execucao', 'concluido'];

/* ---------- Filtros ---------- */
function montarChipsCategorias() {
  const chips = [{ id: '', nome: 'Todas' }, ...Estado.categorias];
  document.getElementById('f-categorias').innerHTML = chips
    .map((c) => `<button type="button" class="chip" data-categoria="${c.id}">${esc(c.nome)}</button>`)
    .join('');
}

/* Coloca os controles de acordo com o Estado (necessário depois de F5 ou link colado). */
function sincronizarFiltros() {
  document.getElementById('f-busca').value = Estado.filtros.busca;
  document.getElementById('f-atrasados').checked = Estado.filtros.atrasados;
  document.querySelectorAll('#f-categorias .chip').forEach((chip) => {
    const ativo = chip.dataset.categoria === String(Estado.filtros.categoria);
    chip.classList.toggle('chip--ativo', ativo);
    chip.setAttribute('aria-pressed', ativo);
  });
}

/* Guarda os filtros na URL sem disparar hashchange (replaceState). */
function filtrosNaUrl() {
  const p = new URLSearchParams();
  if (Estado.filtros.busca) p.set('busca', Estado.filtros.busca);
  if (Estado.filtros.categoria) p.set('categoria', Estado.filtros.categoria);
  if (Estado.filtros.atrasados) p.set('atrasados', '1');
  const q = p.toString();
  history.replaceState(null, '', `#/painel${q ? '?' + q : ''}`);
}

function aoMudarFiltro() {
  sincronizarFiltros();
  filtrosNaUrl();
  renderPainel();
}

document.getElementById('f-busca').addEventListener('input', (e) => {
  Estado.filtros.busca = e.target.value;
  filtrosNaUrl();
  renderPainel(); // não chama sincronizarFiltros para não mexer no cursor do campo
});
document.getElementById('f-categorias').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  Estado.filtros.categoria = chip.dataset.categoria;
  aoMudarFiltro();
});
document.getElementById('f-atrasados').addEventListener('change', (e) => {
  Estado.filtros.atrasados = e.target.checked;
  aoMudarFiltro();
});
document.getElementById('filtros').addEventListener('submit', (e) => e.preventDefault());
document.getElementById('limpar-filtros').addEventListener('click', () => {
  Estado.filtros = { busca: '', categoria: '', atrasados: false };
  aoMudarFiltro();
});

/* ---------- Desenho ---------- */
function htmlCard(c) {
  const final = c.status === 'concluido' || c.status === 'cancelado';
  const apoiado = Estado.apoiados.has(c.id);
  const podeMover = Estado.equipe && TRANSICOES[c.status].length;
  const opcoes = TRANSICOES[c.status]
    .map((s) => `<li><button type="button" data-mover="${s}">${s === 'cancelado' ? 'Cancelar chamado' : (ehVolta(c.status, s) ? 'Devolver para ' : 'Mover para ') + STATUS[s].nome}</button></li>`)
    .join('');

  return `
  <li class="card ${c.atrasado ? 'card--atrasado' : ''} ${Estado.ultimoMovido === c.id ? 'card--movido' : ''}"
      data-id="${c.id}" ${podeMover ? 'draggable="true"' : ''}>
    <div class="card__topo">
      <span class="badge badge--cat${c.categoria_id}">${esc(c.categoria)}</span>
      ${c.atrasado ? '<span class="tag-atraso">Atrasado</span>' : ''}
    </div>
    <h3 class="card__titulo"><button type="button" data-detalhe>${esc(c.titulo)}</button></h3>
    <p class="card__rua">${esc(c.rua)}</p>
    <p class="card__meta">
      <span>${c.protocolo}</span>
      <time datetime="${c.aberto_em.replace(' ', 'T')}" title="Aberto em ${dataHoraBR(c.aberto_em)}">${dataBR(c.aberto_em)} · ${tempoRelativo(c.aberto_em)}</time>
    </p>
    <div class="card__acoes">
      <button type="button" class="apoio ${apoiado ? 'apoio--feito' : ''}" data-apoiar aria-pressed="${apoiado}"
        ${final || apoiado ? 'disabled' : ''} aria-label="Apoiar este chamado (${c.apoios} apoios)">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 21h4V9H2zM22 10a2 2 0 0 0-2-2h-6.3l1-4.6v-.3a1.5 1.5 0 0 0-.4-1L13.2 1 6.6 7.6A2 2 0 0 0 6 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7z"/></svg>
        <span class="apoio__n">${c.apoios}</span>
      </button>
      ${podeMover ? `
      <details class="mover">
        <summary class="btn btn--contorno btn--peq">Mover</summary>
        <ul class="mover__menu">${opcoes}</ul>
      </details>` : ''}
    </div>
  </li>`;
}

function renderPainel() {
  const lista = chamadosFiltrados();
  const kanban = document.getElementById('kanban');
  const cancelados = lista.filter((c) => c.status === 'cancelado').length;

  kanban.innerHTML = COLUNAS.map((s) => {
    const daColuna = lista.filter((c) => c.status === s);
    return `
    <section class="coluna coluna--${s}" data-status="${s}" aria-labelledby="col-${s}">
      <header class="coluna__topo">
        <h2 id="col-${s}">${STATUS[s].nome}</h2>
        <span class="coluna__n" aria-label="${daColuna.length} chamados">${daColuna.length}</span>
      </header>
      <ul class="coluna__lista">${daColuna.map(htmlCard).join('') || '<li class="coluna__vazia">Nenhum chamado</li>'}</ul>
    </section>`;
  }).join('');

  const atrasados = lista.filter((c) => c.atrasado).length;
  document.getElementById('resumo-painel').textContent =
    `${lista.length} chamado${lista.length === 1 ? '' : 's'} · ${atrasados} atrasado${atrasados === 1 ? '' : 's'}` +
    (cancelados ? ` · ${cancelados} cancelado${cancelados === 1 ? '' : 's'} (não aparece${cancelados === 1 ? '' : 'm'} no quadro)` : '');
  document.getElementById('painel-vazio').hidden = lista.length > 0;
  kanban.hidden = lista.length === 0;
  Estado.ultimoMovido = null;
}

/* ---------- Ações nos cards (delegação de eventos: 1 listener para todos) ---------- */
document.getElementById('kanban').addEventListener('click', async (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = Number(card.dataset.id);

  if (e.target.closest('[data-detalhe]')) abrirDetalhe(id, e.target.closest('button'));

  const mover = e.target.closest('[data-mover]');
  if (mover) {
    mover.closest('details').open = false;
    abrirMudarStatus(id, mover.dataset.mover, card.querySelector('summary'));
  }

  const apoio = e.target.closest('[data-apoiar]');
  if (apoio) apoiarChamado(id);
});

async function apoiarChamado(id) {
  try {
    const atualizado = await API.apoiar(id);
    trocarChamado(atualizado);
    toast('Obrigado! Seu apoio foi registrado.');
  } catch (erro) {
    toast(erro.message, 'erro');
    if (erro.status !== 409) return;
  }
  // 201 ou 409 "já apoiou": de qualquer forma este aparelho já apoiou
  Estado.apoiados.add(id);
  localStorage.setItem('zela-apoiados', JSON.stringify([...Estado.apoiados]));
  renderPainel();
  const n = document.querySelector(`.card[data-id="${id}"] .apoio`);
  if (n) { n.classList.add('apoio--pop'); n.focus(); }
}

/* Substitui o chamado no Estado pela versão que a API devolveu. */
function trocarChamado(novo) {
  const i = Estado.chamados.findIndex((c) => c.id === novo.id);
  if (i >= 0) Estado.chamados[i] = novo; else Estado.chamados.unshift(novo);
}

/* Fecha o menu "Mover" aberto quando clica fora dele. */
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.mover[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; });
});

/* ---------- Arrastar e soltar (só equipe) ----------
 * A coluna só aceita o card se a transição for permitida. A coluna
 * "proibida" fica vermelha enquanto o card passa por cima dela. */
let arrastando = null;
const kanbanEl = document.getElementById('kanban');
kanbanEl.addEventListener('dragstart', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  arrastando = Estado.chamados.find((c) => c.id === Number(card.dataset.id));
  e.dataTransfer.setData('text/plain', card.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
  card.classList.add('card--arrastando');
  kanbanEl.querySelectorAll('.coluna').forEach((col) => {
    const s = col.dataset.status;
    if (s === arrastando.status) return;
    col.classList.add(TRANSICOES[arrastando.status].includes(s) ? 'coluna--pode' : 'coluna--nao-pode');
  });
});
kanbanEl.addEventListener('dragover', (e) => {
  const col = e.target.closest('.coluna--pode');
  if (col) { e.preventDefault(); col.classList.add('coluna--sobre'); }
});
kanbanEl.addEventListener('dragleave', (e) => {
  const col = e.target.closest('.coluna');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('coluna--sobre');
});
kanbanEl.addEventListener('drop', (e) => {
  const col = e.target.closest('.coluna--pode');
  if (!col || !arrastando) return;
  e.preventDefault();
  abrirMudarStatus(arrastando.id, col.dataset.status, null);
});
kanbanEl.addEventListener('dragend', () => {
  arrastando = null;
  kanbanEl.querySelectorAll('.coluna').forEach((c) => c.classList.remove('coluna--pode', 'coluna--nao-pode', 'coluna--sobre'));
  kanbanEl.querySelectorAll('.card--arrastando').forEach((c) => c.classList.remove('card--arrastando'));
});

/* ---------- Modal de mudança de status ---------- */
let mudanca = null; // { id, para }
function abrirMudarStatus(id, para, origem) {
  const c = Estado.chamados.find((x) => x.id === id);
  mudanca = { id, para };
  const obrigatoria = para === 'cancelado' || ehVolta(c.status, para);
  document.getElementById('st-texto').innerHTML =
    `<strong>${c.protocolo}</strong> – ${esc(c.titulo)}<br>${STATUS[c.status].nome} → <strong>${STATUS[para].nome}</strong>`;
  document.getElementById('st-obrig').textContent = obrigatoria ? '* (obrigatória, mín. 10 caracteres)' : '(opcional)';
  document.getElementById('st-nota').value = '';
  document.getElementById('st-nota').toggleAttribute('required', obrigatoria);
  document.getElementById('e-nota').textContent = '';
  abrirModal(document.getElementById('modal-status'), origem || document.querySelector(`.card[data-id="${id}"] [data-detalhe]`));
}

document.getElementById('form-status').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nota = document.getElementById('st-nota');
  const erroEl = document.getElementById('e-nota');
  if (nota.required && nota.value.trim().length < 10) {
    erroEl.textContent = 'Explique o motivo com pelo menos 10 caracteres.';
    nota.setAttribute('aria-invalid', 'true');
    nota.focus();
    return;
  }
  nota.removeAttribute('aria-invalid');
  try {
    const atualizado = await API.mudarStatus(mudanca.id, mudanca.para, nota.value.trim());
    trocarChamado(atualizado);
    Estado.ultimoMovido = atualizado.id;
    fecharModal(document.getElementById('modal-status'));
    renderPainel();
    toast(`${atualizado.protocolo} agora está em "${STATUS[atualizado.status].nome}".`);
  } catch (erro) {
    if (erro.status === 422) { erroEl.textContent = Object.values(erro.erros)[0]; return; }
    fecharModal(document.getElementById('modal-status'));
    if (erro.status === 401) sairEquipe(); // token vencido ou apagado
    toast(erro.message, 'erro');
  }
});

/* ---------- Detalhe do chamado ---------- */
async function abrirDetalhe(id, origem) {
  const dialog = document.getElementById('modal-detalhe');
  let c = Estado.chamados.find((x) => x.id === id);
  try { c = await API.chamado(id); trocarChamado(c); } catch (_) { /* usa o que já temos */ }

  const linhaTempo = c.historico
    .map((h) => `<li class="linha__item linha__item--${h.para}">
        <time datetime="${h.em.replace(' ', 'T')}">${dataHoraBR(h.em)}</time>
        <strong>${STATUS[h.para].nome}</strong> <span>por ${esc(h.por)}</span>
        ${h.nota ? `<p>${esc(h.nota)}</p>` : ''}
      </li>`).join('');

  document.getElementById('detalhe-conteudo').innerHTML = `
    <header class="modal__topo">
      <div>
        <p class="det__protocolo">${c.protocolo}</p>
        <h2 id="det-titulo">${esc(c.titulo)}</h2>
      </div>
      <button class="btn-icone" type="button" data-fechar aria-label="Fechar">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>
      </button>
    </header>
    <div class="det">
      <div class="det__info">
        <p class="det__selos">
          <span class="status status--${c.status}">${STATUS[c.status].nome}</span>
          <span class="badge badge--cat${c.categoria_id}">${esc(c.categoria)}</span>
          ${c.atrasado ? '<span class="tag-atraso">Atrasado</span>' : ''}
        </p>
        <p>${esc(c.descricao)}</p>
        <dl class="det__dados">
          <dt>Local</dt><dd>${esc(c.rua)}</dd>
          <dt>Aberto em</dt><dd>${dataHoraBR(c.aberto_em)}</dd>
          <dt>Prazo</dt><dd>${dataBR(c.prazo_em)}${c.concluido_no_prazo === false ? ' (concluído fora do prazo)' : ''}</dd>
          ${c.concluido_em ? `<dt>Concluído em</dt><dd>${dataHoraBR(c.concluido_em)}</dd>` : ''}
          <dt>Apoios</dt><dd>${c.apoios}</dd>
        </dl>
        ${c.foto ? `<img class="det__foto" src="${esc(c.foto)}" alt="Foto enviada para o chamado ${c.protocolo}">` : ''}
      </div>
      <div>
        <div class="mini-mapa mini-mapa--leitura" aria-hidden="true">
          <img src="img/mapa-bairro.svg" alt="">
          <span class="pino pino--${c.status}" style="left:${c.x}%;top:${c.y}%"></span>
        </div>
        <h3 class="det__sub">Histórico</h3>
        <ol class="linha">${linhaTempo}</ol>
      </div>
    </div>`;
  if (!dialog.open) abrirModal(dialog, origem);
}
