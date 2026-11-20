// =====================================================================
// efeitos.js – efeitos que dependem da posição do mouse.
// O JS só calcula NÚMEROS e grava em variáveis CSS; quem desenha é o CSS.
//  - .inclinar  : cartão 3D que inclina na direção do cursor (--rx, --ry)
//                 e brilho que segue o cursor (--mx, --my)
//  - .brilho    : botão com luz radial que segue o cursor (--x, --y)
// Delegação de eventos: um único listener no document serve para todos os
// cards, inclusive os que forem criados depois (troca de página, filtro...).
// =====================================================================
import { menosMovimento } from './util.js';

export function iniciarEfeitos() {
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;     // no toque não inclina

    const card = e.target.closest('.inclinar');
    if (card && !menosMovimento()) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;   // 0 (esquerda) a 1 (direita)
      const y = (e.clientY - r.top) / r.height;   // 0 (topo) a 1 (base)
      card.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);   // gira no eixo Y
      card.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);   // gira no eixo X
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    }
    const b = e.target.closest('.brilho');
    if (b) {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--x', `${e.clientX - r.left}px`);
      b.style.setProperty('--y', `${e.clientY - r.top}px`);
    }
  });
  // Ao sair do card, volta para a posição reta (a transição do CSS suaviza).
  document.addEventListener('pointerout', e => {
    const card = e.target.closest('.inclinar');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
  });
}

// Entrada escalonada: cada card recebe --i (0, 1, 2...) e o CSS usa
// animation-delay: calc(var(--i) * 60ms). Chamado depois de cada renderização.
export function escalonar(container) {
  [...container.children].forEach((el, i) => el.style.setProperty('--i', i));
}
