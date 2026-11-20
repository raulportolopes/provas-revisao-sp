// Base para gravar vídeos de referência das animações (cursor visível e teclas na tela).
const { chromium } = require('playwright');
const fs = require('fs');

const OVERLAY = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:99999;width:22px;height:22px;border-radius:50%;background:rgba(255,214,0,.55);border:2px solid #fff;box-shadow:0 0 0 1px #000;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(255,60,60,.85)'; }, true);
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(255,214,0,.55)'; }, true);
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:99999;left:50%;bottom:60px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#fff;color:#111;font:700 24px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', ' ': 'Tecla Espaço', Home: 'Tecla Home', End: 'Tecla End' };
    document.addEventListener('keydown', (e) => { if (!nomes[e.key]) return; k.textContent = nomes[e.key]; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 800); }, true);
    // os vídeos mostram o diálogo por cima do overlay? Recoloca o cursor no top-layer quando um <dialog> abre
    new MutationObserver(() => {
      const d = document.querySelector('dialog[open]');
      if (d && !d.contains(c)) { d.appendChild(c); d.appendChild(k); c.style.position = k.style.position = 'fixed'; }
      if (!d && c.parentNode !== document.body) { document.body.appendChild(c); document.body.appendChild(k); }
    }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
  });
};

module.exports = function criarGravador(OUT, BASE, opcoes = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  return async function gravar(nome, vp, fn) {
    if (fs.existsSync(`${OUT}/${nome}.webm`)) return;
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo', colorScheme: opcoes.colorScheme || 'dark', hasTouch: !!vp.touch });
    await ctx.addInitScript(OVERLAY);
    if (opcoes.init) await ctx.addInitScript(opcoes.init);
    const p = await ctx.newPage();
    const w = (ms) => p.waitForTimeout(ms);
    const move = async (sel, steps = 16, fx = 0.5, fy = 0.5) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width * fx, bx.y + bx.height * fy, { steps }); };
    const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); await p.locator(sel).first().click(); };
    const rolar = async (y, ms = 1300) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await w(ms); };
    const rolarAte = async (sel, ms = 1300, off = 100) => { const y = await p.locator(sel).first().evaluate((e, off) => e.getBoundingClientRect().top + scrollY - off, off); await rolar(y, ms); };
    const ir = async (pg) => { await p.goto(BASE + pg, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); };
    await fn({ p, w, move, clicar, rolar, rolarAte, ir });
    await w(700);
    const v = p.video();
    await ctx.close(); await b.close();
    fs.renameSync(await v.path(), `${OUT}/${nome}.webm`);
    fs.rmSync(OUT + '/tmp-' + nome, { recursive: true, force: true });
    console.log('ok', nome);
  };
};
