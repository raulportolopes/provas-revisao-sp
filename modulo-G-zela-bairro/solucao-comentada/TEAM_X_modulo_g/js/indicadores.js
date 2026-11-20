/*
 * indicadores.js – Pacote P4 (parte 2): números e gráficos só com CSS
 * --------------------------------------------------------------------
 * - KPIs com contagem animada (requestAnimationFrame)
 * - barras: a largura vem da variável CSS --v (0 a 100) e cada barra
 *   entra com um atraso maior (--i), formando a "sequência"
 * - rosca: conic-gradient montado com as porcentagens de cada status
 */
const COR_STATUS = {
  aberto: 'var(--st-aberto)', triagem: 'var(--st-triagem)', execucao: 'var(--st-execucao)',
  concluido: 'var(--st-concluido)', cancelado: 'var(--st-cancelado)',
};

function contar(el, ate, sufixo = '', casas = 0) {
  if (reduzMovimento()) { el.textContent = ate.toLocaleString('pt-BR', { minimumFractionDigits: casas }) + sufixo; return; }
  const inicio = performance.now();
  const dur = 900;
  function passo(t) {
    const p = Math.min(1, (t - inicio) / dur);
    const v = ate * (1 - Math.pow(1 - p, 3)); // easeOutCubic
    el.textContent = v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + sufixo;
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

async function renderIndicadores() {
  const kpis = document.getElementById('kpis');
  kpis.innerHTML = '<p class="carregando carregando--inline" role="status">Calculando indicadores…</p>';
  let d;
  try {
    d = await API.indicadores();
  } catch (erro) {
    kpis.innerHTML = `<div class="aviso aviso--erro" role="alert">${esc(erro.message)}</div>`;
    return;
  }

  kpis.innerHTML = `
    <article class="kpi"><span class="kpi__n" data-n="${d.total}">0</span><span class="kpi__r">chamados no total</span></article>
    <article class="kpi kpi--alerta"><span class="kpi__n" data-n="${d.atrasados}">0</span><span class="kpi__r">atrasados agora</span></article>
    <article class="kpi"><span class="kpi__n" data-n="${d.percentual_no_prazo}" data-suf="%">0</span><span class="kpi__r">concluídos no prazo</span></article>
    <article class="kpi"><span class="kpi__n" data-n="${d.tempo_medio_dias}" data-casas="1" data-suf=" dias">0</span><span class="kpi__r">tempo médio de solução</span></article>`;
  kpis.querySelectorAll('.kpi__n').forEach((el) =>
    contar(el, Number(el.dataset.n), el.dataset.suf || '', Number(el.dataset.casas || 0)));

  // ---- barras por categoria ----
  const max = Math.max(...d.por_categoria.map((c) => c.total), 1);
  const barras = document.getElementById('barras');
  barras.classList.remove('barras--animar');
  barras.innerHTML = d.por_categoria.map((c, i) => `
    <li class="barra" style="--v:${(c.total / max) * 100};--i:${i}">
      <span class="barra__nome">${esc(c.nome)}</span>
      <span class="barra__trilho"><span class="barra__valor"></span></span>
      <span class="barra__n">${c.total}</span>
    </li>`).join('');
  // dois frames depois, liga a classe que faz as barras crescerem
  requestAnimationFrame(() => requestAnimationFrame(() => barras.classList.add('barras--animar')));

  // ---- rosca por status ----
  const ordem = ['aberto', 'triagem', 'execucao', 'concluido', 'cancelado'];
  let acumulado = 0;
  const fatias = ordem.map((s) => {
    const inicio = acumulado;
    acumulado += (d.por_status[s] / d.total) * 100;
    return `${COR_STATUS[s]} ${inicio.toFixed(2)}% ${acumulado.toFixed(2)}%`;
  });
  const rosca = document.getElementById('rosca');
  rosca.style.setProperty('--fatias', `conic-gradient(${fatias.join(', ')})`);
  rosca.setAttribute('aria-label', 'Situação dos chamados: ' +
    ordem.map((s) => `${STATUS[s].nome} ${d.por_status[s]}`).join(', '));
  rosca.innerHTML = `<span class="rosca__centro"><strong>${d.total}</strong> chamados</span>`;
  rosca.classList.remove('rosca--animar');
  void rosca.offsetWidth;
  rosca.classList.add('rosca--animar');

  document.getElementById('rosca-legenda').innerHTML = ordem.map((s) => `
    <li><span class="ponto ponto--${s}" aria-hidden="true"></span>${STATUS[s].nome}
      <strong>${d.por_status[s]}</strong> <small>(${Math.round((d.por_status[s] / d.total) * 100)}%)</small></li>`).join('');
}
