// Prints de layout, estados e vídeos (um por animação) da solução Estúdio Pulso.
// Uso: node midia.js <pasta_design> [prints|videos]   (servidor da solução em http://localhost:8766)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const B = 'http://localhost:8766/index.html';
const SOL = path.join(__dirname, '..', 'sol');
const TMP = path.join(__dirname, '..', '.tmp');
fs.mkdirSync(`${OUT}/estados`, { recursive: true });
fs.mkdirSync(`${OUT}/videos`, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const OVERLAY = legenda => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;border-radius:50%;background:rgba(251,191,36,.6);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.body.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => (c.style.background = 'rgba(244,63,94,.85)'));
    document.addEventListener('mouseup', () => (c.style.background = 'rgba(251,191,36,.6)'));
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:110px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#fff;color:#111;font:700 22px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', ArrowUp: 'Tecla ↑', ArrowDown: 'Tecla ↓', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', ' ': 'Espaço', Home: 'Tecla Home', End: 'Tecla End' };
    document.addEventListener('keydown', e => { if (!nomes[e.key]) return; k.textContent = (e.altKey ? 'Alt + ' : '') + nomes[e.key]; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 900); }, true);
    if (legenda) {
      const l = document.createElement('div');
      l.textContent = legenda;
      l.style.cssText = 'position:fixed;z-index:9999;left:12px;top:12px;max-width:70%;padding:6px 12px;border-radius:8px;background:rgba(0,0,0,.75);color:#FDE047;font:600 15px Arial;pointer-events:none';
      document.body.appendChild(l);
    }
  });
};

// Reservas de exemplo para as telas da Minha área (paginação e filtros).
// Semana atual começa na segunda 07/12/2026; "agora" é terça 08/12 08:00.
function reservasExemplo() {
  const aulas = JSON.parse(fs.readFileSync(`${SOL}/api/aulas.json`, 'utf8'));
  const seg = [new Date(2026, 11, 7), new Date(2026, 11, 14)];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const res = []; const porDia = {};
  for (const s of seg) for (const a of aulas) {
    const d = new Date(s); d.setDate(d.getDate() + a.dia_semana - 1);
    const data = iso(d);
    if (data <= '2026-12-08' || a.inicio < '10:00') continue;
    if ((porDia[data] = (porDia[data] || 0)) >= 1 || res.length >= 9) continue;
    porDia[data]++;
    const cheia = a.inscritos >= a.capacidade;
    res.push({ aulaId: a.id, data, status: cheia ? 'espera' : 'confirmada', posicao: cheia ? a.lista_espera + 1 : 0, criadaEm: '2026-12-08T07:30:00' });
  }
  return res;
}

const D = { width: 1440, height: 900 }, T = { width: 768, height: 1024 }, M = { width: 375, height: 812 };
async function contexto(b, vp, { logado = false, reservas = false, extra = {} } = {}) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: 'dark', timezoneId: 'America/Sao_Paulo', ...extra });
  const r = reservas ? reservasExemplo() : [];
  await ctx.addInitScript(([logado, r]) => {
    if (sessionStorage.getItem('midia:pronto')) return;
    sessionStorage.setItem('midia:pronto', '1');
    localStorage.clear();
    if (r.length) localStorage.setItem('pulso:reservas', JSON.stringify(r));
  }, [logado, r]);
  const p = await ctx.newPage();
  if (logado) await entrar(p);
  return { ctx, p };
}
async function ir(p, h) {
  await p.goto(B + h);
  await p.waitForFunction(() => document.querySelector('main h1') || document.querySelector('.estado--erro'));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
}
async function entrar(p) {
  await ir(p, '#/entrar');
  await p.fill('#l-email', 'bia@pulso.com'); await p.fill('#l-senha', 'Pulso2026!');
  await p.click('button[type=submit]'); await p.waitForURL(/minha-area/); await p.waitForTimeout(800);
}
// a aula de terça 08/12 com o horário pedido (grade de desktop)
const aula = h => `.grade .aula[aria-label*="terça" i][aria-label*="${h} a"]`;

async function prints() {
  const b = await chromium.launch();
  for (const [nome, vp] of [['1440', D], ['768', T], ['375', M]]) {
    const telas = nome === '768' ? ['inicio', 'aulas', 'minha-area'] : ['inicio', 'aulas', 'planos', 'treino', 'entrar', 'minha-area'];
    for (const tela of telas) {
      const { ctx, p } = await contexto(b, vp, { logado: tela === 'minha-area', reservas: tela === 'minha-area' });
      if (tela === 'treino') {
        await ir(p, '#/treino');
        for (const n of ['Agachamento livre', 'Supino reto', 'Remada curvada', 'Prancha']) { const bt = p.getByRole('button', { name: 'Adicionar ' + n }); if (await bt.count()) await bt.click(); }
      } else await ir(p, '#/' + tela);
      await p.waitForTimeout(1600);
      await p.screenshot({ path: `${OUT}/layout-${nome}-${tela}.png`, fullPage: true });
      await ctx.close();
    }
  }

  // estados (1440)
  const { ctx, p } = await contexto(b, D, { reservas: false });
  const est = async n => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/estados/${n}.png` }); };
  await ir(p, '#/aulas'); await p.click('.chips .chip >> nth=0'); await p.click('.segmentado label >> nth=3'); await est('estado-01-filtros-na-url');
  await ir(p, '#/aulas'); await p.locator(aula('09:00')).first().click(); await est('estado-02-modal-aula-visitante');
  await p.keyboard.press('Escape');
  await ir(p, '#/minha-area'); await est('estado-03-guarda-redireciona-login');
  await p.click('button[type=submit]'); await est('estado-04-login-erros');
  await p.fill('#l-email', 'bia@pulso.com'); await p.fill('#l-senha', 'errada'); await p.click('button[type=submit]'); await est('estado-05-login-senha-errada');
  await p.fill('#l-senha', 'Pulso2026!'); await p.click('button[type=submit]'); await p.waitForURL(/minha-area/);
  await ir(p, '#/aulas'); await p.locator(aula('08:30')).first().click(); await p.waitForTimeout(500); await p.click('.aula-detalhe .botao'); await est('estado-06-reserva-confirmada');
  await est('estado-07-cancelamento-bloqueado-60min');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.locator(aula('09:00')).first().click(); await est('estado-08-conflito-de-horario');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.locator(aula('19:30')).first().click(); await p.waitForTimeout(500); await p.click('.aula-detalhe .botao'); await est('estado-08b-lista-de-espera');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.locator(aula('18:00')).first().click(); await p.waitForTimeout(500); await est('estado-09-limite-2-aulas-por-dia');
  await p.keyboard.press('Escape');
  await ir(p, '#/planos'); await p.click('[role=switch]'); await est('estado-10-planos-anual');
  await p.locator('.acordeao button >> nth=1').click(); await p.locator('.acordeao').scrollIntoViewIfNeeded(); await est('estado-11-faq-acordeao');
  await ir(p, '#/treino');
  for (const n of ['Agachamento livre', 'Supino reto', 'Remada curvada']) { const bt = p.getByRole('button', { name: 'Adicionar ' + n }); if (await bt.count()) await bt.click(); }
  await p.locator('.item-treino input[type=number] >> nth=0').fill('9'); await est('estado-12-treino-erro-series');
  fs.writeFileSync(`${TMP}/treino-invalido.json`, '{"formato":"errado"}');
  await p.setInputFiles('input[type=file]', `${TMP}/treino-invalido.json`); await est('estado-13-importar-invalido');
  await ir(p, '#/minha-area');
  const { execSync } = require('child_process');
  execSync(`python3 -c "from PIL import Image; Image.new('RGB',(120,120),(244,63,94)).save('${TMP}/foto-pequena.png'); Image.new('RGB',(400,400),(56,189,248)).save('${TMP}/foto-ok.png')"`);
  await p.setInputFiles('.perfil input[type=file]', `${TMP}/foto-pequena.png`); await est('estado-14-foto-pequena');
  await p.fill('#meta', '50'); await p.click('.meta__form button'); await est('estado-15-meta-invalida');
  await p.hover('.barra >> nth=5'); await est('estado-16-grafico-hover');
  await ir(p, '#/xyz'); await est('estado-17-pagina-nao-encontrada');
  await p.route('**/api/aulas.json', r => r.fulfill({ status: 500, body: '' }));
  await p.goto(B + '?simular-erro#/inicio'); await p.waitForTimeout(1500); await est('estado-18-erro-api');
  await ctx.close();
  const c2 = await contexto(b, D, { extra: { colorScheme: 'light' } });
  await ir(c2.p, '#/aulas'); await c2.p.click('.fonte button >> nth=2'); await c2.p.waitForTimeout(500);
  await c2.p.screenshot({ path: `${OUT}/estados/estado-19-tema-claro-texto-maior.png` });
  await c2.ctx.close();
  await b.close();
}

async function gravar(nome, legenda, vp, fn, { logado = false, reservas = false } = {}) {
  if (fs.existsSync(`${OUT}/videos/${nome}.webm`) || fs.existsSync(`${OUT}/videos/${nome}.mp4`)) return;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, colorScheme: 'dark', recordVideo: { dir: `${OUT}/videos/tmp-${nome}`, size: vp }, timezoneId: 'America/Sao_Paulo' });
  const r = reservas ? reservasExemplo() : [];
  await ctx.addInitScript(r => {
    if (sessionStorage.getItem('midia:pronto')) return;
    sessionStorage.setItem('midia:pronto', '1');
    localStorage.clear();
    if (r.length) localStorage.setItem('pulso:reservas', JSON.stringify(r));
  }, r);
  await ctx.addInitScript(OVERLAY, legenda);
  const p = await ctx.newPage();
  const w = ms => p.waitForTimeout(ms);
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); const el = p.locator(sel).first(); try { await el.click({ timeout: 3000 }); } catch { await el.click({ force: true }); } };
  if (logado) { await entrar(p); }
  await fn({ p, w, move, clicar, ir: h => ir(p, h) });
  await w(700);
  const v = p.video(); await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/videos/${nome}.webm`);
  fs.rmSync(`${OUT}/videos/tmp-${nome}`, { recursive: true, force: true });
  console.log('video', nome);
}

async function videos() {
  await gravar('01-inicio-hero-e-numeros', 'Início: hero entra, números contam ao aparecer na tela, cartões com hover', D, async ({ p, w, move, ir }) => {
    await ir('#/inicio'); await w(1800);
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 220); await w(450); }
    await move('.modalidade >> nth=0'); await w(700); await move('.modalidade >> nth=2'); await w(700); await move('.modalidade >> nth=4'); await w(900);
  });
  await gravar('02-carrossel-professores', 'Professores: setas, pontos, teclado ← → Home End e arrastar (scroll-snap)', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/inicio'); await move('.trilha'); await w(600);
    await clicar('[aria-label="Próximo professor"]'); await w(900); await clicar('[aria-label="Próximo professor"]'); await w(900);
    await clicar('.ponto >> nth=4'); await w(1000); await clicar('[aria-label="Professor anterior"]'); await w(900);
    await p.focus('.trilha'); for (const k of ['Home', 'ArrowRight', 'ArrowRight', 'End', 'ArrowLeft']) { await p.keyboard.press(k); await w(700); }
  });
  await gravar('03-menu-e-transicao', 'Menu: link ativo (também em /aulas/...), transição entre telas, foco vai para o título', D, async ({ w, clicar, ir }) => {
    await ir('#/inicio'); await w(600);
    for (const t of ['Aulas', 'Planos', 'Treino', 'Minha área', 'Início']) { await clicar(`.menu a:has-text("${t}")`); await w(1200); }
  });
  await gravar('04-grade-filtros-semanas', 'Grade: filtros combinados guardados na URL, só com vaga, trocar de semana, cartões entram e saem', D, async ({ p, w, clicar, ir }) => {
    await ir('#/aulas'); await w(900);
    await clicar('.chips .chip >> nth=1'); await w(900); await clicar('.chips .chip >> nth=4'); await w(900);
    await p.selectOption('.filtros-aulas select', { index: 2 }); await w(1000); await p.selectOption('.filtros-aulas select', { index: 0 }); await w(700);
    await clicar('.segmentado label >> nth=3'); await w(900); await clicar('.interruptor__trilho'); await w(1000);
    await clicar('[aria-label="Próxima semana"]'); await w(1100); await clicar('[aria-label="Próxima semana"]'); await w(1100);
    await clicar('[aria-label="Semana anterior"]'); await w(900); await clicar('.filtros-aulas .botao--texto'); await w(1200);
  });
  await gravar('05-modal-aula-e-reserva', 'Modal da aula: rota própria, foco preso, Esc fecha, reservar, lista de espera, limite por dia, cancelar', D, async ({ p, w, clicar, ir }) => {
    await ir('#/aulas'); await w(600);
    await clicar(aula('08:30')); await w(1200); await p.keyboard.press('Tab'); await w(400); await p.keyboard.press('Tab'); await w(400); await p.keyboard.press('Tab'); await w(500);
    await clicar('.aula-detalhe .botao'); await w(1500); await p.keyboard.press('Escape'); await w(900);
    await clicar(aula('09:00')); await w(1800); await p.keyboard.press('Escape'); await w(900);
    await clicar(aula('19:30')); await w(900); await clicar('.aula-detalhe .botao'); await w(1500); await p.keyboard.press('Escape'); await w(900);
    await clicar(aula('18:00')); await w(1800); await p.keyboard.press('Escape'); await w(900);
    await clicar(aula('19:30')); await w(900); await clicar('.aula-detalhe .botao'); await w(1500); await p.keyboard.press('Escape'); await w(900);
    await p.goBack(); await w(600); await p.goForward(); await w(1200);
  }, { logado: true });
  await gravar('06-login-e-guarda', 'Login: guarda leva ao /entrar?volta=..., validação, mostrar senha, volta para a tela pedida, sair', D, async ({ p, w, clicar, ir }) => {
    await ir('#/inicio'); await clicar('.menu a:has-text("Minha área")'); await w(1200);
    await clicar('button[type=submit]'); await w(1000);
    await clicar('#l-email'); await p.keyboard.type('bia@pulso', { delay: 70 }); await clicar('#l-senha'); await p.keyboard.type('123', { delay: 70 }); await clicar('button[type=submit]'); await w(1000);
    await p.fill('#l-email', ''); await clicar('#l-email'); await p.keyboard.type('bia@pulso.com', { delay: 50 });
    await p.fill('#l-senha', ''); await clicar('#l-senha'); await p.keyboard.type('Pulso2026!', { delay: 70 }); await clicar('.senha button'); await w(800);
    await clicar('button[type=submit]'); await w(1800); await clicar('.topo__acoes button:has-text("Sair")'); await w(1500);
  });
  await gravar('07-planos-e-faq', 'Planos: mensal/anual troca preço com animação, tabela comparativa, FAQ com um item aberto por vez', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/planos'); await w(800); await clicar('[role=switch]'); await w(1300); await clicar('[role=switch]'); await w(1100); await clicar('[role=switch]'); await w(1000);
    await move('.plano >> nth=1'); await w(800); await move('.plano >> nth=2'); await w(800);
    await move('.comparar'); await w(1000);
    for (const i of [0, 1, 1, 3]) { await clicar(`.acordeao button >> nth=${i}`); await w(900); }
  });
  await gravar('08-montar-treino', 'Treino: busca, grupos, adicionar, arrastar para reordenar, Alt + ↑/↓, validação, remover, exportar', D, async ({ p, w, clicar, ir }) => {
    await ir('#/treino'); await w(600);
    await clicar('.catalogo-ex .botao-redondo >> nth=0'); await w(500); await clicar('.catalogo-ex .botao-redondo >> nth=3'); await w(500);
    await clicar('.chips .chip >> nth=2'); await w(700); await clicar('.catalogo-ex .botao-redondo >> nth=0'); await w(500); await clicar('.chips .chip >> nth=0'); await w(500);
    await clicar('.painel input[type=search]'); await p.keyboard.type('prancha', { delay: 80 }); await w(700); await clicar('.catalogo-ex .botao-redondo >> nth=0'); await w(700);
    const a = p.locator('.item-treino .alca').nth(0); const d = p.locator('.item-treino').nth(2);
    const ba = await a.boundingBox(); const bd = await d.boundingBox();
    await p.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2, { steps: 12 }); await w(300);
    await a.dragTo(d, { targetPosition: { x: 40, y: bd.height - 6 } }); await w(1200);
    await p.locator('.item-treino .alca').nth(0).focus(); await p.keyboard.press('Alt+ArrowDown'); await w(800); await p.keyboard.press('Alt+ArrowDown'); await w(800); await p.keyboard.press('Alt+ArrowUp'); await w(900);
    await clicar('.item-treino input[type=number] >> nth=0'); await p.keyboard.press('Control+A'); await p.keyboard.type('9'); await w(1300); await p.keyboard.press('Control+A'); await p.keyboard.type('4'); await w(800);
    await clicar('.item-treino .remover >> nth=1'); await w(1100); await clicar('.painel__acoes button:has-text("Exportar")'); await w(1200);
  });
  await gravar('09-minha-area-graficos', 'Minha área: barras sobem uma a uma, rosca, anel da meta, valor no hover, filtro e paginação', D, async ({ p, w, move, clicar, ir }) => {
    await ir('#/inicio'); await w(400); await clicar('.menu a:has-text("Minha área")'); await w(2200);
    for (const i of [1, 4, 7]) { await move(`.barra >> nth=${i}`); await w(700); }
    await move('.rosca'); await w(800);
    await clicar('.meta__form input'); await p.keyboard.press('Control+A'); await p.keyboard.type('50'); await clicar('.meta__form button'); await w(1100);
    await p.keyboard.press('Control+A'); await clicar('.meta__form input'); await p.keyboard.press('Control+A'); await p.keyboard.type('10'); await clicar('.meta__form button'); await w(1300);
    await move('.minhas'); await w(600);
    await clicar('.paginacao button >> nth=2'); await w(900); await clicar('[aria-label="Próxima página"]'); await w(900);
    await clicar('[aria-pressed] >> text=Lista de espera'); await w(1000); await clicar('[aria-pressed] >> text=Todas'); await w(900);
  }, { logado: true, reservas: true });
  await gravar('10-foto-do-perfil', 'Foto: valida tipo, tamanho e dimensões, prévia antes de salvar, remover', D, async ({ p, w, move, clicar, ir }) => {
    const { execSync } = require('child_process');
    execSync(`python3 -c "from PIL import Image; Image.new('RGB',(120,120),(244,63,94)).save('${TMP}/foto-pequena.png'); Image.new('RGB',(400,400),(56,189,248)).save('${TMP}/foto-ok.png')"`);
    fs.writeFileSync(`${TMP}/nao-e-imagem.txt`, 'texto');
    await move('.perfil__botoes label'); await w(500);
    await p.setInputFiles('.perfil input[type=file]', `${TMP}/nao-e-imagem.txt`); await w(1300);
    await p.setInputFiles('.perfil input[type=file]', `${TMP}/foto-pequena.png`); await w(1300);
    await p.setInputFiles('.perfil input[type=file]', `${TMP}/foto-ok.png`); await w(1300);
    await clicar('.perfil__botoes button:has-text("Salvar")'); await w(1300);
    await move('.usuario'); await w(800); await clicar('.perfil__botoes button:has-text("Remover")'); await w(1300);
  }, { logado: true });
  await gravar('11-tema-e-tamanho-do-texto', 'Preferências: tema claro/escuro e A− A A+ (guardados no navegador)', D, async ({ p, w, clicar, ir }) => {
    await ir('#/aulas'); await w(600);
    await clicar('.botao-tema'); await w(1100); await clicar('.fonte button >> nth=2'); await w(1100); await clicar('.fonte button >> nth=0'); await w(1100);
    await clicar('.fonte button >> nth=1'); await w(700); await p.reload(); await w(1500); await clicar('.botao-tema'); await w(1100);
  });
  await gravar('12-celular-375', 'Celular: menu inferior, grade vira abas por dia (setas do teclado), modal em folha', M, async ({ p, w, clicar, ir }) => {
    await ir('#/inicio'); await w(800); await p.mouse.wheel(0, 700); await w(1000);
    await clicar('.menu a:has-text("Aulas")'); await w(1100);
    await clicar('.abas-dias [role=tab] >> nth=2'); await w(900);
    await p.keyboard.press('ArrowRight'); await w(700); await p.keyboard.press('ArrowRight'); await w(700); await p.keyboard.press('ArrowLeft'); await w(900);
    await clicar('.lista-dia .aula >> nth=0'); await w(1500); await p.keyboard.press('Escape'); await w(900);
    await clicar('.menu a:has-text("Planos")'); await w(1300); await p.mouse.wheel(0, 900); await w(1200);
  });
}

(async () => {
  if (!process.argv[3] || process.argv[3] === 'prints') await prints();
  if (!process.argv[3] || process.argv[3] === 'videos') await videos();
})();
