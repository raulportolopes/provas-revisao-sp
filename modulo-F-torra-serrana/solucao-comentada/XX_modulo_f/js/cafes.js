/* cafes.js — catálogo com busca + torra + ordenação combinados.
   Um estado, uma função desenhar(). Os filtros ficam também na URL (?busca=&torra=&ordem=)
   para o F5 e o link compartilhado mostrarem a mesma lista. */

const estado = { busca: '', torra: '', ordem: 'nota' };
const lista = document.getElementById('lista-cafes');
const contador = document.querySelector('.loja__contador');
const form = document.getElementById('filtros');
const campoBusca = document.getElementById('f-busca');
const campoOrdem = document.getElementById('f-ordem');
const chips = [...form.querySelectorAll('.chip')];

// tira acentos e põe em minúsculas: "Doçura" e "docura" passam a ser iguais na busca
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ORDENS = {
  nota: (a, b) => b.notaSCA - a.notaSCA || a.nome.localeCompare(b.nome),
  'preco-asc': (a, b) => a.preco - b.preco,
  'preco-desc': (a, b) => b.preco - a.preco,
  nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
};

function lerURL() {
  const q = new URLSearchParams(location.search);
  estado.busca = q.get('busca') || '';
  estado.torra = ['clara', 'media', 'escura'].includes(q.get('torra')) ? q.get('torra') : '';
  estado.ordem = ORDENS[q.get('ordem')] ? q.get('ordem') : 'nota';
}
function gravarURL() {
  const q = new URLSearchParams();
  if (estado.busca) q.set('busca', estado.busca);
  if (estado.torra) q.set('torra', estado.torra);
  if (estado.ordem !== 'nota') q.set('ordem', estado.ordem);
  history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
}
function sincronizarControles() {
  campoBusca.value = estado.busca;
  campoOrdem.value = estado.ordem;
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.torra === estado.torra)));
}

function desenhar() {
  const termo = normalizar(estado.busca.trim());
  const itens = catalogo
    .filter((c) => !estado.torra || c.torra === estado.torra)
    .filter((c) => !termo || normalizar(`${c.nome} ${c.origem} ${c.notas}`).includes(termo))
    .sort(ORDENS[estado.ordem]);
  contador.textContent = itens.length === 1 ? '1 café encontrado' : `${itens.length} cafés encontrados`;
  lista.innerHTML = itens.length
    ? itens.map((c, i) => cartaoCafe(c, i)).join('')
    : '<li class="vazio"><p><strong>Nenhum café encontrado.</strong><br>Tente outra palavra ou limpe os filtros.</p></li>';
  vigiarCartoes(lista);
  gravarURL();
}

campoBusca.addEventListener('input', () => { estado.busca = campoBusca.value; desenhar(); });
campoOrdem.addEventListener('change', () => { estado.ordem = campoOrdem.value; desenhar(); });
chips.forEach((chip) => chip.addEventListener('click', () => { estado.torra = chip.dataset.torra; sincronizarControles(); desenhar(); }));
form.addEventListener('submit', (e) => e.preventDefault());        // Enter na busca não recarrega
form.addEventListener('reset', () => {
  setTimeout(() => { Object.assign(estado, { busca: '', torra: '', ordem: 'nota' }); sincronizarControles(); desenhar(); campoBusca.focus(); });
});

lerURL();
sincronizarControles();
catalogoPronto.then(desenhar);
