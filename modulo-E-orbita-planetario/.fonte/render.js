const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const j of jobs) {
    await page.setViewportSize({ width: j.w, height: j.h });
    await page.goto('file://' + j.src);
    await page.evaluate(() => document.fonts.ready);
    const opt = { path: j.out, clip: { x: 0, y: 0, width: j.w, height: j.h } };
    if (j.out.endsWith('.jpg')) { opt.type = 'jpeg'; opt.quality = j.q || 82; } else { opt.omitBackground = !!j.transparent; }
    await page.screenshot(opt);
  }
  await browser.close();
})();
