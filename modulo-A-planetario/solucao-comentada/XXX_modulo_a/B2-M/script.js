/* =====================================================================
   B2-M · Catálogo de Constelações
   O padrão que resolve QUALQUER tela de lista com filtros:
     estado (um objeto)  →  filtrar()  →  ordenar()  →  paginar()  →  desenhar()
   Todo evento só muda o estado e chama render(). Nada de mexer no DOM
   em vários lugares: assim busca, chips, select, ordem e página nunca
   "brigam" entre si.
   ===================================================================== */

const POR_PAGINA = 6;

// ---------- Estado único da tela ----------
const estado = {
  todas: [],          // dados da API
  busca: '',
  hemisferio: '',     // '' = Todos
  estacao: '',
  ordem: 'nome',
  pagina: 1,
  visiveis: [],       // resultado filtrado + ordenado (o modal navega nele)
};

// ---------- Atalhos de DOM ----------
const $ = id => document.getElementById(id);
const elBusca = $('busca'), elEstacao = $('estacao'), elOrdem = $('ordem');
const elLista = $('lista'), elPag = $('paginacao'), elContador = $('contador');
const elVazio = $('vazio'), elEstado = $('estado'), modal = $('modal');

// ---------- Utilidades ----------
// tira acentos e deixa minúsculo: "Órion" → "orion"
const normalizar = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmtNumero = n => n.toLocaleString('pt-BR');                 // 1294 → "1.294"
const fmtMag = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });   // 0.13 → "0,13"
// escapa texto antes de pôr em innerHTML (boa prática)
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 1. URL ↔ estado ----------
function lerURL() {
  const q = new URLSearchParams(location.search);
  estado.busca = q.get('busca') || '';
  estado.hemisferio = ['Norte', 'Sul', 'Equatorial'].includes(q.get('hemisferio')) ? q.get('hemisferio') : '';
  estado.estacao = ['Verão', 'Outono', 'Inverno', 'Primavera'].includes(q.get('estacao')) ? q.get('estacao') : '';
  estado.ordem = ['nome', 'area', 'brilho'].includes(q.get('ordem')) ? q.get('ordem') : 'nome';
  estado.pagina = parseInt(q.get('pagina'), 10) || 1;
}

function gravarURL() {
  const q = new URLSearchParams();
  if (estado.busca) q.set('busca', estado.busca);
  if (estado.hemisferio) q.set('hemisferio', estado.hemisferio);
  if (estado.estacao) q.set('estacao', estado.estacao);
  if (estado.ordem !== 'nome') q.set('ordem', estado.ordem);
  if (estado.pagina > 1) q.set('pagina', estado.pagina);
  const s = q.toString();
  // replaceState: muda a URL sem recarregar e sem encher o histórico
  history.replaceState(null, '', s ? '?' + s : location.pathname);
}

// ---------- 2. Filtrar e ordenar ----------
function filtrar() {
  const termo = normalizar(estado.busca.trim());
  return estado.todas.filter(c =>
    (!termo || [c.nome, c.sigla, c.estrela].some(t => normalizar(t).includes(termo))) &&
    (!estado.hemisferio || c.hemisferio === estado.hemisferio) &&
    (!estado.estacao || c.estacao === estado.estacao)
  );
}

const comparadores = {
  nome:   (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
  area:   (a, b) => b.area - a.area,                                     // maior primeiro
  brilho: (a, b) => a.magnitude - b.magnitude || a.nome.localeCompare(b.nome, 'pt-BR'),  // menor magnitude = mais brilhante
};

// ---------- 3. Desenhar ----------
function render() {
  estado.visiveis = filtrar().sort(comparadores[estado.ordem]);
  const total = estado.visiveis.length;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // página fora do intervalo (ex.: ?pagina=99) vira a última válida
  estado.pagina = Math.min(Math.max(1, estado.pagina), paginas);

  const ini = (estado.pagina - 1) * POR_PAGINA;
  const daPagina = estado.visiveis.slice(ini, ini + POR_PAGINA);

  elContador.textContent = total === 1 ? '1 constelação encontrada' : `${total} constelações encontradas`;
  elVazio.hidden = total > 0;

  elLista.innerHTML = daPagina.map(c => `
    <li>
      <article class="card">
        <span class="sigla">${esc(c.sigla)}</span>
        <h2>${esc(c.nome)}</h2>
        <p>${esc(c.hemisferio)} · ${esc(c.estacao)}</p>
        <p>Estrela mais brilhante: ${esc(c.estrela)} (${fmtMag(c.magnitude)})</p>
        <p>Área: ${fmtNumero(c.area)} graus²</p>
        <button type="button" data-id="${c.id}">Ver detalhes</button>
      </article>
    </li>`).join('');

  desenharPaginacao(paginas);
  desenharControles();
  gravarURL();
}

function desenharPaginacao(paginas) {
  if (paginas <= 1) { elPag.innerHTML = ''; return; }   // 1 página: some
  let html = `<button type="button" data-pag="${estado.pagina - 1}" ${estado.pagina === 1 ? 'disabled' : ''}>‹ Anterior</button>`;
  for (let p = 1; p <= paginas; p++) {
    html += `<button type="button" data-pag="${p}" aria-label="Página ${p}" ${p === estado.pagina ? 'aria-current="page"' : ''}>${p}</button>`;
  }
  html += `<button type="button" data-pag="${estado.pagina + 1}" ${estado.pagina === paginas ? 'disabled' : ''}>Próxima ›</button>`;
  elPag.innerHTML = html;
}

// os controles sempre refletem o estado (importante depois do F5)
function desenharControles() {
  elBusca.value = estado.busca;
  elEstacao.value = estado.estacao;
  elOrdem.value = estado.ordem;
  document.querySelectorAll('.chip').forEach(ch =>
    ch.setAttribute('aria-pressed', String(ch.dataset.hemisferio === estado.hemisferio)));
}

// ---------- 4. Eventos dos filtros: mudam o estado e voltam à página 1 ----------
function mudar(chave, valor) {
  estado[chave] = valor;
  estado.pagina = 1;
  render();
}

elBusca.addEventListener('input', () => mudar('busca', elBusca.value));
elEstacao.addEventListener('change', () => mudar('estacao', elEstacao.value));
elOrdem.addEventListener('change', () => mudar('ordem', elOrdem.value));
$('chips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (chip) mudar('hemisferio', chip.dataset.hemisferio);
});
$('limpar').addEventListener('click', () => {
  Object.assign(estado, { busca: '', hemisferio: '', estacao: '', ordem: 'nome', pagina: 1 });
  render();
  elBusca.focus();
});

elPag.addEventListener('click', e => {
  const b = e.target.closest('button[data-pag]');
  if (!b || b.disabled) return;
  estado.pagina = Number(b.dataset.pag);
  render();
  elLista.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---------- 5. Modal ----------
let posModal = 0;        // posição na lista filtrada
let quemAbriu = null;    // botão que abriu (para devolver o foco)

function preencherModal() {
  const c = estado.visiveis[posModal];
  $('m-sigla').textContent = c.sigla;
  $('m-nome').textContent = c.nome;
  $('m-desc').textContent = c.descricao;
  $('m-hemi').textContent = c.hemisferio;
  $('m-estacao').textContent = c.estacao;
  $('m-area').textContent = `${fmtNumero(c.area)} graus²`;
  $('m-estrela').textContent = `${c.estrela} (magnitude ${fmtMag(c.magnitude)})`;
  $('m-estrelas').textContent = c.estrelas;
  $('m-pos').textContent = `${posModal + 1} de ${estado.visiveis.length}`;
}

function abrirModal(id, botao) {
  posModal = estado.visiveis.findIndex(c => c.id === id);
  quemAbriu = botao;
  preencherModal();
  modal.showModal();
  document.body.classList.add('travado');
  $('m-fechar').focus();
}

// navegação circular: depois da última volta para a primeira
function andar(passo) {
  const n = estado.visiveis.length;
  posModal = (posModal + passo + n) % n;
  preencherModal();
}

elLista.addEventListener('click', e => {
  const b = e.target.closest('button[data-id]');
  if (b) abrirModal(Number(b.dataset.id), b);
});

$('m-fechar').addEventListener('click', () => modal.close());
$('m-ant').addEventListener('click', () => andar(-1));
$('m-prox').addEventListener('click', () => andar(1));

// clique no fundo: o alvo é o próprio <dialog> (a caixa interna cobre o resto)
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

modal.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); andar(1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); andar(-1); }
});

// 'close' dispara em TODAS as formas de fechar (X, fundo, Esc)
modal.addEventListener('close', () => {
  document.body.classList.remove('travado');
  if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus();
});

// ---------- 6. Carregar a API ----------
async function iniciar() {
  lerURL();
  try {
    const r = await fetch('constelacoes.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    estado.todas = await r.json();
    elEstado.hidden = true;
    render();
  } catch (err) {
    elEstado.textContent = 'Não foi possível carregar as constelações. Recarregue a página.';
    console.error(err);
  }
}

iniciar();
