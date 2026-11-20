/*
 * util.js – estado central e funções que todo o time usa (P5)
 * -----------------------------------------------------------
 * Regra do time: NINGUÉM guarda dados soltos em variável do próprio
 * arquivo. Tudo que a tela mostra sai do objeto Estado, e cada tela
 * tem UMA função render que redesenha a partir dele.
 */

/* Status: nomes e ordem combinados no planejamento (iguais aos da API). */
const STATUS = {
  aberto:    { nome: 'Aberto' },
  triagem:   { nome: 'Em triagem' },
  execucao:  { nome: 'Em execução' },
  concluido: { nome: 'Concluído' },
  cancelado: { nome: 'Cancelado' },
};

/* Cópia da máquina de estados da API, só para a interface mostrar
 * as opções certas. Quem manda de verdade é o servidor (409). */
const TRANSICOES = {
  aberto: ['triagem', 'cancelado'],
  triagem: ['execucao', 'cancelado', 'aberto'],
  execucao: ['concluido', 'triagem'],
  concluido: [],
  cancelado: [],
};
const ehVolta = (de, para) => (de === 'triagem' && para === 'aberto') || (de === 'execucao' && para === 'triagem');

/* Identificador do aparelho, para "1 apoio por pessoa".
 * crypto.randomUUID() só existe em contexto seguro (https ou localhost).
 * No servidor da prova (http://192.168...) ele NÃO existe, por isso
 * usamos getRandomValues, que funciona em http também. */
function gerarDispositivo() {
  const salvo = localStorage.getItem('zela-dispositivo');
  if (salvo) return salvo;
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('zela-dispositivo', id);
  return id;
}

const Estado = {
  rota: 'painel',
  chamados: [],
  categorias: [],
  filtros: { busca: '', categoria: '', atrasados: false },
  mapaStatus: new Set(['aberto', 'triagem', 'execucao', 'concluido']), // cancelado começa oculto
  equipe: JSON.parse(sessionStorage.getItem('zela-equipe') || 'null'),
  apoiados: new Set(JSON.parse(localStorage.getItem('zela-apoiados') || '[]')),
  dispositivo: gerarDispositivo(),
  ultimoMovido: null, // id do card que acabou de mudar de coluna (para animar)
};

/* ---------- Datas ----------
 * A API manda "2026-11-16 19:40:00" no horário de Brasília.
 * NÃO use new Date("2026-11-16"): string só com data é lida como UTC
 * e no Brasil volta um dia (a armadilha do fuso). Aqui quebramos a
 * string na mão, sem Date, e o resultado é sempre o certo. */
function dataBR(texto) {
  const [d] = texto.split(' ');
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}
function dataHoraBR(texto) {
  return `${dataBR(texto)} ${texto.slice(11, 16)}`;
}
/* Para contas (dias passados) criamos o Date com os números, no fuso local. */
function paraDate(texto) {
  const [a, m, d, h = 0, mi = 0] = texto.split(/[- :]/).map(Number);
  return new Date(a, m - 1, d, h, mi);
}
function tempoRelativo(texto) {
  const dias = Math.floor((Date.now() - paraDate(texto)) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

/* Busca sem acento e sem diferenciar maiúsculas. */
const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* Escapar texto vindo do usuário antes de pôr em innerHTML (evita XSS:
 * alguém pode abrir um chamado com título "<img onerror=...>"). */
function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Filtro único usado pelo painel (P2). */
function chamadosFiltrados() {
  const { busca, categoria, atrasados } = Estado.filtros;
  const b = semAcento(busca.trim());
  return Estado.chamados.filter((c) =>
    (!b || semAcento(`${c.titulo} ${c.rua} ${c.protocolo}`).includes(b)) &&
    (!categoria || c.categoria_id === Number(categoria)) &&
    (!atrasados || c.atrasado)
  );
}

/* ---------- Toast ---------- */
function toast(mensagem, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.textContent = mensagem;
  document.getElementById('toasts').append(el);
  setTimeout(() => el.classList.add('toast--saindo'), 3200);
  setTimeout(() => el.remove(), 3600);
}

/* ---------- Modais com <dialog> ----------
 * showModal() já dá: fundo (::backdrop), Esc fecha, foco preso dentro
 * e o resto da página inerte. Falta fazer à mão:
 *  - fechar clicando no fundo;
 *  - devolver o foco ao botão que abriu;
 *  - travar a rolagem da página de trás. */
let origemModal = new Map();
function abrirModal(dialog, origem = document.activeElement) {
  origemModal.set(dialog, origem);
  document.body.classList.add('sem-rolagem');
  dialog.showModal();
}
function fecharModal(dialog) {
  if (!dialog.open) return;
  dialog.classList.add('fechando');
  // espera a animação de saída (180 ms) antes de fechar de verdade
  setTimeout(() => { dialog.classList.remove('fechando'); dialog.close(); }, 180);
}
document.querySelectorAll('dialog.modal').forEach((dialog) => {
  // clique no ::backdrop chega como clique no próprio <dialog>
  dialog.addEventListener('click', (e) => { if (e.target === dialog) fecharModal(dialog); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); fecharModal(dialog); }); // tecla Esc
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('sem-rolagem');
    const origem = origemModal.get(dialog);
    if (origem && document.contains(origem)) origem.focus();
  });
  dialog.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(dialog); });
});

/* Copiar texto: navigator.clipboard também só existe em https/localhost.
 * Em http usamos o caminho antigo (textarea + execCommand). */
async function copiar(texto) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
  const t = document.createElement('textarea');
  t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
}

const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
