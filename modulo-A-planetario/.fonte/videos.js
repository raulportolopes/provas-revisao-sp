// Grava os vídeos de referência (um por tarefa animada) a partir da solução.
// Uso: node videos.js <p1|p2> <pasta_saida>
// Cursor = círculo; teclas aparecem na tela; legendas amarelas explicam o efeito
// (as legendas não fazem parte da página, como nos vídeos do simulado de Jacareí).
const { chromium } = require('playwright');
const fs = require('fs');
const [PROJ, OUT] = process.argv.slice(2);
const BASE = PROJ === 'p1' ? 'http://127.0.0.1:8101/XXX_modulo_a/' : 'http://127.0.0.1:8102/XXX_modulo_a/';
fs.mkdirSync(OUT, { recursive: true });

const OVERLAY = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;border-radius:50%;background:rgba(255,209,102,.55);border:2px solid #111;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%)';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(255,92,122,.8)'; }, true);
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(255,209,102,.55)'; }, true);
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:2147483647;right:20px;top:20px;padding:8px 16px;border-radius:8px;background:#fff;color:#111;font:700 20px Arial;box-shadow:0 4px 14px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.documentElement.appendChild(k);
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter', ' ': 'Espaço' };
    document.addEventListener('keydown', e => {
      let n = nomes[e.key];
      if (e.ctrlKey && /^[zy]$/i.test(e.key)) n = 'Ctrl+' + e.key.toUpperCase();
      if (!n) return; k.textContent = n; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 900);
    }, true);
    const l = document.createElement('div');
    l.id = '__legenda';
    l.style.cssText = 'position:fixed;z-index:2147483646;left:50%;bottom:18px;transform:translateX(-50%);max-width:90%;padding:8px 16px;border-radius:6px;background:rgba(0,0,0,.78);color:#FFE600;font:700 20px Arial;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s';
    document.documentElement.appendChild(l);
  });
};

async function gravar(nome, url, vp, fn) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo', colorScheme: 'light' });
  await ctx.addInitScript(OVERLAY);
  await ctx.addInitScript(() => { try { if (!sessionStorage.__limpo) { localStorage.clear(); sessionStorage.__limpo = 1; } } catch (e) {} });
  const p = await ctx.newPage();
  const w = ms => p.waitForTimeout(ms);
  const leg = async t => { await p.evaluate(t => { const l = document.getElementById('__legenda'); if (!l) return; l.textContent = t || ''; l.style.opacity = t ? 1 : 0; }, t); };
  const centro = async (sel, n = 0) => { const el = p.locator(sel).nth(n); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); return [bx.x + bx.width / 2, bx.y + bx.height / 2, bx]; };
  const move = async (sel, n = 0, steps = 18) => { const [x, y] = await centro(sel, n); await p.mouse.move(x, y, { steps }); };
  const clicar = async (sel, n = 0) => { await move(sel, n); await w(250); await p.locator(sel).nth(n).click(); };
  const digitar = async (sel, txt, d = 110) => { await clicar(sel); await p.keyboard.type(txt, { delay: d }); };
  await p.goto(BASE + url);
  await w(700);
  await fn({ p, w, leg, move, clicar, digitar, centro });
  await w(700);
  const v = p.video();
  await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/${nome}.webm`);
  fs.rmSync(OUT + '/tmp-' + nome, { recursive: true, force: true });
  console.log('ok', nome);
}

const D = { width: 1280, height: 720 };

const P1 = async () => {
  await gravar('referencia_a1e', 'A1-E/', D, async ({ p, w, leg, move }) => {
    await leg('Repouso: a borda em degradê gira sem parar (4 s por volta)'); await w(3500);
    await leg('Hover: sobe 4 px, brilho violeta, letras se afastam e um ponto amarelo orbita'); await move('.btn-orbita'); await w(3500);
    await leg('Pressionado: volta para baixo, encolhe (0,96) e o brilho diminui'); await p.mouse.down(); await w(1500); await p.mouse.up(); await w(900);
    await leg('Tirar o mouse: tudo volta animado'); await p.mouse.move(200, 150, { steps: 20 }); await w(1500);
    await leg('Foco pelo teclado (Tab): contorno amarelo tracejado'); await p.keyboard.press('Tab'); await w(2200);
  });
  await gravar('referencia_a2m', 'A2-M/', D, async ({ p, w, leg, clicar, move }) => {
    await leg('Anel 3D com 8 cartões; o planeta escolhido fica na frente, maior e flutuando'); await w(2500);
    for (const n of ['Terra', 'Saturno', 'Netuno']) { await leg(`Clique no nome "${n}": o anel gira 0,8 s até ele`); await clicar(`label:has-text("${n}")`); await w(1800); }
    await leg('Teclado: Tab chega no rádio marcado e as setas trocam de planeta'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await w(500);
    for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight']) { await p.keyboard.press(k); await w(1300); }
    await leg('Cartões de costas não aparecem espelhados'); await clicar('label:has-text("Mercúrio")'); await w(1800);
  });
  await gravar('referencia_a3h', 'A3-H/', D, async ({ p, w, leg, move }) => {
    await leg('Sem o mouse: barras em zero, rosca invisível e medidor em 0%'); await w(2200);
    await leg('Hover no cartão das barras: sobem uma depois da outra (0,15 s) e o valor aparece no fim'); await move('.cartao--barras'); await w(2800);
    await leg('Hover na rosca: desenha no sentido horário a partir das 12 h, com o total no centro'); await move('.cartao--rosca'); await w(2400);
    await leg('Saindo: barras descem juntas; a rosca some no sentido anti-horário'); await w(1000);
    await leg('Hover no medidor: ponteiro, arco e número sobem juntos de 0 até 72%'); await move('.cartao--medidor'); await w(2500);
    await leg('Saindo: tudo volta a zero'); await p.mouse.move(640, 650, { steps: 15 }); await w(2000);
    await p.setViewportSize({ width: 375, height: 720 }); await leg('375 px: uma coluna, sem rolagem lateral'); await w(1500);
    await move('.cartao--barras'); await w(2200);
  });
  await gravar('referencia_b1e', 'B1-E/', D, async ({ p, w, leg, digitar, clicar }) => {
    await leg('Nenhum erro ao abrir; botão Confirmar desabilitado'); await w(1800);
    await leg('Nome precisa de nome e sobrenome'); await digitar('#nome', 'Ana'); await w(900); await p.keyboard.type(' Clara', { delay: 110 }); await w(700);
    await leg('E-mail validado enquanto digita'); await digitar('#email', 'ana@senai'); await w(900); await p.keyboard.type('.br', { delay: 110 }); await w(700);
    await leg('Máscara: as barras entram sozinhas; 31/04 não existe'); await digitar('#nascimento', '31042010', 160); await w(1400);
    await p.fill('#nascimento', ''); await leg('Idade mínima de 12 anos na data da sessão (12/12/2026)'); await digitar('#nascimento', '13122014', 160); await w(1500);
    await p.fill('#nascimento', ''); await leg('12/12/2014: completa 12 anos no dia da sessão → válido'); await digitar('#nascimento', '12122014', 160); await w(1300);
    await leg('Contador de caracteres: amarelo a partir de 180, vermelho acima de 200'); await clicar('#obs'); await p.keyboard.type('Gostaria de ver Saturno. '.repeat(8), { delay: 5 }); await w(1300);
    await p.fill('#obs', 'Primeira vez no planetário.'); await p.locator('#obs').dispatchEvent('input'); await w(600);
    await leg('Tudo válido: botão habilitado; envio mostra a mensagem sem recarregar'); await clicar('#enviar'); await w(2200);
    await leg('Limpar apaga campos, cores e mensagens'); await digitar('#nome', 'x'); await w(600); await clicar('#limpar'); await w(1600);
  });
  await gravar('referencia_b2m', 'B2-M/', D, async ({ p, w, leg, digitar, clicar }) => {
    await leg('6 por página; anterior desabilitado na página 1'); await w(1800);
    await leg('Busca sem acento e sem maiúscula: "acrux" acha Cruzeiro do Sul'); await digitar('#busca', 'acrux', 160); await w(1500);
    await p.fill('#busca', ''); await p.locator('#busca').dispatchEvent('input');
    await leg('Chip Sul + ordenar por estrela mais brilhante; a URL guarda o estado'); await clicar('.chip[data-hemisferio="Sul"]'); await w(900); await p.selectOption('#ordem', 'brilho'); await w(1500);
    await leg('Página 2'); await clicar('#paginacao button[aria-label="Página 2"]'); await w(1500);
    await leg('F5: busca, filtros, ordem e página voltam iguais'); await p.reload(); await w(1800);
    await leg('Ver detalhes abre o modal; setas ← → andam na lista filtrada (circular)'); await clicar('.card button', 1); await w(1300);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight']) { await p.keyboard.press(k); await w(1000); }
    await leg('Esc fecha e o foco volta ao botão'); await p.keyboard.press('Escape'); await w(1300);
    await leg('Clique no fundo escuro também fecha'); await clicar('.card button', 0); await w(1000); await p.mouse.move(40, 40, { steps: 15 }); await p.mouse.click(40, 40); await w(1200);
    await leg('Sem resultados: aviso e botão Limpar filtros'); await digitar('#busca', 'zzz', 140); await w(1300); await clicar('#limpar'); await w(1300);
  });
  await gravar('referencia_b3h', 'B3-H/', D, async ({ p, w, leg, clicar, centro }) => {
    const [, , bx] = await centro('#mapa');
    const pt = (x, y) => [bx.x + x * bx.width / 800, bx.y + y * bx.height / 500];
    const ir = async (x, y) => { const [a, b] = pt(x, y); await p.mouse.move(a, b, { steps: 16 }); };
    const clk = async (x, y) => { await ir(x, y); await w(250); await p.mouse.down(); await p.mouse.up(); await w(500); };
    await leg('Hover numa estrela: dica com nome e magnitude; cursor de mãozinha'); await ir(110, 90); await w(1300); await ir(230, 370); await w(1300);
    await leg('Clique em duas estrelas: cria a ligação'); await clk(110, 90); await clk(165, 220); await clk(165, 220); await clk(230, 370); await clk(190, 210); await clk(210, 110); await w(600);
    await leg('Ligação repetida (em qualquer sentido) não é criada'); await clk(230, 370); await clk(165, 220); await w(1300);
    await leg('Ctrl+Z desfaz, Ctrl+Y refaz'); await p.keyboard.press('Control+z'); await w(1000); await p.keyboard.press('Control+z'); await w(1000); await p.keyboard.press('Control+y'); await w(1200);
    await leg('Limpar também pode ser desfeito'); await clicar('#limpar'); await w(1000); await clicar('#desfazer'); await w(1200);
    await leg('Teclado: Tab até o mapa, setas escolhem, Enter liga'); await p.focus('#mapa'); await w(400);
    for (const k of ['ArrowRight', 'ArrowRight', 'Enter', 'ArrowRight', 'ArrowRight', 'Enter']) { await p.keyboard.press(k); await w(650); }
    await leg('F5: as ligações continuam (localStorage)'); await p.reload(); await w(1600);
    await leg('Importar JSON (arquivo inválido mostra o motivo)'); await p.setInputFiles('#arquivo', '/tmp/ruim.json'); await w(1500);
    await p.setInputFiles('#arquivo', '/home/user/rev/fonte/p1_orion.json'); await w(1500);
  });
};

const P2 = async () => {
  await gravar('referencia_a1e', 'A1-E/', D, async ({ p, w, leg, move }) => {
    await leg('Repouso: fundo branco, borda café, ícone de sacola'); await w(1800);
    await leg('Hover: o "café" sobe de baixo para cima em onda e o texto fica creme'); await move('.btn-add'); await w(2600);
    await leg('Pressionado: escala 0,96'); await p.mouse.down(); await w(900);
    await leg('Clique: vira "Adicionado" (texto desliza), fundo verde e ícone vira ✓'); await p.mouse.up(); await w(1500);
    await p.mouse.move(150, 120, { steps: 18 }); await w(1300);
    await leg('Clique de novo: volta ao estado inicial'); await move('.btn-add'); await p.mouse.down(); await p.mouse.up(); await w(1200); await p.mouse.move(150, 120, { steps: 18 }); await w(1300);
    await leg('Teclado: Tab dá foco (contorno caramelo), Espaço marca'); await p.keyboard.press('Tab'); await w(1000); await p.keyboard.press(' '); await w(1500);
  });
  await gravar('referencia_a2m', 'A2-M/', D, async ({ p, w, leg, centro }) => {
    await leg('O cartão inclina para o lado do cursor: a parte sob o mouse afunda'); await w(1500);
    for (const n of [0, 1, 2]) {
      const [, , b] = await centro('.cartao', n);
      const pts = [[.15, .15], [.5, .15], [.85, .15], [.85, .5], [.85, .85], [.5, .85], [.15, .85], [.15, .5], [.5, .5]];
      if (n === 0) await leg('9 zonas: cantos, lados e centro; brilho acompanha a zona');
      if (n === 1) await leg('Pacote, selo e nome em profundidades diferentes (paralaxe)');
      if (n === 2) await leg('Ao sair, volta para reto em 0,5 s');
      for (const [fx, fy] of pts) { await p.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 12 }); await w(450); }
    }
    await p.mouse.move(640, 690, { steps: 15 }); await w(1300);
  });
  await gravar('referencia_a3h', 'A3-H/', D, async ({ p, w, leg, move }) => {
    await leg('Barra de progresso de leitura no topo acompanha a rolagem'); await w(1200);
    await leg('Cartões do cardápio aparecem ao entrar na tela (rolagem)');
    for (let y = 0; y <= 1400; y += 120) { await p.mouse.wheel(0, 120); await w(160); }
    await move('.item', 1); await leg('Hover no cartão: zoom na imagem'); await w(1300);
    await leg('Acordeão: só um aberto por vez, + vira ×'); await p.locator('#duvidas').scrollIntoViewIfNeeded(); await w(500);
    for (const n of [1, 2, 3]) { await move('.faq summary', n); await p.locator('.faq summary').nth(n).click(); await w(1100); }
    await p.setViewportSize({ width: 375, height: 720 }); await p.evaluate(() => scrollTo(0, 0)); await w(800);
    await leg('375 px: menu hambúrguer só com CSS (vira X)'); await move('.menu-botao'); await p.locator('.menu-botao').click(); await w(1500); await p.locator('.menu-botao').click(); await w(1000);
    await leg('375 px: tabela de preços vira cartões com rótulos'); await p.locator('#precos').scrollIntoViewIfNeeded(); await w(400); await p.mouse.wheel(0, 300); await w(1800);
  });
  await gravar('referencia_b1e', 'B1-E/', D, async ({ p, w, leg, clicar }) => {
    await leg('Sistema (padrão): segue o tema do computador'); await w(1800);
    await leg('Escuro'); await clicar('[data-tema="escuro"]'); await w(1500);
    await leg('Claro'); await clicar('[data-tema="claro"]'); await w(1500);
    await leg('Setas trocam a opção (padrão de rádio)'); await p.keyboard.press('ArrowRight'); await w(1100); await p.keyboard.press('ArrowRight'); await w(1100);
    await leg('Sistema + computador mudou para escuro: a página acompanha na hora'); await p.emulateMedia({ colorScheme: 'dark' }); await w(1600);
    await leg('Tamanho do texto A− / A / A+'); await clicar('[data-fonte="grande"]'); await w(1200); await clicar('[data-fonte="pequena"]'); await w(1200); await clicar('[data-fonte="grande"]'); await w(900);
    await leg('F5: tudo volta como estava, sem piscar'); await p.reload(); await w(1800);
  });
  await gravar('referencia_b2m', 'B2-M/', D, async ({ p, w, leg, clicar }) => {
    await leg('Abas: clique ou setas ← → (circular)'); await clicar('#aba-metodos'); await w(900); await p.keyboard.press('ArrowRight'); await w(900); await p.keyboard.press('ArrowRight'); await w(900);
    await leg('Tamanho muda o preço; quantidade de 1 a 10'); await clicar('.produto[data-id="2"] label:has-text("Grande")'); await w(700); await clicar('.produto[data-id="2"] [data-passo="1"]'); await w(500);
    await leg('Adicionar: soma no carrinho e o contador pula'); await clicar('.produto[data-id="2"] [data-adicionar]'); await w(1200);
    await clicar('#aba-acompanhamentos'); await clicar('.produto[data-id="9"] [data-adicionar]'); await w(1000);
    await leg('Cupom inválido x TORRA10 (10%)'); await clicar('#cupom'); await p.keyboard.type('abc', { delay: 120 }); await clicar('#form-cupom button'); await w(1100);
    await p.fill('#cupom', ''); await p.keyboard.type('torra10', { delay: 120 }); await clicar('#form-cupom button'); await w(1300);
    await leg('Frete grátis a partir de R$ 150,00 (depois do desconto)');
    for (let i = 0; i < 4; i++) { await clicar('.linha [data-linha-passo="1"]', 0); await w(400); }
    await w(1000);
    await leg('Finalizar: modal com resumo; Esc fecha'); await clicar('#finalizar'); await w(1300); await p.keyboard.press('Escape'); await w(900);
    await leg('Confirmar: número do pedido, data e hora; carrinho esvazia'); await clicar('#finalizar'); await w(700); await clicar('#m-confirmar'); await w(2000); await clicar('#m-fechar'); await w(900);
  });
  await gravar('referencia_b3h', 'B3-H/', D, async ({ p, w, leg, clicar }) => {
    const A = '/home/user/rev/fonte/p2assets/B3-H/';
    await leg('Nota com estrelas (hover pinta as anteriores)'); await clicar('label[for="n4"]'); await w(900);
    await leg('Arquivos recusados mostram o motivo: GIF disfarçado de .jpg, 1,6 MB e PDF');
    await p.setInputFiles('#arquivos', [A + 'xicara-1.jpg', A + 'animacao-disfarcada.jpg', A + 'foto-grande-1-6mb.jpg', A + 'cardapio.pdf', A + 'grao-3.webp']); await w(2600);
    await leg('Limite de 6 fotos e foto repetida'); await p.setInputFiles('#arquivos', [A + 'balcao-2.png', A + 'bolo-4.jpg', A + 'latte-5.jpg', A + 'vitrine-6.png', A + 'extra-7.jpg', A + 'xicara-1.jpg']); await w(2600);
    await leg('Reordenar com os botões ◀ ▶; a primeira vira Capa'); await clicar('.foto[data-i="1"] [data-mover="-1"]'); await w(1200);
    await leg('Reordenar arrastando'); await p.dragAndDrop('.foto[data-i="5"]', '.foto[data-i="0"]'); await w(1400);
    await leg('Lightbox: setas ← → (circular), contador e Esc'); await clicar('.foto[data-i="0"] [data-abrir]'); await w(1000);
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowRight']) { await p.keyboard.press(k); await w(900); }
    await p.keyboard.press('Escape'); await w(900);
    await leg('Remover e publicar'); await clicar('.foto[data-i="2"] [data-remover]'); await w(900); await clicar('#publicar'); await w(1800);
  });
};

(PROJ === 'p1' ? P1 : P2)().catch(e => { console.error(e); process.exit(1); });
