// Grava um vídeo por animação da solução Sabor de Bairro. Uso: node videos.js <pasta_saida_webm> [base]
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const B = process.argv[3] || 'http://localhost:8702/';
fs.mkdirSync(OUT, { recursive: true });

const OVERLAY = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;border-radius:50%;background:rgba(232,163,61,.6);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(184,58,27,.9)'; });
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(232,163,61,.6)'; });
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:110px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#15121F;color:#fff;font:700 22px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', End: 'Tecla End', Home: 'Tecla Home' };
    document.addEventListener('keydown', (e) => { if (!nomes[e.key]) return; k.textContent = (e.shiftKey && e.key === 'Tab' ? 'Shift + ' : '') + nomes[e.key]; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 800); }, true);
  });
};

async function gravar(nome, vp, fn, { logado = true, esquema = 'light', carrinho = null } = {}) {
  if (fs.existsSync(`${OUT}/${nome}.webm`)) return;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo', colorScheme: esquema });
  if (logado) {
    // entra antes de começar a gravar "de verdade" (a sessão fica no localStorage do contexto)
    const r = await ctx.request.post(B + 'api/index.php/login', { data: { email: 'cliente@sabor.com.br', senha: 'Sabor2026!' } });
    const j = await r.json();
    await ctx.addInitScript(([t, u]) => { if (!sessionStorage.getItem('ja')) { localStorage.setItem('sabor.token', t); localStorage.setItem('sabor.usuario', u); sessionStorage.setItem('ja', 1); } }, [j.token, JSON.stringify(j.usuario)]);
  }
  if (carrinho) await ctx.addInitScript((c) => { if (!sessionStorage.getItem('jc')) { localStorage.setItem('sabor.carrinho', c); sessionStorage.setItem('jc', 1); } }, JSON.stringify(carrinho));
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage();
  const w = (ms) => p.waitForTimeout(ms);
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); await p.locator(sel).first().click(); };
  const rolar = async (y) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await w(1100); };
  const ir = async (h, espera = 1400) => { await p.goto(B + h); await p.evaluate(() => document.fonts.ready); await w(espera); };
  await fn({ p, w, move, clicar, rolar, ir });
  await w(700);
  const v = p.video();
  await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/${nome}.webm`);
  fs.rmSync(OUT + '/tmp-' + nome, { recursive: true, force: true });
  console.log('ok', nome);
}

const D = { width: 1440, height: 900 };
const M = { width: 375, height: 812 };
const reset = async () => { const b = await chromium.launch(); const c = await b.newContext(); await c.request.post(B + 'api/index.php/reset'); await b.close(); };
// Carrinho pronto (Smash do Bairro) para os vídeos de checkout.
const CARRINHO = { restaurante: { id: 6, slug: 'smash-do-bairro', nome: 'Smash do Bairro', taxa_entrega: 390, pedido_minimo: 2000 }, linhas: [
  { chave: '36|106,109|', item_id: 36, nome: 'Clássico', imagem: 'img/pratos/3-1.jpg', opcoes: [{ id: 106, nome: 'Ao ponto', preco: 0 }, { id: 109, nome: 'Bacon', preco: 600 }], observacao: '', preco_unitario: 4090, quantidade: 2 },
  { chave: '40||', item_id: 40, nome: 'Onion rings', imagem: 'img/pratos/3-2.jpg', opcoes: [], observacao: '', preco_unitario: 2190, quantidade: 1 }] };

(async () => {
  await reset();
  await gravar('01-vitrine-brilho-e-busca', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/');
    for (const [x, y] of [[200, 200], [700, 180], [500, 420], [1000, 300], [300, 380]]) { await p.mouse.move(x, y, { steps: 18 }); await w(150); }
    await clicar('#busca'); await p.keyboard.type('temaki', { delay: 90 }); await w(2200);
    await p.fill('#busca', ''); await p.keyboard.type('lasanha', { delay: 90 }); await w(2000);
    await clicar('.vazio .botao'); await w(1800);
  }, { logado: false });

  await gravar('02-chips-filtros-e-carregar-mais', D, async ({ p, w, clicar, rolar, ir }) => {
    await ir('#/'); await rolar(520);
    await clicar('.chip:has-text("Hambúrguer")'); await w(1600);
    await clicar('.chip:has-text("Saudável")'); await w(1600);
    await clicar('.chip:has-text("Todas")'); await w(1600);
    await clicar('.interruptor:has-text("grátis")'); await w(1600);
    await clicar('.interruptor:has-text("grátis")'); await w(1400);
    await clicar('.ordem select'); await p.selectOption('.ordem select', 'tempo'); await w(1800);
    await rolar(1100); await clicar('.mais .botao'); await w(1800); await rolar(1800); await w(600);
  }, { logado: false });

  await gravar('03-cartao-hover-e-esqueleto', D, async ({ p, w, move, rolar, ir }) => {
    await p.route('**/restaurantes?*', async (r) => { await new Promise((s) => setTimeout(s, 2200)); r.continue().catch(() => {}); });
    await p.goto(B + '#/'); await w(300); await rolar(560); await w(2400);
    for (let i = 0; i < 6; i++) { await move(`.cartao >> nth=${i}`, 12); await w(650); }
    await p.mouse.move(700, 120, { steps: 10 }); await w(500);
  }, { logado: false });

  await gravar('04-abas-do-cardapio-e-scrollspy', D, async ({ p, w, clicar, ir }) => {
    await ir('#/restaurante/forno-da-vila');
    await clicar('.aba-secao >> nth=2'); await w(1500);
    await clicar('.aba-secao >> nth=1'); await w(1500);
    await clicar('.aba-secao >> nth=0'); await w(1500);
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 140); await w(220); }
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, -140); await w(200); }
    await clicar('.busca-cardapio input'); await p.keyboard.type('calabresa', { delay: 80 }); await w(1500);
  }, { logado: false });

  await gravar('05-modal-do-prato-opcoes-e-preco', D, async ({ p, w, clicar, ir }) => {
    await ir('#/restaurante/smash-do-bairro');
    await clicar('.item[data-item="36"]'); await w(1200);
    await clicar('.modal__rodape .botao'); await w(1300);
    await clicar('text=Ao ponto'); await w(600);
    for (const o of ['Bacon', 'Queijo extra', 'Ovo']) { await clicar(`.opcao:has-text("${o}")`); await w(500); }
    await p.locator('.opcao:has-text("Cebola")').scrollIntoViewIfNeeded(); await w(1200);
    await clicar('.opcao:has-text("Ovo")'); await w(600);
    await clicar('[aria-label="Aumentar quantidade"]'); await w(500); await clicar('[aria-label="Aumentar quantidade"]'); await w(500);
    await clicar('[aria-label="Diminuir quantidade"]'); await w(800);
    await p.keyboard.press('Escape'); await w(1000);
  }, { logado: false });

  await gravar('06-adicionar-pulo-do-contador-e-aviso', D, async ({ p, w, clicar, move, ir }) => {
    await ir('#/restaurante/smash-do-bairro');
    await clicar('.item[data-item="40"]'); await w(900); await clicar('.modal__rodape .botao'); await w(500); await move('.botao-carrinho'); await w(1200);
    await clicar('.item[data-item="42"]'); await w(900); await clicar('[aria-label="Aumentar quantidade"]'); await w(300); await clicar('.modal__rodape .botao'); await w(500); await move('.botao-carrinho'); await w(2500);
  }, { logado: false });

  await gravar('07-gaveta-minimo-e-esvaziar', D, async ({ p, w, clicar, ir }) => {
    await ir('#/restaurante/smash-do-bairro');
    await clicar('.item[data-item="42"]'); await w(800); await clicar('.modal__rodape .botao'); await w(800);
    await clicar('.botao-carrinho'); await w(1400);
    for (let i = 0; i < 3; i++) { await clicar('.linha [aria-label="Aumentar"]'); await w(700); }
    await w(800);
    await clicar('.link-botao:has-text("Esvaziar")'); await w(1000); await clicar('.modal .botao--perigo'); await w(1300);
    await p.keyboard.press('Escape'); await w(800);
  }, { logado: false });

  await gravar('08-confirmar-outro-restaurante', D, async ({ p, w, clicar, ir }) => {
    await ir('#/restaurante/pastelaria-madrugada');
    await clicar('.item:has-text("Café coado")'); await w(900); await clicar('.modal__rodape .botao'); await w(1500);
    await clicar('.modal:has-text("novo carrinho") .botao--fantasma'); await w(800); await p.keyboard.press('Escape'); await w(800);
    await clicar('.item:has-text("Café coado")'); await w(900); await clicar('.modal__rodape .botao'); await w(1200);
    await clicar('.modal .botao--perigo'); await w(1500);
  }, { logado: false, carrinho: CARRINHO });

  await gravar('09-login-pelo-checkout', D, async ({ p, w, clicar, ir }) => {
    await ir('#/checkout', 1200);
    await clicar('.entrar__form .botao'); await w(1500);
    await clicar('#email'); await p.keyboard.type('cliente@sabor.com.br', { delay: 40 });
    await clicar('#senha'); await p.keyboard.type('errada', { delay: 50 }); await clicar('.entrar__form .botao'); await w(1500);
    await clicar('.link-botao:has-text("Mostrar")'); await w(600);
    await p.fill('#senha', ''); await p.keyboard.type('Sabor2026!', { delay: 50 }); await clicar('.entrar__form .botao'); await w(2200);
  }, { logado: false, carrinho: CARRINHO });

  await gravar('10-checkout-cep-pagamento-e-troco', D, async ({ p, w, clicar, ir }) => {
    await ir('#/checkout');
    await clicar('.checkout__botoes .botao'); await w(1000);
    await clicar('#f-cep'); await p.keyboard.type('01001000', { delay: 90 }); await w(1600);
    await p.fill('#f-cep', ''); await p.keyboard.type('03164000', { delay: 90 }); await w(1600);
    await clicar('#f-numero'); await p.keyboard.type('45', { delay: 90 }); await clicar('.checkout__botoes .botao'); await w(1200);
    for (const f of ['Pix', 'Cartão', 'Dinheiro']) { await clicar(`.pagamento:has-text("${f}")`); await w(600); }
    await clicar('.troco .interruptor'); await w(600); await clicar('#f-troco'); await p.keyboard.type('50', { delay: 90 });
    await clicar('.checkout__botoes .botao:has-text("Continuar")'); await w(1300);
    await p.fill('#f-troco', ''); await p.keyboard.type('200,00', { delay: 80 }); await clicar('.checkout__botoes .botao:has-text("Continuar")'); await w(1500);
  }, { carrinho: CARRINHO });

  await gravar('11-cupom-e-confirmar-pedido', D, async ({ p, w, clicar, ir }) => {
    await ir('#/checkout'); await p.keyboard.type(''); await p.locator('#f-cep').pressSequentially('03164000'); await w(1300); await p.fill('#f-numero', '45');
    await clicar('.checkout__botoes .botao'); await w(900); await clicar('.pagamento:has-text("Pix")'); await clicar('.checkout__botoes .botao:has-text("Continuar")'); await w(1200);
    await clicar('#f-cupom'); await p.keyboard.type('VERAO2025', { delay: 70 }); await clicar('.cupom .botao'); await w(1500);
    await p.fill('#f-cupom', ''); await p.keyboard.type('BEMVINDO10', { delay: 70 }); await clicar('.cupom .botao'); await w(1500);
    await clicar('.link-botao:has-text("Remover cupom")'); await w(700);
    await clicar('#f-cupom'); await p.keyboard.type('FRETEGRATIS', { delay: 70 }); await clicar('.cupom .botao'); await w(1500);
    await clicar('.checkout__botoes .botao:not(.botao--fantasma)'); await w(3200);
  }, { carrinho: CARRINHO });

  await gravar('12-linha-do-tempo-do-pedido', D, async ({ p, w, clicar, ir }) => {
    const seq = ['recebido', 'em_preparo', 'a_caminho', 'entregue']; let n = 0;
    await p.route(/pedidos\/1003$/, async (r) => {
      const resp = await r.fetch(); const j = await resp.json(); const st = seq[Math.min(n++, 3)];
      Object.assign(j.dados, { status: st, pode_cancelar: st === 'recebido', pode_avaliar: false, avaliacao: null, historico: seq.slice(0, seq.indexOf(st) + 1).map((s) => ({ status: s, em: j.dados.criado_em })) });
      r.fulfill({ response: resp, json: j });
    });
    await ir('#/pedidos/1003', 500); await w(17500);
  });

  await gravar('13-cancelar-e-avaliar-com-estrelas', D, async ({ p, w, clicar, move, ir }) => {
    await ir('#/restaurante/smash-do-bairro?item=40'); await p.click('.modal__rodape .botao'); await w(300);
    await ir('#/checkout'); await p.locator('#f-cep').pressSequentially('03101001'); await w(1300); await p.fill('#f-numero', '10');
    await p.click('.checkout__botoes .botao'); await w(500); await p.click('.pagamento:has-text("Pix")'); await p.click('.checkout__botoes .botao:has-text("Continuar")'); await w(600);
    await p.click('.checkout__botoes .botao:not(.botao--fantasma)'); await w(2500);
    await clicar('text=Cancelar pedido'); await w(1200); await clicar('.modal .botao--perigo'); await w(2000);
    await ir('#/pedidos/1006');
    for (let i = 4; i >= 0; i--) { await move(`.estrela >> nth=${i}`, 8); await w(350); }
    await clicar('.estrela >> nth=1'); await w(500); await clicar('.avaliar .botao'); await w(1300);
    await p.focus('.estrela input >> nth=1'); for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await w(500); }
    await clicar('#f-coment'); await p.keyboard.type('Chegou rapidinho e quente!', { delay: 40 }); await clicar('.avaliar .botao'); await w(2000);
  });

  await gravar('14-tema-escuro', D, async ({ p, w, clicar, ir }) => {
    await ir('#/'); await clicar('[aria-label="Tema escuro"]'); await w(1500);
    await clicar('.cartao >> nth=1'); await w(1800); await clicar('.item >> nth=0'); await w(1500);
    await p.keyboard.press('Escape'); await w(600); await clicar('[aria-label="Tema escuro"]'); await w(1200);
  }, { logado: false });

  await gravar('15-celular-barra-modal-e-gaveta', M, async ({ p, w, clicar, rolar, ir }) => {
    await ir('#/restaurante/smash-do-bairro'); await rolar(500);
    await clicar('.item[data-item="39"]'); await w(1200); await clicar('text=Barbecue'); await w(500); await clicar('.modal__rodape .botao'); await w(1500);
    await rolar(900); await w(600);
    await clicar('.barra-carrinho'); await w(1500); await p.keyboard.press('Escape'); await w(700);
    await clicar('.aba-secao >> nth=2'); await w(1500);
  }, { logado: false });
})();
