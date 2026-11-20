// Verificações automáticas (Playwright) do Zela Bairro. Uso: node checar-zela.js http://IP/TEAM_X_modulo_g/index.html
// Rode com a carga inicial. Precisa de uma imagem /tmp/claude-0/r.png ou troque o caminho abaixo.
const { chromium } = require('playwright');
const B = process.argv[2] || 'http://localhost:8801/index.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => m.type()==='error' && erros.push(m.text()));
  const ok = (n, c) => console.log((c ? 'OK  ' : 'FALHA ') + n);
  await p.goto(B + '#/painel?categoria=1&atrasados=1'); await p.waitForTimeout(800);
  ok('URL restaura filtros', await p.locator('#f-categorias .chip--ativo').innerText() === 'Buraco na via' && await p.isChecked('#f-atrasados'));
  ok('filtro combinado = 1 card', await p.locator('.card').count() === 1);
  await p.click('#limpar-filtros').catch(()=>{}); await p.click('#f-categorias .chip[data-categoria=""]'); await p.uncheck('#f-atrasados');
  await p.fill('#f-busca', 'CALCADA'); await p.waitForTimeout(200);
  ok('busca sem acento = 3', await p.locator('.card').count() === 3);
  ok('busca na URL', p.url().includes('busca=CALCADA'));
  await p.fill('#f-busca', 'zzz'); ok('aviso vazio', await p.isVisible('#painel-vazio'));
  await p.click('#limpar-filtros');
  // detalhe
  await p.click('.card[data-id="1"] [data-detalhe]'); await p.waitForTimeout(300);
  ok('detalhe abre', await p.isVisible('#modal-detalhe') && (await p.locator('.linha__item').count()) === 3);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('Esc fecha e foco volta', !(await p.isVisible('#modal-detalhe')) && await p.evaluate(() => document.activeElement.closest('.card')?.dataset.id) === '1');
  // apoiar
  const antes = Number(await p.locator('.card[data-id="2"] .apoio__n').innerText());
  await p.click('.card[data-id="2"] [data-apoiar]'); await p.waitForTimeout(400);
  ok('apoio +1 e desabilita', Number(await p.locator('.card[data-id="2"] .apoio__n').innerText()) === antes + 1 && await p.isDisabled('.card[data-id="2"] [data-apoiar]'));
  // sem login não há Mover
  ok('sem login sem Mover', await p.locator('.mover').count() === 0);
  // login
  await p.click('#btn-equipe'); await p.fill('#l-usuario', 'marta'); await p.fill('#l-senha', 'errada'); await p.click('#form-login [type=submit]'); await p.waitForTimeout(300);
  ok('login errado mostra erro', (await p.locator('#e-login').innerText()).length > 0);
  await p.fill('#l-senha', 'Zela@2026'); await p.click('#form-login [type=submit]'); await p.waitForTimeout(500);
  ok('login ok mostra Mover', await p.locator('.mover').count() > 0);
  // mover 2 aberto -> triagem
  await p.click('.card[data-id="2"] .mover summary'); await p.click('.card[data-id="2"] [data-mover="triagem"]'); await p.click('#form-status [type=submit]'); await p.waitForTimeout(500);
  ok('moveu para triagem', await p.locator('.coluna--triagem .card[data-id="2"]').count() === 1);
  // cancelar sem nota
  await p.click('.card[data-id="9"] .mover summary'); await p.click('.card[data-id="9"] [data-mover="cancelado"]'); await p.click('#form-status [type=submit]'); await p.waitForTimeout(200);
  ok('cancelar exige nota', (await p.locator('#e-nota').innerText()).length > 0);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // arrastar 11 aberto -> execucao (proibido) e -> triagem
  await p.dragAndDrop('.card[data-id="11"]', '.coluna--execucao'); await p.waitForTimeout(300);
  ok('arrastar proibido não abre modal', !(await p.isVisible('#modal-status')));
  await p.dragAndDrop('.card[data-id="11"]', '.coluna--triagem'); await p.waitForTimeout(300);
  ok('arrastar permitido abre modal', await p.isVisible('#modal-status'));
  await p.click('#form-status [type=submit]'); await p.waitForTimeout(500);
  ok('card 11 em triagem', await p.locator('.coluna--triagem .card[data-id="11"]').count() === 1);
  // novo chamado
  await p.click('#btn-abrir'); await p.click('#n-enviar'); await p.waitForTimeout(200);
  ok('validação mostra 5 erros', (await p.locator('#form-novo .erro:not(:empty)').count()) === 5);
  await p.fill('#n-titulo', 'Placa de rua caída'); await p.selectOption('#n-categoria', '5');
  await p.fill('#n-descricao', 'A placa com o nome da rua caiu e está no chão da calçada.'); await p.fill('#n-rua', 'Rua Paineira, 200');
  await p.click('#mini-mapa', { position: { x: 200, y: 150 } });
  await p.setInputFiles('#n-foto', process.argv[3] || 'foto.png'); await p.waitForTimeout(300);
  ok('prévia da foto', await p.isVisible('#foto-previa'));
  await p.click('#n-enviar'); await p.waitForTimeout(700);
  const prot = await p.locator('#novo-protocolo').innerText();
  ok('protocolo ' + prot, /^ZB-\d{4}-\d{4}$/.test(prot));
  await p.click('#novo-sucesso [data-fechar]'); await p.waitForTimeout(300);
  ok('novo card em Aberto', await p.locator('.coluna--aberto .card', { hasText: 'Placa de rua caída' }).count() === 1);
  // tema
  await p.click('#btn-tema'); await p.reload(); await p.waitForTimeout(500);
  ok('tema escuro persiste', await p.evaluate(() => document.documentElement.dataset.tema) === 'escuro');
  // rotas
  await p.click('.menu a[data-rota="indicadores"]'); await p.waitForTimeout(1200);
  ok('link ativo + título', await p.getAttribute('.menu a[data-rota="indicadores"]', 'aria-current') === 'page' && (await p.title()).startsWith('Indicadores'));
  ok('KPI total 17', (await p.locator('.kpi__n').first().innerText()) === '17');
  await p.goto(B + '#/xyz'); await p.waitForTimeout(500); ok('rota desconhecida = painel', await p.isVisible('#tela-painel'));
  console.log('Erros de console:', erros.length ? erros : 'nenhum');
  await b.close();
})();
