// Fumaça: abre cada tela, coleta erros do console e tira prints rápidos (uso interno).
const { chromium } = require('playwright');
const B = process.argv[2] || 'http://localhost:8702/';
const OUT = process.argv[3] || '/tmp/claude-0/fumaca';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [nome, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 375, height: 812 }]]) {
    const c = await b.newContext({ viewport: vp });
    const p = await c.newPage();
    p.on('console', (m) => m.type() === 'error' && console.log(nome, 'CONSOLE', m.text()));
    p.on('pageerror', (e) => console.log(nome, 'PAGEERROR', e.message));
    const ir = async (h, w = 1500) => { await p.goto(B + h); await p.waitForTimeout(w); };
    const larg = async (t) => { const x = await p.evaluate(() => document.documentElement.scrollWidth); if (x > vp.width) console.log(nome, t, 'OVERFLOW', x); };
    await ir('#/'); await larg('inicio'); await p.screenshot({ path: `${OUT}/${nome}-inicio.png`, fullPage: true });
    await ir('#/restaurante/smash-do-bairro'); await larg('rest'); await p.screenshot({ path: `${OUT}/${nome}-rest.png`, fullPage: true });
    await p.locator('.item:not([disabled])').first().click(); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${nome}-modal.png` });
    await p.keyboard.press('Escape');
    await ir('#/entrar'); await p.fill('#email', 'cliente@sabor.com.br'); await p.fill('#senha', 'Sabor2026!'); await p.click('form .botao'); await p.waitForTimeout(1500);
    await ir('#/pedidos'); await larg('pedidos'); await p.screenshot({ path: `${OUT}/${nome}-pedidos.png`, fullPage: true });
    await ir('#/pedidos/1001'); await larg('pedido'); await p.screenshot({ path: `${OUT}/${nome}-pedido.png`, fullPage: true });
    await c.close();
  }
  await b.close();
})();
