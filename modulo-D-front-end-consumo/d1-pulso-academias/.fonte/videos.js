// Grava um vídeo por animação da solução Pulso. Uso: node videos.js <pasta_saida_webm> [base]
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const B = process.argv[3] || 'http://localhost:8701/';
fs.mkdirSync(OUT, { recursive: true });
const amanha = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

const OVERLAY = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;border-radius:50%;background:rgba(34,211,238,.55);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(229,25,63,.85)'; });
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(34,211,238,.55)'; });
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:110px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#15121F;color:#fff;font:700 22px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', End: 'Tecla End', Home: 'Tecla Home' };
    document.addEventListener('keydown', (e) => { if (!nomes[e.key]) return; k.textContent = (e.shiftKey && e.key === 'Tab' ? 'Shift + ' : '') + nomes[e.key]; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 800); }, true);
  });
};

async function gravar(nome, vp, fn, { logado = true, esquema = 'light' } = {}) {
  if (fs.existsSync(`${OUT}/${nome}.webm`)) return;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo', colorScheme: esquema });
  if (logado) {
    // entra antes de começar a gravar "de verdade" (a sessão fica no localStorage do contexto)
    const r = await ctx.request.post(B + 'api/index.php/login', { data: { email: 'aluno@pulso.com.br', senha: 'Pulso2026!' } });
    const j = await r.json();
    await ctx.addInitScript((s) => { if (!sessionStorage.getItem('ja')) { localStorage.setItem('pulso.sessao', s); sessionStorage.setItem('ja', 1); } }, JSON.stringify({ token: j.token, usuario: j.usuario }));
  }
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage();
  const w = (ms) => p.waitForTimeout(ms);
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); await p.locator(sel).first().click(); };
  const rolar = async (y) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await w(1100); };
  const ir = async (h, espera = 1400) => { await p.goto(B + h); await p.evaluate(() => document.fonts.ready); await w(espera); };
  await fn({ p, w, move, clicar, rolar, ir });
  await w(700);
  const v = p.video();
  await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/${nome}.webm`);
  fs.rmSync(OUT + '/tmp-' + nome, { recursive: true, force: true });
  console.log('ok', nome);
}

const D = { width: 1440, height: 900 };
const M = { width: 375, height: 812 };
const reset = async () => { const b = await chromium.launch(); const c = await b.newContext(); await c.request.post(B + 'api/index.php/reset'); await b.close(); };

(async () => {
  await reset();
  await gravar('01-login-carregando-e-erros', D, async ({ p, w, clicar }) => {
    await p.goto(B + '#/entrar'); await w(1200);
    await clicar('[type=submit]'); await w(1600);
    await clicar('#email'); await p.keyboard.type('aluno@pulso.com.br', { delay: 45 });
    await clicar('#senha'); await p.keyboard.type('senhaerrada', { delay: 45 });
    await clicar('#ver-senha'); await w(700); await clicar('#ver-senha'); await w(400);
    await clicar('[type=submit]'); await w(1800);
    await p.fill('#senha', ''); await p.keyboard.type('Pulso2026!', { delay: 45 });
    await clicar('[type=submit]'); await w(2200);
  }, { logado: false });

  await gravar('02-menu-e-link-ativo', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/agenda');
    for (const r of ['reservas', 'progresso', 'perfil']) { await move(`.menu a[data-rota="${r}"]`); await w(600); }
    for (const r of ['reservas', 'progresso', 'perfil', 'agenda']) { await clicar(`.menu a[data-rota="${r}"]`); await w(1300); }
    await move('#btn-tema'); await w(600); await move('#avatar-topo'); await w(800);
  });

  await gravar('03-abas-de-dias-com-teclado', D, async ({ p, w, clicar, ir }) => {
    await ir('#/agenda');
    await clicar('.dia:nth-child(3)'); await w(1500);
    await p.keyboard.press('ArrowRight'); await w(1400); await p.keyboard.press('ArrowRight'); await w(1400);
    await p.keyboard.press('ArrowLeft'); await w(1300); await p.keyboard.press('End'); await w(1500); await p.keyboard.press('Home'); await w(1500);
  });

  await gravar('04-filtros-busca-e-paginacao', D, async ({ p, w, clicar, ir }) => {
    await ir(`#/agenda?data=${amanha}`);
    await clicar('#f-busca'); await p.keyboard.type('marina', { delay: 140 }); await w(1700);
    await p.fill('#f-busca', ''); await w(1300);
    await clicar('.chip[data-id="1"]'); await w(1000); await clicar('.chip[data-id="7"]'); await w(1300);
    await clicar('.segmentado label:nth-of-type(4)'); await w(1300);
    await clicar('#f-vagas'); await w(1300);
    await clicar('#limpar'); await w(1300);
    await p.selectOption('#f-ordem', 'vagas'); await w(1400);
    await clicar('#paginacao [data-pagina="2"]'); await w(1800);
    await clicar('#paginacao [aria-label="Próxima página"]'); await w(1800);
    await clicar('#f-busca'); await p.keyboard.type('natação', { delay: 120 }); await w(1800);
  });

  await gravar('05-card-3d-e-brilho-no-cursor', D, async ({ p, w, ir }) => {
    await ir(`#/agenda?data=${amanha}`, 1800);
    for (const i of [0, 1, 2]) {
      const bx = await p.locator('.aula').nth(i).boundingBox();
      await p.mouse.move(bx.x + 20, bx.y + 30, { steps: 10 }); await w(200);
      await p.mouse.move(bx.x + bx.width - 20, bx.y + 60, { steps: 25 }); await w(200);
      await p.mouse.move(bx.x + bx.width - 30, bx.y + bx.height - 40, { steps: 25 }); await w(200);
      await p.mouse.move(bx.x + 30, bx.y + bx.height - 60, { steps: 25 }); await w(300);
    }
    await p.mouse.move(700, 160, { steps: 12 }); await w(800);
  });

  await gravar('06-modal-reservar-e-lista-de-espera', D, async ({ p, w, clicar, ir }) => {
    await ir(`#/agenda?data=${amanha}&periodo=noite&vagas=1`, 1800);
    await clicar('.aula--livre [data-detalhes], .aula--alerta [data-detalhes]'); await w(1600);
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); await w(450); }
    await clicar('[data-acao=reservar]'); await w(2200);
    await p.keyboard.press('Escape'); await w(1500);
    await ir(`#/agenda?data=${amanha}&periodo=noite`, 1800);
    if (await p.locator('.aula--lotada [data-detalhes]').count()) {
      await clicar('.aula--lotada [data-detalhes]'); await w(1500);
      await clicar('[data-acao=espera]'); await w(2000);
      await clicar('.modal__fechar'); await w(1300);
    }
    await clicar('.aula--livre [data-detalhes], .aula--alerta [data-detalhes]'); await w(1300);
    await clicar('[data-acao=reservar]'); await w(2000);
    await p.mouse.move(100, 500, { steps: 14 }); await p.mouse.click(100, 500); await w(1400);
  });

  await gravar('07-cancelar-com-confirmacao-e-toast', D, async ({ p, w, clicar, ir }) => {
    await ir('#/reservas', 1800);
    await clicar('[data-cancelar]:not([disabled])'); await w(1300);
    await clicar('.modal--pequeno [data-acao=nao]'); await w(1100);
    await clicar('[data-cancelar]:not([disabled])'); await w(1100);
    await clicar('.modal--pequeno [data-acao=sim]'); await w(3000);
  });

  await gravar('08-reservas-abas-e-paginacao', D, async ({ p, w, clicar, ir }) => {
    await ir('#/reservas', 1800);
    await clicar('#aba-historico'); await w(1600);
    await clicar('#paginacao [data-pagina="2"]'); await w(1500);
    await clicar('#aba-canceladas'); await w(1500);
    await p.keyboard.press('ArrowLeft'); await w(1500); await p.keyboard.press('ArrowLeft'); await w(1500);
  });

  await gravar('09-graficos-de-progresso', D, async ({ p, w, move, ir }) => {
    await ir('#/agenda', 900);
    await p.click('.menu a[data-rota=progresso]'); await w(2600);
    for (let i = 2; i <= 7; i++) { await move(`.barra:nth-child(${i})`, 10); await w(700); }
    await p.mouse.move(1100, 300, { steps: 12 }); await w(500);
    await p.locator('.barra').first().focus(); await w(500);
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); await w(700); }
  });

  await gravar('10-perfil-foto-mascara-e-erros', D, async ({ p, w, clicar, ir }) => {
    await ir('#/perfil');
    await p.evaluate(() => document.getElementById('soltar').classList.add('arrastando')); await w(1200);
    await p.evaluate(() => document.getElementById('soltar').classList.remove('arrastando'));
    await p.setInputFiles('#arquivo', __dirname + '/../app/img/instrutores/5.jpg'); await w(2200);
    await clicar('#telefone'); await p.fill('#telefone', ''); await p.keyboard.type('1198', { delay: 120 }); await w(400);
    await clicar('#form-dados [type=submit]'); await w(1800);
    await clicar('#telefone'); await p.fill('#telefone', ''); await p.keyboard.type('11987654321', { delay: 110 }); await w(600);
    await clicar('#form-dados [type=submit]'); await w(2400);
  });

  await gravar('11-tema-claro-escuro', D, async ({ p, w, clicar, ir }) => {
    await ir(`#/agenda?data=${amanha}`);
    await clicar('#btn-tema'); await w(1600); await clicar('#btn-tema'); await w(1300);
    await clicar('.menu a[data-rota=perfil]'); await w(1300);
    await clicar('.opcao-tema--escuro'); await w(1300); await clicar('.opcao-tema--auto'); await w(1300); await clicar('.opcao-tema--claro'); await w(1200);
  });

  await gravar('12-acordeao-regras', D, async ({ p, w, clicar, ir, rolar }) => {
    await ir('#/perfil'); await rolar(700);
    for (const i of [2, 3, 5, 5, 1]) { await clicar(`#ac-btn-${i}`); await w(1100); }
  });

  await gravar('13-sessao-expirada', D, async ({ p, w, clicar, ir }) => {
    await ir('#/reservas', 1600);
    await p.evaluate(async () => { const s = JSON.parse(localStorage.getItem('pulso.sessao')); await fetch('api/index.php/sessao/expirar', { method: 'POST', headers: { Authorization: 'Bearer ' + s.token } }); });
    await clicar('#aba-historico'); await w(2200);
    await clicar('#email'); await p.keyboard.type('aluno@pulso.com.br', { delay: 35 });
    await clicar('#senha'); await p.keyboard.type('Pulso2026!', { delay: 35 });
    await clicar('[type=submit]'); await w(2500);
  });

  await gravar('14-carregando-e-erro', D, async ({ p, w, clicar }) => {
    let falhar = true;
    await p.route('**/api/index.php/aulas?*', async (r) => {
      if (falhar) return r.fulfill({ status: 500, contentType: 'application/json', body: '{"mensagem":"Erro interno no servidor."}' });
      await new Promise((s) => setTimeout(s, 1800)); r.continue().catch(() => {});
    });
    await p.goto(B + '#/agenda'); await w(2600);
    falhar = false;
    await clicar('#tentar'); await w(3200);
  });

  await gravar('15-celular-375', M, async ({ p, w, clicar, ir, rolar }) => {
    await ir(`#/agenda?data=${amanha}`, 1800);
    await rolar(600); await rolar(1500);
    await clicar('.aula [data-detalhes]'); await w(1600);
    await p.evaluate(() => document.querySelector('.modal').scrollTo({ top: 600, behavior: 'smooth' })); await w(1400);
    await p.keyboard.press('Escape'); await w(1000);
    await clicar('.menu a[data-rota=reservas]'); await w(1500);
    await clicar('.menu a[data-rota=progresso]'); await w(2200); await rolar(500);
    await clicar('.menu a[data-rota=perfil]'); await w(1500);
  });
})();
