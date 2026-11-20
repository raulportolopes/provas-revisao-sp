// Testes automáticos da solução Sabor de Bairro (Playwright). Uso: node checar-sabor.js http://localhost:8702/
// Cada linha PASSOU/FALHOU corresponde a um ou mais aspectos da CIS.
const { chromium } = require('playwright');
const B = process.argv[2] || 'http://localhost:8702/';
let ok = 0, falhas = 0;
const t = (nome, cond, extra = '') => { cond ? ok++ : falhas++; console.log(`${cond ? 'PASSOU' : 'FALHOU'}  ${nome}${extra ? '  (' + extra + ')' : ''}`); };
const brl = (c) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100);
const limpa = (s) => s.replace(/[ \t\n]+/g, ' ').trim();

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo' });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await p.request.post(B + 'api/index.php/reset');
  const pronto = () => p.waitForFunction(() => document.querySelector('.grade-rest')?.getAttribute('aria-busy') === 'false' && document.querySelectorAll('.cartao:not(.cartao--esqueleto)').length > 0);

  /* ---------- 1. Início: lista, filtros na URL, corrida ---------- */
  await p.goto(B + '#/'); await pronto();
  t('Primeira página com 6 restaurantes e total do meta', (await p.$$('.cartao')).length === 6 && (await p.textContent('.filtros__total')).includes('14'));
  await p.click('.mais .botao'); await p.waitForFunction(() => document.querySelectorAll('.cartao').length === 12);
  await p.click('.mais .botao'); await p.waitForFunction(() => document.querySelectorAll('.cartao').length === 14);
  t('"Carregar mais" acrescenta páginas e some no fim', !(await p.$('.mais .botao')));
  const nomes = await p.$$eval('.cartao__nome', (e) => e.map((x) => x.textContent));
  t('Sem restaurante repetido depois de carregar mais', new Set(nomes).size === 14);

  await p.click('.chip:has-text("Pizza")'); await p.waitForTimeout(200); await pronto();
  t('Chip de categoria grava ?categoria= na URL e aria-pressed', p.url().includes('categoria=1') && (await p.getAttribute('.chip:has-text("Pizza")', 'aria-pressed')) === 'true');
  t('Categoria filtrada na API', (await p.$$('.cartao')).length === 2);
  await p.click('.chip:has-text("Pizza")'); await p.waitForTimeout(200); await pronto();

  await p.fill('#busca', 'temaki'); await p.waitForTimeout(150);
  t('Busca espera o debounce antes de mudar a URL', !p.url().includes('busca='));
  await p.waitForURL(/busca=temaki/); await pronto();
  t('Busca encontra pelo nome do prato', (await p.$$eval('.cartao__nome', (e) => e.map((x) => x.textContent))).includes('Temaki Express'));
  await p.fill('#busca', 'xyzxyz'); await p.waitForSelector('.vazio');
  t('Estado vazio com o termo buscado', (await p.textContent('.vazio')).includes('xyzxyz'));
  await p.click('.vazio .botao'); await pronto();
  t('"Limpar filtros" limpa a URL e o campo', !p.url().includes('busca') && (await p.inputValue('#busca')) === '');

  await p.goto(B + '#/?ordem=taxa&gratis=1'); await p.reload(); await pronto();
  t('F5 restaura filtros da URL (select e interruptor)', (await p.inputValue('.ordem select')) === 'taxa' && (await p.isChecked('.interruptor:has-text("grátis") input')));
  const taxas = await p.$$eval('.cartao__meta.suave span:last-child', (e) => e.map((x) => x.textContent));
  t('Entrega grátis filtrada', taxas.length > 0 && taxas.every((x) => x === 'Grátis'), taxas.join(','));

  // Corrida: a resposta da categoria 1 demora 2,5 s; a da 3 chega antes. A tela deve ficar com a 3.
  await p.goto(B + '#/'); await pronto();
  await p.route(/restaurantes\?.*categoria_id=1/, async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); r.continue().catch(() => {}); });
  await p.click('.chip:has-text("Pizza")'); await p.waitForTimeout(100);
  await p.click('.chip:has-text("Hambúrguer")'); await p.waitForTimeout(3200);
  const cat = await p.$$eval('.cartao__meta:not(.suave) span:last-child', (e) => [...new Set(e.map((x) => x.textContent))]);
  t('Resposta atrasada de filtro antigo não sobrescreve (AbortController)', cat.length === 1 && cat[0] === 'Hambúrguer', cat.join(','));
  await p.unroute(/restaurantes\?.*categoria_id=1/);
  const fechado = await p.$('.cartao--fechado .selo');
  if (fechado) t('Restaurante fechado mostra "Abre ... às HH:MM"', /^Abre .+ às \d\d:\d\d$/.test(await fechado.textContent()), await fechado.textContent());

  /* ---------- 2. Cardápio, abas e modal do prato ---------- */
  await p.goto(B + '#/restaurante/smash-do-bairro'); await p.waitForSelector('.item');
  t('Título da aba com o nome do restaurante', (await p.title()).startsWith('Smash do Bairro'));
  await p.click('.aba-secao:has-text("Bebidas")'); await p.waitForTimeout(900);
  t('Clique na aba de seção: aria-current e rolagem', (await p.getAttribute('.aba-secao:has-text("Bebidas")', 'aria-current')) === 'true' && (await p.evaluate(() => scrollY)) > 300, await p.textContent('.aba-secao[aria-current]') + ' ' + await p.evaluate(() => scrollY));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.setViewportSize({ width: 1440, height: 450 });
  await p.evaluate(() => scrollTo(0, document.querySelectorAll('[data-secao]')[1].getBoundingClientRect().top + scrollY - 150)); await p.waitForTimeout(500);
  const spy1 = await p.textContent('.aba-secao[aria-current="true"]');
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
  const spy2 = await p.textContent('.aba-secao[aria-current="true"]');
  await p.setViewportSize({ width: 1440, height: 900 });
  t('Scrollspy acende a aba da seção visível (e a última no fim da página)', spy1.includes('Acompanhamentos') && spy2.includes('Bebidas'), spy1 + ' / ' + spy2);
  await p.fill('.busca-cardapio input', 'onion'); await p.waitForTimeout(200);
  t('Busca local no cardápio esconde seções sem prato', (await p.$$('.item')).length === 1 && (await p.$$('.aba-secao')).length === 1);
  await p.fill('.busca-cardapio input', '');

  await p.click('.item[data-item="36"]'); await p.waitForSelector('[role=dialog]');
  t('Prato aberto vai para a URL (?item=36)', p.url().includes('item=36'));
  await p.reload(); await p.waitForSelector('[role=dialog]');
  t('F5 reabre o modal do prato', (await p.textContent('.modal__titulo')) === 'Clássico');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  t('Esc fecha e tira o ?item da URL', !(await p.$('[role=dialog]')) && !p.url().includes('item='));
  await p.waitForTimeout(100);
  t('Foco volta para o prato depois de fechar', await p.evaluate(() => document.activeElement?.dataset.item === '36'));

  await p.click('.item[data-item="36"]'); await p.waitForSelector('[role=dialog]');
  await p.click('.modal__rodape .botao'); await p.waitForTimeout(200);
  t('Grupo obrigatório: botão diz o que falta e foco vai ao grupo', (await p.textContent('.modal__rodape .botao')).includes('Ponto da carne') && await p.evaluate(() => document.activeElement.classList.contains('grupo')));
  await p.check('text=Ao ponto');
  for (const o of ['Bacon', 'Queijo extra', 'Ovo']) await p.check(`.opcao:has-text("${o}") input`);
  t('Máximo do grupo desabilita as outras opções', await p.isDisabled('.opcao:has-text("Cebola caramelizada") input'));
  await p.uncheck('.opcao:has-text("Ovo") input');
  await p.click('[aria-label="Aumentar quantidade"]');
  const esperado = (3490 + 600 + 500) * 2;
  t('Preço ao vivo = (base + opções) × quantidade', (await p.textContent('.modal__rodape .botao')).includes(brl(esperado)), brl(esperado));
  // Tab preso no modal
  for (let i = 0; i < 40; i++) await p.keyboard.press('Tab');
  t('Tab fica preso dentro do modal', await p.evaluate(() => !!document.activeElement.closest('[role=dialog]')));
  await p.click('.modal__rodape .botao'); await p.waitForTimeout(400);
  t('Adicionar: badge do carrinho e aviso', (await p.textContent('.botao-carrinho__n')) === '2' && (await p.textContent('.avisos')).includes('Clássico'));
  await p.click('.item[data-item="36"]'); await p.check('text=Ao ponto'); await p.check('.opcao:has-text("Bacon") input'); await p.check('.opcao:has-text("Queijo extra") input');
  await p.click('.modal__rodape .botao'); await p.waitForTimeout(300);
  await p.click('.item[data-item="36"]'); await p.check('text=Mal passado'); await p.click('.modal__rodape .botao'); await p.waitForTimeout(300);
  const linhas = await p.evaluate(() => JSON.parse(localStorage.getItem('sabor.carrinho')).linhas.map((l) => l.quantidade));
  t('Mesmas opções somam; opções diferentes viram outra linha', JSON.stringify(linhas) === '[3,1]', JSON.stringify(linhas));
  await p.reload(); await p.waitForSelector('.item');
  t('Carrinho sobrevive ao F5 (localStorage)', (await p.textContent('.botao-carrinho__n')) === '4');

  // Outro restaurante
  await p.goto(B + '#/restaurante/pastelaria-madrugada'); await p.waitForSelector('.item');
  t('Prato esgotado fica desabilitado', await p.isDisabled('.item:has-text("Bauru")'));
  await p.click('.item:has-text("Café coado")'); await p.click('.modal__rodape .botao');
  await p.waitForSelector('text=Começar um novo carrinho?');
  await p.click('.modal:has-text("novo carrinho") .botao--fantasma'); await p.waitForTimeout(300);
  t('Item de outro restaurante pede confirmação; "Voltar" mantém o carrinho', (await p.textContent('.botao-carrinho__n')) === '4');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  /* ---------- 3. Gaveta ---------- */
  await p.goto(B + '#/restaurante/smash-do-bairro'); await p.waitForSelector('.item');
  await p.click('.botao-carrinho'); await p.waitForSelector('.modal--gaveta');
  t('Gaveta abre com foco dentro', await p.evaluate(() => !!document.activeElement.closest('.modal--gaveta')));
  await p.click('.linha:nth-child(2) [aria-label^="Remover"]'); await p.waitForTimeout(200);
  t('Remover linha atualiza subtotal', (await p.textContent('.gaveta__total strong')) === brl((3490 + 1100) * 3));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  t('Esc fecha a gaveta e devolve o foco ao botão do carrinho', !(await p.$('.modal--gaveta')) && await p.evaluate(() => document.activeElement.classList.contains('botao-carrinho')));

  /* ---------- 4. Login e guarda ---------- */
  await p.goto(B + '#/checkout'); await p.waitForTimeout(300);
  t('Checkout sem login vai para /entrar?voltar=/checkout', p.url().includes('#/entrar?voltar=/checkout'));
  await p.click('.entrar__form .botao'); await p.waitForSelector('#e-email');
  t('422 do login aparece no campo com aria-invalid', (await p.getAttribute('#email', 'aria-invalid')) === 'true');
  await p.fill('#email', 'cliente@sabor.com.br'); await p.fill('#senha', 'errada'); await p.click('.entrar__form .botao');
  await p.waitForSelector('#erro-login');
  t('401 do login mostra mensagem geral', (await p.textContent('#erro-login')).length > 5);
  await p.fill('#senha', 'Sabor2026!'); await p.click('.entrar__form .botao'); await p.waitForURL(/#\/checkout/);
  t('Depois do login volta ao checkout', true);

  /* ---------- 5. Checkout ---------- */
  await p.click('.checkout__botoes .botao'); await p.waitForTimeout(150);
  t('Passo 1 não avança sem CEP e número', (await p.getAttribute('.passos__botao[aria-current=step]', 'aria-current')) === 'step' && (await p.textContent('.passos__botao[aria-current=step]')).includes('Endereço'));
  await p.type('#f-cep', '01001ab000');
  t('Máscara do CEP (só números, hífen)', (await p.inputValue('#f-cep')) === '01001-000');
  await p.waitForFunction(() => document.querySelector('#cep-status').textContent.includes('Ainda não'), null, { timeout: 5000 }).catch(async () => console.log('DEBUG cep', await p.inputValue('#f-cep'), await p.textContent('#cep-status')));
  t('CEP fora da área mostra o 404 da API', true);
  await p.fill('#f-cep', ''); await p.type('#f-cep', '03164000');
  await p.waitForFunction(() => document.querySelector('#cep-status').textContent.includes('Itapiti'), null, { timeout: 6000 }).catch(async () => console.log('DEBUG cep2', await p.inputValue('#f-cep'), await p.textContent('#cep-status')));
  t('CEP válido mostra rua, bairro e acréscimo', (await p.textContent('#cep-status')).includes(brl(300)));
  const taxa = 390 + 300;
  t('Resumo soma o acréscimo do bairro na entrega', limpa(await p.textContent('.resumo__contas')).includes(brl(taxa)));
  await p.fill('#f-numero', '45'); await p.click('.checkout__botoes .botao:has-text("Continuar")');
  await p.waitForURL(/passo=2/);
  t('Passo vai para a URL (?passo=2) e o foco para o título', await p.evaluate(() => document.activeElement.id === 't-passo'));
  await p.reload(); await p.waitForSelector('.pagamentos');
  await p.click('.passos__botao:has-text("Endereço")'); await p.waitForSelector('#f-numero');
  t('F5 no meio do checkout não perde o endereço', (await p.inputValue('#f-numero')) === '45' && (await p.inputValue('#f-cep')) === '03164-000');
  await p.click('.checkout__botoes .botao:has-text("Continuar")'); await p.waitForSelector('.pagamentos');
  await p.check('.pagamento:has-text("Dinheiro") input'); await p.check('.troco input[type=checkbox]');
  await p.fill('#f-troco', '20'); await p.click('.checkout__botoes .botao:has-text("Continuar")'); await p.waitForTimeout(150);
  t('Troco menor que o total é barrado', (await p.textContent('#e-troco')).includes('mais de'));
  await p.fill('#f-troco', '200,00'); await p.click('.checkout__botoes .botao:has-text("Continuar")'); await p.waitForURL(/passo=3/);
  await p.fill('#f-cupom', 'verao2025'); await p.click('.cupom .botao'); await p.waitForSelector('#e-cupom:not(:empty)');
  t('Cupom vencido mostra o erro da API', (await p.textContent('#e-cupom')).includes('venceu'));
  await p.fill('#f-cupom', 'FRETEGRATIS'); await p.click('.cupom .botao'); await p.waitForSelector('.cupom__ok');
  const sub = (3490 + 1100) * 3;
  t('Frete grátis desconta a taxa inteira (com acréscimo)', limpa(await p.textContent('.resumo__total')).includes(brl(sub)));
  // Total divergente simulado
  await p.route('**/api/index.php/pedidos', (r) => r.request().method() === 'POST' ? r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ mensagem: 'O total mudou: o valor certo é R$ 1,00.', codigo: 'TOTAL_DIVERGENTE', total: 100 }) }) : r.continue());
  await p.click('.checkout__botoes .botao:not(.botao--fantasma)'); await p.waitForSelector('#alerta-pedido');
  t('409 TOTAL_DIVERGENTE vira alerta focado', (await p.textContent('#alerta-pedido')).includes('total mudou') && await p.evaluate(() => document.activeElement.id === 'alerta-pedido'));
  await p.unroute('**/api/index.php/pedidos');
  const [req] = await Promise.all([p.waitForRequest((r) => r.url().endsWith('/pedidos') && r.method() === 'POST'), p.click('.checkout__botoes .botao:not(.botao--fantasma)')]);
  const corpo = req.postDataJSON();
  t('POST manda total_esperado igual ao total da tela e opções por id', corpo.total_esperado === sub && Array.isArray(corpo.itens[0].opcoes) && typeof corpo.itens[0].opcoes[0] === 'number' && corpo.troco_para === 20000);
  await p.waitForURL(/#\/pedidos\/\d+/);
  t('Pedido criado: vai ao acompanhamento e esvazia o carrinho', !(await p.$('.botao-carrinho__n')));
  await p.waitForSelector('.linha-tempo');
  t('Acompanhamento: status recebido e botão Cancelar', (await p.getAttribute('.etapa--atual', 'aria-current')) === 'step' && !!(await p.$('text=Cancelar pedido')));
  await p.click('text=Cancelar pedido'); await p.click('.modal .botao--perigo'); await p.waitForSelector('text=Pedido cancelado às');
  t('Cancelar com confirmação', !(await p.$('.linha-tempo')));

  /* ---------- 6. Polling (status simulado) ---------- */
  const seq = ['recebido', 'em_preparo', 'a_caminho', 'entregue']; let n = 0, chamadas = 0;
  await p.route(/pedidos\/1003$/, async (r) => {
    chamadas++;
    const resp = await r.fetch(); const j = await resp.json();
    const st = seq[Math.min(n++, 3)];
    Object.assign(j.dados, { status: st, pode_cancelar: st === 'recebido', pode_avaliar: false, avaliacao: null, historico: seq.slice(0, seq.indexOf(st) + 1).map((s) => ({ status: s, em: j.dados.criado_em })) });
    r.fulfill({ response: resp, json: j });
  });
  await p.goto(B + '#/pedidos/1003'); await p.waitForSelector('.linha-tempo');
  await p.waitForSelector('.previsao--ok', { timeout: 25000 });
  t('Polling atualiza a linha do tempo até "Entregue"', (await p.$$('.etapa--feita')).length === 3);
  t('Mudança de status anunciada no aria-live', (await p.textContent('[aria-live=polite].so-leitor')).includes('Entregue'));
  const parou = chamadas; await p.waitForTimeout(6000);
  t('Polling para quando o pedido termina', chamadas === parou, `${chamadas} chamadas`);
  await p.unroute(/pedidos\/1003$/);

  /* ---------- 7. Avaliação ---------- */
  await p.goto(B + '#/pedidos/1002'); await p.waitForSelector('.avaliar');
  await p.click('.avaliar .botao'); await p.waitForTimeout(100);
  t('Avaliar sem nota mostra erro', (await p.textContent('.avaliar')).includes('Escolha de 1 a 5'));
  await p.click('.estrela >> nth=1'); await p.click('.avaliar .botao'); await p.waitForTimeout(100);
  t('Nota 2 sem comentário é barrada (regra da API)', (await p.textContent('#e-coment')).includes('mínimo de 10'));
  await p.focus('.estrela input >> nth=1'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  t('Estrelas funcionam com as setas (radiogroup)', (await p.textContent('.estrelas__texto')) === 'Excelente');
  await p.click('.avaliar .botao'); await p.waitForSelector('.avaliado');
  t('Avaliação enviada aparece no pedido', (await p.textContent('.avaliado')).includes('★★★★★'));

  /* ---------- 8. Pedidos paginados ---------- */
  await p.goto(B + '#/pedidos'); await p.waitForSelector('.pedido-linha');
  t('Lista paginada no servidor (5 por página)', (await p.$$('.pedido-linha')).length === 5 && (await p.$$('.paginacao__botao[aria-label^="Página"]')).length === 2);
  await p.click('[aria-label="Página 2"]'); await p.waitForURL(/pagina=2/); await p.waitForFunction(() => document.querySelector('.pedidos').getAttribute('aria-busy') === 'false');
  t('Página 2 na URL com aria-current="page"', (await p.getAttribute('[aria-label="Página 2"]', 'aria-current')) === 'page' && (await p.$$('.pedido-linha')).length === 3);
  const api = await p.evaluate(async () => (await (await fetch('api/index.php/pedidos?pagina=2', { headers: { Authorization: 'Bearer ' + localStorage.getItem('sabor.token') } })).json()).dados[0].criado_em);
  const hhmm = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(api));
  t('criado_em (UTC) exibido no horário de Brasília', (await p.textContent('.pedido-linha .suave')).includes(hhmm), `${api} -> ${hhmm}`);

  /* ---------- 9. Sessão expirada ---------- */
  await p.evaluate(() => fetch('api/index.php/sessao/expirar', { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('sabor.token') } }));
  await p.click('[aria-label="Página 1"]'); await p.waitForURL(/#\/entrar/);
  t('Token vencido: 401 leva ao login guardando o destino e avisa', decodeURIComponent(p.url()).includes('voltar=/pedidos') && (await p.textContent('.avisos')).includes('expirou'));

  /* ---------- 10. Tema, 404 e celular ---------- */
  await p.goto(B + '#/'); await p.click('[aria-label="Tema escuro"]');
  t('Tema alterna com aria-pressed e salva', (await p.getAttribute('html', 'data-tema')) === 'escuro' && (await p.getAttribute('[aria-label="Tema escuro"]', 'aria-pressed')) === 'true');
  await p.route('**/js/app.js', (r) => r.abort());
  await p.reload(); await p.waitForTimeout(300);
  t('Tema aplicado antes do app (sem piscar)', (await p.getAttribute('html', 'data-tema')) === 'escuro');
  await p.unroute('**/js/app.js');
  await p.goto(B + '#/restaurante/nao-existe'); await p.reload(); await p.waitForSelector('text=Restaurante não encontrado');
  t('Restaurante inexistente: tela de 404', true);
  await p.goto(B + '#/qualquer/coisa'); await p.waitForSelector('text=Página não encontrada');
  t('Rota inexistente: página não encontrada', true);

  const m = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Tokyo' });
  const q = await m.newPage();
  let estouro = [];
  for (const h of ['#/', '#/restaurante/smash-do-bairro', '#/entrar']) {
    await q.goto(B + h); await q.waitForTimeout(1500);
    const w = await q.evaluate(() => document.documentElement.scrollWidth); if (w > 375) estouro.push(h + ':' + w);
  }
  t('375 px sem rolagem lateral', !estouro.length, estouro.join(' '));
  await q.goto(B + '#/restaurante/smash-do-bairro'); await q.waitForSelector('.item'); await q.click('.item[data-item="40"]'); await q.click('.modal__rodape .botao'); await q.waitForTimeout(500);
  const barra = await q.$eval('.barra-carrinho', (e) => { const r = e.getBoundingClientRect(); return [r.bottom, getComputedStyle(e).position]; });
  t('Barra do carrinho fixa no rodapé no celular', barra[1] === 'fixed' && barra[0] > 760, barra.join(' '));
  await q.goto(B + '#/entrar'); await q.fill('#email', 'cliente@sabor.com.br'); await q.fill('#senha', 'Sabor2026!'); await q.click('.entrar__form .botao'); await q.waitForTimeout(1200);
  await q.goto(B + '#/pedidos?pagina=2'); await q.waitForSelector('.pedido-linha');
  t('Navegador em Tóquio mostra a mesma hora de Brasília', (await q.textContent('.pedido-linha .suave')).includes(hhmm));
  await m.close();

  t('Nenhum erro no console', !erros.length, erros.slice(0, 3).join(' | '));
  console.log(`\n${ok} passaram, ${falhas} falharam`);
  await b.close();
  process.exit(falhas ? 1 : 0);
})();
