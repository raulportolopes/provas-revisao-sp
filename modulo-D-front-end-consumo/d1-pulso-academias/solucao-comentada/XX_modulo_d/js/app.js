/*
 * app.js – ponto de entrada. Liga: roteador, guarda de login, cabeçalho, tema e sessão expirada.
 *
 * ROTEAMENTO POR HASH (#/agenda?data=2026-11-24&pagina=2)
 *  - O servidor sempre entrega o mesmo index.html; quem decide a tela é o JavaScript.
 *  - 'hashchange' dispara quando o usuário clica num link #/..., usa Voltar/Avançar ou edita a URL.
 *  - Filtros da agenda atualizam a URL com history.replaceState (NÃO dispara hashchange),
 *    assim digitar na busca não "remonta" a tela e o campo não perde o foco.
 */
import { sessao, quandoSessaoExpirar } from './api.js';
import { lerHash, desenharUsuario, CHAVE_DESTINO } from './navegacao.js';
import * as entrar from './telas/entrar.js';
import * as agenda from './telas/agenda.js';
import * as reservas from './telas/reservas.js';
import * as progresso from './telas/progresso.js';
import * as perfil from './telas/perfil.js';

const ROTAS = {
  entrar:    { tela: entrar,    titulo: 'Entrar',          publica: true },
  agenda:    { tela: agenda,    titulo: 'Agenda' },
  reservas:  { tela: reservas,  titulo: 'Minhas reservas' },
  progresso: { tela: progresso, titulo: 'Progresso' },
  perfil:    { tela: perfil,    titulo: 'Perfil' },
};
const raiz = document.getElementById('conteudo');
let desmontarAtual = null;
let primeiraVez = true;

function rotear() {
  let { nome, params } = lerHash();
  if (!ROTAS[nome]) { nome = 'agenda'; history.replaceState(null, '', '#/agenda'); } // rota desconhecida
  const rota = ROTAS[nome];

  // GUARDA DE ROTA: sem token não entra nas telas internas; guardamos o destino para voltar depois do login.
  if (!rota.publica && !sessao.token) {
    sessionStorage.setItem(CHAVE_DESTINO, location.hash);
    location.replace('#/entrar');
    return;
  }
  if (nome === 'entrar' && sessao.token) { location.replace('#/agenda'); return; }

  desmontarAtual?.();                 // cancela fetch, timers e ouvintes da tela anterior
  desmontarAtual = null;
  raiz.innerHTML = '';
  document.title = `${rota.titulo} · Pulso Academias`;
  atualizarCabecalho(nome);
  desmontarAtual = rota.tela.montar(raiz, params) || null;

  // Acessibilidade: ao trocar de tela, o foco vai para o conteúdo (o leitor de tela anuncia a nova página).
  if (!primeiraVez && nome !== 'entrar') raiz.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  primeiraVez = false;
}

/** Link ativo: classe 'ativo' + aria-current="page" só no link da rota atual. */
function atualizarCabecalho(nome) {
  const logado = nome !== 'entrar';
  document.getElementById('topo').hidden = !logado;
  document.getElementById('rodape').hidden = !logado;
  document.body.classList.toggle('com-menu', logado);
  for (const a of document.querySelectorAll('.menu a')) {
    const ativo = a.dataset.rota === nome;
    a.classList.toggle('ativo', ativo);
    if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  desenharUsuario();
}

// 401 em QUALQUER requisição: limpa a sessão, lembra onde o aluno estava e manda para o login com aviso.
let expirando = false;
quandoSessaoExpirar(() => {
  if (expirando) return;           // várias requisições podem voltar 401 juntas: tratar só uma vez
  expirando = true;
  const onde = location.hash;
  sessao.limpar();
  sessionStorage.setItem(CHAVE_DESTINO, onde);
  location.hash = '#/entrar?expirou=1';
  setTimeout(() => { expirando = false; }, 500);
});

/* Botão de tema no cabeçalho: alterna entre claro e escuro (a opção "automático" fica no Perfil). */
const btnTema = document.getElementById('btn-tema');
function rotuloTema() {
  const escuro = window.PulsoTema.real() === 'escuro';
  btnTema.setAttribute('aria-label', escuro ? 'Ativar tema claro' : 'Ativar tema escuro');
}
btnTema.addEventListener('click', () => {
  window.PulsoTema.definir(window.PulsoTema.real() === 'escuro' ? 'claro' : 'escuro');
  rotuloTema();
  document.dispatchEvent(new CustomEvent('tema-mudou'));
});
document.addEventListener('tema-mudou', rotuloTema);
rotuloTema();

window.addEventListener('hashchange', rotear);
rotear();
