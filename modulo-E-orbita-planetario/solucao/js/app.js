// =====================================================================
// app.js – ponto de entrada: carrega a API, roda o splash e cuida das ROTAS.
//
// Rotas (pelo hash, então funcionam em qualquer servidor sem configuração):
//   #/inicio                 tela inicial com carrossel
//   #/programacao?…          catálogo de sessões (filtros ficam na URL)
//   #/sessao/12              mapa de lugares da sessão 12
//   #/pagamento              pagamento em 3 passos (precisa ter lugares no carrinho)
//   #/reservas?aba=…         minhas reservas
//   #/ceu?aba=…              guia do céu
//   (sem hash)               vai para #/inicio
//   (qualquer outra)         tela "Página não encontrada"
// =====================================================================
import { carregarTudo } from './api.js';
import { rodarSplash } from './splash.js';
import { iniciarTema } from './tema.js';
import { iniciarEfeitos } from './efeitos.js';
import { ligarCronometro } from './carrinho.js';
import { fecharModal, modalAberto } from './modal.js';
import { menosMovimento } from './util.js';
import * as inicio from './telas/inicio.js';
import * as programacao from './telas/programacao.js';
import * as sessao from './telas/sessao.js';
import * as pagamento from './telas/pagamento.js';
import * as reservas from './telas/reservas.js';
import * as ceu from './telas/ceu.js';

const main = document.getElementById('conteudo');
const links = document.querySelectorAll('.menu a[data-rota]');

// Cada tela exporta: titulo (texto da aba) e montar(main, parametros, query).
// "menu" diz qual item do menu fica ativo (a sessão e o pagamento ativam Programação).
const ROTAS = {
  inicio: { tela: inicio, menu: 'inicio' },
  programacao: { tela: programacao, menu: 'programacao' },
  sessao: { tela: sessao, menu: 'programacao' },
  pagamento: { tela: pagamento, menu: 'programacao' },
  reservas: { tela: reservas, menu: 'reservas' },
  ceu: { tela: ceu, menu: 'ceu' },
};

let limparTelaAnterior = null;   // cada tela pode devolver uma função de limpeza (timers, listeners)

// "#/sessao/12?x=1" -> { nome: 'sessao', params: ['12'], query: URLSearchParams('x=1') }
export function lerHash() {
  const [caminho, busca = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [nome = '', ...params] = caminho.split('/').filter(Boolean);
  return { nome, params, query: new URLSearchParams(busca) };
}

function rotear() {
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    // replace: não cria um item a mais no histórico (o Voltar continua funcionando)
    location.replace('#/inicio');
    return;
  }
  const { nome, params, query } = lerHash();
  if (modalAberto()) fecharModal();
  if (limparTelaAnterior) { limparTelaAnterior(); limparTelaAnterior = null; }

  const rota = ROTAS[nome];
  let titulo;
  if (rota) {
    const r = rota.tela.montar(main, params, query);
    // a tela pode pedir para redirecionar (ex.: pagamento sem carrinho)
    if (r && r.redirecionar) { location.replace(r.redirecionar); return; }
    limparTelaAnterior = r && r.limpar;
    titulo = (r && r.titulo) || rota.tela.titulo;
  } else {
    main.innerHTML = `
      <section class="nao-encontrada">
        <p class="nao-encontrada__codigo" aria-hidden="true">404</p>
        <h1>Página não encontrada</h1>
        <p>Esse endereço se perdeu no espaço. Confira o link ou volte para o começo.</p>
        <a class="botao brilho" href="#/inicio">Voltar para o início</a>
      </section>`;
    titulo = 'Página não encontrada';
  }

  // Título da aba: "Programação – Órbita"
  document.title = `${titulo} – Órbita`;

  // Link ativo: classe + aria-current="page" só no item da tela atual.
  const ativo = rota ? rota.menu : null;
  links.forEach(a => {
    const sim = a.dataset.rota === ativo;
    a.classList.toggle('ativo', sim);
    if (sim) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  // Acessibilidade: foco no conteúdo novo e rolagem para o topo.
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });

  // Transição de entrada da tela (Web Animations API).
  if (!menosMovimento()) {
    main.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
      { duration: 280, easing: 'ease-out' });
  }
}

async function iniciar() {
  iniciarTema();
  iniciarEfeitos();

  const carregamento = carregarTudo();
  await rodarSplash(carregamento);
  try {
    await carregamento;
  } catch (erro) {
    mostrarErro(erro);
    return;
  }
  ligarCronometro();                    // continua um cronômetro que existia antes do F5
  window.addEventListener('hashchange', rotear);
  rotear();
}

// Estado de erro com "Tentar novamente" SEM recarregar a página.
function mostrarErro(erro) {
  console.error(erro);
  main.innerHTML = `
    <section class="estado-erro" role="alert">
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5v.5"/></svg>
      <h1>Não foi possível carregar a programação</h1>
      <p>Verifique a conexão com o servidor e tente de novo.</p>
      <button type="button" class="botao" id="tentar">Tentar novamente</button>
    </section>`;
  document.getElementById('tentar').addEventListener('click', async () => {
    main.innerHTML = '<div class="estado-carregando"><span class="giro" aria-hidden="true"></span><p>Carregando a programação…</p></div>';
    try {
      await carregarTudo();
      ligarCronometro();
      window.addEventListener('hashchange', rotear);
      rotear();
    } catch (e) { mostrarErro(e); }
  });
}

// O link "Pular para o conteúdo" não pode mudar o hash (isso trocaria de rota!).
document.querySelector('[data-pular]').addEventListener('click', e => {
  e.preventDefault(); main.focus();
});

iniciar();
