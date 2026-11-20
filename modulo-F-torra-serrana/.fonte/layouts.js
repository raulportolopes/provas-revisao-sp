// Layouts de referência (PNG) para a pasta assets/design: páginas inteiras em 1440/768/375 + estados.
// Uso: node layouts.js obs|cafe <saida>
const { chromium } = require('playwright');
const fs = require('fs');
const qual = process.argv[2], OUT = process.argv[3];
const CFG = {
  obs: { base: 'http://localhost:8801/XX_modulo_f/', tema: 'dark', pags: ['index', 'agenda', 'galeria'],
    estados: [
      ['index', 1440, 'index-1440-tema-claro', async (p) => { await p.evaluate(() => { document.documentElement.dataset.tema = 'claro'; }); }, true],
      ['index', 1440, 'estado-planeta-virado', async (p) => { await p.locator('.planeta:nth-child(3) .planeta__interno').scrollIntoViewIfNeeded(); await p.locator('.planeta:nth-child(3) .planeta__interno').click(); await p.mouse.move(5, 5); await p.waitForTimeout(1500); }],
      ['index', 1440, 'estado-grafico-hover', async (p) => { await p.locator('.numeros').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await p.locator('.legenda li:nth-child(2)').hover(); await p.waitForTimeout(800); await p.locator('.barra:nth-child(8)').hover(); await p.waitForTimeout(800); }],
      ['agenda', 1440, 'estado-modal-reserva', async (p) => { await p.click('.evento:nth-child(1) .evento__cabeca'); await p.waitForTimeout(700); await p.click('.evento:nth-child(1) [data-reservar]'); await p.waitForTimeout(500); await p.click('#form-reserva button[type="submit"]'); await p.waitForTimeout(800); }],
      ['galeria', 1440, 'estado-lightbox', async (p) => { await p.click('.foto:nth-child(2) .foto__botao'); await p.waitForTimeout(1200); }],
      ['index', 375, 'estado-menu-aberto-375', async (p) => { await p.click('.menu-botao'); await p.waitForTimeout(1000); }],
    ] },
  cafe: { base: 'http://localhost:8802/XX_modulo_f/', tema: 'light', pags: ['index', 'cafes', 'preparo'],
    estados: [
      ['index', 1440, 'estado-cartao-hover', async (p) => { await p.locator('#cafes-semana').scrollIntoViewIfNeeded(); await p.locator('#cafes-semana .cartao:nth-child(2)').hover(); await p.waitForTimeout(1600); }],
      ['index', 1440, 'estado-sacola-aberta', async (p) => { await p.locator('#cafes-semana').scrollIntoViewIfNeeded(); await p.click('#cafes-semana .cartao:nth-child(1) .botao-add'); await p.click('#cafes-semana .cartao:nth-child(1) .botao-add'); await p.click('#cafes-semana .cartao:nth-child(3) .botao-add'); await p.waitForTimeout(300); await p.click('.botao-sacola'); await p.waitForTimeout(1000); }],
      ['index', 1440, 'estado-clube-erros', async (p) => { await p.locator('.clube').scrollIntoViewIfNeeded(); await p.click('.interruptor [data-valor="anual"]'); await p.click('#form-clube button[type="submit"]'); await p.waitForTimeout(1200); }],
      ['cafes', 1440, 'estado-busca-vazia', async (p) => { await p.fill('#f-busca', 'xyz'); await p.waitForTimeout(800); }],
      ['preparo', 1440, 'estado-cronometro-rodando', async (p) => { await p.click('#aba-aeropress'); await p.locator('.cronometro').scrollIntoViewIfNeeded(); await p.click('#c-iniciar'); await p.waitForTimeout(6500); await p.click('#c-iniciar'); await p.waitForTimeout(500); }],
      ['index', 375, 'estado-sacola-375', async (p) => { await p.locator('#cafes-semana .cartao:nth-child(1) .botao-add').click(); await p.waitForTimeout(300); await p.click('.botao-sacola'); await p.waitForTimeout(1000); }],
    ] },
}[qual];
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const nova = async (w) => {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, timezoneId: 'America/Sao_Paulo', colorScheme: CFG.tema, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => localStorage.clear());
    return ctx;
  };
  const abrir = async (ctx, pg) => {
    const p = await ctx.newPage();
    await p.goto(CFG.base + pg + '.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => document.querySelectorAll('.revelar').forEach((e) => e.classList.add('visivel')));
    await p.waitForTimeout(2600);
    return p;
  };
  for (const w of [1440, 768, 375]) {
    const ctx = await nova(w);
    for (const pg of CFG.pags) {
      const p = await abrir(ctx, pg);
      fs.mkdirSync(`${OUT}/${pg}`, { recursive: true });
      await p.screenshot({ path: `${OUT}/${pg}/${pg}-${w}.png`, fullPage: true });
      await p.close(); console.log('ok', pg, w);
    }
    await ctx.close();
  }
  fs.mkdirSync(`${OUT}/estados`, { recursive: true });
  for (const [pg, w, nome, fn, inteira] of CFG.estados) {
    const ctx = await nova(w);
    const p = await abrir(ctx, pg);
    await fn(p);
    await p.screenshot({ path: `${OUT}/estados/${nome}.png`, fullPage: !!inteira });
    await ctx.close(); console.log('ok', nome);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
