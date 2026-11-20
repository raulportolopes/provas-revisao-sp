// Verificações automáticas de navegador do Copa Code (Playwright).
// Uso: node checar-copa.js http://IP/TEAM_X_modulo_g/   (banco recém-importado; o script altera os dados)
// Cada linha: OK ou FALHOU + o que foi verificado. Serve para comparar comportamento; a nota segue o Guia.
const { chromium } = require('playwright');
const B = (process.argv[2] || 'http://localhost/TEAM_X_modulo_g/').replace(/\/?$/, '/') + '#/';
let ok = 0, falhou = 0;
const conf = (cond, txt) => { cond ? ok++ : falhou++; console.log((cond ? 'OK      ' : 'FALHOU  ') + txt); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  const w = (ms) => p.waitForTimeout(ms);
  const tenta = async (fn) => { try { return await fn(); } catch (_) { return null; } };

  await p.goto(B + 'xyz'); await w(1200);
  conf(p.url().endsWith('#/equipes'), 'rota desconhecida vai para #/equipes');
  conf(await tenta(() => p.getAttribute('.menu a[href="#/equipes"]', 'aria-current')) === 'page', 'link Equipes com aria-current="page"');
  conf(/Equipes/.test(await p.title()), 'título da aba com o nome da tela');
  conf(await p.locator('.equipe').count() === 9, '9 equipes na carga inicial');

  await p.fill('input[type=search]', 'fenix'); await w(700);
  conf(await p.locator('.equipe').count() === 1, 'busca sem acento "fenix" acha 1 equipe');
  conf(await p.evaluate(() => document.activeElement.type === 'search'), 'foco continua na busca enquanto digita');
  conf(p.url().includes('busca=fenix'), 'busca gravada na URL');
  await p.goto(B + 'equipes?status=confirmed&escola=2'); await p.reload(); await w(1000);
  conf(await p.locator('.equipe').count() === 2, 'filtros vindos da URL (escola 2 + confirmadas = 2)');

  await p.goto(B + 'equipes'); await w(600);
  await p.locator('.equipe__abrir').nth(0).click(); await p.locator('.equipe__abrir').nth(1).click(); await w(400);
  conf(await p.locator('.equipe__abrir[aria-expanded="true"]').count() === 1, 'acordeão: só um aberto por vez');

  await p.goto(B + 'inscricao'); await w(800);
  await p.click('button[type=submit]'); await w(400);
  conf(await p.locator('[aria-invalid="true"]').count() >= 15, 'enviar vazio mostra todos os erros');
  conf(await p.evaluate(() => document.activeElement.getAttribute('aria-invalid') === 'true'), 'foco no primeiro campo inválido');
  await p.fill('#f-tag', 'c m t x z'); conf(await p.inputValue('#f-tag') === 'CMTX', 'tag em maiúsculas, sem espaço, até 4');
  conf(await p.locator('#f-escola option[disabled]').count() === 3, '3 escolas lotadas desabilitadas');
  await p.click('#btn-reserva'); await w(400);
  conf(await p.evaluate(() => document.activeElement.id === 'nick-5'), 'adicionar reserva leva o foco ao nick dela');
  await p.fill('#nasc-5', '2015-01-01'); await p.locator('#nasc-5').blur(); await w(200);
  conf(/14 a 19/.test(await p.textContent('#e-nasc-5')), 'idade fora de 14 a 19 em 28/11 é recusada');

  await p.click('button:has-text("Área da organização")'); await w(400);
  await p.fill('#l-usuario', 'org'); await p.fill('#l-senha', 'errada'); await p.click('.modal button:has-text("Entrar")'); await w(600);
  conf(/incorretos/.test(await p.textContent('.modal .erro')), 'login errado mostra o erro no modal');
  await p.fill('#l-senha', 'Copa@2026'); await p.click('.modal button:has-text("Entrar")'); await w(800);
  conf(await p.locator('text=Sair').count() === 1, 'login certo mostra "Sair"');
  await p.reload(); await w(900); conf(await p.locator('text=Sair').count() === 1, 'login mantido depois do F5');

  await p.goto(B + 'equipes'); await w(700);
  conf(await p.isDisabled('button:has-text("Gerar chaveamento")'), 'Gerar chaveamento desabilitado com 7');
  await p.click('.equipe:has-text("Ipês") button:has-text("Excluir")'); await w(400);
  await p.fill('#confirma-tag', 'IP'); conf(await p.isDisabled('.modal .btn--perigo'), 'excluir só habilita com a tag completa');
  await p.keyboard.press('Escape'); await w(400);
  conf(await p.evaluate(() => !document.querySelector('dialog[open]')), 'Esc fecha o modal');
  await p.click('.equipe:has-text("Sorocrew") button:has-text("Fazer check-in")'); await w(900);
  conf(await p.getAttribute('[role=progressbar]', 'aria-valuenow') === '8', 'check-in leva o progresso a 8');
  await p.click('button:has-text("Gerar chaveamento")'); await w(1200);
  conf(p.url().endsWith('#/chaveamento'), 'gerar vai para o chaveamento');
  const q1 = await tenta(() => p.locator('.chave__coluna--0 .partida-chave').first().innerText());
  conf(q1 && /28\/11\/2026 09:00/.test(q1) && /Fênix Rubra/.test(q1) && /Sorocrew/.test(q1), 'Q1 = Fênix Rubra × Sorocrew, 28/11/2026 09:00');

  await p.goto(B + 'partidas/quartas'); await w(900);
  const r1 = await p.textContent('.contagem__relogio'); await w(1300); const r2 = await p.textContent('.contagem__relogio');
  conf(r1 !== r2, 'contagem regressiva atualiza a cada segundo');
  await p.focus('#aba-quartas'); await p.keyboard.press('ArrowRight'); await w(500);
  conf(p.url().endsWith('#/partidas/semis') && await p.evaluate(() => document.activeElement.id === 'aba-semis'), 'seta → troca a aba, a rota e o foco');
  await p.goto(B + 'partidas/quartas'); await w(600);
  await p.locator('.partida button:has-text("Lançar placar")').first().click(); await w(400);
  conf(await p.locator('.opcao').count() === 4, 'modal de placar com 4 opções');
  await p.locator('.opcao').nth(1).click(); await w(900);
  await p.goto(B + 'chaveamento'); await w(900);
  conf(/Fênix Rubra/.test(await p.locator('.chave__coluna--1 .partida-chave').first().innerText()), 'vencedor da Q1 aparece na S1');

  await p.setViewportSize({ width: 375, height: 812 });
  for (const r of ['equipes', 'inscricao', 'chaveamento', 'partidas/quartas']) {
    await p.goto(B + r); await w(700);
    conf(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `375 px sem rolagem horizontal em #/${r}`);
  }
  conf(await p.evaluate(() => getComputedStyle(document.querySelector('.menu')).position === 'fixed'), '375 px: menu fixo embaixo');
  conf(erros.length === 0, 'nenhum erro de JavaScript no console' + (erros.length ? ': ' + erros[0] : ''));
  console.log(`\n${ok} OK, ${falhou} falharam`);
  await b.close();
})();
