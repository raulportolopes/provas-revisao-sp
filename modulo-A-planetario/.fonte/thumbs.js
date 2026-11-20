// node thumbs.js <base_url> <pasta_sol>  → grava thumbs/<ID>.jpg (640x400)
const { chromium } = require('playwright'); const fs = require('fs');
const [BASE, SOL] = process.argv.slice(2);
const ids = ['A1-E','A2-M','A3-H','B1-E','B2-M','B3-H','C1-E','C2-M','C3-H'];
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(SOL + '/thumbs', { recursive: true });
  for (const id of ids) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    if (id.startsWith('C')) {
      const md = fs.readFileSync(`${SOL}/${id}/README.md`, 'utf8').split('\n').slice(0, 16).join('\n').replace(/[<>&]/g, '');
      await p.setContent(`<body style="margin:0;background:#0F172A;color:#E2E8F0;font:28px Consolas,monospace;padding:50px;white-space:pre-wrap">${md}</body>`);
    } else {
      await p.goto(BASE + id + '/'); await p.waitForTimeout(900);
      const hov = { 'A1-E': '.btn-orbita, .btn-add', 'A3-H': '.cartao--rosca' }[id];
      if (hov && await p.locator(hov).count()) { await p.hover(hov); await p.waitForTimeout(1500); }
    }
    await p.screenshot({ path: `/tmp/th-${id}.png` });
    await p.setViewportSize({ width: 640, height: 400 });
    await p.setContent(`<img src="data:image/png;base64,${fs.readFileSync('/tmp/th-' + id + '.png').toString('base64')}" style="width:640px;height:400px;display:block">`);
    await p.screenshot({ path: `${SOL}/thumbs/${id}.jpg`, type: 'jpeg', quality: 80 });
    await p.close();
  }
  await b.close();
})();
