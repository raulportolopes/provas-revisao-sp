// Grava um vídeo por animação/interação da solução Copa Code, com cursor visível,
// teclas na tela e legenda amarela explicando o que acontece.
// Uso: node videos.js <pasta_saida_webm>   (servidor em localhost:8802, MySQL ligado)
const { chromium } = require('playwright');
const fs = require('fs');
const { preparar, token } = require('./torneio');
const OUT = process.argv[2];
const B = 'http://localhost:8802/#/';
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

// fase do banco antes de gravar; org = já entra logado (token no sessionStorage)
async function gravar(nome, vp, fase, org, fn) {
  if (fs.existsSync(`${OUT}/${nome}.webm`)) return;
  await preparar(fase);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: OUT + '/tmp-' + nome, size: vp }, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });
  await ctx.addInitScript(OVERLAY);
  if (org) { const t = await token(); await ctx.addInitScript((t) => sessionStorage.setItem('copa-org', JSON.stringify({ token: t, name: 'Coordenação da Copa' })), t); }
  const p = await ctx.newPage();
  const w = ms => p.waitForTimeout(ms);
  const leg = async (t, ms = 0) => { await p.evaluate(t => window.__legenda && window.__legenda(t), t); if (ms) await w(ms); };
  const move = async (sel, steps = 16) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps }); };
  const clicar = async (sel, steps = 16) => { await move(sel, steps); await w(250); await p.locator(sel).first().click(); };
  const digitar = async (sel, txt, d = 60) => { await clicar(sel); await p.locator(sel).pressSequentially(txt, { delay: d }); };
  const rolar = async (y) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await w(1000); };
  const ir = async (h) => { await p.goto(B + h); await p.waitForSelector('.tela'); await p.evaluate(() => document.fonts.ready); await w(400); };
  await fn({ p, w, leg, move, clicar, digitar, rolar, ir });
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
  await gravar('01-menu-link-ativo-e-transicao-de-tela', D, 'quartas', false, async ({ p, w, leg, move, clicar, ir }) => {
    await ir('equipes'); await leg('Link ativo: cor verde + barrinha que cresce embaixo (aria-current="page")', 1500);
    await leg('Troca de tela: a atual sai subindo e a nova entra de baixo com fade (Transition mode="out-in")');
    for (const t of ['Inscrição', 'Chaveamento', 'Partidas', 'Equipes']) { await clicar(`.menu a:has-text("${t}")`); await w(1300); }
    await leg('Em /partidas/semis o link "Partidas" continua ativo; o título da aba muda junto');
    await clicar('.menu a:has-text("Partidas")'); await w(700); await clicar('#aba-semis'); await w(1200);
    await leg('F5 e Voltar mantêm a tela e o link certos'); await p.reload(); await w(1400); await p.goBack(); await w(1300);
  });

  await gravar('02-filtros-na-url-e-cartoes', D, 'inicial', false, async ({ p, w, leg, move, clicar, digitar, ir }) => {
    await ir('equipes');
    await leg('Hover no cartão: sobe 3 px, sombra e borda na cor da escola');
    for (const n of ['Fênix', 'Bits', 'Lobos']) { await move(`.equipe:has-text("${n}")`, 14); await w(700); }
    await leg('Busca sem acento por nome, tag ou nick: os cartões saem, entram e se reorganizam (TransitionGroup)');
    await digitar('input[type=search]', 'fenix', 120); await w(1400);
    for (let i = 0; i < 5; i++) { await p.keyboard.press('Backspace'); await w(60); } await w(900);
    await leg('Escola e situação combinados; tudo fica na URL (?escola=2&status=confirmed)');
    await clicar('.filtros select'); await p.selectOption('.filtros select', '2'); await w(1200);
    await clicar('.chip:has-text("Confirmadas")'); await w(1300);
    await leg('F5: os filtros voltam sozinhos da URL'); await p.reload(); await w(1600);
    await leg('Sem resultado: aviso com "Limpar filtros"'); await clicar('.chip:has-text("Aguardando")'); await w(1300);
    await clicar('button:has-text("Limpar filtros")'); await w(1500);
  });

  await gravar('03-acordeao-jogadores', D, 'inicial', false, async ({ p, w, leg, clicar, ir }) => {
    await ir('equipes');
    await leg('Acordeão: a lista de jogadores abre animando a altura e a seta gira');
    await clicar('.equipe:has-text("Fênix") .equipe__abrir'); await w(1400);
    await leg('Só um aberto por vez: abrir outro fecha o anterior');
    await clicar('.equipe:has-text("Bits") .equipe__abrir'); await w(1400);
    await clicar('.equipe:has-text("Lobos") .equipe__abrir'); await w(1400);
    await leg('Clicar de novo fecha (aria-expanded volta a false)'); await clicar('.equipe:has-text("Lobos") .equipe__abrir'); await w(1300);
  });

  await gravar('04-inscricao-validacao-e-reserva', D, 'inicial', false, async ({ p, w, leg, clicar, digitar, ir, rolar }) => {
    await ir('inscricao');
    await leg('Enviar vazio: todos os erros aparecem juntos e o foco vai para o primeiro campo inválido');
    await clicar('button[type=submit]'); await w(1800); await rolar(0);
    await leg('Erro some ao corrigir; nome repetido é avisado na hora');
    await digitar('#f-nome', 'Fenix Rubra', 80); await p.keyboard.press('Tab'); await w(1300);
    await p.fill('#f-nome', ''); await digitar('#f-nome', 'Cometa Azul', 70);
    await leg('Tag sempre em maiúsculas, sem espaço, até 4; a prévia muda com a cor da escola');
    await digitar('#f-tag', 'c m t x z', 110); await w(500);
    await clicar('#f-escola'); await p.selectOption('#f-escola', '6'); await w(1300);
    await leg('Escolas com 2 equipes aparecem desabilitadas no select'); await w(1500);
    await leg('Idade calculada para 28/11/2026, ao lado do rótulo');
    await clicar('#nasc-0'); await p.keyboard.type('15032010', { delay: 90 }); await w(1300);
    await leg('+ Adicionar reserva: a linha entra deslizando e recebe o foco');
    await clicar('#btn-reserva'); await w(1500);
    await leg('Remover reserva: a linha sai e o foco volta para o botão'); await clicar('#btn-reserva'); await w(1600);
  });

  await gravar('05-inscricao-envio-e-sucesso', D, 'inicial', false, async ({ p, w, leg, clicar, ir, rolar }) => {
    await ir('inscricao');
    await leg('Formulário completo: capitão escolhido no rádio (só titulares)');
    await p.fill('#f-nome', 'Cometa Azul'); await p.fill('#f-tag', 'CMT'); await p.selectOption('#f-escola', '6');
    const nomes = ['Lia Moraes', 'Davi Torres', 'Caio Ramos', 'Bia Lopes', 'Enzo Faria'];
    for (let i = 0; i < 5; i++) { await p.fill('#nick-' + i, 'cometa' + (i + 1)); await p.fill('#nome-' + i, nomes[i]); await p.fill('#nasc-' + i, `2010-0${i + 2}-1${i}`); }
    await w(600); await clicar('input[name=capitao] >> nth=2'); await w(900);
    await leg('Inscrever: o cartão de sucesso entra com "pop" e um toast confirma');
    await clicar('button[type=submit]'); await w(2600);
    await leg('A nova equipe já aparece em Equipes, aguardando check-in');
    await clicar('.sucesso a:has-text("Ver equipes")'); await w(1200); await rolar(900); await w(1500);
  });

  await gravar('06-login-checkin-e-progresso', D, 'inicial', false, async ({ p, w, leg, clicar, digitar, ir }) => {
    await ir('equipes');
    await leg('Área da organização: modal com <dialog>, foco no usuário; senha errada mostra o erro');
    await clicar('button:has-text("Área da organização")'); await w(700);
    await p.locator('#l-usuario').pressSequentially('org', { delay: 90 }); await digitar('#l-senha', 'errada', 60); await p.keyboard.press('Enter'); await w(1400);
    await p.fill('#l-senha', ''); await digitar('#l-senha', 'Copa@2026', 50); await clicar('.modal button:has-text("Entrar")'); await w(1500);
    await leg('Logado: aparecem os botões de check-in, excluir e gerar (desabilitado: 7 de 8)'); await w(1600);
    await leg('Check-in: a barra de progresso cresce até 8/8 e as outras viram "Lista de espera"');
    await clicar('.equipe:has-text("Sorocrew") button:has-text("Fazer check-in")'); await w(2400);
    await move2(p, '.equipe:has-text("Ipês") .equipe__acoes .btn'); await w(1300);
    await leg('"Gerar chaveamento" agora está habilitado'); await move2(p, 'button:has-text("Gerar chaveamento")'); await w(1500);
  });

  await gravar('07-excluir-exige-tag', D, 'inicial', true, async ({ p, w, leg, clicar, digitar, ir }) => {
    await ir('equipes'); await w(400);
    await leg('Excluir abre um modal: o botão só habilita digitando a tag da equipe');
    await clicar('.equipe:has-text("Ipês") button:has-text("Excluir")'); await w(800);
    await digitar('#confirma-tag', 'ip', 200); await w(700); await p.keyboard.type('e', { delay: 100 }); await w(1100);
    await leg('Esc fecha com animação e o foco volta ao botão de origem'); await p.keyboard.press('Escape'); await w(1500);
    await leg('Confirmando: a equipe sai da grade e os outros cartões se reorganizam');
    await clicar('.equipe:has-text("Ipês") button:has-text("Excluir")'); await w(600);
    await digitar('#confirma-tag', 'IPE', 120); await clicar('.modal .btn--perigo'); await w(2500);
  });

  await gravar('08-gerar-chaveamento', D, 'inicial', true, async ({ p, w, leg, clicar, ir }) => {
    await ir('chaveamento');
    await leg('Antes de gerar: aviso com o atalho para as confirmadas (7/8)', 1600);
    await clicar('a:has-text("Ver confirmadas")'); await w(1300);
    await clicar('.chip:has-text("Todas")'); await w(700);
    await clicar('.equipe:has-text("Sorocrew") button:has-text("Fazer check-in")'); await w(1500);
    await leg('Gerar chaveamento: a API cria as 7 partidas e o app vai para a chave');
    await clicar('button:has-text("Gerar chaveamento")'); await w(2600);
    await leg('Seeds por ordem de check-in: 1×8, 4×5, 2×7, 3×6. Semis e final "A definir"', 2500);
  });

  await gravar('09-partidas-abas-contagem-e-placar', D, 'chave', true, async ({ p, w, leg, clicar, move, ir }) => {
    await ir('partidas/quartas');
    await leg('Contagem regressiva para a próxima partida, atualizando a cada segundo', 2600);
    await leg('Abas ligadas à rota (/partidas/semis); setas ← → trocam de aba pelo teclado');
    await clicar('#aba-quartas'); await w(500);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight']) { await p.keyboard.press(k); await w(1100); }
    await leg('Lançar placar: modal com as 4 opções válidas da melhor de 3');
    await clicar('.partida button:has-text("Lançar placar")'); await w(900);
    for (let i = 0; i < 4; i++) { await move(`.opcao >> nth=${i}`, 10); await w(450); }
    await clicar('.opcao >> nth=1'); await w(1800);
    await leg('Placar salvo: vencedor em destaque, perdedor apagado, toast "avança" e o contador da aba sobe', 2200);
    await leg('A próxima partida da contagem já é a seguinte'); await p.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' })); await w(1800);
  });

  await gravar('10-chave-caminho-e-chegada', D, 'quartas', true, async ({ p, w, leg, move, ir }) => {
    await ir('chaveamento');
    await leg('Hover (ou foco) numa equipe: o caminho dela fica azul e o resto apagado');
    for (const sel of ['.chave__coluna--0 .lado >> nth=0', '.chave__coluna--1 .lado >> nth=0', '.chave__coluna--0 .lado >> nth=3', '.chave__coluna--0 .lado >> nth=6']) { await move(sel, 12); await w(1100); }
    await p.mouse.move(700, 120, { steps: 10 }); await w(500);
    await leg('Quem vence entra na próxima fase deslizando (Transition com :key)');
    const ms = await p.evaluate(() => store.matches.filter((m) => m.stage === 'semifinal').map((m) => m.id));
    for (const id of ms) { await p.evaluate(async (id) => { store.matches = await API.score(id, 2, 1); }, id); await w(1600); }
  });

  await gravar('11-campea-e-modo-telao', D, 'semis', true, async ({ p, w, leg, clicar, ir }) => {
    await ir('partidas/final');
    await leg('Final: lançar o placar define a campeã');
    await clicar('.partida button:has-text("Lançar placar")'); await w(700); await clicar('.opcao >> nth=0'); await w(1800);
    await leg('Chave: troféu brilhando, confete caindo e o nome da campeã', 0);
    await clicar('.menu a:has-text("Chaveamento")'); await w(3200);
    // o gravador headless não desenha a tela cheia de verdade: aqui ela é imitada só para o vídeo
    await p.evaluate(() => {
      let fe = null; Object.defineProperty(document, 'fullscreenElement', { get: () => fe, configurable: true });
      Element.prototype.requestFullscreen = function () { fe = this; Object.assign(this.style, { position: 'fixed', inset: '0', zIndex: '100' }); document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
      document.exitFullscreen = function () { Object.assign(fe.style, { position: '', inset: '', zIndex: '' }); fe = null; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
    });
    await leg('Modo telão: Fullscreen API na área da chave; Esc ou o botão saem');
    await clicar('button:has-text("Modo telão")'); await w(3000);
    await p.evaluate(() => document.exitFullscreen()); await w(1500);
  });

  await gravar('12-celular-375', M, 'quartas', true, async ({ p, w, leg, clicar, ir }) => {
    await ir('equipes');
    await leg('375 px: menu vira barra fixa embaixo, ícone + texto', 1600);
    await p.evaluate(() => scrollTo({ top: 700, behavior: 'smooth' })); await w(1300);
    await clicar('.menu a:has-text("Chaveamento")'); await w(1200);
    await leg('Chave com rolagem lateral e encaixe por coluna (a página não rola para o lado)');
    for (const x of [300, 600, 900, 0]) { await p.evaluate((x) => document.querySelector('.chave').scrollTo({ left: x, behavior: 'smooth' }), x); await w(1200); }
    await clicar('.menu a:has-text("Partidas")'); await w(1000); await clicar('#aba-semis'); await w(900);
    await leg('Modal de placar com as opções em uma coluna'); await clicar('.partida button:has-text("Lançar placar")'); await w(1600);
    await p.keyboard.press('Escape'); await w(900);
  });

  await gravar('13-carregando-e-erro', D, 'inicial', false, async ({ p, w, leg, clicar }) => {
    let falhar = true;
    await p.route('**/api/teams', async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); falhar ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Erro no banco de dados."}' }) : r.continue(); });
    await p.goto(B + 'equipes'); await p.evaluate(() => window.__legenda && window.__legenda('Carregando: três barras animadas (só CSS) enquanto a API responde'));
    await w(2600); await leg('Falhou: aviso com a mensagem da API e "Tentar novamente"', 1600);
    falhar = false; await leg('Tentar novamente refaz os pedidos sem F5'); await clicar('button:has-text("Tentar novamente")'); await w(2800);
  });
})();

async function move2(p, sel) { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bx = await el.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 14 }); }
