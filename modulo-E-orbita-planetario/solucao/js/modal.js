// =====================================================================
// modal.js – UM modal reutilizável para tudo (detalhes, confirmação,
// gaveta de filtros no celular). Checklist do modal acessível:
//  [x] abre centralizado com transição e fundo escuro
//  [x] foco vai para dentro do modal ao abrir
//  [x] Tab e Shift+Tab ficam presos dentro do modal (focus trap)
//  [x] fecha com Esc, com o X e clicando no fundo
//  [x] ao fechar, o foco VOLTA para o botão que abriu
//  [x] a página de trás não rola enquanto o modal está aberto
// =====================================================================
import { menosMovimento } from './util.js';

const modal = document.getElementById('modal');
const caixa = modal.querySelector('.modal__caixa');
const corpo = document.getElementById('modal-corpo');

let quemAbriu = null;      // elemento que tinha o foco antes de abrir
let aoTeclaAtual = null;   // tecla extra da tela que abriu (ex.: setas)
let aoFecharAtual = null;
let aberto = false;

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

export function modalAberto() { return aberto; }

/**
 * Abre o modal.
 * @param {string} html        conteúdo (precisa ter um elemento com id="modal-titulo")
 * @param {object} op          { tipo: 'detalhes'|'confirmar'|'gaveta', aoTecla, aoFechar, focoEm }
 */
export function abrirModal(html, op = {}) {
  if (!aberto) quemAbriu = document.activeElement;
  corpo.innerHTML = html;
  caixa.className = `modal__caixa modal__caixa--${op.tipo || 'detalhes'}`;
  caixa.setAttribute('role', op.tipo === 'confirmar' ? 'alertdialog' : 'dialog');
  aoTeclaAtual = op.aoTecla || null;
  aoFecharAtual = op.aoFechar || null;

  if (!aberto) {
    aberto = true;
    modal.hidden = false;
    document.body.classList.add('sem-rolagem');           // trava a rolagem do fundo
    // Força o navegador a aplicar o estado inicial antes de animar
    // (sem isso a transição não acontece, porque hidden -> visível é instantâneo).
    void modal.offsetWidth;
    modal.classList.add('modal--aberto');
    document.addEventListener('keydown', teclado);
  }
  const alvo = (op.focoEm && corpo.querySelector(op.focoEm)) || caixa;
  alvo.focus();
  caixa.scrollTop = 0;
}

/** Troca só o conteúdo (usado pelas setas: o modal continua aberto). */
export function trocarConteudo(html) {
  corpo.innerHTML = html;
  caixa.focus();
}

export function fecharModal() {
  if (!aberto) return;
  aberto = false;
  modal.classList.remove('modal--aberto');
  document.removeEventListener('keydown', teclado);
  const terminar = () => {
    modal.hidden = true;
    corpo.innerHTML = '';
    document.body.classList.remove('sem-rolagem');
    // Devolve o foco para quem abriu (se ele ainda existir na página).
    if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus();
    if (aoFecharAtual) aoFecharAtual();
  };
  // Espera a transição de saída terminar antes de esconder.
  if (menosMovimento()) terminar(); else setTimeout(terminar, 220);
}

function teclado(e) {
  if (e.key === 'Escape') { e.preventDefault(); fecharModal(); return; }
  if (e.key === 'Tab') {
    // Focus trap: do último elemento volta para o primeiro e vice-versa.
    const lista = [...caixa.querySelectorAll(FOCAVEIS)].filter(el => el.offsetParent !== null);
    if (!lista.length) return;
    const primeiro = lista[0], ultimo = lista[lista.length - 1];
    if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === caixa)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    return;
  }
  // Setas e outras teclas: só se o foco NÃO estiver num campo de texto/select.
  if (aoTeclaAtual && !e.target.matches('input, select, textarea')) aoTeclaAtual(e);
}

// Clique no fundo escuro ou em qualquer elemento com data-fechar.
modal.addEventListener('click', e => { if (e.target.closest('[data-fechar]')) fecharModal(); });

/**
 * Confirmação acessível (substitui o confirm() do navegador, que não dá para estilizar).
 * Devolve uma Promise: true se confirmou, false se cancelou/fechou.
 */
export function confirmar({ titulo, texto, sim = 'Confirmar', nao = 'Voltar', perigo = false }) {
  return new Promise(resolve => {
    let resposta = false;
    abrirModal(`
      <h2 id="modal-titulo" class="modal__titulo">${titulo}</h2>
      <p class="modal__texto">${texto}</p>
      <div class="modal__botoes">
        <button type="button" class="botao botao--contorno" data-resp="nao">${nao}</button>
        <button type="button" class="botao ${perigo ? 'botao--perigo' : ''}" data-resp="sim">${sim}</button>
      </div>`, {
      tipo: 'confirmar', focoEm: '[data-resp="nao"]',   // foco no botão seguro
      aoFechar: () => resolve(resposta),
    });
    corpo.querySelectorAll('[data-resp]').forEach(b => b.addEventListener('click', () => {
      resposta = b.dataset.resp === 'sim'; fecharModal();
    }));
  });
}
