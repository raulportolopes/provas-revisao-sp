// node shots.js <baseURL> <pastaSaida> pagina1 pagina2 ...  -> full-page PNG em 1440/768/375 + erros de console
const { chromium } = require('playwright');
(async () => {
  const [base, out, ...pags] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const w of [1440, 768, 375]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'no-preference' });
    for (const pg of pags) {
      const p = await ctx.newPage();
      const erros = [];
      p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
      p.on('pageerror', e => erros.push(e.message));
      await p.goto(base + pg + '.html', { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      // força tudo visível para o print de página inteira
      await p.evaluate(() => document.querySelectorAll('.revelar').forEach(e => e.classList.add('visivel')));
      await p.waitForTimeout(1600);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      await p.screenshot({ path: `${out}/${pg}-${w}.png`, fullPage: true });
      console.log(pg, w, 'scrollWidth', sw, erros.length ? 'ERROS: ' + erros.join(' | ') : 'sem erros');
      await p.close();
    }
    await ctx.close();
  }
  await b.close();
})();
