// =====================================================================
// router.js – Vue Router 4 com histórico por hash (#/aulas).
// Por que hash? Funciona em QUALQUER Apache sem configurar .htaccess:
// o servidor sempre entrega o index.html e o resto fica depois do "#".
// =====================================================================
import { store } from './store.js';
import Inicio from './paginas/Inicio.js';
import Aulas from './paginas/Aulas.js';
import AulaModal from './paginas/AulaModal.js';
import Planos from './paginas/Planos.js';
import Treino from './paginas/Treino.js';
import Entrar from './paginas/Entrar.js';
import MinhaArea from './paginas/MinhaArea.js';
import NaoEncontrada from './paginas/NaoEncontrada.js';

const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
  { path: '/', redirect: '/inicio' },
  { path: '/inicio', component: Inicio, meta: { titulo: 'Início' } },
  {
    path: '/aulas', component: Aulas, meta: { titulo: 'Grade de aulas' },
    // ROTA FILHA: o modal da aula tem endereço próprio (#/aulas/12/2026-12-08).
    // Dá para copiar o link, dar F5 e usar o Voltar do navegador para fechar.
    children: [{ path: ':aulaId(\\d+)/:data(\\d{4}-\\d{2}-\\d{2})', component: AulaModal, props: true, meta: { titulo: 'Detalhes da aula', modal: true } }],
  },
  { path: '/planos', component: Planos, meta: { titulo: 'Planos' } },
  { path: '/treino', component: Treino, meta: { titulo: 'Montar treino' } },
  { path: '/entrar', component: Entrar, meta: { titulo: 'Entrar', soVisitante: true } },
  { path: '/minha-area', component: MinhaArea, meta: { titulo: 'Minha área', requerLogin: true } },
  { path: '/:caminho(.*)*', component: NaoEncontrada, meta: { titulo: 'Página não encontrada' } },   // 404
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  linkActiveClass: 'ativo',            // RouterLink recebe "ativo" quando a rota começa com o link
  scrollBehavior(to, from, salvo) {
    if (salvo) return salvo;                                  // botão Voltar: volta para onde estava
    if (to.path.startsWith('/aulas') && from.path.startsWith('/aulas')) return false;   // filtro/modal: não pula
    return { top: 0 };
  },
});

// GUARDA DE NAVEGAÇÃO: roda antes de toda troca de rota.
router.beforeEach(to => {
  if (to.meta.requerLogin && !store.usuario) {
    // guarda para onde a pessoa queria ir; o login devolve ela para lá
    return { path: '/entrar', query: { volta: to.fullPath } };
  }
  if (to.meta.soVisitante && store.usuario) return { path: '/minha-area' };
});

// Depois de trocar: título da aba e foco no <h1> da tela nova (leitor de tela anuncia).
router.afterEach((to, from) => {
  document.title = `${to.meta.titulo} – Estúdio Pulso`;
  const mesmaTela = to.matched[0]?.path === from.matched[0]?.path;
  if (mesmaTela) return;              // abrir/fechar modal ou mudar filtro: não rouba o foco
  Vue.nextTick(() => {
    const h1 = document.querySelector('main h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  });
});
