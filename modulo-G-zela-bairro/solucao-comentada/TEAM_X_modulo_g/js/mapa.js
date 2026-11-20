/*
 * mapa.js – Pacote P4 (parte 1): mapa com pinos ligados à lista
 * --------------------------------------------------------------
 * Os pinos são <button> posicionados em % sobre a imagem do mapa
 * (x e y vêm da API em porcentagem, então funcionam em qualquer largura).
 * Destaque nos dois sentidos: pino -> item da lista e item -> pino.
 */
const ORDEM_STATUS = ['aberto', 'triagem', 'execucao', 'concluido', 'cancelado'];

function montarLegenda() {
  document.getElementById('legenda').insertAdjacentHTML('beforeend', ORDEM_STATUS.map((s) => `
    <label class="legenda__item">
      <input type="checkbox" value="${s}" ${Estado.mapaStatus.has(s) ? 'checked' : ''}>
      <span class="ponto ponto--${s}" aria-hidden="true"></span>${STATUS[s].nome}
    </label>`).join(''));
}
document.getElementById('legenda').addEventListener('change', (e) => {
  e.target.checked ? Estado.mapaStatus.add(e.target.value) : Estado.mapaStatus.delete(e.target.value);
  renderMapa();
});

function renderMapa() {
  const lista = Estado.chamados
    .filter((c) => Estado.mapaStatus.has(c.status))
    .sort((a, b) => ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status) || b.apoios - a.apoios);

  // pinos: o tamanho cresce com os apoios (variável --apoios usada no CSS)
  document.getElementById('pinos').innerHTML = lista.map((c, i) => `
    <button type="button" class="pino pino--${c.status} ${c.atrasado ? 'pino--atrasado' : ''}" data-id="${c.id}"
      style="left:${c.x}%;top:${c.y}%;--atraso:${i * 40}ms"
      aria-label="${c.protocolo}: ${esc(c.titulo)} (${STATUS[c.status].nome})"></button>`).join('');

  document.getElementById('lista-mapa').innerHTML = lista.map((c) => `
    <li class="item-mapa" data-id="${c.id}">
      <button type="button" class="item-mapa__btn">
        <span class="ponto ponto--${c.status}" aria-hidden="true"></span>
        <span class="item-mapa__txt">
          <strong>${esc(c.titulo)}</strong>
          <small>${c.protocolo} · ${STATUS[c.status].nome}${c.atrasado ? ' · <em>atrasado</em>' : ''}</small>
        </span>
        <span class="item-mapa__apoios" aria-label="${c.apoios} apoios">${c.apoios}</span>
      </button>
    </li>`).join('') || '<li class="coluna__vazia">Nenhum chamado com essas situações.</li>';
}

/* Destaque ligado: qualquer um dos dois chama a mesma função. */
function destacar(id, rolarLista) {
  document.querySelectorAll('.pino.ativo, .item-mapa.ativo').forEach((el) => el.classList.remove('ativo'));
  if (id == null) return;
  const pino = document.querySelector(`#pinos .pino[data-id="${id}"]`);
  const item = document.querySelector(`#lista-mapa .item-mapa[data-id="${id}"]`);
  pino?.classList.add('ativo');
  item?.classList.add('ativo');
  if (rolarLista && item) item.scrollIntoView({ block: 'nearest', behavior: reduzMovimento() ? 'auto' : 'smooth' });
}

const telaMapa = document.getElementById('tela-mapa');
['mouseover', 'focusin'].forEach((ev) => telaMapa.addEventListener(ev, (e) => {
  const pino = e.target.closest('#pinos .pino');
  const item = e.target.closest('.item-mapa');
  if (pino) destacar(pino.dataset.id, true);
  else if (item) destacar(item.dataset.id, false);
}));
['mouseout', 'focusout'].forEach((ev) => telaMapa.addEventListener(ev, (e) => {
  if (e.target.closest('#pinos .pino, .item-mapa')) destacar(null);
}));
telaMapa.addEventListener('click', (e) => {
  const alvo = e.target.closest('#pinos .pino, .item-mapa');
  if (alvo) abrirDetalhe(Number(alvo.dataset.id), e.target.closest('button'));
});
