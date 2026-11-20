/*
 * api.js – TODA conversa com o servidor passa por aqui.
 *
 * Por que centralizar?
 *  1. O token vai em todas as requisições sem você lembrar de colocar.
 *  2. Erros viram um objeto só (ErroApi) com status, mensagem, erros por campo e código.
 *  3. Um 401 em qualquer tela dispara o mesmo tratamento: "sessão expirada" -> volta para o login.
 */
const BASE = 'api/index.php';   // caminho RELATIVO: funciona em http://servidor/XX_modulo_d/
const CHAVE_SESSAO = 'pulso.sessao';

export class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.mensagem || 'Erro inesperado. Tente novamente.');
    this.status = status;            // 0 = sem conexão
    this.erros = corpo?.erros || {}; // { campo: ['mensagem', ...] } nos 422
    this.codigo = corpo?.codigo || null; // ex.: 'AULA_LOTADA', 'CONFLITO_HORARIO'
  }
}

/* ---------- Sessão (token + dados do usuário) no localStorage ---------- */
export const sessao = {
  ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
  },
  get token() { return this.ler()?.token || null; },
  get usuario() { return this.ler()?.usuario || null; },
  salvar(token, usuario) { localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, usuario })); },
  atualizarUsuario(usuario) { const s = this.ler(); if (s) this.salvar(s.token, usuario); },
  limpar() { localStorage.removeItem(CHAVE_SESSAO); },
};

let aoExpirar = () => {};
/** app.js registra aqui o que fazer quando o servidor responder 401. */
export function quandoSessaoExpirar(fn) { aoExpirar = fn; }

/**
 * Faz a requisição e devolve o JSON já convertido.
 * @param {string} caminho  ex.: '/aulas'
 * @param {object} op  { metodo, corpo (objeto ou FormData), query (objeto), sinal (AbortSignal) }
 */
export async function api(caminho, { metodo = 'GET', corpo, query, sinal } = {}) {
  const url = new URL(BASE + caminho, location.href);
  // Parâmetros vazios não vão para a URL (a API trataria '' como filtro).
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== '' && v !== null && v !== undefined && v !== false) url.searchParams.set(k, v);
  }

  const headers = { Accept: 'application/json' };
  if (sessao.token) headers.Authorization = 'Bearer ' + sessao.token;

  let body;
  if (corpo instanceof FormData) body = corpo;            // upload: o navegador monta o multipart sozinho
  else if (corpo !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(corpo); }

  let resp;
  try {
    resp = await fetch(url, { method: metodo, headers, body, signal: sinal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;                 // cancelada de propósito: quem chamou ignora
    throw new ErroApi(0, { mensagem: 'Sem conexão com o servidor. Verifique a rede e tente novamente.' });
  }

  if (resp.status === 204) return null;                   // 204 = sucesso sem corpo (logout, sair da fila)
  let dados = null;
  try { dados = await resp.json(); } catch { /* corpo vazio ou não-JSON */ }

  if (!resp.ok) {
    const erro = new ErroApi(resp.status, dados);
    if (resp.status === 401 && caminho !== '/login') aoExpirar(erro);
    throw erro;
  }
  return dados;
}
