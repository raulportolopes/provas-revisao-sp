// Prints de layout, estados e vídeos (um por animação) da solução Órbita.
// Uso: node midia.js <pasta_design>   (servidor da solução em http://localhost:8765)
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const B = 'http://localhost:8765/index.html';
fs.mkdirSync(`${OUT}/estados`, { recursive: true });
fs.mkdirSync(`${OUT}/videos`, { recursive: true });

const OVERLAY = legenda => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;border-radius:50%;background:rgba(251,191,36,.6);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.body.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => (c.style.background = 'rgba(244,63,94,.85)'));
    document.addEventListener('mouseup', () => (c.style.background = 'rgba(251,191,36,.6)'));
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:110px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#fff;color:#111;font:700 22px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', ArrowUp: 'Tecla ↑', ArrowDown: 'Tecla ↓', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', ' ': 'Espaço', Home: 'Tecla Home', End: 'Tecla End' };
    document.addEventListener('keydown', e => { const n = (e.altKey ? 'Alt + ' : '') + (nomes[e.key] || ''); if (!nomes[e.key]) return; k.textContent = n; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 900); }, true);
    if (legenda) {
      const l = document.createElement('div');
      l.textContent = legenda;
      l.style.cssText = 'position:fixed;z-index:9999;left:12px;top:12px;max-width:70%;padding:6px 12px;border-radius:8px;background:rgba(0,0,0,.75);color:#FDE047;font:600 15px Arial;pointer-events:none';
      document.body.appendChild(l);
    }
  });
};

const D = { width: 1440, height: 900 }, T = { width: 768, height: 1024 }, M = { width: 375, height: 812 };
async function contexto(b, vp, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: 'dark', timezoneId: 'America/Sao_Paulo', ...extra });
  await ctx.addInitScript(() => sessionStorage.setItem('orbita:splash', '1'));
  return ctx;
}
async function ir(p, h) { await p.goto(B + h); await p.waitForFunction(() => !document.querySelector('#carregando')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900); }

async function prints() {
  const b = await chromium.launch();
  for (const [nome, vp] of [['1440', D], ['768', T], ['375', M]]) {
    const ctx = await contexto(b, vp); const p = await ctx.newPage();
    for (const [tela, h] of [['inicio', '#/inicio'], ['programacao', '#/programacao'], ['sessao', '#/sessao/9'], ['pagamento', null], ['reservas', '#/reservas'], ['ceu', '#/ceu']]) {
      if (nome === '768' && !['inicio', 'programacao', 'sessao'].includes(tela)) continue;
      if (tela === 'pagamento') {
        await ir(p, '#/sessao/9'); await p.click('.lugar[data-id="F4"]'); await p.click('.lugar[data-id="F5"]'); await p.click('#continuar'); await p.waitForTimeout(900);
      } else await ir(p, h);
      if (tela === 'inicio') { await p.click('.carrossel__pausa'); await p.mouse.move(5, 5); await p.waitForTimeout(800); }
      await p.mouse.move(2, vp.height - 2);
      await p.screenshot({ path: `${OUT}/layout-${nome}-${tela}.png`, fullPage: true });
    }
    await ctx.close();
  }
  // estados
  const ctx = await contexto(b, D); const p = await ctx.newPage();
  const est = async (n) => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/estados/${n}.png` }); };
  await ir(p, '#/programacao?data=2026-12-08&classif=L&ordem=preco-desc'); await est('estado-01-filtros-combinados');
  await ir(p, '#/programacao?busca=xyz'); await est('estado-02-sem-resultados');
  await ir(p, '#/programacao?genero=Ciência'); await p.click('#grade [data-detalhe] >> nth=1'); await est('estado-03-modal-detalhes');
  await p.keyboard.press('ArrowRight'); await est('estado-04-modal-seta-direita');
  await p.keyboard.press('Escape');
  await ir(p, '#/sessao/2'); for (const id of ['C8', 'C9', 'C11']) await p.click(`.lugar[data-id="${id}"]`); await p.click('#continuar'); await p.mouse.move(5, 5); await est('estado-05-lugar-isolado');
  await p.click('.lugar[data-id="C11"]'); await p.click('.interruptor'); await p.click('.lugar[data-id="H1"]'); await p.selectOption('[data-tipo="C8"]', 'meia'); await p.selectOption('[data-tipo="C9"]', 'meia'); await p.waitForTimeout(300); await est('estado-06-limite-de-meias');
  await p.click('#continuar'); await p.waitForTimeout(800);
  await p.click('button[type=submit]'); await p.mouse.move(5, 5); await est('estado-07-pagamento-erros');
  await p.fill('#c-nome', 'Eduardo Zanetti'); await p.type('#c-cpf', '52998224725'); await p.type('#c-celular', '11987654321'); await p.fill('#c-email', 'edu@exemplo.com'); await p.click('button[type=submit]');
  await p.check('[name=forma][value=cartao]'); await p.waitForTimeout(300); await p.type('#c-cartao', '4242424242424241'); await p.fill('#c-titular', 'EDUARDO ZANETTI'); await p.type('#c-validade', '1126'); await p.type('#c-cvv', '12'); await p.click('button[type=submit]'); await est('estado-08-cartao-invalido');
  await p.fill('#c-cartao', ''); await p.type('#c-cartao', '4242424242424242'); await p.fill('#c-validade', ''); await p.type('#c-validade', '0128'); await p.fill('#c-cvv', ''); await p.type('#c-cvv', '123'); await p.click('button[type=submit]'); await est('estado-09-revisao');
  await p.check('#c-aceite'); await p.click('button[type=submit]'); await p.waitForTimeout(600); await est('estado-10-reserva-confirmada');
  await p.click('[data-cancelar]'); await est('estado-11-confirmar-cancelamento');
  await p.click('[data-resp="sim"]'); await est('estado-12-cancelada-desfazer');
  await ir(p, '#/ceu?aba=constelacoes'); await p.click('#const-b1'); await est('estado-13-acordeao');
  await ir(p, '#/ceu'); await p.click('[data-planeta="3"]'); await p.waitForTimeout(1200); await p.hover('.barra:nth-child(12)'); await est('estado-14-grafico-hover');
  await ir(p, '#/xyz'); await est('estado-15-pagina-nao-encontrada');
  await p.route('**/api/sessoes.json', r => r.fulfill({ status: 500, body: '' }));
  await p.goto(B + '?simular-erro#/inicio'); await p.waitForTimeout(1500); await est('estado-16-erro-api');
  await ctx.close();
  const cl = await contexto(b, D, { colorScheme: 'light' }); const q = await cl.newPage();
  await ir(q, '#/programacao'); await q.mouse.move(2, 898); await q.screenshot({ path: `${OUT}/estados/estado-17-tema-claro.png` });
  await b.close();
}

async function gravar(nome, legenda, vp, fn, splash = false) {
  if (fs.existsSync(`${OUT}/videos/${nome}.webm`) || fs.existsSync(`${OUT}/videos/${nome}.mp4`)) return;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, colorScheme: 'dark', recordVideo: { dir: `${OUT}/videos/tmp-${nome}`, size: vp }, timezoneId: 'America/Sao_Paulo' });
  if (!splash) await ctx.addInitScript(() => sessionStorage.setItem('orbita:splash', '1'));
  await ctx.addInitScript(OVERLAY, legenda);
  const p = await ctx.newPage();
  const w = ms => p.waitForTimeout(ms);
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); const el = p.locator(sel).first(); try { await el.click({ timeout: 3000 }); } catch { await el.click({ force: true }); } };
  await fn({ p, w, move, clicar, ir: h => ir(p, h) });
  await w(700);
  const v = p.video(); await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/videos/${nome}.webm`);
  fs.rmSync(`${OUT}/videos/tmp-${nome}`, { recursive: true, force: true });
  console.log('video', nome);
}

async function videos() {
  await gravar('01-splash', 'Splash: barra e % juntas em 2,5 s, depois fade-out', D, async ({ p, w }) => { await p.goto(B); await w(4200); }, true);
  await gravar('02-carrossel', 'Carrossel: troca a cada 6 s, pausa no hover, setas, bolinhas, teclado', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/inicio'); await p.mouse.move(700, 850); await w(7000);
    await move('.carrossel__texto h2'); await w(1500);
    await clicar('[data-ir="1"]'); await w(1200); await clicar('[data-ir="-1"]'); await w(1200);
    await clicar('.carrossel__ponto >> nth=3'); await w(1200);
    await p.focus('.carrossel'); await p.keyboard.press('ArrowRight'); await w(1200); await p.keyboard.press('ArrowLeft'); await w(1200);
    await clicar('.carrossel__pausa'); await p.mouse.move(700, 860, { steps: 10 }); await w(2500); });
  await gravar('03-menu-e-transicao', 'Menu: trilha do link ativo, transição de tela, título da aba', D, async ({ w, move, clicar, ir }) => {
    await ir('#/inicio'); for (const r of ['programacao', 'reservas', 'ceu', 'inicio']) { await move(`.menu a[data-rota="${r}"]`); await w(400); }
    for (const r of ['programacao', 'reservas', 'ceu', 'inicio']) { await clicar(`.menu a[data-rota="${r}"]`); await w(1300); } });
  await gravar('04-cartao-3d-e-brilho', 'Card inclina na direção do cursor + reflexo; botão com luz que segue o cursor', D, async ({ p, w, move, ir }) => {
    await ir('#/programacao'); await w(600);
    const bx = await p.locator('.card-sessao').nth(1).boundingBox();
    for (const [fx, fy] of [[.15, .15], [.85, .2], [.85, .85], [.15, .8], [.5, .5]]) { await p.mouse.move(bx.x + bx.width * fx, bx.y + bx.height * fy, { steps: 22 }); await w(300); }
    await move('.card-sessao >> nth=2', 20); await w(800);
    const bt = await p.locator('.card-sessao >> nth=2 >> a.botao').boundingBox();
    for (const fx of [.1, .9, .3, .7]) { await p.mouse.move(bt.x + bt.width * fx, bt.y + bt.height / 2, { steps: 14 }); await w(250); }
    await p.mouse.move(5, 5, { steps: 20 }); await w(800); });
  await gravar('05-filtros-ordenacao-paginacao', 'Busca, dia, gênero, classificação, período, ordenação, paginação, URL e F5', D, async ({ p, w, clicar, ir }) => {
    await ir('#/programacao'); await clicar('#f-busca'); await p.keyboard.type('ceu', { delay: 150 }); await w(1300);
    for (let i = 0; i < 3; i++) await p.keyboard.press('Backspace'); await w(900);
    await clicar('#f-dias .chip[data-dia="2026-12-08"]'); await w(1100);
    await p.selectOption('#f-genero', 'Música imersiva'); await w(1100); await p.selectOption('#f-genero', ''); await w(800);
    await clicar('[name="classif"][value="L"]'); await w(1000);
    await clicar('.segmentado label:nth-child(4)'); await w(1100);
    await p.selectOption('#f-ordem', 'preco-desc'); await w(1300);
    await p.reload(); await p.waitForTimeout(1800);
    await clicar('#f-limpar'); await w(1000);
    await clicar('#paginacao button[data-pagina="2"]'); await w(1300); await clicar('#paginacao [aria-label="Próxima página"]'); await w(1300);
    await clicar('#f-busca'); await p.keyboard.type('xyz', { delay: 150 }); await w(1600); });
  await gravar('06-modal-detalhes', 'Modal: abre com transição, setas ← → navegam, fecha com Esc, X e fundo', D, async ({ p, w, clicar, ir }) => {
    await ir('#/programacao?genero=Ciência'); await clicar('#grade [data-detalhe] >> nth=0'); await w(1300);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft']) { await p.keyboard.press(k); await w(1100); }
    await clicar('#det-prox'); await w(900); await p.keyboard.press('Escape'); await w(1100);
    await clicar('#grade [data-detalhe] >> nth=1'); await w(1100); await clicar('.modal__fechar'); await w(1100);
    await clicar('#grade [data-detalhe] >> nth=2'); await w(1100); await p.mouse.move(60, 450, { steps: 14 }); await p.mouse.click(60, 450); await w(1200); });
  await gravar('07-mapa-de-lugares', 'Mapa: marcar, limite, acessível, meias, teclado, lugar isolado e cronômetro', D, async ({ p, w, clicar, ir }) => {
    await ir('#/sessao/2'); for (const id of ['C8', 'C9', 'C11']) { await clicar(`.lugar[data-id="${id}"]`); await w(500); }
    await clicar('#continuar'); await w(2200);
    await clicar('.lugar[data-id="C10"]'); await w(800);
    await p.selectOption('[data-tipo="C8"]', 'meia'); await w(700); await p.selectOption('[data-tipo="C9"]', 'meia'); await w(700); await p.selectOption('[data-tipo="C10"]', 'meia'); await w(1500);
    await clicar('.lugar[data-id="H1"]'); await w(1300); await clicar('.interruptor__trilho'); await w(700); await clicar('.lugar[data-id="H1"]'); await w(900);
    await p.focus('.lugar[data-id="D5"]'); for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft']) { await p.keyboard.press(k); await w(450); }
    await p.keyboard.press('Enter'); await w(800); await p.keyboard.press('ArrowRight'); await w(400); await p.keyboard.press(' '); await w(800);
    await clicar('.lugar[data-id="A1"]'); await w(1600); });
  await gravar('08-pagamento-3-passos', 'Pagamento: máscaras, validação, voltar mantém dados, Pix copiar, cartão, revisão', D, async ({ p, w, clicar, ir }) => {
    await ir('#/sessao/9'); await clicar('.lugar[data-id="F4"]'); await clicar('.lugar[data-id="F5"]'); await clicar('#continuar'); await w(1000);
    await clicar('button[type=submit]'); await w(1500);
    await clicar('#c-nome'); await p.keyboard.type('Eduardo Zanetti', { delay: 50 }); await clicar('#c-cpf'); await p.keyboard.type('52998224725', { delay: 90 });
    await clicar('#c-celular'); await p.keyboard.type('11987654321', { delay: 80 }); await clicar('#c-email'); await p.keyboard.type('edu@exemplo.com', { delay: 50 }); await w(500);
    await clicar('button[type=submit]'); await w(1000); await clicar('#copiar'); await w(1300);
    await clicar('#voltar'); await w(1300); await clicar('button[type=submit]'); await w(900);
    await clicar('[name=forma][value=cartao]'); await w(600);
    await clicar('#c-cartao'); await p.keyboard.type('4242424242424242', { delay: 60 }); await clicar('#c-titular'); await p.keyboard.type('EDUARDO ZANETTI', { delay: 40 });
    await clicar('#c-validade'); await p.keyboard.type('1126', { delay: 90 }); await clicar('#c-cvv'); await p.keyboard.type('123', { delay: 90 }); await clicar('button[type=submit]'); await w(1500);
    await p.fill('#c-validade', ''); await clicar('#c-validade'); await p.keyboard.type('0128', { delay: 90 }); await p.selectOption('#c-parcelas', '3'); await w(600); await clicar('button[type=submit]'); await w(1500);
    await clicar('button[type=submit]'); await w(1300); await clicar('#c-aceite'); await w(400); await clicar('button[type=submit]'); await w(2500); });
  await gravar('09-reservas-abas-cancelar', 'Reservas: abas com teclado, cancelar com confirmação, desfazer, baixar .json', D, async ({ p, w, clicar, ir }) => {
    await ir('#/sessao/9'); await p.click('.lugar[data-id="F7"]'); await p.click('#continuar'); await p.waitForTimeout(500);
    await p.evaluate(() => sessionStorage.setItem('orbita:checkout', JSON.stringify({ passo: 3, forma: 'pix', parcelas: 1, aceite: true, nome: 'Eduardo Zanetti', cpf: '529.982.247-25', email: 'edu@exemplo.com', celular: '(11) 98765-4321', carrinho: '9:F7inteira' })));
    await p.reload(); await p.waitForTimeout(1200); await p.click('button[type=submit]'); await w(1500);
    await clicar('#aba-encerradas'); await w(1000); await p.keyboard.press('ArrowRight'); await w(1000); await p.keyboard.press('ArrowLeft'); await w(800); await p.keyboard.press('Home'); await w(1000);
    await clicar('[data-cancelar]'); await w(1300); await clicar('[data-resp="nao"]'); await w(900);
    await clicar('[data-cancelar]'); await w(900); await clicar('[data-resp="sim"]'); await w(1500);
    await clicar('.aviso__acao'); await w(1500); await clicar('#exportar'); await w(1200); });
  await gravar('10-guia-do-ceu', 'Guia do céu: abas, barras em sequência, valor no hover, acordeão (um aberto)', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/ceu'); await w(1200); for (const i of [1, 3, 4]) { await clicar(`[data-planeta="${i}"]`); await w(1400); }
    for (const i of [3, 7, 12]) { await move(`.barra:nth-child(${i})`); await w(600); }
    await clicar('#tab-constelacoes'); await w(800); for (const i of [1, 3, 3, 4]) { await clicar(`#const-b${i}`); await w(900); }
    await p.keyboard.press('Shift+Tab'); await p.focus('#tab-constelacoes'); await p.keyboard.press('ArrowRight'); await w(1200); await p.keyboard.press('ArrowRight'); await w(1200);
    await clicar('#faq-b2'); await w(1200); });
  await gravar('11-tema-e-avisos', 'Tema claro/escuro com transição e persistência no F5', D, async ({ p, w, clicar, ir }) => {
    await ir('#/programacao'); await clicar('#botao-tema'); await w(1400); await p.reload(); await p.waitForTimeout(1600); await clicar('#botao-tema'); await w(1400); });
  await gravar('12-celular-375', 'Celular: barra inferior, filtros recolhidos, modal em folha, mapa rola sozinho', M, async ({ p, w, clicar, ir }) => {
    await ir('#/inicio'); await w(800); await p.mouse.wheel(0, 600); await w(1000);
    await clicar('.menu a[data-rota="programacao"]'); await w(1100); await clicar('.filtros__abrir'); await w(1000); await clicar('#f-dias .chip[data-dia="2026-12-09"]'); await w(900); await p.click('.filtros__abrir', { force: true }); await w(900);
    await clicar('#grade [data-detalhe] >> nth=0'); await w(1500); await p.keyboard.press('Escape'); await w(900);
    await p.locator('#grade a[href^="#/sessao/"]').first().click(); await w(1200); await p.evaluate(() => document.querySelector('.mapa-rolagem').scrollTo({ left: 400, behavior: 'smooth' })); await w(1300);
    await clicar('.menu a[data-rota="reservas"]'); await w(1300); await clicar('.menu a[data-rota="ceu"]'); await w(1500); });
}

(async () => {
  if (!process.argv[3] || process.argv[3] === 'prints') await prints();
  if (!process.argv[3] || process.argv[3] === 'videos') await videos();
})();
