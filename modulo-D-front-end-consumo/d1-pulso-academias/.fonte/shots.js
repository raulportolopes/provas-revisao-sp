// Prints de referência (design/) da solução Pulso. Uso: node shots.js <pasta_saida> [base]
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const B = process.argv[3] || 'http://localhost:8701/';
fs.mkdirSync(OUT + '/estados', { recursive: true });
const amanha = (() => { const d = new Date(Date.now() + 86400000); return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); })();
(async () => {
  const br = await chromium.launch();
  const erros = [];
  async function pg(w, h, esquema = 'light') {
    const c = await br.newContext({ viewport: { width: w, height: h }, timezoneId: 'America/Sao_Paulo', colorScheme: esquema });
    const p = await c.newPage();
    p.on('pageerror', (e) => erros.push(String(e)));
    return p;
  }
  async function entrar(p) {
    await p.goto(B + '#/entrar'); await p.fill('#email', 'aluno@pulso.com.br'); await p.fill('#senha', 'Pulso2026!');
    await p.click('[type=submit]'); await p.waitForURL(/#\/agenda/); await p.waitForTimeout(1500);
  }
  async function ir(p, hash, espera = 1700) { await p.goto(B + hash); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(espera); }
  const full = async (p, n) => { await p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); };
  const tela = async (p, n) => { await p.screenshot({ path: `${OUT}/estados/${n}.png` }); };

  await br.newContext().then(async (c) => { const p = await c.newPage(); await p.request.post(B + 'api/index.php/reset'); await c.close(); });

  // ---------- 1440 ----------
  let p = await pg(1440, 900);
  await ir(p, '#/entrar', 600); await full(p, 'layout-1440-entrar');
  await p.click('[type=submit]'); await p.waitForTimeout(1200); await tela(p, 'estado-01-login-erros-422');
  await p.fill('#email', 'aluno@pulso.com.br'); await p.fill('#senha', 'errada'); await p.click('[type=submit]'); await p.waitForTimeout(150);
  await tela(p, 'estado-02-login-entrando'); await p.waitForTimeout(1200); await tela(p, 'estado-03-login-401');
  await p.fill('#senha', 'Pulso2026!'); await p.click('[type=submit]'); await p.waitForURL(/#\/agenda/); await p.waitForTimeout(1500);
  await ir(p, `#/agenda?data=${amanha}`); await full(p, 'layout-1440-agenda');
  await ir(p, `#/agenda?data=${amanha}&modalidades=1,7&periodo=noite&vagas=1`); await tela(p, 'estado-04-filtros-combinados');
  await ir(p, `#/agenda?data=${amanha}&busca=natacao`); await tela(p, 'estado-05-sem-resultados');
  await p.route('**/api/index.php/aulas?*', async (r) => { await new Promise((s) => setTimeout(s, 4000)); r.continue().catch(() => {}); });
  await p.goto(B + `#/agenda?data=${amanha}&pagina=2`); await p.waitForTimeout(700); await tela(p, 'estado-06-carregando');
  await p.unroute('**/api/index.php/aulas?*');
  await p.route('**/api/index.php/aulas?*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"mensagem":"Erro interno no servidor."}' }));
  await p.goto(B + `#/agenda?data=${amanha}&ordem=vagas`); await p.waitForTimeout(1200); await tela(p, 'estado-07-erro-api');
  await p.unroute('**/api/index.php/aulas?*');
  await ir(p, `#/agenda?data=${amanha}&pagina=2`);
  const card = await p.locator('.aula').nth(1).boundingBox();
  await p.mouse.move(card.x + card.width * 0.8, card.y + card.height * 0.25, { steps: 8 }); await p.waitForTimeout(500); await tela(p, 'estado-08-card-3d-hover-pagina-2');
  await ir(p, `#/agenda?data=${amanha}&periodo=noite&vagas=1`);
  await p.locator('.aula--livre [data-detalhes], .aula--alerta [data-detalhes]').first().click(); await p.waitForSelector('[data-acao=reservar]'); await p.waitForTimeout(500);
  await tela(p, 'estado-09-modal-reservar');
  await p.click('[data-acao=reservar]'); await p.waitForSelector('[data-acao=cancelar]'); await p.waitForTimeout(400); await tela(p, 'estado-10-reservada-toast');
  await p.click('[data-acao=cancelar]'); await p.waitForSelector('.modal--pequeno'); await p.waitForTimeout(500); await tela(p, 'estado-11-confirmar-cancelamento');
  await p.click('.modal--pequeno [data-acao=nao]'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  // conflito: tenta outra aula no mesmo horário/dia
  await ir(p, `#/agenda?data=${amanha}&periodo=noite`);
  const lotada = p.locator('.aula--lotada [data-detalhes]');
  if (await lotada.count()) { await lotada.first().click(); await p.waitForSelector('[data-acao=espera]'); await p.waitForTimeout(500); await tela(p, 'estado-12-modal-lotada-espera'); await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
  const outras = p.locator('.aula--livre [data-detalhes], .aula--alerta [data-detalhes]');
  for (let i = 0; i < await outras.count(); i++) {
    await outras.nth(i).click(); await p.waitForSelector('.detalhe');
    const b = p.locator('[data-acao=reservar]');
    if (await b.count()) { await b.click(); await p.waitForTimeout(1200); if (await p.locator('.modal__mensagem:not([hidden])').count()) { await tela(p, 'estado-13-modal-conflito-409'); await p.keyboard.press('Escape'); break; } }
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  }
  await ir(p, '#/reservas'); await full(p, 'layout-1440-reservas');
  await ir(p, '#/reservas?aba=historico&pagina=2'); await tela(p, 'estado-14-reservas-historico-pagina-2');
  await ir(p, '#/progresso', 2600); await full(p, 'layout-1440-progresso');
  await p.hover('.barra:nth-child(4)'); await p.waitForTimeout(500); await tela(p, 'estado-15-progresso-balao');
  await ir(p, '#/perfil'); await full(p, 'layout-1440-perfil');
  await p.fill('#nome', 'Edu'); await p.fill('#telefone', '(11) 1234'); await p.click('#form-dados [type=submit]'); await p.waitForTimeout(1200); await tela(p, 'estado-16-perfil-erros-422');
  await p.evaluate(() => document.getElementById('soltar').classList.add('arrastando')); await p.waitForTimeout(300);
  await p.locator('#soltar').screenshot({ path: `${OUT}/estados/estado-17-arrastando-foto.png` });
  await p.evaluate(() => document.getElementById('soltar').classList.remove('arrastando'));
  await p.click('#ac-btn-3'); await p.waitForTimeout(600); await p.locator('.perfil__regras').screenshot({ path: `${OUT}/estados/estado-18-acordeao.png` });
  await p.close();

  // escuro
  p = await pg(1440, 900, 'dark'); await entrar(p);
  await ir(p, `#/agenda?data=${amanha}`); await tela(p, 'estado-19-tema-escuro-agenda');
  await ir(p, '#/progresso', 2600); await tela(p, 'estado-20-tema-escuro-progresso');
  // sessão expirada
  await p.evaluate(async () => { const s = JSON.parse(localStorage.getItem('pulso.sessao')); await fetch('api/index.php/sessao/expirar', { method: 'POST', headers: { Authorization: 'Bearer ' + s.token } }); });
  await ir(p, '#/reservas'); await tela(p, 'estado-21-sessao-expirada');
  await p.close();

  // ---------- 768 ----------
  p = await pg(768, 1024); await entrar(p);
  await ir(p, `#/agenda?data=${amanha}`); await full(p, 'layout-768-agenda');
  await ir(p, '#/progresso', 2600); await full(p, 'layout-768-progresso');
  await p.close();

  // ---------- 375 ----------
  p = await pg(375, 812);
  await ir(p, '#/entrar', 600); await full(p, 'layout-375-entrar');
  await entrar(p);
  await ir(p, `#/agenda?data=${amanha}`); await full(p, 'layout-375-agenda');
  for (const r of ['reservas', 'progresso', 'perfil']) { await ir(p, '#/' + r, r === 'progresso' ? 2600 : 1700); await full(p, `layout-375-${r}`); }
  await ir(p, `#/agenda?data=${amanha}`); await p.locator('[data-detalhes]').first().click(); await p.waitForTimeout(1300); await tela(p, 'estado-22-modal-375');
  await p.close();
  await br.close();
  console.log('erros:', erros);
})();
