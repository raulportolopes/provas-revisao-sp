// Gera os prints de layout e de estados do Zela Bairro a partir da solução.
// Uso: node shots.js <pasta_design> <foto.jpg>  (servidor da solução em localhost:8801, dados resetados)
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2]; const B = 'http://localhost:8801/index.html';
fs.mkdirSync(OUT + '/estados', { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId: 'America/Sao_Paulo' });
  const nova = async (w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); return p; };
  for (const [w, h] of [[1440, 900], [768, 1024], [375, 812]]) {
    const p = await nova(w, h);
    for (const r of ['painel', 'mapa', 'indicadores']) {
      await p.goto(B + '#/' + r); await p.waitForTimeout(1600);
      await p.screenshot({ path: `${OUT}/layout-${w}-${r}.png`, fullPage: w !== 375 });
    }
    await p.close();
  }
  const p = await nova(1440, 900);
  const s = async (n) => { await p.waitForTimeout(450); await p.screenshot({ path: `${OUT}/estados/${n}.png` }); };
  await p.goto(B + '#/painel?categoria=1&atrasados=1'); await s('estado-01-filtros-na-url');
  await p.goto(B + '#/painel'); await p.waitForTimeout(800);
  await p.hover('.card[data-id="4"]'); await s('estado-02-card-hover');
  await p.click('.card[data-id="1"] [data-detalhe]'); await s('estado-03-detalhe-historico');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('#btn-abrir'); await p.click('#n-enviar'); await s('estado-04-novo-erros');
  await p.fill('#n-titulo', 'Placa de rua caída'); await p.selectOption('#n-categoria', '5');
  await p.fill('#n-descricao', 'A placa com o nome da rua caiu e está no chão da calçada.'); await p.fill('#n-rua', 'Rua Paineira, 200');
  await p.click('#mini-mapa', { position: { x: 250, y: 140 } });
  await p.setInputFiles('#n-foto', process.argv[3]);
  await p.evaluate(() => document.getElementById('modal-novo').scrollTo(0, 999)); await s('estado-05-novo-preenchido-foto');
  await p.click('#n-enviar'); await p.waitForTimeout(900); await s('estado-06-novo-sucesso');
  await p.click('#novo-sucesso [data-fechar]'); await p.waitForTimeout(400);
  await p.click('#btn-equipe'); await p.fill('#l-usuario', 'marta'); await p.fill('#l-senha', 'Zela@2026'); await s('estado-07-login-equipe');
  await p.click('#form-login [type=submit]'); await p.waitForTimeout(500);
  await p.click('.card[data-id="12"] .mover summary'); await s('estado-08-menu-mover');
  await p.click('.card[data-id="12"] [data-mover="cancelado"]'); await p.waitForSelector('#modal-status[open]'); await p.waitForTimeout(400);
  await p.click('#form-status [type=submit]'); await s('estado-09-cancelar-exige-nota');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => { const c = document.querySelector('.card[data-id="2"]'); c.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() })); document.querySelector('.coluna--triagem').classList.add('coluna--sobre'); });
  await s('estado-10-arrastando-colunas-permitidas');
  await p.evaluate(() => document.querySelector('.card[data-id="2"]').dispatchEvent(new DragEvent('dragend', { bubbles: true })));
  await p.click('.menu a[data-rota="mapa"]'); await p.waitForTimeout(900); await p.hover('#pinos .pino[data-id="6"]'); await s('estado-11-mapa-pino-destacado');
  await p.click('#btn-tema'); await p.click('.menu a[data-rota="indicadores"]'); await p.waitForTimeout(1500); await s('estado-12-tema-escuro-indicadores');
  await p.click('.menu a[data-rota="painel"]'); await p.waitForTimeout(800); await s('estado-13-tema-escuro-painel');
  await p.click('#btn-tema');
  await p.route('**/api/chamados', r => r.fulfill({ status: 500, body: '{"mensagem":"Erro interno"}' }));
  await p.reload(); await p.waitForTimeout(800); await s('estado-14-erro-api');
  await b.close();
})();
