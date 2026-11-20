// Vídeos de referência do Observatório (um por animação). Uso: node videos_obs.js <saida_webm> <baseURL>
const criar = require('/home/user/rev/tools/gravador.js');
const gravar = criar(process.argv[2], process.argv[3] || 'http://localhost:8801/XX_modulo_f/');
const D = { width: 1440, height: 900 };
const T = { width: 768, height: 1024 };
const M = { width: 375, height: 812 };

(async () => {
  await gravar('01-cabecalho-vidro-e-progresso', D, async ({ p, w, move, rolar, ir }) => {
    await ir('index.html'); await w(800);
    for (const s of ['.menu a[href="agenda.html"]', '.menu a[href="galeria.html"]', '.menu a[href="index.html"]']) { await move(s); await w(700); }
    await move('.menu .botao'); await w(900);
    await p.mouse.move(700, 600, { steps: 10 });
    for (const y of [700, 1500, 2300, 3200, 4300]) await rolar(y, 1200);
    await rolar(0, 1500);
  });

  await gravar('02-hero-lanterna', D, async ({ p, w, ir }) => {
    await ir('index.html'); await w(600);
    const pts = [[1100, 300], [700, 250], [400, 330], [600, 520], [1000, 600], [1300, 400], [1200, 200], [900, 420]];
    for (const [x, y] of pts) { await p.mouse.move(x, y, { steps: 30 }); await w(500); }
    await p.mouse.move(200, 880, { steps: 20 }); await w(1200);
  });

  await gravar('03-contagem-regressiva', D, async ({ p, w, move, ir }) => {
    await ir('index.html'); await move('.contagem__numeros', 20); await w(6000);
  });

  await gravar('04-planetas-cartao-3d', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(400);
    await rolarAte('#planetas', 1500, 80); await w(800);
    for (const i of [1, 2, 3, 4, 5, 6]) { await move(`.planeta:nth-child(${i})`, 18); await w(1500); }
    await p.mouse.move(700, 120, { steps: 12 }); await w(900);
    await p.locator('.planeta:nth-child(3) .planeta__interno').focus(); await w(500);
    await p.keyboard.press('Enter'); await w(1600); await p.keyboard.press('Enter'); await w(1200);
  });

  await gravar('05-graficos-barras-e-rosca', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(400);
    await rolarAte('.numeros', 1600, 160); await w(1800);
    for (const i of [1, 4, 7, 9, 12]) { await move(`.barra:nth-child(${i})`, 10); await w(800); }
    for (const i of [1, 2, 3, 4]) { await move(`.legenda li:nth-child(${i})`, 10); await w(1000); }
    await p.mouse.move(700, 120, { steps: 10 }); await w(800);
  });

  await gravar('06-comparador-antes-depois', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(400);
    await rolarAte('.comparador', 1500, 140);
    const bx = await p.locator('.comparador').boundingBox();
    const y = bx.y + bx.height / 2;
    await p.mouse.move(bx.x + bx.width / 2, y, { steps: 10 }); await p.mouse.down();
    for (const f of [0.2, 0.85, 0.5]) { await p.mouse.move(bx.x + bx.width * f, y, { steps: 30 }); await w(500); }
    await p.mouse.up(); await w(500);
    await p.focus('.comparador__controle');
    for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowRight'); await w(150); }
    await w(900);
  });

  await gravar('07-chamada-borda-e-botoes', D, async ({ p, w, move, rolarAte, ir }) => {
    await ir('index.html'); await w(400);
    await rolarAte('.chamada', 1500, 140); await w(2500);
    await move('.chamada .botao'); await w(1500);
    await p.mouse.move(300, 300, { steps: 10 });
    await rolarAte('.hero', 1200, 0);
    await move('.hero__acoes .botao--primario'); await w(1000);
    await move('.hero__acoes .botao--contorno'); await w(1000);
  });

  await gravar('08-tema-claro-escuro', D, async ({ p, w, clicar, ir, rolar }) => {
    await ir('index.html'); await w(800);
    await clicar('.tema-botao'); await w(1500);
    await rolar(1100, 1300); await rolar(2200, 1300);
    await clicar('.menu a[href="agenda.html"]'); await w(1500);
    await clicar('.tema-botao'); await w(1500);
  });

  await gravar('09-agenda-abas-e-filtros', D, async ({ p, w, clicar, move, ir }) => {
    await ir('agenda.html'); await w(600);
    await p.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' })); await w(1100);
    await clicar('.aba[data-mes="2027-01"]'); await w(1300);
    await clicar('.aba[data-mes="2027-02"]'); await w(1300);
    await clicar('.aba[data-mes="2026-12"]'); await w(1300);
    await clicar('.chip[data-tipo="oficina"]'); await w(1300);
    await clicar('.chip[data-tipo="palestra"]'); await w(1000);
    await clicar('.aba[data-mes="2027-01"]'); await w(1300);
    await clicar('.chip[data-tipo=""]'); await w(1000);
    await p.locator('.aba[aria-selected="true"]').focus();
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft']) { await p.keyboard.press(k); await w(1000); }
  });

  await gravar('10-agenda-acordeao', D, async ({ p, w, clicar, ir }) => {
    await ir('agenda.html'); await w(500);
    await p.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' })); await w(1100);
    await clicar('.evento:nth-child(1) .evento__cabeca'); await w(1400);
    await clicar('.evento:nth-child(2) .evento__cabeca'); await w(1400);
    await clicar('.evento:nth-child(3) .evento__cabeca'); await w(1600);
    await clicar('.evento:nth-child(3) .evento__cabeca'); await w(1200);
  });

  await gravar('11-agenda-modal-reserva', D, async ({ p, w, clicar, ir }) => {
    await ir('agenda.html'); await w(400);
    await p.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' })); await w(1000);
    await clicar('.evento:nth-child(1) .evento__cabeca'); await w(900);
    await clicar('.evento:nth-child(1) [data-reservar]'); await w(1200);
    await clicar('#form-reserva button[type="submit"]'); await w(1500);
    await clicar('#r-nome'); await p.keyboard.type('Marina Souza', { delay: 70 });
    await clicar('#r-email'); await p.keyboard.type('marina@exemplo', { delay: 70 }); await p.keyboard.press('Tab'); await w(1200);
    await clicar('#r-email'); await p.keyboard.type('.com', { delay: 90 });
    await clicar('#r-qtd'); await p.keyboard.press('ArrowUp'); await w(500); await p.keyboard.press('ArrowUp'); await w(700);
    await clicar('#r-termos'); await w(500);
    await clicar('#form-reserva button[type="submit"]'); await w(2200);
    await p.keyboard.press('Escape'); await w(1500);
    await clicar('.evento:nth-child(2) .evento__cabeca'); await w(800);
    await clicar('.evento:nth-child(2) [data-reservar]'); await w(1000);
    await p.mouse.move(150, 450, { steps: 16 }); await w(300); await p.mouse.click(150, 450); await w(1200);
  });

  await gravar('12-galeria-filtro-e-tilt', D, async ({ p, w, clicar, move, ir }) => {
    await ir('galeria.html'); await w(500);
    await p.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' })); await w(1100);
    for (const i of [1, 2, 3]) {
      for (const [fx, fy] of [[0.15, 0.15], [0.85, 0.2], [0.85, 0.85], [0.15, 0.8], [0.5, 0.5]]) { await move(`.foto:nth-child(${i}) .foto__botao`, 8, fx, fy); await w(160); }
    }
    await p.mouse.move(700, 250, { steps: 10 }); await w(800);
    await clicar('.chip[data-categoria="sistema-solar"]'); await w(1300);
    await clicar('.chip[data-categoria="paisagens"]'); await w(1300);
    await clicar('.chip[data-categoria=""]'); await w(1200);
  });

  await gravar('13-galeria-lightbox', D, async ({ p, w, clicar, ir }) => {
    await ir('galeria.html'); await w(500);
    await p.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' })); await w(1000);
    await clicar('.foto:nth-child(2) .foto__botao'); await w(1500);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft']) { await p.keyboard.press(k); await w(1000); }
    await clicar('#lb-prox'); await w(900); await clicar('#lb-ant'); await w(900);
    await p.keyboard.press('Escape'); await w(1300);
  });

  await gravar('14-tablet-768', T, async ({ p, w, clicar, rolar, ir }) => {
    await ir('index.html'); await w(800);
    await clicar('.menu-botao'); await w(1300); await clicar('.menu-botao'); await w(900);
    for (const y of [900, 1900, 2900, 4000]) await rolar(y, 1200);
  });

  await gravar('15-celular-375', M, async ({ p, w, clicar, rolar, ir }) => {
    await ir('index.html'); await w(800);
    await clicar('.menu-botao'); await w(1300);
    await clicar('.menu a[href="agenda.html"]'); await w(1500);
    await rolar(450, 1100);
    await clicar('.evento:nth-child(1) .evento__cabeca'); await w(1300);
    await clicar('.evento:nth-child(1) [data-reservar]'); await w(1500);
    await p.keyboard.press('Escape'); await w(800);
    await clicar('.menu-botao'); await w(1000); await clicar('.menu a[href="index.html"]'); await w(1200);
    await rolar(1000, 1000);
    await p.locator('.planeta:nth-child(1) .planeta__interno').click(); await w(1600);
    for (const y of [3200, 4300]) await rolar(y, 1200);
  });
})();
