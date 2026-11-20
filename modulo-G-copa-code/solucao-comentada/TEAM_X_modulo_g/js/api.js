/*
 * api.js – cliente da API (contrato entre P1 e o front)
 * Lança Error com .status e .errors (objeto campo => mensagem) quando a resposta não é 2xx.
 */
const API = {
  base: 'api',
  async pedir(caminho, { metodo = 'GET', corpo = null } = {}) {
    const opcoes = { method: metodo, headers: { Accept: 'application/json' } };
    if (store.org) opcoes.headers.Authorization = 'Bearer ' + store.org.token;
    if (corpo) {
      opcoes.headers['Content-Type'] = 'application/json';
      opcoes.body = JSON.stringify(corpo);
    }
    let r;
    try {
      r = await fetch(`${this.base}/${caminho}`, opcoes);
    } catch (_) {
      const e = new Error('Sem conexão com o servidor.');
      e.status = 0;
      throw e;
    }
    if (r.status === 204) return null;
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(dados.message || `Erro ${r.status}`);
      e.status = r.status;
      e.errors = dados.errors || {};
      // token vencido: desloga em qualquer tela
      if (r.status === 401 && store.org) { store.org = null; sessionStorage.removeItem('copa-org'); }
      throw e;
    }
    return dados;
  },
  schools: () => API.pedir('schools'),
  teams: () => API.pedir('teams'),
  createTeam: (dados) => API.pedir('teams', { metodo: 'POST', corpo: dados }),
  deleteTeam: (id) => API.pedir(`teams/${id}`, { metodo: 'DELETE' }),
  checkIn: (id) => API.pedir(`teams/${id}/check-in`, { metodo: 'POST' }),
  matches: () => API.pedir('matches'),
  bracket: () => API.pedir('bracket', { metodo: 'POST' }),
  score: (id, a, b) => API.pedir(`matches/${id}/score`, { metodo: 'PATCH', corpo: { score_a: a, score_b: b } }),
  login: (username, password) => API.pedir('login', { metodo: 'POST', corpo: { username, password } }),
};
