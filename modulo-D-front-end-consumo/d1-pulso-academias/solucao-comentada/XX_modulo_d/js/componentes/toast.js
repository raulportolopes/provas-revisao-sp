/*
 * toast.js – avisos rápidos no canto da tela ("Reserva confirmada!").
 * A região #toasts tem aria-live="polite": o leitor de tela lê o texto sem tirar o foco do usuário.
 */
export function toast(texto, tipo = 'sucesso', ms = 4000) {
  const area = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  t.textContent = texto;
  area.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visivel'));
  setTimeout(() => {
    t.classList.remove('visivel');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 500);
  }, ms);
}
