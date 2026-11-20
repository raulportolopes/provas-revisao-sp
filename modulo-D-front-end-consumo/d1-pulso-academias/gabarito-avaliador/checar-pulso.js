// Testes automáticos da solução Pulso (Playwright). Uso: node checar-pulso.js http://localhost:8701/
const { chromium } = require('playwright');
const fs = require('fs');
const B = process.argv[2] || 'http://localhost:8701/';
let ok = 0, falhas = 0;
const t = (nome, cond, extra = '') => { cond ? ok++ : falhas++; console.log(`${cond ? 'PASSOU' : 'FALHOU'}  ${nome}${extra ? '  (' + extra + ')' : ''}`); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo' });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await p.request.post(B + 'api/index.php/reset');

  // 1. Guarda de rota, erros do login e volta ao destino
  await p.goto(B + '#/reservas'); await p.waitForTimeout(400);
  t('Sem token, rota interna vai para #/entrar', p.url().includes('#/entrar'));
  await p.click('[type=submit]'); await p.waitForSelector('#erro-email:not(:empty)');
  t('422 mostra erro embaixo do campo', (await p.textContent('#erro-email')).includes('Informe') && (await p.getAttribute('#email', 'aria-invalid')) === 'true');
  await p.fill('#email', 'aluno@pulso.com.br'); await p.fill('#senha', 'errada'); await p.click('[type=submit]');
  await p.waitForSelector('#erro-geral:not([hidden])');
  t('401 mostra aviso geral', (await p.textContent('#erro-geral')).includes('incorretos'));
  await p.fill('#senha', 'Pulso2026!'); await p.click('[type=submit]');
  await p.waitForURL(/#\/reservas/);
  t('Depois do login volta para o destino (#/reservas)', true);
  await p.waitForSelector('.reserva:not(.reserva--esqueleto)');
  t('Link ativo com aria-current', (await p.getAttribute('.menu a[data-rota=reservas]', 'aria-current')) === 'page' && (await p.$$('.menu a[aria-current]')).length === 1);
  t('Título da aba muda por rota', (await p.title()).startsWith('Minhas reservas'));
  await p.waitForFunction(() => document.querySelector('[data-qtd=historico]').textContent !== '–');
  const qtd = await p.textContent('[data-qtd=historico]');
  t('Contagens das abas vêm do meta.total', +qtd > 10, qtd);
  const api = await p.evaluate(async () => { const s = JSON.parse(localStorage.getItem('pulso.sessao')); return (await (await fetch('api/index.php/reservas', { headers: { Authorization: 'Bearer ' + s.token } })).json()).dados[0].criada_em; });
  const esperado = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(api));
  const reg = await p.textContent('.reserva .texto-pequeno');
  t('criada_em (UTC) exibida no horário de Brasília', reg.includes(esperado), `${api} -> ${reg.trim()}`);

  // 2. Agenda
  await p.click('.menu a[data-rota=agenda]'); await p.waitForSelector('.aula:not(.aula--esqueleto)');
  await p.focus('.dia[aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1300);
  const amanha = await p.getAttribute('.dia[aria-selected=true]', 'data-data');
  t('Seta → troca o dia (aba ARIA) e grava na URL', p.url().includes('data=' + amanha));
  await p.click('.chip[data-id="1"]'); await p.click('.chip[data-id="7"]'); await p.waitForTimeout(400); await p.waitForFunction(() => !document.querySelector('#lista[aria-busy]'));
  const mods = await p.$$eval('.aula__titulo', (els) => [...new Set(els.map((e) => e.textContent))]);
  t('Chips múltiplos filtram na API', mods.length > 0 && mods.every((m) => ['Bike Indoor', 'HIIT'].includes(m)), mods.join(','));
  t('URL guarda modalidades=1,7', /modalidades=1(%2C|,)7/.test(p.url()));
  await p.click('#limpar'); await p.waitForTimeout(1300);
  await p.type('#f-busca', 'yoga', { delay: 40 }); await p.waitForTimeout(1800);
  const t2 = await p.$$eval('.aula__titulo', (els) => els.map((e) => e.textContent));
  t('Busca com debounce mostra só o último resultado', (t2.length > 0 && t2.every((x) => x === 'Yoga')) || (await p.textContent('#contador')).includes('Nenhuma'), t2.join(','));
  await p.fill('#f-busca', ''); await p.waitForTimeout(1500);
  await p.click('#paginacao [data-pagina="2"]'); await p.waitForTimeout(1500);
  t('Paginação do servidor: página 2 ativa com aria-current', (await p.getAttribute('#paginacao .ativa', 'aria-current')) === 'page' && p.url().includes('pagina=2'));
  await p.reload(); await p.waitForSelector('.aula:not(.aula--esqueleto)'); await p.waitForTimeout(400);
  t('F5 restaura dia e página', (await p.textContent('#paginacao .ativa')).trim() === '2' && (await p.getAttribute('.dia[aria-selected=true]', 'data-data')) === amanha);

  // 3. Modal e reserva
  await p.click('#paginacao [data-pagina="1"]'); await p.waitForTimeout(1300);
  await p.check('#f-vagas'); await p.check('[name=periodo][value=noite]', { force: true }); await p.waitForTimeout(1500);
  await p.locator('.aula--livre [data-detalhes], .aula--alerta [data-detalhes]').first().focus(); await p.keyboard.press('Enter'); await p.waitForSelector('.detalhe');
  t('Modal: role=dialog, aria-modal e aria-labelledby', await p.$eval('.modal', (m) => m.getAttribute('role') === 'dialog' && m.getAttribute('aria-modal') === 'true' && !!document.getElementById(m.getAttribute('aria-labelledby'))));
  t('Modal trava rolagem do fundo', await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'));
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  t('Tab fica preso dentro do modal', await p.evaluate(() => document.querySelector('.modal').contains(document.activeElement)));
  await p.click('[data-acao=reservar]'); await p.waitForSelector('[data-acao=cancelar]');
  t('Reservar troca o botão para Cancelar reserva', true);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  t('Esc fecha e o foco volta ao botão que abriu', (await p.$$('.modal')).length === 0 && await p.evaluate(() => document.activeElement && 'detalhes' in document.activeElement.dataset));
  await p.waitForTimeout(1200);
  t('Card mostra "Reservada" sem recarregar a página', (await p.textContent('.grade-aulas')).includes('Reservada'));
  const r409 = await p.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem('pulso.sessao'));
    const h = { Authorization: 'Bearer ' + s.token, 'Content-Type': 'application/json' };
    const d = new URLSearchParams(location.hash.split('?')[1]).get('data');
    const l = await (await fetch('api/index.php/aulas?somente_vagas=1&por_pagina=30&data=' + d, { headers: h })).json();
    const c = [];
    for (const a of l.dados.slice(0, 4)) { const r = await fetch('api/index.php/reservas', { method: 'POST', headers: h, body: JSON.stringify({ aula_id: a.id }) }); c.push(r.status + ':' + ((await r.json()).codigo || '')); }
    return c.join(' ');
  });
  t('API devolve 409 com código (conflito/limite)', /409:(CONFLITO_HORARIO|LIMITE_DIARIO|JA_RESERVADA)/.test(r409), r409);

  // 4. Cancelar em Minhas reservas
  await p.goto(B + '#/reservas'); await p.waitForSelector('[data-cancelar]:not([disabled])');
  await p.waitForFunction(() => document.querySelector('[data-qtd=proximas]').textContent !== '–');
  const antes = +(await p.textContent('[data-qtd=proximas]'));
  await p.click('[data-cancelar]:not([disabled])'); await p.waitForSelector('.modal--pequeno');
  await p.click('.modal--pequeno [data-acao=sim]'); await p.waitForTimeout(2200);
  t('Cancelar atualiza contagem e lista', +(await p.textContent('[data-qtd=proximas]')) === antes - 1, `${antes} -> ${await p.textContent('[data-qtd=proximas]')}`);
  t('Toast anunciado em região aria-live', (await p.textContent('#toasts')).includes('cancelada'));

  // 5. Perfil
  await p.goto(B + '#/perfil'); await p.waitForSelector('#unidade_id option', { state: 'attached' });
  await p.fill('#telefone', '1199'); await p.click('#form-dados [type=submit]'); await p.waitForSelector('#erro-telefone:not(:empty)');
  t('PATCH 422 mostra erro do telefone', (await p.textContent('#erro-telefone')).includes('formato'));
  await p.fill('#telefone', ''); await p.type('#telefone', '11912345678');
  t('Máscara do telefone', (await p.inputValue('#telefone')) === '(11) 91234-5678');
  await p.fill('#nome', 'Duda Zanetti'); await p.click('#form-dados [type=submit]'); await p.waitForTimeout(1300);
  t('Salvar perfil atualiza o cabeçalho', (await p.textContent('#avatar-topo-nome')) === 'Duda');
  await p.setInputFiles('#arquivo', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(__dirname + '/../app/img/instrutores/1.jpg') });
  await p.waitForTimeout(1600);
  t('Upload da foto com FormData atualiza o avatar do topo', !!(await p.$('#avatar-topo-img img')));
  await p.setInputFiles('#arquivo', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
  t('Validação de tipo no navegador', (await p.textContent('#erro-foto')).includes('JPG'));
  await p.click('#ac-btn-3'); await p.waitForTimeout(400);
  t('Acordeão: um aberto por vez', (await p.$$('.acordeao [aria-expanded=true]')).length === 1 && (await p.getAttribute('#ac-btn-3', 'aria-expanded')) === 'true');
  await p.click('.opcao-tema--escuro'); await p.reload(); await p.waitForTimeout(800);
  t('Tema escuro persiste depois do F5', (await p.evaluate(() => document.documentElement.dataset.tema)) === 'escuro');

  // 6. Sessão expirada
  await p.evaluate(async () => { const s = JSON.parse(localStorage.getItem('pulso.sessao')); await fetch('api/index.php/sessao/expirar', { method: 'POST', headers: { Authorization: 'Bearer ' + s.token } }); });
  await p.goto(B + '#/progresso'); await p.waitForTimeout(1800);
  t('401 leva ao login com aviso de sessão expirada', p.url().includes('#/entrar?expirou=1') && (await p.textContent('main')).includes('expirou'));
  await p.fill('#email', 'aluno@pulso.com.br'); await p.fill('#senha', 'Pulso2026!'); await p.click('[type=submit]');
  await p.waitForURL(/#\/progresso/); await p.waitForSelector('.barra');
  t('Depois de entrar de novo, volta para #/progresso', true);
  t('Gráfico: 6 barras com aria-label', (await p.$$('.barra[aria-label]')).length === 6);
  const errosReais = erros.filter((e) => !/status of (401|409|422)/.test(e));
  t('Console sem erros de JavaScript', errosReais.length === 0, errosReais.join(' | '));
  console.log(`\n${ok} passaram, ${falhas} falharam`);
  await b.close();
})();
