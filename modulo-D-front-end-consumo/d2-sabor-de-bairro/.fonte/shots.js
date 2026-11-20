// Prints de referência (design/) da solução Sabor de Bairro. Uso: node shots.js <pasta_saida> [base]
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const B = process.argv[3] || 'http://localhost:8702/';
fs.mkdirSync(OUT + '/estados', { recursive: true });
(async () => {
  const br = await chromium.launch();
  const erros = [];
  async function pg(w, h, esquema = 'light') {
    const c = await br.newContext({ viewport: { width: w, height: h }, timezoneId: 'America/Sao_Paulo', colorScheme: esquema });
    const p = await c.newPage();
    p.on('pageerror', (e) => erros.push(String(e)));
    return p;
  }
  async function ir(p, hash, espera = 1600) { await p.goto(B + hash); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(espera); }
  async function entrar(p) { await ir(p, '#/entrar', 500); await p.fill('#email', 'cliente@sabor.com.br'); await p.fill('#senha', 'Sabor2026!'); await p.click('.entrar__form .botao'); await p.waitForTimeout(1300); }
  async function encher(p) { // 2 Clássicos com bacon + 1 onion rings
    await ir(p, '#/restaurante/smash-do-bairro?item=36'); await p.check('text=Ao ponto'); await p.check('.opcao:has-text("Bacon") input');
    await p.click('[aria-label="Aumentar quantidade"]'); await p.click('.modal__rodape .botao'); await p.waitForTimeout(500);
    await ir(p, '#/restaurante/smash-do-bairro?item=40', 900); await p.click('.modal__rodape .botao'); await p.waitForTimeout(4300); // espera os avisos sumirem
  }
  const full = async (p, n) => { await p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }); };
  const tela = async (p, n) => { await p.screenshot({ path: `${OUT}/estados/${n}.png` }); };
  const reset = async () => { const c = await br.newContext(); const p = await c.newPage(); await p.request.post(B + 'api/index.php/reset'); await c.close(); };
  await reset();

  // ---------- Layouts (página inteira) nas 3 larguras ----------
  for (const [w, h] of [[1440, 900], [768, 1024], [375, 812]]) {
    const p = await pg(w, h);
    await ir(p, '#/'); await full(p, `layout-${w}-inicio`);
    await ir(p, '#/restaurante/forno-da-vila'); await full(p, `layout-${w}-cardapio`);
    await entrar(p); await encher(p);
    await ir(p, '#/checkout'); await p.type('#f-cep', '03164000'); await p.waitForTimeout(1200); await p.fill('#f-numero', '45');
    await full(p, `layout-${w}-checkout`);
    await ir(p, '#/pedidos'); await full(p, `layout-${w}-pedidos`);
    await ir(p, '#/pedidos/1002'); await full(p, `layout-${w}-pedido`);
    await p.context().close();
  }

  // ---------- Estados (tela visível, 1440) ----------
  await reset();
  let p = await pg(1440, 900);
  await p.route('**/restaurantes?*', async (r) => { await new Promise((s) => setTimeout(s, 4000)); r.continue().catch(() => {}); });
  await p.goto(B + '#/'); await p.waitForTimeout(900); await p.evaluate(() => scrollTo(0, 560)); await tela(p, 'estado-01-carregando-esqueleto');
  await p.unroute('**/restaurantes?*');
  await ir(p, '#/?categoria=3&aberto=1&ordem=avaliacao'); await p.evaluate(() => scrollTo(0, 520)); await tela(p, 'estado-02-filtros-na-url');
  await ir(p, '#/?busca=lasanha'); await tela(p, 'estado-03-busca-sem-resultado');
  await ir(p, '#/'); await p.evaluate(() => scrollTo(0, 560)); await p.waitForTimeout(300);
  const c1 = await p.locator('.cartao').nth(1).boundingBox(); await p.mouse.move(c1.x + c1.width / 2, c1.y + 80, { steps: 6 }); await p.waitForTimeout(600);
  await tela(p, 'estado-04-cartao-hover');
  await p.route('**/restaurantes?*', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"mensagem":"Erro interno no servidor."}' }));
  await ir(p, '#/?ordem=nome'); await p.evaluate(() => scrollTo(0, 520)); await tela(p, 'estado-05-erro-api');
  await p.unroute('**/restaurantes?*');
  await ir(p, '#/restaurante/smash-do-bairro'); await p.click('.aba-secao:has-text("Bebidas")'); await p.waitForTimeout(1200); await tela(p, 'estado-06-abas-scrollspy');
  await ir(p, '#/restaurante/smash-do-bairro?item=36'); await tela(p, 'estado-07-modal-prato');
  await p.click('.modal__rodape .botao'); await p.waitForTimeout(500); await tela(p, 'estado-08-grupo-obrigatorio');
  await p.check('text=Ao ponto'); for (const o of ['Bacon', 'Queijo extra', 'Ovo']) await p.check(`.opcao:has-text("${o}") input`);
  await p.locator('.opcao:has-text("Cebola")').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await tela(p, 'estado-09-maximo-atingido');
  await p.click('.modal__rodape .botao'); await p.waitForTimeout(500); await tela(p, 'estado-10-adicionado-toast');
  { // gaveta com pedido abaixo do mínimo: contexto limpo, só um refrigerante
    const g = await pg(1440, 900); await ir(g, '#/restaurante/smash-do-bairro?item=42', 900); await g.click('.modal__rodape .botao'); await g.waitForTimeout(4500);
    await g.click('.botao-carrinho'); await g.waitForTimeout(700); await g.screenshot({ path: `${OUT}/estados/estado-11-gaveta-abaixo-do-minimo.png` }); await g.context().close();
  }
  await ir(p, '#/restaurante/pastelaria-madrugada?item=87'); await p.click('.modal__rodape .botao'); await p.waitForTimeout(600); await tela(p, 'estado-12-confirmar-outro-restaurante');
  await p.click('.modal:has-text("novo carrinho") .botao--fantasma'); await p.keyboard.press('Escape');
  await ir(p, '#/checkout', 900); await tela(p, 'estado-13-login-pedido-pelo-checkout');
  await p.click('.entrar__form .botao'); await p.waitForTimeout(1300); await tela(p, 'estado-14-login-422');
  await p.fill('#email', 'cliente@sabor.com.br'); await p.fill('#senha', 'Sabor2026!'); await p.click('.entrar__form .botao'); await p.waitForTimeout(1500);
  await ir(p, '#/restaurante/smash-do-bairro?item=40', 900); await p.click('.modal__rodape .botao'); await p.waitForTimeout(400);
  await ir(p, '#/checkout'); await p.type('#f-cep', '01001000'); await p.waitForTimeout(1300); await tela(p, 'estado-15-cep-fora-da-area');
  await p.fill('#f-cep', ''); await p.type('#f-cep', '03164000'); await p.waitForTimeout(1300); await p.fill('#f-numero', '45'); await tela(p, 'estado-16-cep-encontrado');
  await p.click('.checkout__botoes .botao'); await p.waitForTimeout(500);
  await p.check('.pagamento:has-text("Dinheiro") input'); await p.check('.troco input[type=checkbox]'); await p.fill('#f-troco', '50');
  await p.click('.checkout__botoes .botao:has-text("Continuar")'); await p.waitForTimeout(400); await tela(p, 'estado-17-troco-invalido');
  await p.fill('#f-troco', '200,00'); await p.click('.checkout__botoes .botao:has-text("Continuar")'); await p.waitForTimeout(600);
  await p.fill('#f-cupom', 'VERAO2025'); await p.click('.cupom .botao'); await p.waitForTimeout(1200); await tela(p, 'estado-18-cupom-vencido');
  await p.fill('#f-cupom', 'FRETEGRATIS'); await p.click('.cupom .botao'); await p.waitForTimeout(1200); await tela(p, 'estado-19-cupom-frete-gratis');
  await p.click('.checkout__botoes .botao:not(.botao--fantasma)'); await p.waitForURL(/#\/pedidos\/\d+/); await p.waitForTimeout(1200); await tela(p, 'estado-20-pedido-recebido');
  await p.click('text=Cancelar pedido'); await p.waitForTimeout(500); await tela(p, 'estado-21-confirmar-cancelamento');
  await p.keyboard.press('Escape');
  await ir(p, '#/pedidos/1006'); await p.click('.estrela >> nth=1'); await p.click('.avaliar .botao'); await p.waitForTimeout(300);
  await p.locator('.avaliar').scrollIntoViewIfNeeded(); await tela(p, 'estado-22-avaliacao-nota-baixa');
  await ir(p, '#/pedidos?pagina=2'); await tela(p, 'estado-23-pedidos-pagina-2');
  await p.context().close();

  // Tema escuro
  p = await pg(1440, 900, 'dark');
  await ir(p, '#/'); await tela(p, 'estado-24-tema-escuro');
  await ir(p, '#/restaurante/sushi-kaigan?item=' + 20); await tela(p, 'estado-25-tema-escuro-modal');
  await p.context().close();
  // Celular: barra do carrinho e modal como folha de baixo
  p = await pg(375, 812);
  await encher(p); await ir(p, '#/restaurante/smash-do-bairro'); await tela(p, 'estado-26-celular-barra-carrinho');
  await ir(p, '#/restaurante/smash-do-bairro?item=39'); await tela(p, 'estado-27-celular-modal');
  await p.context().close();

  console.log(erros.length ? 'ERROS: ' + erros.join(' | ') : 'ok, sem erros');
  await br.close();
})();
