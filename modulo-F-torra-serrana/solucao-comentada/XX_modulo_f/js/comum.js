/* comum.js — usado pelas três páginas:
   1) cabeçalho que encolhe   2) catálogo (fetch) e o cartão de café   3) sacola (gaveta + localStorage)   4) aviso (toast) */

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FRETE_GRATIS = 150;
const FRETE = 18.9;
const TORRAS = { clara: 'Torra clara', media: 'Torra média', escura: 'Torra escura' };
const CORES = { 'mantiqueira-amarelo': '#F2C46B', 'pedra-bela': '#E9A27E', 'sitio-aurora': '#A9C9A4', 'vale-do-garcia': '#C9A6D6', 'mogiana-classico': '#D6B48E', 'cerrado-noturno': '#9DB0CC', 'alta-paulista': '#9CCFD3', 'descafeinado-serra': '#C9C9C9' };

// ---------- 1. CABEÇALHO ----------
const cabecalho = document.querySelector('.cabecalho');
const compactar = () => cabecalho.classList.toggle('cabecalho--compacto', window.scrollY > 40);
window.addEventListener('scroll', compactar, { passive: true });
compactar();

// ---------- 2. CATÁLOGO ----------
// carregarCafes() devolve uma Promise com a lista; as páginas usam o mesmo cartão.
let catalogo = [];
function carregarCafes() {
  return fetch('dados/cafes.json')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((dados) => (catalogo = dados));
}

// Gera o HTML de UM cartão. --alvo = nota SCA (o anel e o número animam até ela);
// cada barra do perfil tem --v (0 a 5) e --i (ordem da animação).
function cartaoCafe(c, i = 0) {
  const p = c.perfil;
  const barra = (nome, v, k) => `<li><span>${nome}</span><span class="perfil__barra" style="--v:${v};--i:${k}"></span><b>${v}/5</b></li>`;
  return `
  <li class="cartao" style="--i:${i}">
    <div class="cartao__imagem" style="--cor:${CORES[c.id]}">
      <span class="etiqueta-torra">${TORRAS[c.torra]}</span>
      <span class="nota" style="--alvo:${c.notaSCA}" role="img" aria-label="Nota SCA ${c.notaSCA}"></span>
      <img src="img/${c.imagem}" alt="Pacote do café ${c.nome}" width="360" height="456" loading="lazy">
    </div>
    <div class="cartao__corpo">
      <p class="cartao__origem">${c.origem} · ${c.altitude}</p>
      <h3 class="cartao__nome">${c.nome}</h3>
      <p class="cartao__notas">${c.notas}</p>
      <ul class="perfil" aria-label="Perfil sensorial">
        ${barra('Acidez', p.acidez, 0)}${barra('Corpo', p.corpo, 1)}${barra('Doçura', p.docura, 2)}${barra('Amargor', p.amargor, 3)}
      </ul>
      <div class="cartao__rodape">
        <p class="preco">${moeda.format(c.preco)} <small>/ 250 g</small></p>
        <button class="botao botao--primario botao-add" type="button" data-adicionar="${c.id}">
          <span class="icone icone--sacola" aria-hidden="true"></span>Adicionar<span class="visualmente-oculto"> ${c.nome} à sacola</span>
        </button>
      </div>
    </div>
  </li>`;
}

// no celular não existe hover: o gráfico aparece quando o cartão entra na tela
const semHover = matchMedia('(hover: none)').matches;
const vigia = new IntersectionObserver((itens) => itens.forEach((it) => {
  if (it.isIntersecting) { it.target.classList.add('mostrar'); vigia.unobserve(it.target); }
}), { threshold: 0.5 });
function vigiarCartoes(lista) { if (semHover) lista.querySelectorAll('.cartao').forEach((c) => vigia.observe(c)); }

// ---------- 3. SACOLA ----------
// Estado: { idDoCafe: quantidade }, salvo em localStorage a cada mudança.
let sacola = JSON.parse(localStorage.getItem('ts-sacola') || '{}');
const gaveta = document.getElementById('sacola');
const fundo = document.querySelector('.gaveta-fundo');
const botaoSacola = document.querySelector('.botao-sacola');
const selo = document.querySelector('.selo');
const listaItens = gaveta.querySelector('.gaveta__itens');
let ultimoFoco = null;

function salvar() { localStorage.setItem('ts-sacola', JSON.stringify(sacola)); }
function totalItens() { return Object.values(sacola).reduce((s, q) => s + q, 0); }

function atualizarSelo(pular) {
  const n = totalItens();
  selo.querySelector('.selo__numero').textContent = n;
  selo.classList.toggle('selo--vazio', n === 0);
  if (pular && !reduzirMovimento) { selo.classList.remove('pulou'); void selo.offsetWidth; selo.classList.add('pulou'); }
}

function desenharSacola() {
  const ids = Object.keys(sacola).filter((id) => catalogo.some((c) => c.id === id));
  const vazia = ids.length === 0;
  gaveta.querySelector('.gaveta__vazia').hidden = !vazia;
  gaveta.querySelector('.gaveta__rodape').hidden = vazia;
  listaItens.innerHTML = ids.map((id) => {
    const c = catalogo.find((x) => x.id === id);
    const q = sacola[id];
    return `<li class="item" data-id="${id}">
      <img src="img/${c.imagem}" alt="" width="64" height="64">
      <div><span class="item__nome">${c.nome}</span><span class="item__preco">${moeda.format(c.preco)} cada</span>
        <div class="qtd" role="group" aria-label="Quantidade de ${c.nome}">
          <button type="button" data-acao="menos" aria-label="Diminuir"><span class="icone icone--menos" aria-hidden="true"></span></button>
          <output aria-live="polite">${q}</output>
          <button type="button" data-acao="mais" aria-label="Aumentar"><span class="icone icone--mais" aria-hidden="true"></span></button>
        </div></div>
      <div class="item__lado"><span class="item__total">${moeda.format(c.preco * q)}</span>
        <button class="item__remover" type="button" data-acao="remover" aria-label="Remover ${c.nome}"><span class="icone icone--lixo" aria-hidden="true"></span></button></div>
    </li>`;
  }).join('');

  const subtotal = ids.reduce((s, id) => s + catalogo.find((c) => c.id === id).preco * sacola[id], 0);
  const frete = subtotal === 0 || subtotal >= FRETE_GRATIS ? 0 : FRETE;
  gaveta.querySelector('.js-subtotal').textContent = moeda.format(subtotal);
  gaveta.querySelector('.js-frete').textContent = frete === 0 ? 'Grátis' : moeda.format(frete);
  gaveta.querySelector('.js-total').textContent = moeda.format(subtotal + frete);
  const falta = FRETE_GRATIS - subtotal;
  gaveta.querySelector('.frete__texto').innerHTML = falta > 0
    ? `Faltam <strong>${moeda.format(falta)}</strong> para o frete grátis.`
    : '<strong>Você ganhou frete grátis!</strong>';
  gaveta.querySelector('.frete').style.setProperty('--progresso', Math.min(1, subtotal / FRETE_GRATIS).toFixed(3));
}

function adicionar(id, botao) {
  sacola[id] = (sacola[id] || 0) + 1;
  salvar(); atualizarSelo(true); desenharSacola();
  const c = catalogo.find((x) => x.id === id);
  avisar(`${c.nome} foi para a sacola.`);
  if (botao) {                                          // feedback no próprio botão por 1,5 s
    botao.classList.add('adicionado');
    setTimeout(() => botao.classList.remove('adicionado'), 1500);
  }
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-adicionar]');
  if (b) adicionar(b.dataset.adicionar, b);
});

listaItens.addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]');
  if (!b) return;
  const li = b.closest('.item');
  const id = li.dataset.id;
  if (b.dataset.acao === 'mais') sacola[id]++;
  if (b.dataset.acao === 'menos') sacola[id]--;
  const remover = b.dataset.acao === 'remover' || sacola[id] <= 0;
  if (remover) delete sacola[id];
  salvar(); atualizarSelo(true);
  if (remover && !reduzirMovimento) {                   // anima a saída e só depois redesenha
    li.classList.add('saindo');
    li.addEventListener('animationend', () => { desenharSacola(); gaveta.querySelector('.gaveta__fechar').focus(); }, { once: true });
  } else {
    desenharSacola();
    const mesmo = listaItens.querySelector(`[data-id="${id}"] [data-acao="${b.dataset.acao}"]`);
    if (mesmo) mesmo.focus();                           // foco não se perde ao redesenhar
  }
});

// abrir e fechar a gaveta
function focaveis() { return [...gaveta.querySelectorAll('button, a[href], input')].filter((el) => !el.closest('[hidden]') && !el.disabled); }
function abrirSacola() {
  ultimoFoco = document.activeElement;
  gaveta.hidden = false; fundo.hidden = false;
  requestAnimationFrame(() => { gaveta.classList.add('aberta'); fundo.classList.add('aberta'); });  // 1 quadro depois: a transição roda
  botaoSacola.setAttribute('aria-expanded', 'true');
  document.body.classList.add('travado');
  gaveta.querySelector('.gaveta__fechar').focus();
}
function fecharSacola() {
  gaveta.classList.remove('aberta'); fundo.classList.remove('aberta');
  botaoSacola.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('travado');
  const fim = () => { gaveta.hidden = true; fundo.hidden = true; };
  if (reduzirMovimento) fim(); else gaveta.addEventListener('transitionend', fim, { once: true });
  if (ultimoFoco) ultimoFoco.focus();
}
botaoSacola.addEventListener('click', abrirSacola);
gaveta.querySelector('.gaveta__fechar').addEventListener('click', fecharSacola);
fundo.addEventListener('click', fecharSacola);
gaveta.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharSacola();
  if (e.key === 'Tab') {                                // FOCO PRESO: Tab não sai da gaveta
    const f = focaveis(); const primeiro = f[0]; const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
});
gaveta.querySelector('.gaveta__rodape .botao').addEventListener('click', () => avisar('Pedido de treino: nada foi cobrado.'));

// ---------- 4. AVISO (toast) ----------
const aviso = document.querySelector('.aviso');
let tempoAviso;
function avisar(texto) {
  aviso.textContent = texto;
  aviso.classList.add('visivel');
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => aviso.classList.remove('visivel'), 2400);
}

// a sacola precisa do catálogo para mostrar nomes e preços
const catalogoPronto = carregarCafes()
  .then(() => { atualizarSelo(false); desenharSacola(); })
  .catch(() => avisar('Não foi possível carregar os cafés.'));
atualizarSelo(false);
