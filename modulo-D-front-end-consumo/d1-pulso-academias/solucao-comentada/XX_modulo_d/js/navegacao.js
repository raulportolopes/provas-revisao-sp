/*
 * navegacao.js – funções pequenas usadas pelo roteador (app.js) e pelas telas.
 * Ficam separadas do app.js para as telas não precisarem importar o app (evita import circular).
 */
import { sessao } from './api.js';
import { esc } from './formatos.js';

export const CHAVE_DESTINO = 'pulso.destino';

/** Lê o hash: '#/agenda?data=2026-11-24' -> { nome: 'agenda', params: URLSearchParams } */
export function lerHash() {
  const [caminho, qs = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { nome: caminho || 'agenda', params: new URLSearchParams(qs) };
}
/** Troca o hash sem criar entrada no histórico e sem remontar a tela. */
export function substituirParams(nome, params) {
  const qs = params.toString();
  history.replaceState(null, '', `#/${nome}${qs ? '?' + qs : ''}`);
}

/** Nome e foto no cabeçalho (chamado também pelo perfil depois de salvar). */
export function desenharUsuario() {
  const u = sessao.usuario;
  if (!u) return;
  document.getElementById('avatar-topo-nome').textContent = u.nome.split(' ')[0];
  document.getElementById('avatar-topo-img').innerHTML = avatarHTML(u);
}
export function avatarHTML(u) {
  if (u.foto) return `<img src="${esc(u.foto)}" alt="">`;
  const ini = u.nome.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return `<span aria-hidden="true">${esc(ini)}</span>`;
}

/** Destino guardado pela guarda de rota (ou #/agenda). */
export function destinoDepoisDoLogin() {
  const d = sessionStorage.getItem(CHAVE_DESTINO);
  sessionStorage.removeItem(CHAVE_DESTINO);
  return d && !d.startsWith('#/entrar') ? d : '#/agenda';
}

