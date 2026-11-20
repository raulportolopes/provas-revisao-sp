// Grava um vídeo por animação/interação da solução Zela Bairro, com cursor visível,
// teclas na tela e legenda amarela explicando o que acontece.
// Uso: node videos.js <pasta_saida_webm> <foto.jpg>   (servidor em localhost:8801, dados resetados)
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2]; const FOTO = process.argv[3];
const B = 'http://localhost:8801/index.html';
fs.mkdirSync(OUT, { recursive: true });

const OVERLAY = () => {
  // As camadas do vídeo usam popover para ficar ACIMA do <dialog> aberto (top layer).
  const camada = (el) => { el.setAttribute('popover', 'manual'); el.style.margin = '0'; el.style.border = '0'; el.style.overflow = 'visible'; ['top', 'right', 'bottom', 'left'].forEach(l => { if (!el.style[l]) el.style[l] = 'auto'; }); return el; };
  const subir = () => document.querySelectorAll('[data-camada]').forEach(el => { try { el.hidePopover(); el.showPopover(); } catch (_) {} });
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;border-radius:50%;background:rgba(245,158,11,.55);border:2px solid #fff;pointer-events:none;left:-40px;top:-40px;transform:translate(-50%,-50%);box-shadow:0 0 0 1px #0003';
    document.documentElement.appendChild(c); c.dataset.camada = 1;
    document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { c.style.background = 'rgba(220,38,38,.8)'; }, true);
    document.addEventListener('mouseup', () => { c.style.background = 'rgba(245,158,11,.55)'; }, true);
    const k = document.createElement('div');
    k.style.cssText = 'position:fixed;z-index:2147483647;left:50%;bottom:110px;transform:translateX(-50%);padding:10px 22px;border-radius:10px;background:#fff;color:#111;font:700 24px Arial;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s;pointer-events:none';
    document.documentElement.appendChild(k); k.dataset.camada = 1;
    let t; const nomes = { ArrowRight: 'Tecla →', ArrowLeft: 'Tecla ←', ArrowUp: 'Tecla ↑', ArrowDown: 'Tecla ↓', Escape: 'Tecla Esc', Tab: 'Tecla Tab', Enter: 'Tecla Enter' };
    document.addEventListener('keydown', e => { if (!nomes[e.key]) return; k.textContent = nomes[e.key]; k.style.opacity = 1; clearTimeout(t); t = setTimeout(() => (k.style.opacity = 0), 800); }, true);
    const l = document.createElement('div'); l.id = '__legenda';
    l.style.cssText = 'position:fixed;z-index:2147483647;left:50%;top:14px;transform:translateX(-50%);max-width:92%;padding:8px 18px;border-radius:8px;background:#FDE047;color:#111;font:700 18px Arial;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .25s';
    document.documentElement.appendChild(l); l.dataset.camada = 1;
    document.querySelectorAll('[data-camada]').forEach(camada); subir();
    new MutationObserver(subir).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open'] });
    window.__legenda = (txt) => { l.textContent = txt; l.style.opacity = txt ? 1 : 0; };
  });
};

async function gravar(nome, vp, fn) {
  if (fs.existsSync(`${OUT}/${nome}.webm`)) return;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo' });
  await ctx.addInitScript(OVERLAY);
  const p = await ctx.newPage();
  const w = ms => p.waitForTimeout(ms);
  const leg = async (t, ms = 0) => { await p.evaluate(t => window.__legenda && window.__legenda(t), t); if (ms) await w(ms); };
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); await p.locator(sel).first().click(); };
  const rolar = async (y, sel) => { await p.evaluate(([y, sel]) => (sel ? document.querySelector(sel) : window).scrollTo({ top: y, behavior: 'smooth' }), [y, sel]); await w(1100); };
  const ir = async h => { await p.goto(B + h); await p.waitForSelector('#carregando[hidden]', { state: 'attached' }); await p.evaluate(() => document.fonts.ready); };
  const login = async () => { await clicar('#btn-equipe'); await w(400); await p.locator('#l-usuario').pressSequentially('marta', { delay: 70 }); await p.locator('#l-senha').pressSequentially('Zela@2026', { delay: 50 }); await clicar('#form-login [type=submit]'); await w(900); };
  await fn({ p, w, leg, move, clicar, rolar, ir, login });
  await w(700);
  const v = p.video();
  await ctx.close(); await b.close();
  fs.renameSync(await v.path(), `${OUT}/${nome}.webm`);
  fs.rmSync(OUT + '/tmp-' + nome, { recursive: true, force: true });
  console.log('ok', nome);
}

const D = { width: 1440, height: 900 };
const M = { width: 375, height: 812 };

(async () => {
  await gravar('01-menu-link-ativo-e-transicao-de-tela', D, async ({ p, w, leg, move, clicar, ir }) => {
    await ir('#/painel'); await leg('Link ativo: fundo verde-claro + aria-current="page"', 1200);
    for (const r of ['mapa', 'indicadores']) { await move(`.menu a[data-rota="${r}"]`); await w(600); }
    await leg('Hover nos outros links: fundo cinza');
    await w(600);
    await leg('Troca de tela sem recarregar: a nova tela sobe 10 px com fade (0,35 s)');
    for (const r of ['mapa', 'indicadores', 'painel']) { await clicar(`.menu a[data-rota="${r}"]`); await w(1400); }
    await leg('F5 e botão Voltar mantêm o link ativo certo'); await clicar('.menu a[data-rota="mapa"]'); await w(700);
    await p.reload(); await w(1300); await p.goBack(); await w(1300);
  });

  await gravar('02-card-hover-e-apoio', D, async ({ p, w, leg, move, clicar, ir }) => {
    await ir('#/painel'); await w(600);
    await leg('Hover no card: sobe 3 px e a sombra aumenta');
    for (const id of [11, 9, 14, 13]) { await move(`.card[data-id="${id}"]`, 14); await w(900); }
    await leg('Etiqueta "Atrasado" com ponto pulsando (só CSS) e borda em degradê vermelho'); await move('.card[data-id="6"]'); await w(2200);
    await leg('Apoiar: +1, ícone dá um "pop" e o botão fica marcado e desabilitado');
    await clicar('.card[data-id="4"] [data-apoiar]'); await w(1800);
    await leg('Toast de confirmação sobe da parte de baixo e some sozinho em 3 s', 2600);
  });

  await gravar('03-filtros-busca-e-url', D, async ({ p, w, leg, move, clicar, ir }) => {
    await ir('#/painel'); await w(600);
    await leg('Busca em tempo real, sem acento e sem maiúsculas ("CALCADA" acha "Calçada")');
    await clicar('#f-busca'); await p.keyboard.type('CALCADA', { delay: 150 }); await w(1500);
    for (let i = 0; i < 7; i++) { await p.keyboard.press('Backspace'); await w(50); }
    await leg('Chip de categoria: um ativo por vez (chip--ativo + aria-pressed)');
    await clicar('#f-categorias .chip[data-categoria="2"]'); await w(1200);
    await clicar('#f-categorias .chip[data-categoria="1"]'); await w(1200);
    await leg('Interruptor "Só atrasados" combina com o chip'); await clicar('#f-atrasados'); await w(1600);
    await leg('Os filtros ficam na URL: o F5 devolve a mesma tela'); await p.reload(); await w(2000);
    await leg('Nada encontrado: aviso + botão Limpar filtros'); await clicar('#f-busca'); await p.keyboard.type('xyz', { delay: 150 }); await w(1400);
    await clicar('#limpar-filtros'); await w(1400);
  });

  await gravar('04-modal-detalhe', D, async ({ p, w, leg, clicar, ir }) => {
    await ir('#/painel'); await w(600);
    await leg('Detalhe: modal (<dialog>) entra subindo com escala; fundo escurece com desfoque');
    await clicar('.card[data-id="1"] [data-detalhe]'); await w(2200);
    await leg('Linha do tempo do histórico com a cor de cada situação', 1800);
    await leg('Fecha com Esc, e o foco volta para o card que abriu'); await p.keyboard.press('Escape'); await w(1500);
    await leg('Fecha com o X'); await clicar('.card[data-id="7"] [data-detalhe]'); await w(1200); await clicar('#modal-detalhe [data-fechar]'); await w(1200);
    await leg('Fecha com clique no fundo escuro (clique dentro não fecha)'); await clicar('.card[data-id="3"] [data-detalhe]'); await w(1000);
    await p.mouse.move(700, 450, { steps: 10 }); await p.mouse.click(700, 450); await w(700);
    await p.mouse.move(60, 450, { steps: 16 }); await w(300); await p.mouse.click(60, 450); await w(1300);
  });

  await gravar('05-abrir-chamado-validacao-mapa-foto', D, async ({ p, w, leg, clicar, ir }) => {
    await ir('#/painel'); await w(500);
    await clicar('#btn-abrir'); await w(900);
    await leg('Enviar vazio: todos os erros aparecem juntos e tremem; foco vai para o 1º campo inválido');
    await clicar('#n-enviar'); await w(2200);
    await leg('Validação ao vivo: o erro some assim que o campo fica válido');
    await p.locator('#n-titulo').pressSequentially('Placa de rua caída', { delay: 60 }); await w(400);
    await p.selectOption('#n-categoria', '5'); await w(500);
    await clicar('#n-descricao'); await p.keyboard.type('A placa com o nome da rua caiu na calçada.', { delay: 25 }); await w(400);
    await clicar('#n-rua'); await p.keyboard.type('Rua Paineira, 200', { delay: 40 }); await w(500);
    await leg('Local: clique no mapa = pino "cai" no ponto; setas do teclado ajustam (Shift = 5%)');
    const mm = p.locator('#mini-mapa'); await mm.scrollIntoViewIfNeeded(); const bx = await mm.boundingBox();
    await p.mouse.move(bx.x + bx.width * .3, bx.y + bx.height * .4, { steps: 16 }); await w(300); await p.mouse.click(bx.x + bx.width * .3, bx.y + bx.height * .4); await w(1200);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown']) { await p.keyboard.down('Shift'); await p.keyboard.press(k); await p.keyboard.up('Shift'); await w(700); }
    await leg('Foto: prévia com FileReader, nome e tamanho; botões Trocar e Remover');
    await p.setInputFiles('#n-foto', FOTO); await p.evaluate(() => document.getElementById('modal-novo').scrollTo({ top: 999, behavior: 'smooth' })); await w(2000);
    await clicar('#foto-remover'); await w(1000); await p.setInputFiles('#n-foto', FOTO); await w(1000);
    await leg('Enviado: check verde se desenha e aparece o protocolo ZB-AAAA-NNNN');
    await clicar('#n-enviar'); await w(2600);
    await clicar('#copiar-protocolo'); await w(1200);
    await leg('O card novo entra em "Aberto" com destaque amarelo'); await clicar('#novo-sucesso [data-fechar]'); await w(2200);
  });

  await gravar('06-equipe-mover-e-arrastar', D, async ({ p, w, leg, move, clicar, ir, login }) => {
    await ir('#/painel'); await w(500);
    await leg('Login da equipe: aparecem o selo da equipe e o botão Mover nos cards'); await login(); await w(800);
    await leg('Mover: o menu mostra SÓ as transições permitidas pela máquina de estados');
    await clicar('.card[data-id="2"] .mover summary'); await w(1300);
    await clicar('.card[data-id="2"] [data-mover="triagem"]'); await w(900);
    await clicar('#form-status [type=submit]'); await w(800);
    await leg('O card chega na nova coluna com destaque (escala + brilho amarelo)', 2000);
    await leg('Arrastar: coluna permitida fica tracejada; proibida fica apagada');
    await move('.card[data-id="11"]'); await w(400);
    await p.dragAndDrop('.card[data-id="11"]', '.coluna--triagem', { steps: 40 }); await w(1200);
    await clicar('#form-status [type=submit]'); await w(1800);
    await leg('Cancelar ou devolver exige observação com 10+ caracteres');
    await clicar('.card[data-id="3"] .mover summary'); await w(900);
    await clicar('.card[data-id="3"] [data-mover="aberto"]'); await w(900);
    await clicar('#form-status [type=submit]'); await w(1500);
    await clicar('#st-nota'); await p.keyboard.type('Morador pediu nova vistoria.', { delay: 40 }); await w(300);
    await clicar('#form-status [type=submit]'); await w(2200);
  });

  await gravar('07-mapa-pinos-e-lista-ligados', D, async ({ p, w, leg, move, clicar, ir }) => {
    await ir('#/painel'); await w(500);
    await leg('Pinos caem um depois do outro (atraso de 40 ms por pino)');
    await clicar('.menu a[data-rota="mapa"]'); await w(2000);
    await leg('Pino atrasado tem anel vermelho pulsando', 1500);
    await leg('Hover/foco no pino destaca o item da lista (e rola a lista até ele)');
    for (const id of [1, 6, 14, 5]) { await move(`#pinos .pino[data-id="${id}"]`); await w(1100); }
    await leg('Hover no item da lista destaca o pino no mapa');
    for (const n of [2, 4, 7]) { await move(`#lista-mapa .item-mapa:nth-child(${n})`); await w(1100); }
    await leg('Legenda: liga e desliga as situações mostradas');
    await clicar('#legenda input[value="concluido"]'); await w(1200); await clicar('#legenda input[value="cancelado"]'); await w(1400);
    await leg('Clique no pino abre o detalhe'); await clicar('#pinos .pino[data-id="10"]'); await w(1800);
  });

  await gravar('08-indicadores-graficos-css', D, async ({ p, w, leg, clicar, ir }) => {
    await ir('#/painel'); await w(500);
    await leg('Números contam de 0 até o valor (requestAnimationFrame, 0,9 s)');
    await clicar('.menu a[data-rota="indicadores"]'); await w(2000);
    await leg('Barras crescem em sequência: largura = --v %, atraso = --i × 120 ms');
    await clicar('.menu a[data-rota="painel"]'); await w(500); await clicar('.menu a[data-rota="indicadores"]'); await w(2400);
    await leg('Rosca com conic-gradient entra girando e crescendo', 1500);
  });

  await gravar('09-tema-claro-escuro', D, async ({ p, w, leg, clicar, ir }) => {
    await ir('#/painel'); await w(600);
    await leg('Tema escuro: troca as variáveis CSS; o ícone vira sol; fica salvo no localStorage');
    await clicar('#btn-tema'); await w(1600);
    await clicar('.menu a[data-rota="indicadores"]'); await w(2000);
    await leg('Recarregando a página o tema continua escuro'); await p.reload(); await w(2000);
    await clicar('#btn-tema'); await w(1500);
  });

  await gravar('10-celular-375', M, async ({ p, w, leg, clicar, rolar, ir }) => {
    await ir('#/painel'); await w(600);
    await leg('375 px: menu vira barra inferior fixa; Abrir chamado vira botão redondo', 1800);
    await leg('Colunas lado a lado com rolagem e encaixe (scroll-snap)');
    await p.evaluate(() => document.getElementById('kanban').scrollTo({ left: 330, behavior: 'smooth' })); await w(1300);
    await p.evaluate(() => document.getElementById('kanban').scrollTo({ left: 660, behavior: 'smooth' })); await w(1300);
    await p.evaluate(() => document.getElementById('kanban').scrollTo({ left: 0, behavior: 'smooth' })); await w(1000);
    await leg('Modal no celular sai de baixo, ocupando a largura'); await clicar('#btn-abrir'); await w(1600);
    await clicar('#modal-novo [data-fechar]'); await w(900);
    await leg('Nada fica escondido atrás da barra'); await rolar(5000); await w(600);
    await clicar('.menu a[data-rota="mapa"]'); await w(1500); await clicar('.menu a[data-rota="indicadores"]'); await w(2000);
  });

  await gravar('11-carregando-e-erro', D, async ({ p, w, leg, clicar }) => {
    let falhar = true;
    await p.route('**/api/chamados', async r => { await new Promise(s => setTimeout(s, 1800)); if (falhar) r.fulfill({ status: 500, contentType: 'application/json', body: '{"mensagem":"Erro interno do servidor."}' }); else r.continue(); });
    await p.goto(B + '#/painel'); await w(300);
    await leg('Carregando: pino quicando enquanto a API não responde', 1700);
    await leg('API com erro: aviso vermelho + botão Tentar novamente (sem F5)', 2200);
    falhar = false;
    await clicar('#tentar'); await w(3000);
  });
})();
