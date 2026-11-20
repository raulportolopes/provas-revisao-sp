const { chromium } = require('playwright');
const B = process.argv[2] || 'http://localhost:8701/', OUT = process.argv[3] || '/tmp/claude-0/w/shots';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    const ctx = await b.newContext({ viewport: vp, timezoneId: 'America/Sao_Paulo' });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', vp.width, m.text()); });
    p.on('pageerror', e => console.log('PAGEERROR', vp.width, e.message));
    await p.goto(B + '#/agenda');
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/${vp.width}-entrar.png` });
    await p.fill('#email', 'aluno@pulso.com.br'); await p.fill('#senha', 'Pulso2026!');
    await p.click('[type=submit]');
    await p.waitForSelector('.aula:not(.aula--esqueleto)', { timeout: 8000 });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/${vp.width}-agenda.png`, fullPage: true });
    console.log(vp.width, 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth));
    await p.click('.aula [data-detalhes]'); await p.waitForSelector('.detalhe'); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${vp.width}-modal.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    for (const r of ['reservas', 'progresso', 'perfil']) {
      await p.goto(B + '#/' + r); await p.waitForTimeout(1600);
      await p.screenshot({ path: `${OUT}/${vp.width}-${r}.png`, fullPage: true });
      console.log(vp.width, r, 'scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth));
    }
    await ctx.close();
  }
  await b.close();
})();
