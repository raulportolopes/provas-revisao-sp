// Vídeos de referência da Torra Serrana (um por animação). Uso: node videos_cafe.js <saida_webm> <baseURL>
const criar = require('/home/user/rev/tools/gravador.js');
const gravar = criar(process.argv[2], process.argv[3] || 'http://localhost:8802/XX_modulo_f/', { colorScheme: 'light' });
const D = { width: 1440, height: 900 };
const T = { width: 768, height: 1024 };
const M = { width: 375, height: 812 };

(async () => {
  await gravar('01-hero-palavras-e-vapor', D, async ({ p, w, ir }) => {
    await ir('index.html'); await w(4500);
    await p.reload({ waitUntil: 'networkidle' }); await w(3500);
  });

  await gravar('02-botao-magnetico-e-links', D, async ({ p, w, move, ir }) => {
    await ir('index.html'); await w(2200);
    await move('.magnetico', 20, 0.1, 0.2); await w(500);
    await move('.magnetico', 20, 0.9, 0.8); await w(500);
    await move('.magnetico', 20, 0.2, 0.9); await w(500);
    await p.mouse.move(400, 820, { steps: 20 }); await w(900);
    await move('.link-seta', 16); await w(1200);
    for (const s of ['.menu a[href="cafes.html"]', '.menu a[href="preparo.html"]', '.menu a[href="index.html"]']) { await move(s); await w(700); }
    await move('.botao-sacola'); await w(900);
  });

  await gravar('03-cabecalho-encolhe', D, async ({ p, w, rolar, ir }) => {
    await ir('index.html'); await w(1500);
    await rolar(300, 1200); await w(600); await rolar(0, 1200); await w(600);
    await rolar(900, 1200); await w(800); await rolar(0, 1400);
  });

  await gravar('04-faixa-regioes', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(300);
    await rolarAte('.faixa', 1200, 300); await w(4000);
    await move('.faixa', 20); await w(2500);
    await p.mouse.move(700, 120, { steps: 12 }); await w(2500);
  });

  await gravar('05-cartao-cafe-hover', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(300);
    await rolarAte('#cafes-semana', 1500, 90); await w(800);
    for (const i of [1, 2, 3]) { await move(`#cafes-semana .cartao:nth-child(${i})`, 18, 0.5, 0.35); await w(1800); }
    await move('#cafes-semana .cartao:nth-child(2) .botao-add', 14); await w(1000);
    await p.mouse.move(700, 120, { steps: 12 }); await w(900);
  });

  await gravar('06-etapas-linha-no-scroll', D, async ({ p, w, rolarAte, rolar, ir }) => {
    await ir('index.html'); await w(300);
    const y = await p.locator('.etapas').evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await rolar(y - 900, 1200);
    for (let i = 1; i <= 10; i++) await rolar(y - 900 + i * 90, 450);
    await w(800);
    for (let i = 9; i >= 0; i--) await rolar(y - 900 + i * 90, 300);
    await w(600);
  });

  await gravar('07-carrossel-depoimentos', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await ir('index.html'); await w(300);
    await rolarAte('.carrossel', 1500, 160); await p.mouse.move(700, 60, { steps: 10 });
    await w(13000); // autoplay: a barra do ponto enche e troca sozinho (2 trocas)
    await move('.carrossel__janela', 16); await w(2500); // mouse em cima: pausa
    await clicar('.carrossel__seta[data-dir="1"]'); await w(1200);
    await clicar('.carrossel__seta[data-dir="1"]'); await w(1200);
    await clicar('.carrossel__seta[data-dir="-1"]'); await w(1200);
    await clicar('.ponto:nth-child(1)'); await w(1200);
    await clicar('.carrossel__pausa'); await p.evaluate(() => document.activeElement.blur());
    await p.mouse.move(700, 60, { steps: 10 }); await w(3000); // pausado: não troca
    await clicar('.carrossel__pausa'); await p.evaluate(() => document.activeElement.blur());
    await p.mouse.move(700, 60, { steps: 10 }); await w(7000);
  });

  await gravar('08-clube-interruptor-e-formulario', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await ir('index.html'); await w(300);
    await rolarAte('.clube', 1500, 90); await w(700);
    await clicar('.interruptor [data-valor="anual"]'); await w(1500);
    await clicar('.interruptor [data-valor="mensal"]'); await w(1500);
    await clicar('.interruptor [data-valor="anual"]'); await w(1200);
    await clicar('#form-clube button[type="submit"]'); await w(1800); // erros em português
    await clicar('#clube-nome'); await p.keyboard.type('Ana Souza', { delay: 80 });
    await clicar('#clube-email'); await p.keyboard.type('ana@email.com', { delay: 60 });
    await clicar('#clube-cep'); await p.keyboard.type('12345', { delay: 120 }); await w(400); await p.keyboard.type('678', { delay: 120 }); await w(800);
    await clicar('#form-clube button[type="submit"]'); await w(2500);
  });

  await gravar('09-sacola-gaveta-e-frete', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await p.addInitScript(() => localStorage.removeItem('ts-sacola'));
    await ir('index.html'); await w(300);
    await rolarAte('#cafes-semana', 1400, 90); await w(500);
    await clicar('#cafes-semana .cartao:nth-child(1) .botao-add'); await w(1500); // aviso + selo pula
    await clicar('#cafes-semana .cartao:nth-child(3) .botao-add'); await w(1500);
    await clicar('.botao-sacola'); await w(1200);
    await clicar('.gaveta .item:nth-child(1) [data-acao="mais"]'); await w(900);
    await clicar('.gaveta .item:nth-child(1) [data-acao="mais"]'); await w(1200); // passa de R$ 150: frete grátis
    await clicar('.gaveta .item:nth-child(1) [data-acao="menos"]'); await w(1000);
    await clicar('.gaveta .item:nth-child(2) [data-acao="remover"]'); await w(1200);
    await p.keyboard.press('Escape'); await w(1200);
    await clicar('.botao-sacola'); await w(1000);
    await clicar('.gaveta__fechar'); await w(1000);
  });

  await gravar('10-catalogo-filtros-e-ordem', D, async ({ p, w, move, clicar, ir }) => {
    await p.addInitScript(() => localStorage.removeItem('ts-sacola'));
    await ir('cafes.html'); await w(1200);
    await clicar('.chip[data-torra="clara"]'); await w(1300);
    await clicar('.chip[data-torra="escura"]'); await w(1300);
    await clicar('.chip[data-torra="media"]'); await w(1000);
    await move('#f-ordem'); await p.selectOption('#f-ordem', 'preco-asc'); await w(1500);
    await p.selectOption('#f-ordem', 'preco-desc'); await w(1500);
    await clicar('.chip[data-torra=""]'); await w(800);
    await clicar('#f-busca'); await p.keyboard.type('mel', { delay: 180 }); await w(1500);
    await p.fill('#f-busca', ''); await p.keyboard.type('garca', { delay: 180 }); await w(1500);
    await p.fill('#f-busca', ''); await p.keyboard.type('xyz', { delay: 180 }); await w(1500); // estado vazio
    await clicar('.botao-limpar'); await w(1500);
    await p.reload({ waitUntil: 'networkidle' }); await w(1200);
  });

  await gravar('11-preparo-abas-de-metodo', D, async ({ p, w, move, clicar, ir }) => {
    await ir('preparo.html'); await w(1000);
    for (const id of ['#aba-prensa', '#aba-moka', '#aba-aeropress']) { await clicar(id); await w(1500); }
    await p.focus('#aba-aeropress');
    for (const k of ['ArrowUp', 'ArrowUp', 'Home', 'End']) { await p.keyboard.press(k); await w(1100); }
    await clicar('#aba-v60'); await w(1000);
  });

  await gravar('12-cronometro-de-preparo', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await ir('preparo.html'); await w(400);
    await clicar('#aba-aeropress'); await w(600);
    await rolarAte('.cronometro', 1200, 120); await w(500);
    await clicar('#c-iniciar'); await w(9000);
    await clicar('#c-iniciar'); await w(1500); // pausa
    await clicar('#c-iniciar'); await w(4000);
    await clicar('#c-zerar'); await w(1500);
  });

  await gravar('13-calculadora-de-proporcao', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await ir('preparo.html'); await w(400);
    await rolarAte('.calculadora', 1200, 140); await w(600);
    const r = p.locator('#calc-ml'); const bx = await r.boundingBox();
    const y = bx.y + bx.height / 2;
    await p.mouse.move(bx.x + bx.width * 0.25, y, { steps: 10 }); await p.mouse.down();
    for (const f of [0.9, 0.05, 0.5]) { await p.mouse.move(bx.x + bx.width * f, y, { steps: 30 }); await w(500); }
    await p.mouse.up(); await w(600);
    await p.focus('#calc-ml'); for (let i = 0; i < 5; i++) { await p.keyboard.press('ArrowRight'); await w(200); }
    await w(600);
    await clicar('#aba-moka'); await rolarAte('.calculadora', 900, 140); await w(1500);
  });

  await gravar('14-perguntas-frequentes', D, async ({ p, w, move, clicar, rolarAte, ir }) => {
    await ir('preparo.html'); await w(400);
    await rolarAte('.faq', 1400, 160); await w(800);
    for (const i of [2, 3, 4, 1]) { await clicar(`.faq details:nth-child(${i}) summary`); await w(1300); }
    await clicar('.faq details:nth-child(1) summary'); await w(1200);
  });

  await gravar('15-tablet-768', T, async ({ p, w, rolar, ir }) => {
    await ir('index.html'); await w(2500);
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 700; y < h; y += 800) await rolar(y, 900);
    await ir('cafes.html'); await w(1000); await rolar(900, 1200);
    await ir('preparo.html'); await w(1000); await rolar(900, 1200); await rolar(1800, 1200);
  });

  await gravar('16-celular-375-barra-inferior', M, async ({ p, w, rolar, clicar, ir }) => {
    await ir('index.html'); await w(2500);
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 600; y < h; y += 700) await rolar(y, 800);
    await rolar(0, 1200);
    await clicar('.menu a[href="cafes.html"]'); await w(1500);
    await clicar('.cartao:nth-child(1) .botao-add'); await w(1200);
    await clicar('.botao-sacola'); await w(1500);
    await clicar('.gaveta__fechar'); await w(800);
    await clicar('.menu a[href="preparo.html"]'); await w(1500);
    await rolar(700, 1000); await w(800);
  });
})().catch((e) => { console.error(e); process.exit(1); });
