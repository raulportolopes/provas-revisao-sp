// Apoio ao avaliador — Módulo F Observatório Estrela da Serra.
// Uso: node checar-observatorio.js http://servidor/XX_modulo_f/
// Confere as interações que dá para medir por script. NÃO substitui o roteiro: use como evidência.
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:8801/XX_modulo_f/').replace(/\/?$/, '/');
const res = [];
const ok = (nome, cond, extra = '') => { res.push(`${cond ? 'OK   ' : 'FALHA'} ${nome}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo', colorScheme: 'dark' });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

  // ---------- INÍCIO ----------
  await p.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  ok('Cabeçalho fixo', await p.$eval('header', (h) => getComputedStyle(h).position === 'fixed'));
  ok('Cabeçalho com backdrop-filter', await p.$eval('header', (h) => getComputedStyle(h).backdropFilter !== 'none'));
  ok('Um único link com aria-current="page"', (await p.$$('nav a[aria-current="page"]')).length === 1);

  // lanterna: --x/--y mudam com o mouse
  await p.mouse.move(300, 300); await p.waitForTimeout(100);
  await p.mouse.move(1000, 500, { steps: 8 }); await p.waitForTimeout(600);
  const xy = await p.$eval('.hero__constelacoes', (e) => getComputedStyle(e).getPropertyValue('--x') + ' ' + getComputedStyle(e).getPropertyValue('--y'));
  ok('Lanterna segue o cursor (--x/--y)', xy.trim().startsWith('1000px'), xy);

  // contagem
  const c1 = await p.$eval('[data-unidade="segundos"]', (e) => e.textContent);
  await p.waitForTimeout(1200);
  const c2 = await p.$eval('[data-unidade="segundos"]', (e) => e.textContent);
  ok('Contagem regressiva atualiza a cada segundo', c1 !== c2, `${c1} → ${c2}`);

  // flip por teclado
  const cart = p.locator('.planeta__interno').first();
  await cart.scrollIntoViewIfNeeded(); await p.mouse.move(5, 5);
  await cart.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  const tr = await cart.evaluate((e) => getComputedStyle(e).transform);
  ok('Cartão do planeta vira pelo teclado (Enter)', tr !== 'none' && tr.includes('-1'), tr);

  // gráfico de barras
  await p.locator('.grafico-barras').scrollIntoViewIfNeeded(); await p.waitForTimeout(2200);
  const alt = await p.$eval('.barra:nth-child(7) .barra__coluna', (e) => getComputedStyle(e).transform);
  ok('Barras crescem ao aparecer (scaleY = --v)', alt.includes('0.95'), alt);
  await p.hover('.barra:nth-child(7)'); await p.waitForTimeout(400);
  const op = await p.$eval('.barra:nth-child(1) .barra__coluna', (e) => getComputedStyle(e).opacity);
  const dica = await p.$eval('.barra:nth-child(7) .barra__dica', (e) => getComputedStyle(e).opacity);
  ok('Hover na barra mostra a dica e apaga as outras', op === '0.3' && dica === '1', `opacidade outra=${op} dica=${dica}`);
  await p.hover('.legenda li:nth-child(2)'); await p.waitForTimeout(400);
  const f2 = await p.$eval('.fatia:nth-child(2)', (e) => getComputedStyle(e).opacity);
  const f1 = await p.$eval('.fatia:nth-child(1)', (e) => getComputedStyle(e).opacity);
  ok('Hover na legenda destaca a fatia da rosca', f2 === '1' && Number(f1) < 0.5, `fatia2=${f2} fatia1=${f1}`);

  // comparador
  await p.locator('.comparador').scrollIntoViewIfNeeded();
  await p.focus('.comparador__controle');
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
  const pos = await p.$eval('.comparador', (e) => e.style.getPropertyValue('--pos'));
  ok('Comparador funciona pelo teclado', pos === '60%', pos);

  // tema
  await p.click('.tema-botao');
  const tema = await p.evaluate(() => [document.documentElement.dataset.tema, localStorage.getItem('oes-tema')].join('/'));
  ok('Botão de tema troca e salva no localStorage', tema === 'claro/claro', tema);
  await p.goto(BASE + 'galeria.html', { waitUntil: 'networkidle' });
  ok('Tema persiste ao trocar de página', (await p.evaluate(() => document.documentElement.dataset.tema)) === 'claro');
  await p.click('.tema-botao');

  // ---------- GALERIA ----------
  ok('Galeria com 9 fotos', (await p.$$('.foto')).length === 9);
  await p.click('.chip[data-categoria="nebulosas"]');
  ok('Filtro Nebulosas = 2 fotos', (await p.$$('.foto')).length === 2);
  await p.click('.chip[data-categoria=""]');
  const card = p.locator('.foto__botao').nth(1);
  const bx = await card.boundingBox();
  await p.mouse.move(bx.x + bx.width * 0.9, bx.y + bx.height * 0.1, { steps: 6 }); await p.waitForTimeout(300);
  const t = await card.evaluate((e) => [e.style.getPropertyValue('--rx'), e.style.getPropertyValue('--ry')].join(' '));
  ok('Tilt 3D: canto superior direito inclina (rx>0, ry>0)', /^\d.*deg \d.*deg$/.test(t), t);
  await card.click(); await p.waitForTimeout(500);
  ok('Lightbox abre', await p.$eval('#lightbox', (d) => d.open));
  const cont1 = await p.textContent('#lb-contador');
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
  const cont2 = await p.textContent('#lb-contador');
  ok('Setas trocam a foto de forma circular', cont1 === '2 de 9' && cont2 === '9 de 9', `${cont1} → ${cont2}`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('Esc fecha e o foco volta ao cartão', !(await p.$eval('#lightbox', (d) => d.open)) && (await p.evaluate(() => document.activeElement.classList.contains('foto__botao'))));

  // ---------- AGENDA ----------
  await p.goto(BASE + 'agenda.html', { waitUntil: 'networkidle' });
  ok('Dezembro com 5 atividades', (await p.$$('.evento')).length === 5);
  await p.focus('.aba[aria-selected="true"]'); await p.keyboard.press('ArrowRight');
  ok('Seta → muda para Janeiro (4)', (await p.getAttribute('.aba[aria-selected="true"]', 'data-mes')) === '2027-01' && (await p.$$('.evento')).length === 4);
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
  ok('Seta ← circular vai para Fevereiro', (await p.getAttribute('.aba[aria-selected="true"]', 'data-mes')) === '2027-02');
  await p.click('.aba[data-mes="2026-12"]');
  await p.click('.chip[data-tipo="oficina"]');
  ok('Filtro Oficina em dezembro = 2', (await p.$$('.evento')).length === 2);
  await p.click('.chip[data-tipo="palestra"]'); await p.click('.aba[data-mes="2027-02"]');
  ok('Palestra em fevereiro = 1 (filtro mantido ao trocar de aba)', (await p.$$('.evento')).length === 1);
  await p.click('.aba[data-mes="2026-12"]'); await p.click('.chip[data-tipo=""]');
  const cabs = p.locator('.evento__cabeca');
  await cabs.nth(0).click(); await cabs.nth(1).click(); await p.waitForTimeout(500);
  ok('Acordeão: só um aberto por vez', (await p.$$eval('.evento__cabeca[aria-expanded="true"]', (l) => l.length)) === 1);
  ok('Datas em DD/MM/AAAA com dia da semana', (await p.textContent('.evento:nth-child(1) .evento__meta')).includes('sex, 04/12/2026'));
  await cabs.nth(2).click(); await p.waitForTimeout(400);
  ok('Evento esgotado tem Reservar desabilitado', await p.$eval('.evento:nth-child(3) [data-reservar]', (x) => x.disabled));
  await cabs.nth(0).click(); await p.waitForTimeout(500);
  await p.click('.evento:nth-child(1) [data-reservar]'); await p.waitForTimeout(400);
  ok('Modal de reserva abre com foco no nome', await p.evaluate(() => document.getElementById('modal-reserva').open && document.activeElement.id === 'r-nome'));
  await p.click('#form-reserva button[type="submit"]');
  ok('Envio vazio mostra mensagens em português', (await p.textContent('#e-nome')) === 'Preencha este campo.');
  await p.fill('#r-nome', 'Eduardo Teste'); await p.fill('#r-email', 'eduardo@exemplo.com');
  await p.fill('#r-qtd', '9'); await p.check('#r-termos');
  await p.click('#form-reserva button[type="submit"]');
  ok('Quantidade acima do limite é recusada', (await p.textContent('#e-qtd')).includes('Restam só 6'), await p.textContent('#e-qtd'));
  await p.fill('#r-qtd', '2');
  const tot = (await p.textContent('#r-total')).replace(/\s/g, ' ');
  ok('Total calculado (2 × R$ 45,00)', tot === 'R$ 90,00', tot);
  await p.click('#form-reserva button[type="submit"]'); await p.waitForTimeout(300);
  ok('Sucesso com protocolo', /^OES-/.test(await p.textContent('#reserva-protocolo')), await p.textContent('#reserva-protocolo'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok('Vagas atualizadas na lista (8 → 6)', (await p.textContent('.evento:nth-child(1) .evento__vagas')).trim() === '6 vagas');

  // ---------- RESPONSIVO ----------
  for (const w of [768, 375]) {
    await p.setViewportSize({ width: w, height: 900 });
    for (const pg of ['index', 'agenda', 'galeria']) {
      await p.goto(BASE + pg + '.html', { waitUntil: 'networkidle' });
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      ok(`${pg} em ${w}px sem rolagem horizontal`, sw === w, `scrollWidth=${sw}`);
    }
    await p.click('.menu-botao'); await p.waitForTimeout(500);
    ok(`Menu abre em ${w}px (aria-expanded)`, (await p.getAttribute('.menu-botao', 'aria-expanded')) === 'true' && await p.isVisible('#menu-principal a'));
    await p.keyboard.press('Escape');
    ok(`Esc fecha o menu em ${w}px`, (await p.getAttribute('.menu-botao', 'aria-expanded')) === 'false');
  }
  ok('Console sem erros', erros.length === 0, erros.join(' | '));
  console.log(res.join('\n'));
  console.log(`\n${res.filter((r) => r.startsWith('OK')).length} de ${res.length} verificações OK`);
  await b.close();
})();
