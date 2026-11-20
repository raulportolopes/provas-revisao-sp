/* preparo.js — abas de método + cronômetro com passos + calculadora de proporção.
   Os dados das receitas vêm de dados/metodos.json. */

const abas = [...document.querySelectorAll('.metodo-aba')];
const painel = document.getElementById('painel-metodo');
const receita = document.getElementById('receita');
const passosEl = document.getElementById('passos');
const botaoIniciar = document.getElementById('c-iniciar');
const anel = document.querySelector('.anel');
const faixa = document.getElementById('calc-agua');
let metodos = {};
let metodo = null;                                    // receita atual
const relogio = { segundos: 0, rodando: false, id: null };

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const paraSegundos = (t) => { const [m, s] = t.split(':').map(Number); return m * 60 + s; };
const $ = (id) => document.getElementById(id);

fetch('dados/metodos.json')
  .then((r) => r.json())
  .then((dados) => { metodos = dados; mostrar('v60'); });

// ---------- ABAS ----------
function mostrar(chave, focar) {
  metodo = { chave, ...metodos[chave], total: paraSegundos(metodos[chave].tempo) };
  abas.forEach((a) => {
    const ativa = a.dataset.metodo === chave;
    a.setAttribute('aria-selected', String(ativa));
    a.tabIndex = ativa ? 0 : -1;
    if (ativa && focar) a.focus();
  });
  painel.setAttribute('aria-labelledby', `aba-${chave}`);
  $('r-tipo').textContent = metodo.tipo;
  $('r-nome').textContent = metodo.nome;
  $('r-resumo').textContent = metodo.resumo;
  $('r-img').src = `img/metodo-${chave}.webp`;
  $('r-cafe').textContent = metodo.cafe;
  $('r-agua').textContent = metodo.agua;
  $('r-moagem').textContent = metodo.moagem;
  $('r-temp').textContent = metodo.temp;
  $('c-total').textContent = metodo.tempo;
  faixa.value = parseInt(metodo.agua, 10);
  receita.style.animation = 'none'; void receita.offsetWidth; receita.style.animation = '';  // reinicia a animação de troca
  zerar();
  calcular();
}
abas.forEach((a) => a.addEventListener('click', () => mostrar(a.dataset.metodo)));
document.querySelector('.metodos').addEventListener('keydown', (e) => {
  const i = abas.indexOf(document.activeElement);
  if (i < 0) return;
  const mapa = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };   // vale vertical e horizontal
  if (e.key in mapa) { e.preventDefault(); mostrar(abas[(i + mapa[e.key] + abas.length) % abas.length].dataset.metodo, true); }
  if (e.key === 'Home') { e.preventDefault(); mostrar(abas[0].dataset.metodo, true); }
  if (e.key === 'End') { e.preventDefault(); mostrar(abas[abas.length - 1].dataset.metodo, true); }
});

// ---------- CRONÔMETRO ----------
function desenharRelogio() {
  const s = relogio.segundos;
  $('c-tempo').textContent = mmss(s);
  anel.style.setProperty('--p', (s / metodo.total).toFixed(4));
  // passo atual = aquele em que "de <= s < ate"; os anteriores ficam feitos
  passosEl.innerHTML = metodo.passos.map((p) => {
    const classe = s >= p.ate ? 'passo--feito' : (s >= p.de && (relogio.rodando || s > 0)) ? 'passo--atual' : '';
    return `<li class="passo ${classe}"><span>${p.texto}</span><small>${mmss(p.de)}–${mmss(p.ate)}</small></li>`;
  }).join('');
}
function tique() {
  relogio.segundos++;
  if (relogio.segundos >= metodo.total) { relogio.segundos = metodo.total; pausar(); avisar(`${metodo.nome} pronto! Bom café.`); }
  desenharRelogio();
}
function iniciar() {
  if (relogio.segundos >= metodo.total) relogio.segundos = 0;
  relogio.rodando = true;
  relogio.id = setInterval(tique, 1000);
  botaoIniciar.querySelector('span:last-child').textContent = 'Pausar';
  botaoIniciar.querySelector('.icone').className = 'icone icone--pausa';
  desenharRelogio();
}
function pausar() {
  relogio.rodando = false;
  clearInterval(relogio.id);
  botaoIniciar.querySelector('span:last-child').textContent = relogio.segundos ? 'Continuar' : 'Iniciar';
  botaoIniciar.querySelector('.icone').className = 'icone icone--play';
}
function zerar() { pausar(); relogio.segundos = 0; botaoIniciar.querySelector('span:last-child').textContent = 'Iniciar'; desenharRelogio(); }
botaoIniciar.addEventListener('click', () => (relogio.rodando ? pausar() : iniciar()));
$('c-zerar').addEventListener('click', zerar);

// ---------- CALCULADORA ----------
function calcular() {
  const ml = Number(faixa.value);
  $('calc-ml').textContent = `${ml} ml`;
  $('calc-g').textContent = `${Math.round(ml / metodo.proporcao)} g`;
  $('calc-prop').textContent = `1:${String(metodo.proporcao).replace('.', ',')}`;
}
faixa.addEventListener('input', calcular);
