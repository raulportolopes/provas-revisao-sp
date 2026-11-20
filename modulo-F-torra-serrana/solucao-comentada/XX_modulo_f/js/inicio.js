/* inicio.js — página inicial: cafés da semana, botão magnético, carrossel, interruptor de plano e formulário do clube. */

// ---------- CAFÉS DA SEMANA (mesmo cartão da página Cafés) ----------
const listaSemana = document.getElementById('cafes-semana');
catalogoPronto.then(() => {
  const ids = listaSemana.dataset.ids.split(',');
  listaSemana.innerHTML = ids.map((id, i) => cartaoCafe(catalogo.find((c) => c.id === id), i)).join('');
  vigiarCartoes(listaSemana);
});

// ---------- BOTÃO MAGNÉTICO ----------
// Dentro de um raio de 90 px o botão é "puxado" 35% da distância até o cursor.
const magnetico = document.querySelector('.magnetico');
const RAIO = 90;
if (!reduzirMovimento && matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', (e) => {
    const r = magnetico.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const perto = Math.abs(dx) < r.width / 2 + RAIO && Math.abs(dy) < r.height / 2 + RAIO;
    magnetico.style.setProperty('--mx', perto ? `${dx * 0.35}px` : '0px');
    magnetico.style.setProperty('--my', perto ? `${dy * 0.35}px` : '0px');
  });
}

// ---------- CARROSSEL DE DEPOIMENTOS ----------
const carrossel = document.querySelector('.carrossel');
const trilho = carrossel.querySelector('.carrossel__trilho');
const slides = [...trilho.children];
const pontos = [...carrossel.querySelectorAll('.ponto')];
const botaoPausa = carrossel.querySelector('.carrossel__pausa');
const TEMPO = 6000;
let atual = 0;
let pausadoPeloUsuario = reduzirMovimento;            // movimento reduzido = sem autoplay
if (reduzirMovimento) botaoPausa.hidden = true;
carrossel.style.setProperty('--tempo', `${TEMPO}ms`);

function irPara(n, anunciar) {
  atual = (n + slides.length) % slides.length;         // circular
  trilho.style.setProperty('--slide', atual);
  slides.forEach((s, i) => s.inert = i !== atual);      // slides escondidos saem do Tab e do leitor de tela
  // trocar o aria-current faz a barrinha do ponto ativo começar do zero (o seletor do CSS muda)
  pontos.forEach((p, i) => (i === atual ? p.setAttribute('aria-current', 'true') : p.removeAttribute('aria-current')));
  // anuncia no leitor de tela só quando a troca foi do usuário (no autoplay incomodaria)
  trilho.setAttribute('aria-live', anunciar ? 'polite' : 'off');
}
// O "relógio" do autoplay é a própria animação da barrinha (CSS): quando ela termina, passa o slide.
// Como o CSS pausa a barrinha no hover, no foco e com .pausado, o autoplay pausa junto, sem setInterval.
pontos.forEach((p) => p.addEventListener('animationend', () => { if (!pausadoPeloUsuario) irPara(atual + 1, false); }));
carrossel.querySelectorAll('.carrossel__seta').forEach((b) => b.addEventListener('click', () => irPara(atual + Number(b.dataset.dir), true)));
pontos.forEach((p, i) => p.addEventListener('click', () => irPara(i, true)));
carrossel.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') irPara(atual + 1, true);
  if (e.key === 'ArrowLeft') irPara(atual - 1, true);
});
function atualizarPausa() {
  botaoPausa.setAttribute('aria-pressed', String(pausadoPeloUsuario));
  botaoPausa.querySelector('.carrossel__pausa-texto').textContent = pausadoPeloUsuario ? 'Reproduzir' : 'Pausar';
  botaoPausa.querySelector('.icone').className = `icone ${pausadoPeloUsuario ? 'icone--play' : 'icone--pausa'}`;
  botaoPausa.setAttribute('aria-label', pausadoPeloUsuario ? 'Reproduzir depoimentos automaticamente' : 'Pausar depoimentos');
  carrossel.classList.toggle('pausado', pausadoPeloUsuario);
}
botaoPausa.addEventListener('click', () => { pausadoPeloUsuario = !pausadoPeloUsuario; atualizarPausa(); });
atualizarPausa();
irPara(0, false);

// ---------- INTERRUPTOR MENSAL / ANUAL ----------
const plano = document.querySelector('.plano');
const opcoes = [...plano.querySelectorAll('[role="radio"]')];
const valor = plano.querySelector('.plano__valor');
function escolherPlano(botao, focar) {
  opcoes.forEach((o) => { o.setAttribute('aria-checked', String(o === botao)); o.tabIndex = o === botao ? 0 : -1; });
  plano.dataset.plano = botao.dataset.valor;
  const forte = valor.querySelector('strong');
  forte.classList.remove('rolando'); void forte.offsetWidth; forte.classList.add('rolando');
  setTimeout(() => (forte.textContent = valor.dataset[botao.dataset.valor]), reduzirMovimento ? 0 : 220); // troca no meio do "rolar"
  if (focar) botao.focus();
}
opcoes.forEach((o) => o.addEventListener('click', () => escolherPlano(o)));
plano.querySelector('.interruptor').addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  e.preventDefault();
  const i = opcoes.indexOf(document.activeElement);
  escolherPlano(opcoes[(i + 1) % 2], true);
});

// ---------- FORMULÁRIO DO CLUBE ----------
const form = document.getElementById('form-clube');
const cep = document.getElementById('clube-cep');
// máscara: só números e o traço depois do 5º dígito
cep.addEventListener('input', () => {
  const n = cep.value.replace(/\D/g, '').slice(0, 8);
  cep.value = n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
});
function mensagem(c) {
  const v = c.validity;
  if (v.valid) return '';
  if (v.valueMissing) return 'Preencha este campo.';
  if (v.typeMismatch) return 'Digite um e-mail válido, como nome@exemplo.com.';
  if (v.tooShort) return `Use pelo menos ${c.minLength} letras.`;
  if (v.patternMismatch) return 'O CEP tem 8 números, no formato 00000-000.';
  return 'Valor inválido.';
}
function validar(c) {
  const t = mensagem(c);
  c.closest('.campo').classList.toggle('campo--erro', !!t);
  c.setAttribute('aria-invalid', String(!!t));
  document.getElementById(c.getAttribute('aria-describedby')).textContent = t;
  return !t;
}
const campos = [...form.querySelectorAll('input')];
campos.forEach((c) => c.addEventListener('blur', () => { if (c.value) validar(c); }));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = campos.map(validar).every(Boolean);
  if (!ok) { campos.find((c) => !c.validity.valid).focus(); return; }
  const primeiro = form.elements.nome.value.trim().split(' ')[0];
  const plano = document.querySelector('.plano').dataset.plano;
  const caixa = form.querySelector('.clube__ok');
  caixa.querySelector('.clube__ok-texto').textContent = `Pronto, ${primeiro}! Você entrou na lista do plano ${plano}. Avisaremos por e-mail.`;
  caixa.hidden = false;
  form.reset();
});
