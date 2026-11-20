// Extrai os textos visíveis de cada página (com os dados já carregados) para design/<pagina>/textos.txt
const { chromium } = require('playwright'); const fs = require('fs');
const [base, out, ...pags] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const pg of pags) {
    await p.goto(base + pg + '.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const t = await p.evaluate(() => {
      const fora = ['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'];
      const linhas = [];
      const andar = (el) => {
        if (fora.includes(el.tagName?.toUpperCase())) return;
        if (el.nodeType === 3) { const s = el.textContent.replace(/\s+/g, ' ').trim(); if (s) linhas.push(s); return; }
        if (el.nodeType !== 1) return;
        if (el.getAttribute('aria-hidden') === 'true') return;
        if (el.tagName === 'DIALOG' || el.matches('.gaveta, .aviso')) return;
        el.childNodes.forEach(andar);
        if (/^(P|H1|H2|H3|H4|LI|A|BUTTON|LABEL|SUMMARY|DT|DD|TD|TH|SPAN|OPTION)$/.test(el.tagName)) linhas.push('\n');
      };
      andar(document.body);
      return linhas.join(' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
    });
    fs.writeFileSync(`${out}/${pg}/textos.txt`, `Textos da página ${pg}.html, na ordem em que aparecem (dados do JSON incluídos).\n\n` + t + '\n');
    console.log('ok', pg);
  }
  await b.close();
})();
