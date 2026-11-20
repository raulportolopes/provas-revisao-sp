/*
 * app.js – Pacote P5: integração (rotas, menu ativo, tema, login, carga inicial)
 * ------------------------------------------------------------------------------
 * Este arquivo é o último a ser carregado: ele "liga" os módulos dos colegas.
 * No Team Challenge, quem fica com P5 também é quem faz o merge e publica.
 */
const TITULOS = { painel: 'Painel', mapa: 'Mapa', indicadores: 'Indicadores' };

/* ---------- Rotas por hash: #/painel?busca=...&categoria=2&atrasados=1 ---------- */
function lerRota() {
  const [caminho, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const rota = TITULOS[caminho] ? caminho : 'painel';   // rota desconhecida -> painel
  const p = new URLSearchParams(query);
  if (rota === 'painel') {
    Estado.filtros = {
      busca: p.get('busca') || '',
      categoria: p.get('categoria') || '',
      atrasados: p.get('atrasados') === '1',
    };
  }
  return rota;
}

function irPara(rota) {
  Estado.rota = rota;
  document.querySelectorAll('.tela').forEach((t) => (t.hidden = t.dataset.tela !== rota));
  document.querySelectorAll('.menu a').forEach((a) => {
    const ativo = a.dataset.rota === rota;
    a.classList.toggle('active', ativo);
    ativo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  document.title = `${TITULOS[rota]} – Zela Bairro`;
  if (rota === 'painel') { sincronizarFiltros(); renderPainel(); }
  if (rota === 'mapa') renderMapa();
  if (rota === 'indicadores') renderIndicadores();
}

window.addEventListener('hashchange', () => {
  if (!Estado.chamados.length && !Estado.categorias.length) return;
  const rota = lerRota();
  irPara(rota);
  document.getElementById('conteudo').focus({ preventScroll: true }); // leitor de tela anuncia a nova tela
  window.scrollTo(0, 0);
});

/* Redesenha a tela que estiver aberta (usado depois de criar um chamado). */
function renderTudo() { irPara(Estado.rota); }

/* ---------- Tema claro/escuro ---------- */
const btnTema = document.getElementById('btn-tema');
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const escuro = tema === 'escuro';
  btnTema.setAttribute('aria-pressed', escuro);
  btnTema.setAttribute('aria-label', escuro ? 'Ativar tema claro' : 'Ativar tema escuro');
}
btnTema.addEventListener('click', () => {
  const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  localStorage.setItem('zela-tema', novo);
  aplicarTema(novo);
});
aplicarTema(document.documentElement.dataset.tema);

/* ---------- Login da equipe ---------- */
const btnEquipe = document.getElementById('btn-equipe');
function atualizarEquipe() {
  const selo = document.getElementById('selo-equipe');
  if (Estado.equipe) {
    btnEquipe.textContent = 'Sair';
    btnEquipe.setAttribute('aria-label', `Sair (equipe: ${Estado.equipe.nome})`);
    selo.hidden = false;
    selo.innerHTML = `Equipe de zeladoria: <strong>${esc(Estado.equipe.nome)}</strong> · arraste os cards ou use “Mover”`;
  } else {
    btnEquipe.textContent = 'Entrar como equipe';
    btnEquipe.removeAttribute('aria-label');
    selo.hidden = true;
  }
}
function sairEquipe() {
  Estado.equipe = null;
  sessionStorage.removeItem('zela-equipe');
  atualizarEquipe();
  if (Estado.rota === 'painel') renderPainel();
}
btnEquipe.addEventListener('click', () => {
  if (Estado.equipe) { sairEquipe(); toast('Você saiu da conta da equipe.'); return; }
  document.getElementById('form-login').reset();
  document.getElementById('e-login').textContent = '';
  abrirModal(document.getElementById('modal-login'));
  document.getElementById('l-usuario').focus();
});
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await API.login(document.getElementById('l-usuario').value.trim(), document.getElementById('l-senha').value);
    Estado.equipe = r;
    sessionStorage.setItem('zela-equipe', JSON.stringify(r)); // sessionStorage: sai ao fechar a aba
    atualizarEquipe();
    fecharModal(document.getElementById('modal-login'));
    renderTudo();
    toast(`Bem-vinda(o), ${r.nome}!`);
  } catch (erro) {
    document.getElementById('e-login').textContent = erro.message;
  }
});

document.getElementById('btn-abrir').addEventListener('click', abrirNovoChamado);

/* ---------- Carga inicial com estados de carregando e erro ---------- */
async function carregar() {
  const carregando = document.getElementById('carregando');
  const erro = document.getElementById('erro-global');
  carregando.hidden = false;
  erro.hidden = true;
  try {
    // os dois pedidos ao mesmo tempo
    [Estado.categorias, Estado.chamados] = await Promise.all([API.categorias(), API.chamados()]);
    carregando.hidden = true;
    if (!document.querySelector('#f-categorias .chip')) { montarChipsCategorias(); montarLegenda(); }
    irPara(lerRota());
  } catch (e) {
    carregando.hidden = true;
    document.getElementById('erro-global-msg').textContent = e.message;
    erro.hidden = false;
    document.getElementById('tentar').focus();
  }
}
document.getElementById('tentar').addEventListener('click', carregar);

atualizarEquipe();
carregar();
