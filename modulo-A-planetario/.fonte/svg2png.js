// Uso: node svg2png.js jobs.json  — cada job {svg, out, w, h, transparent}
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage();
  for (const j of jobs) {
    await p.setViewportSize({ width: j.w, height: j.h });
    await p.setContent(`<html><body style="margin:0;background:transparent">${j.svg}</body></html>`);
    const o = { path: j.out, clip: { x: 0, y: 0, width: j.w, height: j.h }, omitBackground: !!j.transparent };
    if (j.out.endsWith('.jpg')) { o.type = 'jpeg'; o.quality = j.q || 85; delete o.omitBackground; }
    await p.screenshot(o);
  }
  await b.close();
})();
