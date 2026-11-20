// =====================================================================
// telas/programacao.js – catálogo de sessões com filtros, busca,
// ordenação, paginação e modal de detalhes.
//
// O SEGREDO desta tela: existe UM objeto "estado" e UMA função "aplicar()".
// Todo controle só muda o estado e chama aplicar(). aplicar() faz, sempre
// na mesma ordem:   filtrar -> ordenar -> paginar -> desenhar -> gravar na URL
// Assim os filtros nunca "brigam" entre si e o F5 restaura tudo.
// =====================================================================
import { dados, todasSessoes } from '../api.js';
import { agora, dataLocal, isoDia, dataBR, diaMes, diaSemana, reais, esc, normalizar, debounce, plural, CLASSIF } from '../util.js';
import { abrirModal, trocarConteudo, fecharModal } from '../modal.js';
import { escalonar } from '../efeitos.js';

export const titulo = 'Programação';
const POR_PAGINA = 6;
const ORDENS = {
  horario: { nome: 'Horário (mais cedo primeiro)', fn: (a, b) => a.inicio - b.inicio },
  titulo: { nome: 'Título (A–Z)', fn: (a, b) => a.programa.titulo.localeCompare(b.programa.titulo, 'pt-BR') || a.inicio - b.inicio },
  'preco-asc': { nome: 'Preço: menor primeiro', fn: (a, b) => a.preco_inteira - b.preco_inteira || a.inicio - b.inicio },
  'preco-desc': { nome: 'Preço: maior primeiro', fn: (a, b) => b.preco_inteira - a.preco_inteira || a.inicio - b.inicio },
  livres: { nome: 'Mais lugares livres', fn: (a, b) => b.livres - a.livres || a.inicio - b.inicio },
};
const PERIODOS = { '': 'Todos', manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const periodoDe = hora => (hora < '12:00' ? 'manha' : hora < '18:00' ? 'tarde' : 'noite');

export function montar(main, _params, query) {
  // ---------- 1. Estado inicial lido da URL ----------
  const estado = {
    data: query.get('data') || '',
    genero: query.get('genero') || '',
    classif: (query.get('classif') || '').split(',').filter(c => CLASSIF[c]),
    periodo: PERIODOS[query.get('periodo')] ? query.get('periodo') : '',
    busca: query.get('busca') || '',
    livres: query.get('livres') === '1',
    ordem: ORDENS[query.get('ordem')] ? query.get('ordem') : 'horario',
    pagina: Math.max(1, parseInt(query.get('pagina'), 10) || 1),
  };
  let resultado = [];   // lista filtrada e ordenada (todas as páginas) – o modal navega nela

  // Os 7 dias a partir de "agora" (segunda-feira o planetário está fechado)
  const base = agora();
  const dias = Array.from({ length: 7 }, (_, k) => isoDia(new Date(base.getFullYear(), base.getMonth(), base.getDate() + k)));
  const generos = [...new Set(dados.programas.map(p => p.genero))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  main.innerHTML = `
    <div class="cabecalho-pagina">
      <h1>Programação</h1>
      <p>Sessões dos próximos 7 dias nas cúpulas Galileu e Hipátia.</p>
    </div>
    <div class="catalogo">
      <aside class="filtros" aria-label="Filtros">
        <button type="button" class="filtros__abrir" aria-expanded="false" aria-controls="filtros-corpo">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 5h18M6 12h12M10 19h4"/></svg>
          Filtros <span class="filtros__qtd" id="filtros-qtd"></span>
        </button>
        <form class="filtros__corpo" id="filtros-corpo" role="search" onsubmit="return false">
          <div class="campo">
            <label for="f-busca">Buscar programa</label>
            <input type="search" id="f-busca" placeholder="Ex.: Marte" autocomplete="off">
          </div>
          <fieldset class="campo">
            <legend>Dia</legend>
            <div class="chips" id="f-dias">
              <button type="button" class="chip" data-dia="">Todos</button>
              ${dias.map(d => {
                const fechado = !dados.sessoes.some(s => s.data === d);
                return `<button type="button" class="chip chip--dia" data-dia="${d}" ${fechado ? 'disabled' : ''}>
                  <span>${diaSemana(d, true)}</span> ${diaMes(d)}${fechado ? ' <small>Fechado</small>' : ''}</button>`;
              }).join('')}
            </div>
          </fieldset>
          <div class="campo">
            <label for="f-genero">Gênero</label>
            <select id="f-genero">
              <option value="">Todos</option>
              ${generos.map(g => `<option>${esc(g)}</option>`).join('')}
            </select>
          </div>
          <fieldset class="campo">
            <legend>Classificação</legend>
            <!-- Atenção: Object.keys/entries coloca chaves numéricas ("10") ANTES de "L".
                 Por isso a ordem vem de um array fixo. -->
            <div class="checks">
              ${['L', '10', '12', '14'].map(k => [k, CLASSIF[k]]).map(([k, c]) => `
                <label class="check"><input type="checkbox" value="${k}" name="classif">
                  <span class="classif classif--${c.cor}">${k}</span> ${c.texto}</label>`).join('')}
            </div>
          </fieldset>
          <fieldset class="campo">
            <legend>Período</legend>
            <div class="segmentado">
              ${Object.entries(PERIODOS).map(([k, t]) => `
                <label><input type="radio" name="periodo" value="${k}"><span>${t}</span></label>`).join('')}
            </div>
          </fieldset>
          <label class="interruptor">
            <input type="checkbox" id="f-livres" role="switch">
            <span class="interruptor__trilho" aria-hidden="true"></span>
            Só sessões com lugares livres
          </label>
          <button type="button" class="botao botao--contorno botao--largo" id="f-limpar">Limpar filtros</button>
        </form>
      </aside>

      <section class="resultados" aria-labelledby="contador">
        <div class="resultados__topo">
          <p class="contador" id="contador" aria-live="polite"></p>
          <div class="campo campo--linha">
            <label for="f-ordem">Ordenar por</label>
            <select id="f-ordem">
              ${Object.entries(ORDENS).map(([k, o]) => `<option value="${k}">${o.nome}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grade-sessoes" id="grade"></div>
        <nav class="paginacao" id="paginacao" aria-label="Páginas de resultados"></nav>
      </section>
    </div>`;

  const $ = s => main.querySelector(s);
  const busca = $('#f-busca'), genero = $('#f-genero'), ordem = $('#f-ordem'), livres = $('#f-livres');

  // ---------- 2. Controles: refletem o estado (importante para o F5) ----------
  function sincronizarControles() {
    busca.value = estado.busca;
    genero.value = generos.includes(estado.genero) ? estado.genero : '';
    ordem.value = estado.ordem;
    livres.checked = estado.livres;
    main.querySelectorAll('#f-dias .chip').forEach(c => {
      const sim = c.dataset.dia === estado.data;
      c.classList.toggle('chip--ativo', sim);
      c.setAttribute('aria-pressed', String(sim));
    });
    main.querySelectorAll('[name="classif"]').forEach(c => (c.checked = estado.classif.includes(c.value)));
    main.querySelectorAll('[name="periodo"]').forEach(r => (r.checked = r.value === estado.periodo));
  }

  // ---------- 3. Eventos: mudam o estado e chamam aplicar() ----------
  // Qualquer filtro novo volta para a página 1.
  const mudar = (campo, valor) => { estado[campo] = valor; estado.pagina = 1; aplicar(); };
  busca.addEventListener('input', debounce(() => mudar('busca', busca.value.trim()), 250));
  genero.addEventListener('change', () => mudar('genero', genero.value));
  ordem.addEventListener('change', () => mudar('ordem', ordem.value));
  livres.addEventListener('change', () => mudar('livres', livres.checked));
  $('#f-dias').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c || c.disabled) return;
    mudar('data', c.dataset.dia); sincronizarControles();
  });
  main.querySelectorAll('[name="classif"]').forEach(c => c.addEventListener('change', () =>
    mudar('classif', [...main.querySelectorAll('[name="classif"]:checked')].map(x => x.value))));
  main.querySelectorAll('[name="periodo"]').forEach(r => r.addEventListener('change', () => mudar('periodo', r.value)));
  $('#f-limpar').addEventListener('click', () => {
    Object.assign(estado, { data: '', genero: '', classif: [], periodo: '', busca: '', livres: false, ordem: 'horario', pagina: 1 });
    sincronizarControles(); aplicar(); busca.focus();
  });

  // Botão "Filtros" (só aparece abaixo de 1024 px): abre e fecha o painel.
  const abrir = $('.filtros__abrir');
  abrir.addEventListener('click', () => {
    const aberto = abrir.getAttribute('aria-expanded') === 'true';
    abrir.setAttribute('aria-expanded', String(!aberto));
  });

  // Paginação (delegação: os botões são recriados a cada aplicar)
  $('#paginacao').addEventListener('click', e => {
    const b = e.target.closest('button[data-pagina]'); if (!b || b.disabled) return;
    estado.pagina = Number(b.dataset.pagina); aplicar();
    $('.resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Botões Detalhes dos cards
  $('#grade').addEventListener('click', e => {
    const b = e.target.closest('[data-detalhe]'); if (!b) return;
    abrirDetalhes(resultado.findIndex(s => s.id === Number(b.dataset.detalhe)));
  });

  // ---------- 4. aplicar(): filtrar -> ordenar -> paginar -> desenhar -> URL ----------
  function aplicar() {
    const termo = normalizar(estado.busca);
    resultado = todasSessoes()
      .filter(s => s.inicio > agora())                                   // nunca mostra sessão que já começou
      .filter(s => !estado.data || s.data === estado.data)
      .filter(s => !estado.genero || s.programa.genero === estado.genero)
      .filter(s => !estado.classif.length || estado.classif.includes(s.programa.classificacao))
      .filter(s => !estado.periodo || periodoDe(s.hora) === estado.periodo)
      .filter(s => !estado.livres || s.livres > 0)
      .filter(s => !termo || normalizar(s.programa.titulo).includes(termo))
      .sort(ORDENS[estado.ordem].fn);

    const total = resultado.length;
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    estado.pagina = Math.min(estado.pagina, paginas);                    // ?pagina=99 vira a última
    const ini = (estado.pagina - 1) * POR_PAGINA;
    const pagina = resultado.slice(ini, ini + POR_PAGINA);

    $('#contador').textContent = total
      ? `${plural(total, 'sessão encontrada', 'sessões encontradas')} · mostrando ${ini + 1}–${ini + pagina.length}`
      : 'Nenhuma sessão encontrada';

    $('#grade').innerHTML = total ? pagina.map(cardSessao).join('') : `
      <div class="vazio">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <h2>Nenhuma sessão encontrada</h2>
        <p>Tente outro dia ou limpe os filtros.</p>
      </div>`;
    escalonar($('#grade'));
    desenharPaginacao(paginas);

    // quantidade de filtros ativos (aparece no botão "Filtros" do celular)
    const qtd = [estado.data, estado.genero, estado.periodo, estado.busca, estado.livres].filter(Boolean).length + estado.classif.length;
    $('#filtros-qtd').textContent = qtd ? `(${qtd})` : '';

    gravarNaUrl();
  }

  function desenharPaginacao(paginas) {
    const nav = $('#paginacao');
    if (paginas <= 1) { nav.hidden = true; nav.innerHTML = ''; return; }
    nav.hidden = false;
    const p = estado.pagina;
    nav.innerHTML = `
      <button type="button" data-pagina="${p - 1}" ${p === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>
      ${Array.from({ length: paginas }, (_, k) => k + 1).map(n => `
        <button type="button" data-pagina="${n}" ${n === p ? 'class="ativa" aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`).join('')}
      <button type="button" data-pagina="${p + 1}" ${p === paginas ? 'disabled' : ''} aria-label="Próxima página">›</button>`;
  }

  // Só grava parâmetros diferentes do padrão (URL limpa).
  // replaceState: troca a URL sem criar histórico e SEM disparar hashchange.
  function gravarNaUrl() {
    const q = new URLSearchParams();
    if (estado.busca) q.set('busca', estado.busca);
    if (estado.data) q.set('data', estado.data);
    if (estado.genero) q.set('genero', estado.genero);
    if (estado.classif.length) q.set('classif', estado.classif.join(','));
    if (estado.periodo) q.set('periodo', estado.periodo);
    if (estado.livres) q.set('livres', '1');
    if (estado.ordem !== 'horario') q.set('ordem', estado.ordem);
    if (estado.pagina > 1) q.set('pagina', estado.pagina);
    const qs = q.toString();
    history.replaceState(null, '', `#/programacao${qs ? '?' + qs : ''}`);
  }

  // ---------- 5. Modal de detalhes com navegação pelas setas ----------
  function abrirDetalhes(i) {
    let atual = i;
    const ir = passo => {
      atual = (atual + passo + resultado.length) % resultado.length;   // loop
      trocarConteudo(htmlDetalhes(resultado[atual], atual, resultado.length));
      ligarBotoes();
    };
    const ligarBotoes = () => {
      const corpo = document.getElementById('modal-corpo');
      corpo.querySelector('#det-ant').addEventListener('click', () => ir(-1));
      corpo.querySelector('#det-prox').addEventListener('click', () => ir(1));
      corpo.querySelectorAll('a').forEach(a => a.addEventListener('click', () => fecharModal()));
    };
    abrirModal(htmlDetalhes(resultado[atual], atual, resultado.length), {
      tipo: 'detalhes',
      aoTecla: e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
      },
    });
    ligarBotoes();
  }

  sincronizarControles();
  aplicar();
}

// ---------- HTML de um card ----------
function cardSessao(s) {
  const p = s.programa, c = CLASSIF[p.classificacao];
  const pct = Math.round((s.livres / s.sala.capacidade) * 100);
  const nivel = s.livres === 0 ? 'esgotada' : pct <= 20 ? 'poucos' : 'ok';
  return `
    <article class="card-sessao inclinar card-sessao--${nivel}">
      <div class="card-sessao__poster">
        <img src="${p.imagem}" alt="Pôster de ${esc(p.titulo)}" width="400" height="500" loading="lazy">
        <span class="classif classif--${c.cor}" title="${c.texto}">${p.classificacao}</span>
        ${s.livres === 0 ? '<span class="selo selo--esgotada">Esgotada</span>' : ''}
      </div>
      <div class="card-sessao__corpo">
        <p class="card-sessao__quando"><time datetime="${s.data}T${s.hora}">${diaSemana(s.data, true)}, ${dataBR(s.data)} · ${s.hora}</time></p>
        <h2 class="card-sessao__titulo">${esc(p.titulo)}</h2>
        <p class="card-sessao__meta">${esc(p.genero)} · ${esc(s.sala.nome)} · ${p.duracao_min} min</p>
        <div class="lotacao lotacao--${nivel}" style="--v:${pct}">
          <span class="lotacao__barra" aria-hidden="true"><span></span></span>
          <span class="lotacao__texto">${s.livres === 0 ? 'Sem lugares livres' : `${s.livres} de ${s.sala.capacidade} lugares livres`}</span>
        </div>
        <p class="card-sessao__preco">Inteira <strong>${reais(s.preco_inteira)}</strong> · Meia ${reais(s.preco_inteira / 2)}</p>
        <div class="card-sessao__acoes">
          <button type="button" class="botao botao--contorno botao--pequeno" data-detalhe="${s.id}" aria-label="Detalhes de ${esc(p.titulo)}, ${dataBR(s.data)} ${s.hora}">Detalhes</button>
          ${s.livres ? `<a class="botao botao--pequeno brilho" href="#/sessao/${s.id}">Escolher lugares</a>`
                     : '<button type="button" class="botao botao--pequeno" disabled>Esgotada</button>'}
        </div>
      </div>
    </article>`;
}

// ---------- HTML do modal ----------
function htmlDetalhes(s, i, total) {
  const p = s.programa, c = CLASSIF[p.classificacao];
  const outras = dados.sessoes
    .filter(x => x.programa_id === p.id && x.id !== s.id)
    .filter(x => dataLocal(x.data, x.hora) > agora())
    .sort((a, b) => dataLocal(a.data, a.hora) - dataLocal(b.data, b.hora));
  return `
    <div class="detalhes">
      <img class="detalhes__img" src="${p.imagem}" alt="Pôster de ${esc(p.titulo)}">
      <div class="detalhes__texto">
        <p class="rotulo"><span class="classif classif--${c.cor}">${p.classificacao}</span> ${esc(p.genero)} · ${c.texto}</p>
        <h2 id="modal-titulo" class="modal__titulo">${esc(p.titulo)}</h2>
        <p class="estrelas" style="--nota:${p.avaliacao}" aria-label="Avaliação ${p.avaliacao.toFixed(1).replace('.', ',')} de 5">
          <span aria-hidden="true">★★★★★</span> <b>${p.avaliacao.toFixed(1).replace('.', ',')}</b></p>
        <p>${esc(p.sinopse)}</p>
        <dl class="ficha">
          <div><dt>Sessão</dt><dd>${diaSemana(s.data)}, ${dataBR(s.data)} às ${s.hora}</dd></div>
          <div><dt>Sala</dt><dd>${esc(s.sala.nome)}</dd></div>
          <div><dt>Duração</dt><dd>${p.duracao_min} minutos</dd></div>
          <div><dt>Áudio</dt><dd>${esc(s.idioma)}</dd></div>
          <div><dt>Ingresso</dt><dd>${reais(s.preco_inteira)} (meia ${reais(s.preco_inteira / 2)})</dd></div>
          <div><dt>Lugares livres</dt><dd>${s.livres} de ${s.sala.capacidade}</dd></div>
        </dl>
        <h3 class="detalhes__sub">Outras sessões deste programa</h3>
        ${outras.length ? `<ul class="outras">${outras.map(x => `
            <li><a href="#/sessao/${x.id}">${diaSemana(x.data, true)}, ${diaMes(x.data)} · ${x.hora}</a></li>`).join('')}</ul>`
          : '<p class="suave">Esta é a única sessão deste programa na semana.</p>'}
        ${s.livres ? `<a class="botao brilho botao--largo" href="#/sessao/${s.id}">Escolher lugares</a>` : '<p class="selo selo--esgotada">Sessão esgotada</p>'}
      </div>
    </div>
    <div class="detalhes__nav">
      <button type="button" class="botao botao--contorno botao--pequeno" id="det-ant" aria-label="Sessão anterior">‹ Anterior</button>
      <span>${i + 1} de ${total}</span>
      <button type="button" class="botao botao--contorno botao--pequeno" id="det-prox" aria-label="Próxima sessão">Próxima ›</button>
    </div>`;
}
