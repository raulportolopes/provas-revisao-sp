// =====================================================================
// avisos.js – toasts (avisos rápidos no canto da tela).
// - tipo: 'sucesso' | 'erro' | 'info'
// - some sozinho depois de "duracao" ms
// - pode ter um botão de ação (ex.: "Desfazer")
// O contêiner #avisos tem aria-live="polite": o leitor de tela lê cada aviso.
// =====================================================================
import { esc } from './util.js';

const caixa = document.getElementById('avisos');

export function avisar(texto, { tipo = 'info', duracao = 4000, acao = null } = {}) {
  const el = document.createElement('div');
  el.className = `aviso aviso--${tipo}`;
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  el.innerHTML = `<p>${esc(texto)}</p>`;

  if (acao) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'aviso__acao'; b.textContent = acao.texto;
    b.addEventListener('click', () => { acao.executar(); sumir(); });
    el.appendChild(b);
  }
  // Barra que encolhe mostrando quanto tempo falta (puramente visual).
  el.style.setProperty('--duracao', `${duracao}ms`);
  caixa.appendChild(el);

  let t = setTimeout(sumir, duracao);
  // Pausa enquanto o mouse está em cima (dá tempo de clicar em "Desfazer").
  el.addEventListener('mouseenter', () => { clearTimeout(t); el.classList.add('aviso--pausado'); });
  el.addEventListener('mouseleave', () => { t = setTimeout(sumir, 1500); el.classList.remove('aviso--pausado'); });

  function sumir() {
    clearTimeout(t);
    el.classList.add('aviso--saindo');
    setTimeout(() => el.remove(), 250);
  }
  return sumir;
}
