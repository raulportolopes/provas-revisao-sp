// =====================================================================
// telas/sessao.js – mapa de lugares (#/sessao/:id).
//
// Regras do enunciado (todas validadas aqui no cliente):
//  1. Lugar ocupado não pode ser marcado.
//  2. No máximo 6 lugares (config.limite_lugares).
//  3. Lugar de cadeirante (C) só com "Preciso de lugar acessível" ligado.
//  4. Meia-entrada: no máximo metade dos lugares, arredondando para cima.
//  5. Não pode sobrar UM lugar livre sozinho entre dois lugares tomados
//     (ocupados ou selecionados) no mesmo bloco da fileira.
//  6. Cronômetro de 5 minutos começa no primeiro lugar marcado.
//  7. Já existe carrinho de OUTRA sessão? Pergunta antes de trocar.
//  8. Teclado: setas andam pelo mapa (roving tabindex), Enter/Espaço marca.
// =====================================================================
import { dados, sessaoPorId, lugaresDaSala, ocupados } from '../api.js';
import { agora, dataBR, diaSemana, reais, esc, centavos, plural } from '../util.js';
import { carrinho, salvarCarrinho, limparCarrinho, mmss, segundosRestantes } from '../carrinho.js';
import { avisar } from '../avisos.js';
import { confirmar } from '../modal.js';

export const titulo = 'Escolher lugares';

export function montar(main, params) {
  const s = sessaoPorId(Number(params[0]));
  if (!s) {
    main.innerHTML = `<section class="nao-encontrada"><h1>Sessão não encontrada</h1>
      <p>Essa sessão não existe ou saiu da programação.</p><a class="botao" href="#/programacao">Ver programação</a></section>`;
    return { titulo: 'Sessão não encontrada' };
  }
  if (s.inicio <= agora()) {
    main.innerHTML = `<section class="nao-encontrada"><h1>Esta sessão já começou</h1>
      <p>As vendas encerram no horário de início.</p><a class="botao" href="#/programacao">Ver outras sessões</a></section>`;
    return { titulo: 'Sessão encerrada' };
  }

  const cfg = dados.config;
  const tomados = ocupados(s);                       // Set com ids ocupados (API + vendidos aqui)
  const lugares = lugaresDaSala(s.sala);             // [{id, fileira, numero, col, acessivel}]
  const porId = Object.fromEntries(lugares.map(l => [l.id, l]));

  // Estado da tela. Se o carrinho é desta sessão, recupera (F5 / voltar do pagamento).
  const c = carrinho();
  const estado = {
    selecionados: c && c.sessaoId === s.id ? c.lugares.filter(l => !tomados.has(l.id)) : [],  // [{id, tipo}]
    acessivel: c && c.sessaoId === s.id ? !!c.acessivel : false,
  };
  let foco = null;   // id do lugar que tem tabindex=0

  main.innerHTML = `
    <div class="cabecalho-pagina cabecalho-pagina--sessao">
      <a class="link-voltar" href="#/programacao">‹ Programação</a>
      <h1>${esc(s.programa.titulo)}</h1>
      <p><time datetime="${s.data}T${s.hora}">${diaSemana(s.data)}, ${dataBR(s.data)} às ${s.hora}</time> · ${esc(s.sala.nome)} · ${esc(s.idioma)}</p>
    </div>
    <div class="compra">
      <section class="mapa-area" aria-labelledby="titulo-mapa">
        <h2 id="titulo-mapa" class="sr-only">Mapa de lugares</h2>
        <div class="legenda" aria-hidden="true">
          <span><i class="lugar lugar--livre"></i>Livre</span>
          <span><i class="lugar lugar--selecionado"></i>Selecionado</span>
          <span><i class="lugar lugar--ocupado"></i>Ocupado</span>
          <span><i class="lugar lugar--acessivel"></i>Acessível</span>
        </div>
        <label class="interruptor">
          <input type="checkbox" id="acessivel" role="switch">
          <span class="interruptor__trilho" aria-hidden="true"></span>
          Preciso de lugar acessível (cadeirante)
        </label>
        <div class="mapa-rolagem">
          <div class="cupula" aria-hidden="true"><span>CÚPULA</span></div>
          <div class="mapa" id="mapa" role="grid" aria-label="Lugares da ${esc(s.sala.nome)}. Use as setas para andar e Enter para marcar."></div>
        </div>
        <p class="dica-teclado">Dica: use as setas do teclado para andar pelo mapa e Enter ou Espaço para marcar.</p>
      </section>

      <aside class="resumo" aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo">Seu pedido</h2>
        <p class="resumo__tempo" id="resumo-tempo" hidden>Lugares reservados por <strong data-tempo-restante>05:00</strong></p>
        <div id="lista-ingressos"></div>
        <dl class="resumo__valores" id="valores"></dl>
        <p class="erro-texto" id="erro-isolado" role="alert"></p>
        <button type="button" class="botao brilho botao--largo" id="continuar">Continuar para o pagamento</button>
        <button type="button" class="botao botao--texto botao--largo" id="limpar">Limpar seleção</button>
      </aside>
    </div>`;

  const mapa = main.querySelector('#mapa');
  const chkAcessivel = main.querySelector('#acessivel');
  chkAcessivel.checked = estado.acessivel;

  // ---------- desenho do mapa (uma vez); depois só trocamos classes ----------
  s.sala.layout.forEach((linha, r) => {
    const fileira = String.fromCharCode(65 + r);
    const row = document.createElement('div');
    row.className = 'fileira'; row.setAttribute('role', 'row');
    row.innerHTML = `<span class="fileira__letra" role="rowheader">${fileira}</span>`;
    let n = 0;
    [...linha].forEach(ch => {
      if (ch === 'A' || ch === 'C') {
        n++;
        const id = `${fileira}${n}`;
        row.insertAdjacentHTML('beforeend', `<span role="gridcell"><button type="button" class="lugar" data-id="${id}" tabindex="-1">${n}</button></span>`);
      } else {
        row.insertAdjacentHTML('beforeend', `<span class="${ch === '_' ? 'corredor' : 'buraco'}" aria-hidden="true"></span>`);
      }
    });
    row.insertAdjacentHTML('beforeend', `<span class="fileira__letra" aria-hidden="true">${fileira}</span>`);
    mapa.appendChild(row);
  });
  const botoes = Object.fromEntries([...mapa.querySelectorAll('.lugar')].map(b => [b.dataset.id, b]));

  // ---------- atualizar(): estado -> tela ----------
  function atualizar() {
    const sel = new Set(estado.selecionados.map(l => l.id));
    for (const l of lugares) {
      const b = botoes[l.id];
      const ocupado = tomados.has(l.id);
      const bloqueado = ocupado || (l.acessivel && !estado.acessivel);
      b.className = 'lugar' + (ocupado ? ' lugar--ocupado' : sel.has(l.id) ? ' lugar--selecionado' : ' lugar--livre') + (l.acessivel ? ' lugar--acessivel' : '');
      b.setAttribute('aria-pressed', String(sel.has(l.id)));
      // aria-disabled (e não disabled) para o lugar continuar focável pelas setas
      if (bloqueado) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      const situacao = ocupado ? 'ocupado' : sel.has(l.id) ? 'selecionado' : (l.acessivel && !estado.acessivel) ? 'acessível, ligue a opção de lugar acessível' : 'livre';
      b.setAttribute('aria-label', `Fileira ${l.fileira}, lugar ${l.numero}${l.acessivel ? ', para cadeirante' : ''}: ${situacao}`);
    }
    // roving tabindex: só UM lugar fica no Tab
    if (!foco || !botoes[foco]) foco = (estado.selecionados[0] || lugares.find(l => !tomados.has(l.id)) || lugares[0]).id;
    Object.values(botoes).forEach(b => (b.tabIndex = b.dataset.id === foco ? 0 : -1));

    desenharResumo();
    // Grava o carrinho. CUIDADO: só apaga se o carrinho for DESTA sessão
    // (abrir outra sessão só para olhar não pode liberar os lugares da primeira).
    const atual = carrinho();
    const desta = atual && atual.sessaoId === s.id;
    if (estado.selecionados.length) {
      salvarCarrinho({ sessaoId: s.id, lugares: estado.selecionados, acessivel: estado.acessivel, expiraEm: desta ? atual.expiraEm : null });
    } else if (desta) limparCarrinho();
    main.querySelector('#resumo-tempo').hidden = !estado.selecionados.length;
    main.querySelector('[data-tempo-restante]').textContent = mmss(segundosRestantes() || cfg.tempo_reserva_segundos);
    main.querySelector('#erro-isolado').textContent = '';
    mapa.querySelectorAll('.lugar--isolado').forEach(b => b.classList.remove('lugar--isolado'));
  }

  function desenharResumo() {
    const sel = ordenar(estado.selecionados);
    const lista = main.querySelector('#lista-ingressos');
    if (!sel.length) {
      lista.innerHTML = '<p class="suave">Escolha até ' + cfg.limite_lugares + ' lugares no mapa.</p>';
    } else {
      lista.innerHTML = `<ul class="ingressos">${sel.map(l => `
        <li>
          <span class="ingressos__lugar">${l.id}</span>
          <label class="sr-only" for="tipo-${l.id}">Tipo do ingresso do lugar ${l.id}</label>
          <select id="tipo-${l.id}" data-tipo="${l.id}">
            <option value="inteira" ${l.tipo === 'inteira' ? 'selected' : ''}>Inteira ${reais(s.preco_inteira)}</option>
            <option value="meia" ${l.tipo === 'meia' ? 'selected' : ''}>Meia ${reais(s.preco_inteira / 2)}</option>
          </select>
          <button type="button" class="botao-icone" data-remover="${l.id}" aria-label="Remover lugar ${l.id}">✕</button>
        </li>`).join('')}</ul>
        <p class="suave">Meias: no máximo ${maxMeias()} de ${plural(sel.length, 'ingresso', 'ingressos')}.</p>`;
    }
    const v = valores(sel, s.preco_inteira, cfg.taxa_servico_percentual);
    main.querySelector('#valores').innerHTML = `
      <div><dt>Ingressos (${sel.length})</dt><dd>${reais(v.subtotal)}</dd></div>
      <div><dt>Taxa de serviço (${cfg.taxa_servico_percentual}%)</dt><dd>${reais(v.taxa)}</dd></div>
      <div class="resumo__total"><dt>Total</dt><dd>${reais(v.total)}</dd></div>`;
    main.querySelector('#continuar').disabled = !sel.length;
  }

  const maxMeias = () => Math.ceil(estado.selecionados.length / 2);
  // Ordena A1, A2, ..., A10, B1 (comparação numérica do número do lugar)
  const ordenar = lista => [...lista].sort((a, b) => a.id[0].localeCompare(b.id[0]) || Number(a.id.slice(1)) - Number(b.id.slice(1)));

  // ---------- marcar / desmarcar ----------
  async function alternar(id) {
    const l = porId[id];
    if (tomados.has(id)) { avisar(`O lugar ${id} já está ocupado.`, { tipo: 'erro' }); return; }
    if (l.acessivel && !estado.acessivel) { avisar('Ligue "Preciso de lugar acessível" para escolher este lugar.', { tipo: 'info' }); return; }
    const i = estado.selecionados.findIndex(x => x.id === id);
    if (i >= 0) {
      estado.selecionados.splice(i, 1);
      ajustarMeias();
    } else {
      if (estado.selecionados.length >= cfg.limite_lugares) {
        avisar(`Você pode escolher no máximo ${cfg.limite_lugares} lugares por compra.`, { tipo: 'erro' }); return;
      }
      // Regra 7: carrinho de outra sessão
      const atual = carrinho();
      if (atual && atual.sessaoId !== s.id) {
        const outra = sessaoPorId(atual.sessaoId);
        const ok = await confirmar({
          titulo: 'Trocar de sessão?',
          texto: `Você tem ${plural(atual.lugares.length, 'lugar reservado', 'lugares reservados')} em "${esc(outra.programa.titulo)}" (${dataBR(outra.data)} ${outra.hora}). Se continuar, eles serão liberados.`,
          sim: 'Liberar e continuar', nao: 'Manter a outra sessão',
        });
        if (!ok) return;
        limparCarrinho();
      }
      estado.selecionados.push({ id, tipo: 'inteira' });
    }
    foco = id;
    atualizar();
    botoes[id].focus();
  }

  // Se removeu lugares e agora há meias demais, as últimas viram inteiras.
  function ajustarMeias() {
    let sobra = estado.selecionados.filter(l => l.tipo === 'meia').length - maxMeias();
    if (sobra <= 0) return;
    for (let k = estado.selecionados.length - 1; k >= 0 && sobra > 0; k--) {
      if (estado.selecionados[k].tipo === 'meia') { estado.selecionados[k].tipo = 'inteira'; sobra--; }
    }
    avisar(`Limite de meias ajustado para ${maxMeias()}.`, { tipo: 'info' });
  }

  // ---------- eventos ----------
  mapa.addEventListener('click', e => { const b = e.target.closest('.lugar'); if (b) alternar(b.dataset.id); });

  // Navegação pelas setas: anda para o lugar mais próximo naquela direção.
  mapa.addEventListener('keydown', e => {
    const b = e.target.closest('.lugar'); if (!b) return;
    const l = porId[b.dataset.id];
    const r = l.fileira.charCodeAt(0) - 65;
    let alvo = null;
    const naFileira = fr => lugares.filter(x => x.fileira === fr);
    if (e.key === 'ArrowRight') alvo = naFileira(l.fileira).find(x => x.col > l.col);
    if (e.key === 'ArrowLeft') alvo = naFileira(l.fileira).reverse().find(x => x.col < l.col);
    if (e.key === 'Home') alvo = naFileira(l.fileira)[0];
    if (e.key === 'End') alvo = naFileira(l.fileira).at(-1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const fr = String.fromCharCode(65 + r + (e.key === 'ArrowUp' ? -1 : 1));
      const op = naFileira(fr);
      // a fileira de cima/baixo pode ter outro desenho: pega a coluna mais próxima
      if (op.length) alvo = op.reduce((m, x) => (Math.abs(x.col - l.col) < Math.abs(m.col - l.col) ? x : m));
    }
    if (alvo) {
      e.preventDefault();
      foco = alvo.id;
      Object.values(botoes).forEach(x => (x.tabIndex = x.dataset.id === foco ? 0 : -1));
      botoes[foco].focus();
    }
  });

  chkAcessivel.addEventListener('change', () => {
    estado.acessivel = chkAcessivel.checked;
    if (!estado.acessivel) {
      const antes = estado.selecionados.length;
      estado.selecionados = estado.selecionados.filter(x => !porId[x.id].acessivel);
      if (estado.selecionados.length < antes) { avisar('Os lugares acessíveis foram removidos da seleção.'); ajustarMeias(); }
    }
    atualizar();
  });

  const resumo = main.querySelector('.resumo');
  resumo.addEventListener('change', e => {
    const sel = e.target.closest('[data-tipo]'); if (!sel) return;
    const item = estado.selecionados.find(x => x.id === sel.dataset.tipo);
    const meias = estado.selecionados.filter(x => x.tipo === 'meia' && x !== item).length + (sel.value === 'meia' ? 1 : 0);
    if (meias > maxMeias()) {
      sel.value = 'inteira';
      avisar(`No máximo ${maxMeias()} ${maxMeias() === 1 ? 'meia-entrada' : 'meias-entradas'} nesta compra.`, { tipo: 'erro' });
      return;
    }
    item.tipo = sel.value;
    atualizar();
  });
  resumo.addEventListener('click', e => {
    const r = e.target.closest('[data-remover]'); if (r) alternar(r.dataset.remover);
  });
  main.querySelector('#limpar').addEventListener('click', () => { estado.selecionados = []; limparCarrinho(); atualizar(); });

  main.querySelector('#continuar').addEventListener('click', () => {
    const isolados = lugaresIsolados(s.sala, tomados, new Set(estado.selecionados.map(x => x.id)));
    if (isolados.length) {
      isolados.forEach(id => botoes[id].classList.add('lugar--isolado'));
      main.querySelector('#erro-isolado').textContent =
        `Não deixe ${isolados.length === 1 ? 'o lugar ' + isolados[0] : 'os lugares ' + isolados.join(', ')} sozinho entre lugares ocupados. Escolha ${isolados.length === 1 ? 'esse lugar' : 'esses lugares'} ou mude a seleção.`;
      botoes[isolados[0]].focus();
      return;
    }
    location.hash = '#/pagamento';
  });

  const expirou = () => { estado.selecionados = []; atualizar(); };
  window.addEventListener('carrinho-expirou', expirou);

  atualizar();
  return { limpar: () => window.removeEventListener('carrinho-expirou', expirou) };
}

// Valor de cada ingresso, subtotal, taxa (arredondada a 2 casas) e total.
export function valores(sel, precoInteira, taxaPct) {
  const subtotal = centavos(sel.reduce((soma, l) => soma + (l.tipo === 'meia' ? precoInteira / 2 : precoInteira), 0));
  const taxa = centavos(subtotal * taxaPct / 100);
  return { subtotal, taxa, total: centavos(subtotal + taxa) };
}

// Regra 5: devolve os lugares livres que ficariam sozinhos.
// Percorre cada fileira em blocos (o corredor "_" e o vazio "." quebram o bloco).
// Um lugar livre é "isolado" quando os DOIS vizinhos do bloco estão tomados
// e pelo menos um deles é um lugar que o cliente acabou de selecionar
// (se os dois vizinhos já eram ocupados antes, a culpa não é do cliente).
export function lugaresIsolados(sala, ocupadosSet, selSet) {
  const isolados = [];
  sala.layout.forEach((linha, r) => {
    const fileira = String.fromCharCode(65 + r);
    let n = 0; let bloco = [];
    const fechar = () => {
      bloco.forEach((id, k) => {
        if (ocupadosSet.has(id) || selSet.has(id)) return;
        const esq = bloco[k - 1], dir = bloco[k + 1];
        if (!esq || !dir) return;   // ponta do bloco nunca é "isolada"
        const tomado = x => ocupadosSet.has(x) || selSet.has(x);
        if (tomado(esq) && tomado(dir) && (selSet.has(esq) || selSet.has(dir))) isolados.push(id);
      });
      bloco = [];
    };
    [...linha].forEach(ch => {
      if (ch === 'A' || ch === 'C') { n++; bloco.push(`${fileira}${n}`); } else fechar();
    });
    fechar();
  });
  return isolados;
}
