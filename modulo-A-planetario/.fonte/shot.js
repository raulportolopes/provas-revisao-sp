// node shot.js url out.png w h [hoverSelector] [waitms]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w, h, hov, wait] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(300);
  if (hov && hov !== '-') await p.hover(hov);
  await p.waitForTimeout(+(wait || 500));
  await p.screenshot({ path: out });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log('scrollWidth', sw, 'errors', errs);
  await b.close();
})();
