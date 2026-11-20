/*
 * api.js – cliente da API (contrato combinado entre P1 e o resto do time)
 * ----------------------------------------------------------------------
 * Um único ponto que faz fetch. Vantagens no Team Challenge:
 *  - P1 pode mudar a URL base num lugar só;
 *  - todos tratam erro do mesmo jeito: a função LANÇA um Error com
 *    .status (401, 404, 409, 422...) e .erros (campo => mensagem).
 */
const API = {
  base: 'api',

  async pedir(caminho, { metodo = 'GET', corpo = null } = {}) {
    const opcoes = { method: metodo, headers: { Accept: 'application/json' } };

    // token da equipe (só existe depois do login)
    if (Estado.equipe) opcoes.headers.Authorization = 'Bearer ' + Estado.equipe.token;

    if (corpo instanceof FormData) {
      opcoes.body = corpo; // NÃO definir Content-Type: o navegador põe o boundary do multipart
    } else if (corpo) {
      opcoes.headers['Content-Type'] = 'application/json';
      opcoes.body = JSON.stringify(corpo);
    }

    let resposta;
    try {
      resposta = await fetch(`${this.base}/${caminho}`, opcoes);
    } catch (e) {
      const erro = new Error('Sem conexão com o servidor.');
      erro.status = 0;
      throw erro;
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      const erro = new Error(dados.mensagem || `Erro ${resposta.status}`);
      erro.status = resposta.status;
      erro.erros = dados.erros || {};
      throw erro;
    }
    return dados;
  },

  categorias: () => API.pedir('categorias'),
  chamados: () => API.pedir('chamados'),
  chamado: (id) => API.pedir(`chamados/${id}`),
  criar: (formData) => API.pedir('chamados', { metodo: 'POST', corpo: formData }),
  mudarStatus: (id, status, nota) => API.pedir(`chamados/${id}/status`, { metodo: 'PATCH', corpo: { status, nota } }),
  apoiar: (id) => API.pedir(`chamados/${id}/apoios`, { metodo: 'POST', corpo: { dispositivo: Estado.dispositivo } }),
  indicadores: () => API.pedir('indicadores'),
  login: (usuario, senha) => API.pedir('login', { metodo: 'POST', corpo: { usuario, senha } }),
};
