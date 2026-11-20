// =====================================================================
// telas/reservas.js – Minhas reservas (#/reservas?aba=proximas|encerradas|canceladas)
//
//  - ABAS acessíveis (padrão WAI-ARIA): role tablist/tab/tabpanel,
//    aria-selected, setas ← → Home End, só a aba ativa no Tab
//  - a aba fica na URL (?aba=…), então F5 mantém a aba
//  - cancelar: só até 2 h antes; confirmação em modal; vira "cancelada"
//    (NÃO apaga – continua na aba Canceladas com a data do cancelamento)
//  - "Desfazer" no aviso por 6 s
//  - exportar todas as reservas em .json (Blob + link de download)
// =====================================================================
import { dados, ocupadosLocais, gravarOcupadosLocais } from '../api.js';
import { agora, dataLocal, dataBR, diaSemana, reais, esc, ler, gravar, isoDia } from '../util.js';
import { confirmar } from '../modal.js';
import { avisar } from '../avisos.js';
import { escalonar } from '../efeitos.js';

export const titulo = 'Minhas reservas';
const ABAS = { proximas: 'Próximas', encerradas: 'Encerradas', canceladas: 'Canceladas' };

export function grupoDa(r) {
  if (r.status === 'cancelada') return 'canceladas';
  return dataLocal(r.sessao.data, r.sessao.hora) <= agora() ? 'encerradas' : 'proximas';
}

// Pode cancelar se faltam PELO MENOS 2 horas para o início.
export function podeCancelar(r) {
  const horas = (dataLocal(r.sessao.data, r.sessao.hora) - agora()) / 36e5;
  return r.status === 'ativa' && horas >= dados.config.cancelamento_minimo_horas;
}

export function montar(main, _p, query) {
  let aba = ABAS[query.get('aba')] ? query.get('aba') : 'proximas';
  const nova = query.get('nova');
  if (nova) aba = 'proximas';

  main.innerHTML = `
    <div class="cabecalho-pagina cabecalho-pagina--linha">
      <div>
        <h1>Minhas reservas</h1>
        <p>As reservas ficam guardadas neste navegador.</p>
      </div>
      <button type="button" class="botao botao--contorno" id="exportar">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/></svg>
        Baixar reservas (.json)</button>
    </div>
    <div class="abas" role="tablist" aria-label="Situação das reservas" id="abas"></div>
    <div id="painel" role="tabpanel" tabindex="0"></div>`;

  const abasEl = main.querySelector('#abas');
  const painel = main.querySelector('#painel');

  function desenhar(focarAba = false) {
    const reservas = ler('orbita:reservas', []);
    const grupos = { proximas: [], encerradas: [], canceladas: [] };
    reservas.forEach(r => grupos[grupoDa(r)].push(r));
    // Próximas: a mais perto primeiro. As outras: a mais recente primeiro.
    const quando = r => dataLocal(r.sessao.data, r.sessao.hora);
    grupos.proximas.sort((a, b) => quando(a) - quando(b));
    grupos.encerradas.sort((a, b) => quando(b) - quando(a));
    grupos.canceladas.sort((a, b) => b.cancelada_em.localeCompare(a.cancelada_em));

    abasEl.innerHTML = Object.entries(ABAS).map(([k, t]) => `
      <button type="button" role="tab" id="aba-${k}" data-aba="${k}" aria-controls="painel"
        aria-selected="${k === aba}" tabindex="${k === aba ? 0 : -1}">${t} <span class="abas__qtd">${grupos[k].length}</span></button>`).join('');
    painel.setAttribute('aria-labelledby', `aba-${aba}`);

    const lista = grupos[aba];
    painel.innerHTML = lista.length ? `<div class="lista-reservas">${lista.map(cardReserva).join('')}</div>` : `
      <div class="vazio">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 1 0-4V4H3z"/></svg>
        <h2>${{ proximas: 'Nenhuma reserva para os próximos dias', encerradas: 'Nenhuma sessão assistida ainda', canceladas: 'Nenhuma reserva cancelada' }[aba]}</h2>
        ${aba === 'proximas' ? '<a class="botao" href="#/programacao">Ver programação</a>' : ''}
      </div>`;
    escalonar(painel.querySelector('.lista-reservas') || painel);
    if (focarAba) abasEl.querySelector('[aria-selected="true"]').focus();
    history.replaceState(null, '', `#/reservas${aba !== 'proximas' ? '?aba=' + aba : ''}`);
  }

  function cardReserva(r) {
    const pode = podeCancelar(r);
    const grupo = grupoDa(r);
    return `
      <article class="reserva reserva--${grupo} ${r.codigo === nova ? 'reserva--nova' : ''}" data-codigo="${r.codigo}">
        <header class="reserva__topo">
          <p class="reserva__codigo">${r.codigo}</p>
          <span class="selo selo--${grupo}">${{ proximas: 'Confirmada', encerradas: 'Encerrada', canceladas: 'Cancelada' }[grupo]}</span>
        </header>
        <h2 class="reserva__titulo">${esc(r.sessao.programa)}</h2>
        <p><time datetime="${r.sessao.data}T${r.sessao.hora}">${diaSemana(r.sessao.data)}, ${dataBR(r.sessao.data)} às ${r.sessao.hora}</time> · ${esc(r.sessao.sala)}</p>
        <ul class="reserva__lugares">${r.lugares.map(l => `<li>${l.id} <small>${l.tipo === 'meia' ? 'meia' : 'inteira'}</small></li>`).join('')}</ul>
        <p class="reserva__total">Total <strong>${reais(r.total)}</strong> · ${esc(r.pagamento)}</p>
        ${grupo === 'canceladas' ? `<p class="suave">Cancelada em ${dataBR(r.cancelada_em.slice(0, 10))}</p>` : ''}
        ${grupo === 'proximas' ? (pode
          ? `<button type="button" class="botao botao--perigo botao--pequeno" data-cancelar="${r.codigo}">Cancelar reserva</button>`
          : `<p class="aviso-inline">Cancelamento encerrado: faltam menos de ${dados.config.cancelamento_minimo_horas} horas para a sessão.</p>`) : ''}
      </article>`;
  }

  // ---------- abas: clique e teclado ----------
  abasEl.addEventListener('click', e => {
    const t = e.target.closest('[role="tab"]'); if (!t) return;
    aba = t.dataset.aba; desenhar(true);
  });
  abasEl.addEventListener('keydown', e => {
    const chaves = Object.keys(ABAS);
    let i = chaves.indexOf(aba);
    if (e.key === 'ArrowRight') i = (i + 1) % chaves.length;
    else if (e.key === 'ArrowLeft') i = (i - 1 + chaves.length) % chaves.length;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = chaves.length - 1;
    else return;
    e.preventDefault(); aba = chaves[i]; desenhar(true);
  });

  // ---------- cancelar + desfazer ----------
  painel.addEventListener('click', async e => {
    const b = e.target.closest('[data-cancelar]'); if (!b) return;
    const reservas = ler('orbita:reservas', []);
    const r = reservas.find(x => x.codigo === b.dataset.cancelar);
    if (!podeCancelar(r)) { avisar('Esta reserva não pode mais ser cancelada.', { tipo: 'erro' }); desenhar(); return; }
    const ok = await confirmar({
      titulo: 'Cancelar reserva?',
      texto: `${esc(r.sessao.programa)} – ${dataBR(r.sessao.data)} às ${r.sessao.hora}, lugares ${r.lugares.map(l => l.id).join(', ')}. O valor de ${reais(r.total)} volta para o mesmo meio de pagamento.`,
      sim: 'Sim, cancelar', nao: 'Manter reserva', perigo: true,
    });
    if (!ok) return;
    mudarStatus(r.codigo, 'cancelada');
    desenhar();
    avisar(`Reserva ${r.codigo} cancelada.`, {
      tipo: 'sucesso', duracao: 6000,
      acao: { texto: 'Desfazer', executar: () => { mudarStatus(r.codigo, 'ativa'); desenhar(); avisar('Cancelamento desfeito.'); } },
    });
  });

  main.querySelector('#exportar').addEventListener('click', () => {
    const json = JSON.stringify(ler('orbita:reservas', []), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `reservas-orbita-${isoDia(agora()).replaceAll('-', '')}.json` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);   // libera a memória
  });

  desenhar();
  if (nova) main.querySelector('.reserva--nova')?.scrollIntoView({ block: 'center' });
}

// Cancela ou reativa: muda o status E libera/ocupa os lugares da sessão.
function mudarStatus(codigo, status) {
  const reservas = ler('orbita:reservas', []);
  const r = reservas.find(x => x.codigo === codigo);
  r.status = status;
  r.cancelada_em = status === 'cancelada' ? agora().toISOString() : null;
  gravar('orbita:reservas', reservas);
  if (r.sessao_id) {
    const ids = r.lugares.map(l => l.id);
    const atuais = ocupadosLocais(r.sessao_id);
    gravarOcupadosLocais(r.sessao_id, status === 'cancelada' ? atuais.filter(x => !ids.includes(x)) : [...new Set([...atuais, ...ids])]);
  }
}
