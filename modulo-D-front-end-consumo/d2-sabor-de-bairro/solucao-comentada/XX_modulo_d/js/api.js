/*
 * UM lugar só para conversar com a API: base, token, JSON, erros e 401.
 * Toda tela chama api('/rota', opções). Se alguma tela fizer fetch() direto, ela esquece o token
 * ou o 401 cedo ou tarde.
 */
import { sessao } from './estado.js';

export const BASE = 'api/index.php';

/** Erro com status e corpo, para a tela decidir o que mostrar (422 por campo, 409 por código...). */
export class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.mensagem || `Erro ${status}`);
    this.status = status;
    this.erros = corpo?.erros || {};
    this.codigo = corpo?.codigo || null;
    this.corpo = corpo || {};
  }
}

let aoExpirar = () => {};
/** O app.js registra aqui o que fazer quando o token vence (ir para /entrar guardando o destino). */
export const quandoSessaoExpirar = (fn) => { aoExpirar = fn; };

export async function api(caminho, { metodo = 'GET', corpo, params, signal } = {}) {
  const url = new URL(BASE + caminho, location.href);
  // Parâmetros vazios não vão na URL (a API trata "" como filtro ligado em alguns campos).
  for (const [k, v] of Object.entries(params || {})) if (v !== '' && v != null && v !== false) url.searchParams.set(k, v);

  const headers = { Accept: 'application/json' };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (sessao.token) headers.Authorization = `Bearer ${sessao.token}`;

  let resposta;
  try {
    resposta = await fetch(url, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo), signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;          // cancelado por nós: a tela ignora
    throw new ErroApi(0, { mensagem: 'Sem conexão com o servidor. Tente de novo.' });
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (resposta.status === 401 && sessao.token) {   // token vencido ou inválido
    sessao.sair();
    aoExpirar();
  }
  if (!resposta.ok) throw new ErroApi(resposta.status, dados);
  return dados;
}

/** Atalho: primeira mensagem de um campo do 422 ("endereco.cep" -> "Use o formato..."). */
export const erroDe = (erro, campo) => erro?.erros?.[campo]?.[0] || '';
