// Apoio ao avaliador — Módulo F Torra Serrana.
// Uso: node checar-torra-serrana.js http://servidor/XX_modulo_f/
// Confere por script as interações mensuráveis. NÃO substitui o roteiro: use como evidência.
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:8802/XX_modulo_f/').replace(/\/?$/, '/');
const res = [];
const ok = (nome, cond, extra = '') => res.push(`${cond ? 'OK   ' : 'FALHA'} ${nome}${extra !== '' ? ' — ' + extra : ''}`);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo' });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  const txt = async (s) => (await p.textContent(s)).replace(/\s+/g, ' ').trim();

  // ---------- INÍCIO ----------
  await p.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  ok('Um único link com aria-current="page"', (await p.$$('nav a[aria-current="page"]')).length === 1);
  await p.waitForTimeout(1500);
  const palavra = await p.$eval('.palavra > span', (e) => getComputedStyle(e).transform);
  ok('Palavras do título terminam no lugar (subiram)', palavra === 'none' || palavra === 'matrix(1, 0, 0, 1, 0, 0)', palavra);
  ok('Vapor animado em loop', await p.$eval('.vapor path', (e) => getComputedStyle(e).animationIterationCount === 'infinite'));
  ok('Faixa infinita animada', await p.$eval('.faixa__trilho', (e) => getComputedStyle(e).animationName !== 'none'));
  await p.evaluate(() => scrollTo(0, 200)); await p.waitForTimeout(500);
  ok('Cabeçalho encolhe ao rolar', await p.$eval('.cabecalho__dentro', (e) => e.getBoundingClientRect().height < 70));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);

  // botão magnético
  const mg = await p.locator('.magnetico').boundingBox();
  await p.mouse.move(mg.x + mg.width + 40, mg.y + mg.height / 2, { steps: 5 }); await p.waitForTimeout(600);
  const mx = await p.$eval('.magnetico', (e) => getComputedStyle(e).getPropertyValue('--mx'));
  ok('Botão magnético é puxado na direção do cursor', parseFloat(mx) > 5, mx);
  await p.mouse.move(5, 600, { steps: 5 });

  // cartão com gráfico
  const card = p.locator('#cafes-semana .cartao').first();
  await card.scrollIntoViewIfNeeded(); await card.hover(); await p.waitForTimeout(1600);
  const barra = await card.locator('.perfil li:nth-child(3) .perfil__barra').evaluate((e) => getComputedStyle(e, '::before').transform);
  const nota = await card.locator('.nota').evaluate((e) => getComputedStyle(e).getPropertyValue('--n'));
  ok('Hover enche a barra do perfil (Doçura 5/5 = 100%)', barra.startsWith('matrix(1,'), barra);
  ok('Hover gira o anel e conta a nota até 87', nota.trim() === '87', nota);

  // carrossel
  const s0 = await p.$eval('.carrossel__trilho', (e) => e.style.getPropertyValue('--slide'));
  await p.click('.carrossel__seta[data-dir="1"]'); await p.waitForTimeout(800);
  const s1 = await p.$eval('.carrossel__trilho', (e) => e.style.getPropertyValue('--slide'));
  await p.click('.carrossel__seta[data-dir="-1"]'); await p.click('.carrossel__seta[data-dir="-1"]'); await p.waitForTimeout(800);
  const s2 = await p.$eval('.carrossel__trilho', (e) => e.style.getPropertyValue('--slide'));
  ok('Carrossel: próxima e anterior, circular', Number(s1) === (Number(s0) + 1) % 4 && Number(s2) === (Number(s0) + 3) % 4, `${s0} → ${s1} → ${s2}`);
  // foco dentro do carrossel PAUSA o autoplay (regra de acessibilidade): tiramos o foco antes de esperar
  await p.click('.ponto:nth-child(2)'); await p.evaluate(() => document.activeElement.blur()); await p.mouse.move(5, 5); await p.waitForTimeout(6800);
  const auto = await p.$eval('.carrossel__trilho', (e) => e.style.getPropertyValue('--slide'));
  ok('Autoplay avança sozinho em ~6 s', auto === '2', auto);
  await p.click('.carrossel__pausa'); await p.evaluate(() => document.activeElement.blur()); await p.mouse.move(5, 5); await p.waitForTimeout(6800);
  const pausa = await p.$eval('.carrossel__trilho', (e) => e.style.getPropertyValue('--slide'));
  ok('Botão Pausar para o autoplay', pausa === '2' && (await p.getAttribute('.carrossel__pausa', 'aria-pressed')) === 'true', pausa);
  ok('Slides escondidos ficam inert', (await p.$$('.depo[inert]')).length === 3);

  // plano
  await p.click('.interruptor [data-valor="anual"]'); await p.waitForTimeout(600);
  ok('Interruptor anual troca o preço para 94,90', (await txt('.plano__valor strong')) === '94,90');
  // formulário
  await p.click('#form-clube button[type="submit"]');
  ok('Formulário vazio mostra erro em português', (await txt('#erro-clube-nome')) === 'Preencha este campo.');
  await p.fill('#clube-nome', 'Eduardo Zanetti'); await p.fill('#clube-email', 'edu@exemplo.com');
  await p.type('#clube-cep', '18035123');
  ok('Máscara de CEP (00000-000)', (await p.inputValue('#clube-cep')) === '18035-123', await p.inputValue('#clube-cep'));
  await p.click('#form-clube button[type="submit"]');
  ok('Envio válido mostra a confirmação', (await txt('.clube__ok-texto')).includes('Eduardo') && (await txt('.clube__ok-texto')).includes('anual'));

  // ---------- SACOLA ----------
  await p.evaluate(() => localStorage.clear());
  await p.goto(BASE + 'cafes.html', { waitUntil: 'networkidle' });
  ok('Catálogo com 8 cafés', (await p.$$('#lista-cafes .cartao')).length === 8);
  ok('Ordenação padrão: maior nota primeiro (Vale do Garcia 90)', (await txt('#lista-cafes .cartao:first-child .cartao__nome')) === 'Vale do Garcia Fermentado');
  await p.click('.chip[data-torra="escura"]');
  ok('Torra escura = 2', (await p.$$('#lista-cafes .cartao')).length === 2);
  await p.click('.chip[data-torra=""]');
  await p.fill('#f-busca', 'MANTIQUEIRA');
  ok('Busca sem diferenciar maiúsculas (Mantiqueira = 3)', (await p.$$('#lista-cafes .cartao')).length === 3);
  await p.fill('#f-busca', 'mel'); ok('Busca também nas notas ("mel" = 6: mel, melaço, caramelo, vermelhas)', (await p.$$('#lista-cafes .cartao')).length === 6);
  await p.fill('#f-busca', 'GARCA'); ok('Busca sem acento ("GARCA" acha Garça)', (await p.$$('#lista-cafes .cartao')).length === 1);
  await p.fill('#f-busca', 'xyz');
  ok('Lista vazia mostra aviso', (await txt('#lista-cafes')).includes('Nenhum café encontrado'));
  await p.fill('#f-busca', ''); await p.click('.chip[data-torra="media"]'); await p.selectOption('#f-ordem', 'preco-asc');
  ok('Combinado: torra média + menor preço (preços em ordem crescente)',
    (await p.$$eval('#lista-cafes .preco', (l) => l.map((x) => parseFloat(x.textContent.replace(/[^\d,]/g, '').replace(',', '.'))))).every((v, i, a) => !i || a[i - 1] <= v));
  ok('Filtros na URL', p.url().includes('torra=media') && p.url().includes('ordem=preco-asc'), p.url());
  await p.reload({ waitUntil: 'networkidle' });
  ok('F5 mantém filtros', (await p.getAttribute('.chip[data-torra="media"]', 'aria-pressed')) === 'true' && (await p.inputValue('#f-ordem')) === 'preco-asc');
  await p.click('.botao-limpar'); await p.waitForTimeout(200);

  await p.click('[data-adicionar="vale-do-garcia"]'); await p.click('[data-adicionar="vale-do-garcia"]');
  ok('Selo da sacola mostra 2', (await txt('.selo__numero')) === '2');
  ok('Aviso (toast) aparece', await p.$eval('.aviso', (e) => e.classList.contains('visivel')));
  await p.click('.botao-sacola'); await p.waitForTimeout(600);
  ok('Gaveta abre com foco no fechar', await p.evaluate(() => !document.getElementById('sacola').hidden && document.activeElement.classList.contains('gaveta__fechar')));
  ok('Subtotal 2 × R$ 98,00 = R$ 196,00 e frete grátis', (await txt('.js-subtotal')) === 'R$ 196,00' && (await txt('.js-frete')) === 'Grátis');
  await p.click('.item [data-acao="menos"]'); await p.waitForTimeout(200);
  ok('Diminuir: R$ 98,00 + frete R$ 18,90 = R$ 116,90', (await txt('.js-total')) === 'R$ 116,90', await txt('.js-total'));
  ok('Barra do frete mostra quanto falta (R$ 52,00)', (await txt('.frete__texto')).includes('R$ 52,00'));
  for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
  ok('Foco preso dentro da gaveta', await p.evaluate(() => document.getElementById('sacola').contains(document.activeElement)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  ok('Esc fecha a gaveta e devolve o foco', await p.evaluate(() => document.getElementById('sacola').hidden && document.activeElement.classList.contains('botao-sacola')));
  await p.goto(BASE + 'preparo.html', { waitUntil: 'networkidle' });
  ok('Sacola persiste entre páginas (localStorage)', (await txt('.selo__numero')) === '1');
  await p.click('.botao-sacola'); await p.waitForTimeout(500);
  await p.click('.item [data-acao="remover"]'); await p.waitForTimeout(700);
  ok('Remover deixa a sacola vazia com mensagem', await p.isVisible('.gaveta__vazia'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);

  // ---------- PREPARO ----------
  ok('V60 selecionada ao abrir', (await p.getAttribute('#aba-v60', 'aria-selected')) === 'true' && (await txt('#r-nome')) === 'V60');
  await p.focus('#aba-v60'); await p.keyboard.press('ArrowDown');
  ok('Seta ↓ vai para Prensa francesa', (await txt('#r-nome')) === 'Prensa francesa' && (await txt('#c-total')) === '4:00');
  await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
  ok('Seta ↑ circular vai para AeroPress', (await txt('#r-nome')) === 'AeroPress');
  await p.click('#aba-v60');
  await p.click('#c-iniciar'); await p.waitForTimeout(3200);
  const t = await txt('#c-tempo');
  ok('Cronômetro conta (≈0:03)', ['0:03', '0:02', '0:04'].includes(t), t);
  ok('Primeiro passo aceso', (await p.$$('.passo--atual')).length === 1);
  await p.click('#c-iniciar'); await p.waitForTimeout(1500);
  ok('Pausar congela o tempo', (await txt('#c-tempo')) === t || (await txt('#c-iniciar')) === 'Continuar');
  await p.click('#c-zerar'); ok('Zerar volta a 0:00', (await txt('#c-tempo')) === '0:00');
  await p.$eval('#calc-agua', (e) => { e.value = 500; e.dispatchEvent(new Event('input')); });
  ok('Calculadora: 500 ml na V60 = 30 g', (await txt('#calc-g')) === '30 g', await txt('#calc-g'));
  await p.click('details:nth-child(3) summary'); await p.waitForTimeout(300);
  ok('FAQ: só um aberto por vez', (await p.$$('details[open]')).length === 1 && await p.$eval('details:nth-child(3)', (d) => d.open));

  // ---------- RESPONSIVO ----------
  for (const w of [768, 375]) {
    await p.setViewportSize({ width: w, height: 900 });
    for (const pg of ['index', 'cafes', 'preparo']) {
      await p.goto(BASE + pg + '.html', { waitUntil: 'networkidle' });
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      ok(`${pg} em ${w}px sem rolagem horizontal`, sw === w, `scrollWidth=${sw}`);
    }
  }
  const nav = await p.$eval('.menu', (e) => { const r = e.getBoundingClientRect(); return [getComputedStyle(e).position, Math.round(r.bottom)]; });
  ok('375 px: menu vira barra fixa embaixo', nav[0] === 'fixed' && nav[1] === 900, nav.join(' '));
  ok('375 px: body com espaço para a barra', await p.evaluate(() => parseInt(getComputedStyle(document.body).paddingBottom) >= 72));
  ok('Console sem erros', erros.length === 0, erros.join(' | '));
  console.log(res.join('\n'));
  console.log(`\n${res.filter((r) => r.startsWith('OK')).length} de ${res.length} verificações OK`);
  await b.close();
})();
