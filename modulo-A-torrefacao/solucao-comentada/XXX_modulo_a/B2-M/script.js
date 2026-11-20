/* =====================================================================
   B2-M · Monte seu pedido (abas + carrinho + cupom + modal)
   Regras de ouro desta solução:
   1. Dinheiro sempre em CENTAVOS (inteiros). 0,1 + 0,2 em float dá
      0,30000000000000004; 10 + 20 centavos dá 30. Formata só na tela.
   2. Um estado (carrinho + cupom), uma função render(), salvar no fim.
   3. Abas no padrão ARIA: tablist/tab/tabpanel, setas e Home/End.
   ===================================================================== */

const CHAVE = 'torra-carrinho';
const FRETE = 1200;              // R$ 12,00
const FRETE_GRATIS_A_PARTIR = 15000;
const MAX_QTD = 10;
const CUPONS = {
  TORRA10:     { tipo: 'percentual', valor: 10, texto: '10% de desconto' },
  FRETEGRATIS: { tipo: 'frete',      valor: 0,  texto: 'frete grátis' },
};

const $ = id => document.getElementById(id);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dinheiro = centavos => brl.format(centavos / 100);

let cardapio = null;
let estado = carregar();         // { linhas: [{id, tamanho, qtd}], cupom: 'TORRA10' | null }

function carregar() {
  try {
    const e = JSON.parse(localStorage.getItem(CHAVE));
    if (e && Array.isArray(e.linhas)) return { linhas: e.linhas, cupom: CUPONS[e.cupom] ? e.cupom : null };
  } catch { /* dado corrompido: começa vazio */ }
  return { linhas: [], cupom: null };
}
const salvar = () => localStorage.setItem(CHAVE, JSON.stringify(estado));

const item = id => cardapio.itens.find(i => i.id === id);
const limitar = n => Math.min(MAX_QTD, Math.max(1, Number.isFinite(n) ? Math.round(n) : 1));

/* =====================================================================
   1. Cálculo dos totais (função pura: entra estado, sai números)
   ===================================================================== */
function calcular() {
  const subtotal = estado.linhas.reduce((s, l) => s + item(l.id).precos[l.tamanho] * l.qtd, 0);
  const cupom = CUPONS[estado.cupom];
  const desconto = cupom && cupom.tipo === 'percentual' ? Math.round(subtotal * cupom.valor / 100) : 0;
  const base = subtotal - desconto;
  let frete = 0;
  if (subtotal > 0) {
    frete = (cupom && cupom.tipo === 'frete') || base >= FRETE_GRATIS_A_PARTIR ? 0 : FRETE;
  }
  return { subtotal, desconto, frete, total: base + frete, qtd: estado.linhas.reduce((s, l) => s + l.qtd, 0), base };
}

/* =====================================================================
   2. Abas e produtos (desenhados uma vez a partir do JSON)
   ===================================================================== */
function montarAbas() {
  const abas = $('abas'), paineis = $('paineis');
  cardapio.categorias.forEach((c, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.id = `aba-${c.id}`;
    tab.textContent = c.nome;
    tab.setAttribute('aria-controls', `painel-${c.id}`);
    abas.appendChild(tab);

    const painel = document.createElement('section');
    painel.setAttribute('role', 'tabpanel');
    painel.id = `painel-${c.id}`;
    painel.tabIndex = 0;
    painel.setAttribute('aria-labelledby', tab.id);
    painel.innerHTML = `<div class="grade">${cardapio.itens.filter(it => it.categoria === c.id).map(cartaoProduto).join('')}</div>`;
    paineis.appendChild(painel);
  });
  selecionarAba(0);
}

function cartaoProduto(it) {
  const tams = Object.keys(it.precos);
  const radios = tams.length > 1 ? `
    <fieldset class="tamanhos">
      <legend>Tamanho</legend>
      ${tams.map((t, k) => `<label><input type="radio" name="tam-${it.id}" value="${t}" ${k === 0 ? 'checked' : ''}><span>${cardapio.tamanhos[t]}</span></label>`).join('')}
    </fieldset>` : '';
  return `
    <article class="produto" data-id="${it.id}">
      <h3>${it.nome}</h3>
      <p>${it.descricao}</p>
      ${radios}
      <span class="produto__preco">${dinheiro(it.precos[tams[0]])}</span>
      <div class="acoes-produto">
        <div class="qtd">
          <button type="button" data-passo="-1" aria-label="Diminuir quantidade de ${it.nome}" disabled>−</button>
          <input type="number" min="1" max="${MAX_QTD}" value="1" aria-label="Quantidade de ${it.nome}">
          <button type="button" data-passo="1" aria-label="Aumentar quantidade de ${it.nome}">+</button>
        </div>
        <button type="button" class="primario" data-adicionar>Adicionar</button>
      </div>
    </article>`;
}

function selecionarAba(i, focar = false) {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((t, k) => {
    const ativa = k === i;
    t.setAttribute('aria-selected', String(ativa));
    t.tabIndex = ativa ? 0 : -1;                   // só a aba ativa entra no Tab
    $(t.getAttribute('aria-controls')).hidden = !ativa;
  });
  if (focar) tabs[i].focus();
}

$('abas').addEventListener('click', e => {
  const t = e.target.closest('[role="tab"]');
  if (t) selecionarAba([...$('abas').children].indexOf(t));
});

$('abas').addEventListener('keydown', e => {
  const tabs = [...$('abas').children];
  const i = tabs.indexOf(document.activeElement);
  const n = tabs.length;
  const mapa = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 };
  if (e.key in mapa) { e.preventDefault(); selecionarAba(mapa[e.key], true); }
});

/* ---------- Interação dentro do cartão do produto ---------- */
function atualizarCartao(card) {
  const it = item(Number(card.dataset.id));
  const marcado = card.querySelector('input[type="radio"]:checked');
  const tam = marcado ? marcado.value : Object.keys(it.precos)[0];
  const input = card.querySelector('.qtd input');
  const q = limitar(Number(input.value));
  input.value = q;
  card.querySelector('[data-passo="-1"]').disabled = q <= 1;
  card.querySelector('[data-passo="1"]').disabled = q >= MAX_QTD;
  card.querySelector('.produto__preco').textContent = dinheiro(it.precos[tam]);
  return { it, tam, q };
}

$('paineis').addEventListener('click', e => {
  const card = e.target.closest('.produto');
  if (!card) return;
  const passo = e.target.closest('[data-passo]');
  if (passo) {
    const input = card.querySelector('.qtd input');
    input.value = Number(input.value) + Number(passo.dataset.passo);
    atualizarCartao(card);
  }
  if (e.target.closest('[data-adicionar]')) {
    const { it, tam, q } = atualizarCartao(card);
    adicionar(it.id, tam, q);
  }
});
$('paineis').addEventListener('change', e => {
  const card = e.target.closest('.produto');
  if (card) atualizarCartao(card);
});

/* =====================================================================
   3. Carrinho
   ===================================================================== */
function adicionar(id, tamanho, qtd) {
  // mesmo produto no mesmo tamanho: soma na linha existente (até 10)
  const l = estado.linhas.find(x => x.id === id && x.tamanho === tamanho);
  if (l) l.qtd = Math.min(MAX_QTD, l.qtd + qtd);
  else estado.linhas.push({ id, tamanho, qtd });
  render();
  const b = $('badge');
  b.classList.remove('pulo'); void b.offsetWidth; b.classList.add('pulo');   // reinicia a animação
}

function render() {
  const t = calcular();

  $('vazio').hidden = estado.linhas.length > 0;
  $('linhas').innerHTML = estado.linhas.map((l, k) => {
    const it = item(l.id);
    const nomeTam = Object.keys(it.precos).length > 1 ? ` (${cardapio.tamanhos[l.tamanho]})` : '';
    return `
      <li class="linha" data-k="${k}">
        <span class="linha__nome">${it.nome}${nomeTam}</span>
        <span class="linha__valor">${dinheiro(it.precos[l.tamanho] * l.qtd)}</span>
        <div class="qtd">
          <button type="button" data-linha-passo="-1" aria-label="Diminuir ${it.nome}" ${l.qtd <= 1 ? 'disabled' : ''}>−</button>
          <input type="number" min="1" max="${MAX_QTD}" value="${l.qtd}" aria-label="Quantidade de ${it.nome} no carrinho" data-linha-qtd>
          <button type="button" data-linha-passo="1" aria-label="Aumentar ${it.nome}" ${l.qtd >= MAX_QTD ? 'disabled' : ''}>+</button>
        </div>
        <button type="button" class="linha__remover" data-remover>Remover</button>
      </li>`;
  }).join('');

  $('subtotal').textContent = dinheiro(t.subtotal);
  $('desconto').textContent = t.desconto ? '− ' + dinheiro(t.desconto) : dinheiro(0);
  $('frete').textContent = t.subtotal === 0 ? dinheiro(0) : (t.frete === 0 ? 'Grátis' : dinheiro(t.frete));
  $('total').textContent = dinheiro(t.total);
  $('dica-frete').textContent = t.subtotal > 0 && t.frete > 0
    ? `Faltam ${dinheiro(FRETE_GRATIS_A_PARTIR - t.base)} para o frete grátis.` : '';

  $('badge').textContent = t.qtd;
  $('barra-qtd').textContent = t.qtd;
  $('barra-total').textContent = dinheiro(t.total);
  $('finalizar').disabled = estado.linhas.length === 0;

  mostrarCupom();
  salvar();
}

$('linhas').addEventListener('click', e => {
  const li = e.target.closest('.linha');
  if (!li) return;
  const l = estado.linhas[Number(li.dataset.k)];
  const passo = e.target.closest('[data-linha-passo]');
  if (passo) { l.qtd = limitar(l.qtd + Number(passo.dataset.linhaPasso)); render(); }
  if (e.target.closest('[data-remover]')) { estado.linhas.splice(Number(li.dataset.k), 1); render();}
});
$('linhas').addEventListener('change', e => {
  const li = e.target.closest('.linha');
  if (li && e.target.matches('[data-linha-qtd]')) { estado.linhas[Number(li.dataset.k)].qtd = limitar(Number(e.target.value)); render(); }
});

/* ---------- Cupom ---------- */
let msgCupom = { texto: '', tipo: '' };

function mostrarCupom() {
  const m = $('msg-cupom');
  if (estado.cupom) {
    m.className = 'msg ok';
    m.innerHTML = `Cupom ${estado.cupom} aplicado: ${CUPONS[estado.cupom].texto}. <button type="button" id="tirar-cupom">Remover cupom</button>`;
  } else {
    m.className = 'msg ' + msgCupom.tipo;
    m.textContent = msgCupom.texto;
  }
}

$('form-cupom').addEventListener('submit', e => {
  e.preventDefault();
  const cod = $('cupom').value.trim().toUpperCase();
  if (!cod) { msgCupom = { texto: 'Digite um cupom.', tipo: 'erro' }; }
  else if (!CUPONS[cod]) { msgCupom = { texto: 'Cupom inválido.', tipo: 'erro' }; }
  else { estado.cupom = cod; msgCupom = { texto: '', tipo: '' }; $('cupom').value = ''; }
  render();
});
$('msg-cupom').addEventListener('click', e => {
  if (e.target.id === 'tirar-cupom') { estado.cupom = null; msgCupom = { texto: 'Cupom removido.', tipo: '' }; render(); $('cupom').focus(); }
});

/* =====================================================================
   4. Modal de confirmação
   ===================================================================== */
const modal = $('modal');

function dataHoraBr(d) {
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} às ${p(d.getHours())}:${p(d.getMinutes())}`;
}

$('finalizar').addEventListener('click', () => {
  const t = calcular();
  $('m-titulo').textContent = 'Confirmar pedido';
  $('m-conteudo').innerHTML = `
    <ul>${estado.linhas.map(l => `<li>${l.qtd} × ${item(l.id).nome}${Object.keys(item(l.id).precos).length > 1 ? ' (' + cardapio.tamanhos[l.tamanho] + ')' : ''}</li>`).join('')}</ul>
    <p><strong>Total: ${dinheiro(t.total)}</strong></p>`;
  $('m-acoes').hidden = false;
  modal.showModal();
  document.body.classList.add('travado');
  $('m-confirmar').focus();
});

$('m-confirmar').addEventListener('click', () => {
  const numero = 'TP-' + String(Math.floor(Math.random() * 9000) + 1000);
  $('m-titulo').textContent = 'Pedido confirmado!';
  $('m-conteudo').innerHTML = `<p>Pedido <strong>${numero}</strong> confirmado em ${dataHoraBr(new Date())}.</p>`;
  $('m-acoes').hidden = true;
  estado = { linhas: [], cupom: null };
  msgCupom = { texto: '', tipo: '' };
  render();
  $('m-fechar').focus();
});

$('m-cancelar').addEventListener('click', () => modal.close());
$('m-fechar').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });   // clique no fundo
modal.addEventListener('close', () => {
  document.body.classList.remove('travado');
  ($('finalizar').disabled ? $('cupom') : $('finalizar')).focus();               // devolve o foco
});

/* =====================================================================
   5. Início
   ===================================================================== */
fetch('cardapio.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(dados => {
    cardapio = dados;
    // remove do carrinho salvo o que não existe mais no cardápio
    estado.linhas = estado.linhas.filter(l => item(l.id) && item(l.id).precos[l.tamanho]).map(l => ({ ...l, qtd: limitar(l.qtd) }));
    $('estado').hidden = true;
    montarAbas();
    render();
  })
  .catch(() => { $('estado').textContent = 'Não foi possível carregar o cardápio.'; });
