// =====================================================================
// telas/ceu.js – Guia do céu (#/ceu?aba=planetas|constelacoes|lua|perguntas)
//
//  - mesmas ABAS acessíveis da tela de reservas (aqui com um painel por aba)
//  - Planetas: gráfico de barras SÓ COM CSS. O JS escreve --v (altura em %)
//    e --i (posição) em cada barra; o CSS anima uma barra depois da outra.
//  - Constelações e Perguntas: ACORDEÃO com UM item aberto por vez.
//  - Lua: fases desenhadas com CSS e destaque da próxima fase.
// =====================================================================
import { dados } from '../api.js';
import { agora, dataLocal, dataBR, esc } from '../util.js';

export const titulo = 'Guia do céu';
const ABAS = { planetas: 'Planetas', constelacoes: 'Constelações', lua: 'Fases da Lua', perguntas: 'Perguntas' };
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function montar(main, _p, query) {
  const ceu = dados.ceu;
  let aba = ABAS[query.get('aba')] ? query.get('aba') : 'planetas';
  let planeta = 0;
  const mesAtual = agora().getMonth();

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <h1>Guia do céu</h1>
      <p>O que observar no céu de São Paulo em ${MESES_LONGOS[mesAtual].toLowerCase()}.</p>
    </div>
    <div class="abas" role="tablist" aria-label="Assuntos do guia">
      ${Object.entries(ABAS).map(([k, t]) => `
        <button type="button" role="tab" id="tab-${k}" data-aba="${k}" aria-controls="painel-${k}">${t}</button>`).join('')}
    </div>
    ${Object.keys(ABAS).map(k => `<section role="tabpanel" id="painel-${k}" aria-labelledby="tab-${k}" tabindex="0" class="painel-ceu" hidden></section>`).join('')}`;

  const $ = s => main.querySelector(s);

  // ---------- Abas ----------
  function trocarAba(nova, focar = false) {
    aba = nova;
    main.querySelectorAll('[role="tab"]').forEach(t => {
      const sim = t.dataset.aba === aba;
      t.setAttribute('aria-selected', String(sim));
      t.tabIndex = sim ? 0 : -1;
      if (sim && focar) t.focus();
    });
    main.querySelectorAll('[role="tabpanel"]').forEach(p => (p.hidden = p.id !== `painel-${aba}`));
    history.replaceState(null, '', `#/ceu${aba !== 'planetas' ? '?aba=' + aba : ''}`);
    if (aba === 'planetas') desenharGrafico();      // reanima as barras ao voltar para a aba
  }
  $('[role="tablist"]').addEventListener('click', e => { const t = e.target.closest('[role="tab"]'); if (t) trocarAba(t.dataset.aba, true); });
  $('[role="tablist"]').addEventListener('keydown', e => {
    const k = Object.keys(ABAS); let i = k.indexOf(aba);
    if (e.key === 'ArrowRight') i = (i + 1) % k.length;
    else if (e.key === 'ArrowLeft') i = (i - 1 + k.length) % k.length;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = k.length - 1;
    else return;
    e.preventDefault(); trocarAba(k[i], true);
  });

  // ---------- Planetas ----------
  $('#painel-planetas').innerHTML = `
    <div class="planetas">
      <div class="planetas__escolha" role="group" aria-label="Escolha o planeta">
        ${ceu.planetas.map((p, i) => `
          <button type="button" class="planeta-botao" data-planeta="${i}" style="--cor:${p.cor}">
            <span class="planeta-bola" aria-hidden="true"></span>${esc(p.nome)}</button>`).join('')}
      </div>
      <div class="planetas__info" id="planeta-info" aria-live="polite"></div>
      <figure class="grafico">
        <figcaption id="grafico-legenda"></figcaption>
        <div class="grafico__barras" id="barras"></div>
      </figure>
    </div>`;

  function desenharGrafico() {
    const p = ceu.planetas[planeta];
    main.querySelectorAll('.planeta-botao').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.planeta) === planeta)));
    const melhor = p.visibilidade.indexOf(Math.max(...p.visibilidade));
    $('#planeta-info').innerHTML = `
      <span class="planeta-bola planeta-bola--grande" style="--cor:${p.cor}" aria-hidden="true"></span>
      <div>
        <h2>${esc(p.nome)}</h2>
        <p>${esc(p.descricao)}</p>
        <p><b>Melhor horário:</b> ${esc(p.melhor_horario)} · <b>Brilho:</b> magnitude ${String(p.magnitude).replace('.', ',')} · <b>Melhor mês:</b> ${MESES_LONGOS[melhor]}</p>
      </div>`;
    $('#grafico-legenda').textContent = `Visibilidade de ${p.nome} mês a mês (0 a 100)`;
    // Recria as barras: assim a animação de entrada roda de novo a cada troca.
    $('#barras').innerHTML = p.visibilidade.map((v, i) => `
      <div class="barra ${i === mesAtual ? 'barra--atual' : ''}" style="--v:${v}; --i:${i}; --cor:${p.cor}"
           tabindex="0" role="img" aria-label="${MESES_LONGOS[i]}: ${v} de 100${i === mesAtual ? ' (mês atual)' : ''}">
        <span class="barra__valor">${v}</span>
        <span class="barra__coluna"></span>
        <span class="barra__mes">${MESES[i]}</span>
      </div>`).join('');
  }
  $('.planetas__escolha').addEventListener('click', e => {
    const b = e.target.closest('[data-planeta]'); if (!b) return;
    planeta = Number(b.dataset.planeta); desenharGrafico();
  });

  // ---------- Acordeão (reutilizado em Constelações e Perguntas) ----------
  const acordeao = (prefixo, itens, titulo, corpo) => `
    <div class="acordeao" data-acordeao>
      ${itens.map((it, i) => `
        <div class="acordeao__item">
          <h3 class="acordeao__cabeca">
            <button type="button" id="${prefixo}-b${i}" aria-expanded="${i === 0}" aria-controls="${prefixo}-p${i}">
              ${titulo(it)}<span class="acordeao__seta" aria-hidden="true"></span></button>
          </h3>
          <div class="acordeao__painel" id="${prefixo}-p${i}" role="region" aria-labelledby="${prefixo}-b${i}">
            <div><div class="acordeao__conteudo">${corpo(it)}</div></div>
          </div>
        </div>`).join('')}
    </div>`;

  $('#painel-constelacoes').innerHTML = acordeao('const', ceu.constelacoes,
    c => `${esc(c.nome)} <small>${esc(c.estacao)}</small>`,
    c => `<p>${esc(c.historia)}</p>${c.estrelas ? `<p class="suave">${c.estrelas} estrelas principais</p>` : '<p class="suave">Constelação de manchas escuras (sem estrelas principais)</p>'}`);

  $('#painel-perguntas').innerHTML = acordeao('faq', ceu.faq, f => esc(f.pergunta), f => `<p>${esc(f.resposta)}</p>`);

  // Um aberto por vez: abrir um item fecha os outros DO MESMO acordeão.
  // Clicar no item aberto fecha ele (pode ficar tudo fechado).
  main.addEventListener('click', e => {
    const b = e.target.closest('[data-acordeao] [aria-expanded]'); if (!b) return;
    const abrir = b.getAttribute('aria-expanded') !== 'true';
    b.closest('[data-acordeao]').querySelectorAll('[aria-expanded]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    b.setAttribute('aria-expanded', String(abrir));
  });

  // ---------- Lua ----------
  const proxima = ceu.lua.find(f => dataLocal(f.data) >= agora());
  const diasAte = proxima ? Math.ceil((dataLocal(proxima.data) - agora()) / 864e5) : null;
  const classeLua = f => ({ 'Lua nova': 'nova', 'Quarto crescente': 'crescente', 'Lua cheia': 'cheia', 'Quarto minguante': 'minguante' }[f.fase]);
  $('#painel-lua').innerHTML = `
    ${proxima ? `<p class="destaque-lua">Próxima fase: <b>${proxima.fase}</b> em ${dataBR(proxima.data)} (${diasAte === 1 ? 'amanhã' : `daqui a ${diasAte} dias`}).</p>` : ''}
    <ol class="fases">
      ${ceu.lua.map(f => `
        <li class="fase ${f === proxima ? 'fase--proxima' : ''}">
          <span class="lua lua--${classeLua(f)}" aria-hidden="true"></span>
          <b>${f.fase}</b>
          <time datetime="${f.data}">${dataBR(f.data)}</time>
          <span class="suave">${f.iluminacao}% iluminada</span>
        </li>`).join('')}
    </ol>`;

  trocarAba(aba);
}
