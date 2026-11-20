// =====================================================================
// splash.js – tela de abertura.
// Regras do enunciado:
//  - só na PRIMEIRA visita da sessão (sessionStorage 'orbita:splash')
//  - barra e porcentagem andam juntas de 0 a 100 em 2,5 s (requestAnimationFrame)
//  - só some quando: passou 2,5 s  E  a API terminou de carregar
//  - botão "Pular" encerra na hora (se a API já carregou)
//  - com prefers-reduced-motion, não há splash
// =====================================================================
import { menosMovimento } from './util.js';

const DURACAO = 2500;
const splash = document.getElementById('splash');
const barra = splash.querySelector('[role="progressbar"]');
const pct = document.getElementById('splash-pct');

/** Recebe a Promise do carregamento da API. Resolve quando o splash some. */
export function rodarSplash(carregamento) {
  if (sessionStorage.getItem('orbita:splash') || menosMovimento()) {
    splash.remove();
    return carregamento.catch(() => {});
  }
  return new Promise(resolve => {
    let inicio = null, pulou = false, apiPronta = false, tempoOk = false;
    carregamento.finally(() => { apiPronta = true; tentarSair(); });

    function passo(agoraMs) {
      if (inicio === null) inicio = agoraMs;
      // Porcentagem calculada pelo TEMPO real decorrido (não por um contador +1),
      // por isso termina exatamente em 2,5 s mesmo se o computador engasgar.
      const p = Math.min(100, Math.round(((agoraMs - inicio) / DURACAO) * 100));
      mostrar(p);
      if (p < 100 && !pulou) requestAnimationFrame(passo);
      else { tempoOk = true; tentarSair(); }
    }
    function mostrar(p) {
      splash.style.setProperty('--progresso', p / 100);  // o CSS usa scaleX(var(--progresso))
      pct.textContent = p;
      barra.setAttribute('aria-valuenow', p);
    }
    function tentarSair() {
      if (!tempoOk || !apiPronta) return;
      sessionStorage.setItem('orbita:splash', '1');
      splash.classList.add('splash--saindo');            // fade-out no CSS
      splash.addEventListener('transitionend', () => { splash.remove(); resolve(); }, { once: true });
    }
    document.getElementById('splash-pular').addEventListener('click', () => {
      pulou = true; mostrar(100); tempoOk = true; tentarSair();
    });
    requestAnimationFrame(passo);
  });
}
