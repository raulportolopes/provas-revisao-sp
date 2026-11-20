/*
 * abas.js – liga o comportamento de TECLADO do padrão ARIA de abas a um role="tablist".
 *
 * O HTML de cada tela já sai com role="tab", aria-selected, aria-controls e tabindex
 * (só a aba selecionada tem tabindex="0"; as outras têm -1 – "roving tabindex").
 * Aqui tratamos: ← → (circular), Home e End. A aba recebe o foco E é ativada (ativação automática).
 *
 * @param {HTMLElement} lista  elemento com role="tablist"
 * @param {(aba: HTMLElement) => void} aoAtivar  chamado quando uma aba é escolhida
 */
export function ligarAbas(lista, aoAtivar) {
  const abas = () => [...lista.querySelectorAll('[role="tab"]')];
  lista.addEventListener('click', (e) => {
    const aba = e.target.closest('[role="tab"]');
    if (aba) aoAtivar(aba);
  });
  lista.addEventListener('keydown', (e) => {
    const todas = abas();
    const i = todas.indexOf(document.activeElement);
    if (i < 0) return;
    let alvo = null;
    if (e.key === 'ArrowRight') alvo = todas[(i + 1) % todas.length];
    if (e.key === 'ArrowLeft') alvo = todas[(i - 1 + todas.length) % todas.length];
    if (e.key === 'Home') alvo = todas[0];
    if (e.key === 'End') alvo = todas[todas.length - 1];
    if (!alvo) return;
    e.preventDefault();
    alvo.focus();
    aoAtivar(alvo);
  });
}

/** Marca visualmente/semanticamente qual aba está ativa (sem trocar o foco). */
export function marcarAba(lista, abaAtiva) {
  for (const a of lista.querySelectorAll('[role="tab"]')) {
    const sel = a === abaAtiva;
    a.setAttribute('aria-selected', sel);
    a.tabIndex = sel ? 0 : -1;
  }
}
