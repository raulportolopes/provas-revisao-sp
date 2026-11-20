/* =====================================================================
   B1-E · Tema Claro / Escuro / Sistema + tamanho do texto
   - O que o usuário ESCOLHEU (claro, escuro ou sistema) é diferente do
     tema APLICADO (claro ou escuro). "Sistema" é resolvido na hora,
     olhando prefers-color-scheme, e continua ouvindo mudanças.
   - Tudo fica salvo em um único objeto no localStorage.
   ===================================================================== */

const CHAVE = 'torra-preferencias';
const midiaEscura = matchMedia('(prefers-color-scheme: dark)');
const raiz = document.documentElement;

const prefs = carregar();

function carregar() {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE)) || {};
    return {
      tema: ['claro', 'escuro', 'sistema'].includes(p.tema) ? p.tema : 'sistema',
      fonte: ['pequena', 'normal', 'grande'].includes(p.fonte) ? p.fonte : 'normal',
    };
  } catch {
    return { tema: 'sistema', fonte: 'normal' };
  }
}

function salvar() { localStorage.setItem(CHAVE, JSON.stringify(prefs)); }

const NOMES = { claro: 'Claro', escuro: 'Escuro' };

function aplicar() {
  const aplicado = prefs.tema === 'sistema' ? (midiaEscura.matches ? 'escuro' : 'claro') : prefs.tema;
  raiz.dataset.tema = aplicado;
  raiz.dataset.fonte = prefs.fonte;

  // rádios do tema: aria-checked + tabindex "itinerante" (só o marcado entra no Tab)
  document.querySelectorAll('#grupo-tema [role="radio"]').forEach(b => {
    const marcado = b.dataset.tema === prefs.tema;
    b.setAttribute('aria-checked', String(marcado));
    b.tabIndex = marcado ? 0 : -1;
  });
  document.querySelectorAll('#grupo-fonte button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.fonte === prefs.fonte)));

  document.getElementById('status-tema').textContent =
    `Tema atual: ${NOMES[aplicado]}${prefs.tema === 'sistema' ? ' (seguindo o sistema)' : ''}`;
}

function escolherTema(tema, focar = false) {
  prefs.tema = tema;
  salvar();
  aplicar();
  if (focar) document.querySelector(`#grupo-tema [data-tema="${tema}"]`).focus();
}

/* ---------- Eventos ---------- */
const grupoTema = document.getElementById('grupo-tema');

grupoTema.addEventListener('click', e => {
  const b = e.target.closest('[role="radio"]');
  if (b) escolherTema(b.dataset.tema);
});

// setas trocam e já selecionam (comportamento de rádio), circular
grupoTema.addEventListener('keydown', e => {
  const ordem = ['claro', 'escuro', 'sistema'];
  const i = ordem.indexOf(prefs.tema);
  let novo = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') novo = ordem[(i + 1) % 3];
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') novo = ordem[(i + 2) % 3];
  if (e.key === 'Home') novo = ordem[0];
  if (e.key === 'End') novo = ordem[2];
  if (novo) { e.preventDefault(); escolherTema(novo, true); }
});

document.getElementById('grupo-fonte').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  prefs.fonte = b.dataset.fonte;
  salvar();
  aplicar();
});

// Sistema mudou (ex.: Windows trocou para escuro às 18h): só reage se a escolha for "sistema"
midiaEscura.addEventListener('change', () => { if (prefs.tema === 'sistema') aplicar(); });

// Outra aba mudou a preferência: acompanha
window.addEventListener('storage', e => {
  if (e.key !== CHAVE) return;
  Object.assign(prefs, carregar());
  aplicar();
});

aplicar();
