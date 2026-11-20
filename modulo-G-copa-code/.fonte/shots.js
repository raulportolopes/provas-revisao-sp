// Gera os prints de layout e de estados do Copa Code a partir da solução.
// Uso: node shots.js <pasta_design>   (servidor da solução em localhost:8802, MySQL ligado)
const { chromium } = require('playwright');
const fs = require('fs');
const { preparar } = require('./torneio');
const OUT = process.argv[2]; const B = 'http://localhost:8802/#/';
fs.mkdirSync(OUT + '/estados', { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--lang=pt-BR'] });
  const ctx = await b.newContext({ timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });
  const nova = async (w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); return p; };
  const telas = { inicial: ['equipes', 'inscricao'], quartas: ['chaveamento', 'partidas/semis'] };
  for (const fase of ['inicial', 'quartas']) {
    await preparar(fase);
    for (const [w, h] of [[1440, 900], [768, 1024], [375, 812]]) {
      const p = await nova(w, h);
      for (const r of telas[fase]) {
        await p.goto(B + r); await p.waitForTimeout(1500);
        await p.screenshot({ path: `${OUT}/layout-${w}-${r.split('/')[0]}.png`, fullPage: w !== 375 });
      }
      await p.close();
    }
  }
  await preparar('inicial');
  const p = await nova(1440, 900);
  const s = async (n, full = false) => { await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/estados/${n}.png`, fullPage: full }); };
  const login = async () => { await p.click('text=Área da organização'); await p.fill('#l-usuario', 'org'); await p.fill('#l-senha', 'Copa@2026'); };
  await p.goto(B + 'equipes?status=confirmed&escola=2'); await p.waitForTimeout(900); await s('estado-01-filtros-na-url');
  await p.goto(B + 'equipes'); await p.waitForTimeout(800);
  await p.click('.equipe:has-text("Bits Voadores") .equipe__abrir'); await p.hover('.equipe:has-text("Lobos")'); await s('estado-02-acordeao-e-hover');
  await p.goto(B + 'inscricao'); await p.waitForTimeout(800);
  await p.click('button[type=submit]'); await s('estado-03-inscricao-erros');
  await p.fill('#f-nome', 'Cometa Azul'); await p.fill('#f-tag', 'cmt'); await p.selectOption('#f-escola', '6');
  const nomes = ['Lia Moraes', 'Davi Torres', 'Caio Ramos', 'Bia Lopes', 'Enzo Faria'];
  for (let i = 0; i < 5; i++) { await p.fill('#nick-' + i, 'cometa' + (i + 1)); await p.fill('#nome-' + i, nomes[i]); await p.fill('#nasc-' + i, `2010-0${i + 2}-1${i}`); }
  await p.click('#btn-reserva'); await p.fill('#nick-5', 'Mako54'); await p.fill('#nome-5', 'Rui Prado'); await p.fill('#nasc-5', '2014-01-01'); await p.locator('#nasc-5').blur();
  await p.locator('#nick-5').scrollIntoViewIfNeeded(); await s('estado-04-inscricao-reserva-e-idade');
  await p.fill('#nasc-5', '2009-01-01'); await p.click('button[type=submit]'); await p.waitForTimeout(400); await s('estado-05-nick-ja-inscrito');
  await p.fill('#nick-5', 'cometa6'); await p.click('button[type=submit]'); await p.waitForTimeout(900); await s('estado-06-inscricao-sucesso');
  await p.goto(B + 'equipes'); await p.waitForTimeout(800); await login(); await s('estado-07-login-organizacao');
  await p.click('.modal button:has-text("Entrar")'); await p.waitForTimeout(800); await s('estado-08-equipes-organizacao');
  await p.click('.equipe:has-text("Ipês") button:has-text("Excluir")'); await p.fill('#confirma-tag', 'ip'); await s('estado-09-excluir-exige-tag');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await preparar('chave'); await p.goto(B + 'chaveamento'); await p.reload(); await p.waitForTimeout(1200); await s('estado-10-chaveamento-gerado');
  await preparar('quartas'); await p.reload(); await p.waitForTimeout(1200);
  await p.hover('.chave__coluna--1 .lado >> nth=0'); await s('estado-11-caminho-da-equipe');
  await p.goto(B + 'partidas/semis'); await p.reload(); await p.waitForTimeout(900);
  await p.click('.partida button:has-text("Lançar placar") >> nth=0'); await s('estado-12-modal-placar');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await preparar('campea'); await p.goto(B + 'chaveamento'); await p.reload(); await p.waitForTimeout(1500); await s('estado-13-campea');
  await p.goto(B + 'partidas/final'); await p.reload(); await p.waitForTimeout(900); await s('estado-14-torneio-encerrado');
  await p.goto(B + 'chaveamento'); await p.waitForTimeout(1000);
  await p.click('button:has-text("Modo telão")'); await p.waitForTimeout(1200); await s('estado-15-modo-telao');
  await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
  await p.route('**/api/teams', (r) => r.fulfill({ status: 500, body: '{"message":"Erro no banco de dados."}' }));
  await p.goto(B + 'equipes'); await p.reload(); await p.waitForTimeout(900); await s('estado-16-erro-api');
  await preparar('inicial');
  await b.close();
})();
