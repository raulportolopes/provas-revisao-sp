/*
 * Tela PROGRESSO (#/progresso) – gráficos feitos só com HTML + CSS, a partir de GET /me/progresso.
 *
 *  - Gráfico de barras: cada barra recebe a altura numa variável CSS (--h). O CSS anima de 0 até --h.
 *    Linha tracejada da meta mensal; barra que bateu a meta fica verde.
 *    Hover OU foco (teclado) na barra mostra o balão "julho de 2026: 8 aulas".
 *  - Rosca por modalidade: um conic-gradient montado no JS com as fatias em graus acumulados.
 *  - Anel da meta do mês atual: outro conic-gradient (porcentagem da meta).
 *  - Tabela escondida visualmente com os mesmos números: quem usa leitor de tela também "vê" o gráfico.
 */
import { api } from '../api.js';
import { cat, carregarCatalogos } from '../dados.js';
import * as f from '../formatos.js';
import { esc } from '../formatos.js';

export function montar(raiz) {
  raiz.innerHTML = `
  <div class="pagina">
    <header class="cabecalho-pagina">
      <div><p class="sobretitulo">Últimos 6 meses</p><h1>Seu progresso</h1></div>
    </header>
    <div id="progresso" aria-busy="true"><div class="kpis">${'<div class="kpi kpi--esqueleto"></div>'.repeat(4)}</div></div>
  </div>`;
  const alvo = raiz.querySelector('#progresso');
  let vivo = true;

  async function carregar() {
    try {
      const [, r] = await Promise.all([carregarCatalogos(), api('/me/progresso')]);
      if (!vivo) return;
      desenhar(alvo, r.dados);
    } catch (err) {
      if (err.status === 401 || !vivo) return;
      alvo.innerHTML = `<div class="vazio vazio--erro" role="alert"><p class="vazio__titulo">Não foi possível carregar seu progresso</p>
        <p>${esc(err.message)}</p><button class="btn btn--primario" type="button" id="tentar">Tentar novamente</button></div>`;
      alvo.querySelector('#tentar').addEventListener('click', carregar);
    } finally { alvo.removeAttribute('aria-busy'); }
  }
  carregar();
  return () => { vivo = false; };
}

function desenhar(alvo, d) {
  const meta = d.meta_mensal;
  const maxValor = Math.max(meta, ...d.meses.map((m) => m.total));
  const topo = Math.ceil((maxValor + 2) / 4) * 4;                 // escala "redonda" acima do maior valor
  const mesAtual = d.meses[d.meses.length - 1];
  const pctMeta = Math.min(100, Math.round((mesAtual.total / meta) * 100));
  const media = (d.total_aulas / d.meses.length).toFixed(1).replace('.', ',');
  const horas = Math.floor(d.total_minutos / 60);

  // Fatias da rosca: cada modalidade ocupa (total / soma) * 360 graus, começando onde a anterior parou.
  const soma = d.por_modalidade.reduce((s, x) => s + x.total, 0) || 1;
  let acumulado = 0;
  const fatias = d.por_modalidade.map((x) => {
    const m = cat.modalidades.get(x.modalidade_id);
    const ini = acumulado; acumulado += (x.total / soma) * 360;
    return { ...x, nome: m.nome, cor: m.cor, ini, fim: acumulado, pct: Math.round((x.total / soma) * 100) };
  });
  const gradiente = fatias.map((x) => `${x.cor} ${x.ini.toFixed(1)}deg ${x.fim.toFixed(1)}deg`).join(', ');

  alvo.innerHTML = `
  <div class="kpis">
    <div class="kpi"><p class="kpi__valor">${d.total_aulas}</p><p class="kpi__rotulo">aulas concluídas</p></div>
    <div class="kpi"><p class="kpi__valor">${horas}h${String(d.total_minutos % 60).padStart(2, '0')}</p><p class="kpi__rotulo">de treino</p></div>
    <div class="kpi"><p class="kpi__valor">${media}</p><p class="kpi__rotulo">aulas por mês</p></div>
    <div class="kpi kpi--meta">
      <div class="anel" style="--p:${pctMeta}" role="img" aria-label="Meta de ${esc(f.mesAno(mesAtual.mes))}: ${mesAtual.total} de ${meta} aulas (${pctMeta}%)">
        <span>${pctMeta}%</span>
      </div>
      <div><p class="kpi__valor kpi__valor--pequeno">${mesAtual.total}/${meta}</p><p class="kpi__rotulo">meta de ${esc(f.mesAno(mesAtual.mes).split(' ')[0])}</p></div>
    </div>
  </div>

  <div class="graficos">
    <section class="cartao grafico" aria-labelledby="t-barras">
      <h2 id="t-barras">Aulas por mês</h2>
      <div class="barras" style="--topo:${topo}">
        <div class="barras__meta" style="--h:${(meta / topo) * 100}%" aria-hidden="true"><span data-rotulo="Meta: ${meta} aulas"></span></div>
        ${d.meses.map((m) => `
          <div class="barra ${m.total >= meta ? 'barra--meta' : ''}" style="--h:${(m.total / topo) * 100}%" tabindex="0"
               aria-label="${esc(f.mesAno(m.mes))}: ${m.total} aulas${m.total >= meta ? ', meta atingida' : ''}">
            <span class="barra__coluna"></span>
            <span class="barra__balao" aria-hidden="true">${esc(f.mesAno(m.mes))}<strong>${m.total} aulas</strong></span>
            <span class="barra__rotulo" aria-hidden="true">${esc(f.mesCurto(m.mes))}</span>
          </div>`).join('')}
      </div>
    </section>

    <section class="cartao grafico" aria-labelledby="t-rosca">
      <h2 id="t-rosca">Por modalidade</h2>
      <div class="rosca-area">
        <div class="rosca" style="background:conic-gradient(${gradiente})" aria-hidden="true">
          <div class="rosca__centro"><strong>${soma}</strong><span>aulas</span></div>
        </div>
        <ul class="legenda">
          ${fatias.map((x) => `<li style="--cor:${x.cor}"><span class="legenda__cor" aria-hidden="true"></span>${esc(x.nome)}<strong>${x.total} · ${x.pct}%</strong></li>`).join('')}
        </ul>
      </div>
    </section>
  </div>

  <table class="so-leitor">
    <caption>Aulas concluídas por mês (meta mensal: ${meta})</caption>
    <thead><tr><th scope="col">Mês</th><th scope="col">Aulas</th></tr></thead>
    <tbody>${d.meses.map((m) => `<tr><th scope="row">${esc(f.mesAno(m.mes))}</th><td>${m.total}</td></tr>`).join('')}</tbody>
  </table>`;

  // Liga a animação no PRÓXIMO quadro: as barras nascem com altura 0 e o CSS faz a transição até --h.
  requestAnimationFrame(() => requestAnimationFrame(() => alvo.querySelector('.barras')?.classList.add('animar')));
}
