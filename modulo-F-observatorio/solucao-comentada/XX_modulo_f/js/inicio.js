/* inicio.js — efeitos da página inicial:
   lanterna do hero, contagem regressiva, cartões dos planetas, comparador. */

const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- LANTERNA QUE SEGUE O CURSOR ----------
// Só escrevemos --x e --y; o CSS faz o resto (máscara + transição suave).
const hero = document.querySelector('.hero');
const camada = document.querySelector('.hero__constelacoes');
let pedido = null;
hero.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;               // no toque a lanterna fica parada
  if (pedido) return;                                  // no máximo 1 atualização por quadro
  pedido = requestAnimationFrame(() => {
    const caixa = hero.getBoundingClientRect();
    camada.style.setProperty('--x', `${e.clientX - caixa.left}px`);
    camada.style.setProperty('--y', `${e.clientY - caixa.top}px`);
    pedido = null;
  });
});

// ---------- CONTAGEM REGRESSIVA ----------
const relogio = document.querySelector('.contagem__numeros');
const alvo = new Date(relogio.dataset.alvo).getTime();   // ISO com fuso -03:00: sem surpresa de fuso
const campos = {
  dias: relogio.querySelector('[data-unidade="dias"]'),
  horas: relogio.querySelector('[data-unidade="horas"]'),
  minutos: relogio.querySelector('[data-unidade="minutos"]'),
  segundos: relogio.querySelector('[data-unidade="segundos"]'),
};
const dois = (n) => String(n).padStart(2, '0');

function escrever(campo, valor) {
  if (campo.textContent === valor) return;              // só anima o que mudou
  campo.textContent = valor;
  campo.classList.remove('mudou');
  void campo.offsetWidth;                               // "reinicia" a animação CSS
  campo.classList.add('mudou');
}
function atualizarContagem() {
  let resto = Math.max(0, Math.floor((alvo - Date.now()) / 1000));
  if (resto === 0) {
    relogio.hidden = true;
    document.querySelector('.contagem__fim').hidden = false;
    clearInterval(intervalo);
    return;
  }
  const dias = Math.floor(resto / 86400); resto %= 86400;
  const horas = Math.floor(resto / 3600); resto %= 3600;
  const minutos = Math.floor(resto / 60);
  const segundos = resto % 60;
  escrever(campos.dias, dois(dias));
  escrever(campos.horas, dois(horas));
  escrever(campos.minutos, dois(minutos));
  escrever(campos.segundos, dois(segundos));
}
const intervalo = setInterval(atualizarContagem, 1000);
atualizarContagem();

// ---------- PLANETAS: virar com clique, Enter ou Espaço ----------
// O hover é só CSS. O clique serve para celular e teclado: aria-pressed guarda o estado.
document.querySelectorAll('.planeta__interno').forEach((cartao) => {
  cartao.addEventListener('click', () => {
    const virado = cartao.getAttribute('aria-pressed') === 'true';
    cartao.setAttribute('aria-pressed', String(!virado));
  });
});

// ---------- COMPARADOR ----------
const comparador = document.querySelector('.comparador');
const controle = comparador.querySelector('.comparador__controle');
controle.addEventListener('input', () => comparador.style.setProperty('--pos', `${controle.value}%`));

// ---------- GRÁFICOS: começam a crescer quando aparecem ----------
// (o .revelar do comum.js já coloca .visivel; aqui não precisa de nada a mais)
if (reduzir) document.querySelectorAll('.grafico-barras, .grafico-rosca').forEach((g) => g.classList.add('visivel'));
