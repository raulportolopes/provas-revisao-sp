/*
 * modal.js – um modal acessível reaproveitável (detalhes da aula, confirmação de cancelamento).
 *
 * Checklist que a prova cobra (e que este arquivo resolve):
 *  [x] fundo escuro + caixa centralizada, com transição de entrada e saída
 *  [x] role="dialog", aria-modal="true", aria-labelledby apontando para o título
 *  [x] foco vai para dentro ao abrir; Tab e Shift+Tab ficam presos dentro
 *  [x] fecha com Esc, com o botão X e com clique no fundo (clique dentro NÃO fecha)
 *  [x] ao fechar, o foco volta para o botão que abriu
 *  [x] a página de trás não rola enquanto o modal está aberto
 *  [x] dá para abrir um modal por cima do outro (confirmação dentro dos detalhes)
 */
const pilha = []; // modais abertos, o último é o que está "em cima"
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let contador = 0;

/**
 * @param {object} op { titulo, conteudo (HTML), classe, aoFechar }
 * @returns {{ el, corpo, fechar, definirConteudo }}
 */
export function abrirModal({ titulo, conteudo = '', classe = '', aoFechar } = {}) {
  const id = 'modal-titulo-' + (++contador);
  const quemAbriu = document.activeElement;

  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="modal ${classe}" role="dialog" aria-modal="true" aria-labelledby="${id}">
      <div class="modal__topo">
        <h2 class="modal__titulo" id="${id}"></h2>
        <button type="button" class="btn-icone modal__fechar" aria-label="Fechar">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="modal__corpo">${conteudo}</div>
    </div>`;
  fundo.querySelector('.modal__titulo').textContent = titulo; // textContent: nada de HTML no título
  document.body.appendChild(fundo);

  const caixa = fundo.querySelector('.modal');
  const corpo = fundo.querySelector('.modal__corpo');

  // Trava a rolagem do fundo (só no primeiro modal da pilha).
  if (pilha.length === 0) {
    const barra = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = barra + 'px'; // evita o "pulo" quando a barra de rolagem some
    document.body.classList.add('sem-rolagem');
  }

  function aoTeclar(e) {
    if (pilha[pilha.length - 1] !== api) return;   // só o modal de cima responde
    if (e.key === 'Escape') { e.preventDefault(); fechar(); }
    if (e.key === 'Tab') {
      const lista = [...caixa.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      else if (!caixa.contains(document.activeElement)) { e.preventDefault(); primeiro.focus(); }
    }
  }
  // mousedown + click no MESMO alvo: evita fechar quando o usuário arrasta a seleção de texto para fora.
  let clicouNoFundo = false;
  fundo.addEventListener('mousedown', (e) => { clicouNoFundo = e.target === fundo; });
  fundo.addEventListener('click', (e) => { if (clicouNoFundo && e.target === fundo) fechar(); });
  fundo.querySelector('.modal__fechar').addEventListener('click', () => fechar());
  document.addEventListener('keydown', aoTeclar);

  let fechado = false;
  function fechar(resultado) {
    if (fechado) return; fechado = true;
    document.removeEventListener('keydown', aoTeclar);
    pilha.splice(pilha.indexOf(api), 1);
    fundo.classList.remove('aberto');                 // dispara a transição de saída
    const remover = () => fundo.remove();
    fundo.addEventListener('transitionend', remover, { once: true });
    setTimeout(remover, 400);                         // garantia caso a transição não rode (reduced motion)
    if (pilha.length === 0) { document.body.classList.remove('sem-rolagem'); document.body.style.paddingRight = ''; }
    if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus();
    aoFechar?.(resultado);
  }

  const api = {
    el: caixa, corpo, fechar,
    definirConteudo(html) { corpo.innerHTML = html; },
    focarPrimeiro() { (caixa.querySelector('[data-foco-inicial]') || caixa.querySelector('.modal__fechar')).focus(); },
  };
  pilha.push(api);
  requestAnimationFrame(() => { fundo.classList.add('aberto'); api.focarPrimeiro(); });
  return api;
}

/** Confirmação no lugar do window.confirm() (que é feio e não pode ser estilizado). Devolve Promise<boolean>. */
export function confirmar({ titulo, texto, sim = 'Confirmar', nao = 'Voltar', perigo = false }) {
  return new Promise((resolve) => {
    const m = abrirModal({
      titulo, classe: 'modal--pequeno',
      conteudo: `<p class="confirmar__texto"></p>
        <div class="modal__acoes">
          <button type="button" class="btn btn--fantasma" data-acao="nao" data-foco-inicial></button>
          <button type="button" class="btn ${perigo ? 'btn--perigo' : 'btn--primario'}" data-acao="sim"></button>
        </div>`,
      aoFechar: (r) => resolve(r === true),
    });
    m.corpo.querySelector('.confirmar__texto').textContent = texto;
    m.corpo.querySelector('[data-acao="nao"]').textContent = nao;
    m.corpo.querySelector('[data-acao="sim"]').textContent = sim;
    m.corpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-acao]');
      if (b) m.fechar(b.dataset.acao === 'sim');
    });
  });
}
