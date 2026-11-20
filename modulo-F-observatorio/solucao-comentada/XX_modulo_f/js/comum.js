/* comum.js — o que as três páginas têm em comum:
   1) botão de tema   2) menu do celular/tablet   3) revelar elementos ao rolar */

// ---------- 1. TEMA CLARO / ESCURO ----------
const botaoTema = document.querySelector('.tema-botao');

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  localStorage.setItem('oes-tema', tema);              // persiste entre páginas e visitas
  const claro = tema === 'claro';
  botaoTema.setAttribute('aria-pressed', String(claro));
  botaoTema.setAttribute('aria-label', claro ? 'Usar tema escuro' : 'Usar tema claro');
}
aplicarTema(document.documentElement.getAttribute('data-tema') || 'escuro');
botaoTema.addEventListener('click', () => {
  const atual = document.documentElement.getAttribute('data-tema');
  aplicarTema(atual === 'claro' ? 'escuro' : 'claro');
});

// ---------- 2. MENU (abaixo de 1024 px) ----------
const botaoMenu = document.querySelector('.menu-botao');
const menu = document.getElementById('menu-principal');
const iconeMenu = botaoMenu.querySelector('.icone');

function abrirMenu(abrir) {
  menu.classList.toggle('aberto', abrir);
  botaoMenu.setAttribute('aria-expanded', String(abrir));
  botaoMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  iconeMenu.classList.toggle('icone--menu', !abrir);
  iconeMenu.classList.toggle('icone--fechar', abrir);
  if (abrir) menu.querySelector('a').focus();
}
botaoMenu.addEventListener('click', () => abrirMenu(!menu.classList.contains('aberto')));
// Esc fecha e devolve o foco ao botão
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('aberto')) { abrirMenu(false); botaoMenu.focus(); }
});
// clicou num link (ex.: âncora) → fecha
menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrirMenu(false); });
// voltou para desktop com o menu aberto → limpa o estado
matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) abrirMenu(false); });

// ---------- 3. REVELAR AO ROLAR ----------
// IntersectionObserver avisa quando o elemento entra na tela; colocamos .visivel uma vez só.
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));

// utilitários usados pela agenda e pela galeria
const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function dataBR(iso) {
  // "2026-12-04" → "04/12/2026" sem usar new Date (evita o erro de fuso que volta um dia)
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
