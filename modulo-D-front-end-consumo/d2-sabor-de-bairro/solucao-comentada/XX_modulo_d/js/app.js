/*
 * Ponto de entrada: rotas, guarda de login e montagem do app.
 * Rotas em HASH (#/restaurante/forno-da-vila): funcionam em qualquer Apache/XAMPP sem .htaccess,
 * e o F5 em qualquer tela volta para a mesma tela.
 */
import { sessao, avisos } from './estado.js';
import { quandoSessaoExpirar } from './api.js';
import Cabecalho from './componentes/cabecalho.js';
import Avisos from './componentes/avisos.js';
import GavetaCarrinho from './componentes/gaveta-carrinho.js';
import { CaixaConfirmacao } from './componentes/confirmar.js';
import Inicio from './telas/inicio.js';
import Restaurante from './telas/restaurante.js';
import Entrar from './telas/entrar.js';
import Checkout from './telas/checkout.js';
import Pedidos from './telas/pedidos.js';
import Pedido from './telas/pedido.js';
import NaoEncontrada from './telas/nao-encontrada.js';

const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
  { path: '/', name: 'inicio', component: Inicio, meta: { titulo: 'Restaurantes' } },
  { path: '/restaurante/:slug', name: 'restaurante', component: Restaurante, meta: { titulo: 'Cardápio' } },
  { path: '/entrar', name: 'entrar', component: Entrar, meta: { titulo: 'Entrar' } },
  { path: '/checkout', name: 'checkout', component: Checkout, meta: { titulo: 'Finalizar pedido', login: true } },
  { path: '/pedidos', name: 'pedidos', component: Pedidos, meta: { titulo: 'Meus pedidos', login: true } },
  { path: '/pedidos/:id(\\d+)', name: 'pedido', component: Pedido, meta: { titulo: 'Acompanhar pedido', login: true } },
  { path: '/:resto(.*)*', name: 'nao-encontrada', component: NaoEncontrada, meta: { titulo: 'Página não encontrada' } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // Voltar/avançar restaura a rolagem; tela nova começa do topo.
  scrollBehavior: (to, from, salvo) => salvo || (to.path === from.path ? false : { top: 0 }),
});

// Guarda: rota com meta.login exige token. O destino vai junto para voltar depois do login.
router.beforeEach((to) => {
  if (to.meta.login && !sessao.logado) return { name: 'entrar', query: { voltar: to.fullPath } };
  if (to.name === 'entrar' && sessao.logado) return { name: 'inicio' };
});

// Título da aba + foco no <main> a cada troca de tela (leitor de tela "sente" a navegação).
router.afterEach((to, from) => {
  document.title = `${to.meta.titulo} · Sabor de Bairro`;
  if (from.matched.length && to.path !== from.path) requestAnimationFrame(() => document.getElementById('conteudo')?.focus({ preventScroll: true }));
});

// Token venceu no meio do uso: avisa e manda para o login guardando onde estava.
quandoSessaoExpirar(() => {
  avisos.mostrar('Sua sessão expirou. Entre de novo para continuar.', 'erro', 6000);
  const atual = router.currentRoute.value;
  if (atual.name !== 'entrar') router.push({ name: 'entrar', query: { voltar: atual.fullPath } });
});

const App = {
  components: { Cabecalho, Avisos, GavetaCarrinho, CaixaConfirmacao },
  template: `
    <cabecalho></cabecalho>
    <main id="conteudo" tabindex="-1">
      <router-view></router-view>
    </main>
    <footer class="rodape">
      <p>Sabor de Bairro · delivery dos restaurantes da Mooca e região</p>
      <p class="suave">Projeto de revisão SP Skills 2026 · #17 Tecnologias Web</p>
    </footer>
    <gaveta-carrinho></gaveta-carrinho>
    <caixa-confirmacao></caixa-confirmacao>
    <avisos></avisos>`,
};

createApp(App).use(router).mount('#app');
