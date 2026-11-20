const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], url = 'http://127.0.0.1:8102/XXX_modulo_a/A3-H/';
  const b = await chromium.launch();
  for (const [w, h, nome, menu] of [[1440,900,'layout-1440.png'],[768,1024,'layout-768.png'],[375,812,'layout-375.png'],[375,812,'layout-375-menu-aberto.png',1]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } , reducedMotion: 'reduce'});
    await p.goto(url); await p.waitForTimeout(400);
    if (menu) { await p.click('.menu-botao'); await p.waitForTimeout(500); await p.screenshot({ path: out + '/' + nome }); }
    else await p.screenshot({ path: out + '/' + nome, fullPage: true });
    await p.close();
  }
  await b.close();
})();
