/*
 * app.js – Pacote P5: rotas, casca do app (cabeçalho, menu, login, toasts) e montagem
 * ------------------------------------------------------------------------------------
 * Vue Router com createWebHashHistory: funciona em qualquer pasta do
 * Apache sem configurar reescrita (as URLs ficam #/equipes).
 */
const rotas = [
  { path: '/', redirect: '/equipes' },
  { path: '/inscricao', component: PaginaInscricao, meta: { titulo: 'Inscrição' } },
  { path: '/equipes', component: PaginaEquipes, meta: { titulo: 'Equipes' } },
  { path: '/chaveamento', component: PaginaChaveamento, meta: { titulo: 'Chaveamento' } },
  { path: '/partidas', redirect: '/partidas/quartas' },
  { path: '/partidas/:fase(quartas|semis|final)', component: PaginaPartidas, meta: { titulo: 'Partidas' } },
  { path: '/:qualquer(.*)*', redirect: '/equipes' },   // rota desconhecida
];
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: rotas,
  linkActiveClass: 'active',        // /partidas/semis deixa o link "Partidas" ativo
  linkExactActiveClass: 'active',
  scrollBehavior: () => ({ top: 0 }),
});
router.afterEach((to, from) => {
  document.title = `${to.meta.titulo || 'Copa Code'} – Copa Code`;
  // foco no <main> só quando muda de TELA. Filtro (?busca=) e aba (/partidas/semis)
  // mudam a rota também: se o foco pulasse, a pessoa perderia o campo onde digita.
  const tela = (r) => r.path.split('/')[1];
  if (from.matched.length && tela(to) !== tela(from)) {
    nextTick(() => document.getElementById('conteudo')?.focus({ preventScroll: true }));
  }
});

const App = {
  components: { ModalBase },
  setup() {
    const route = VueRouter.useRoute();
    const loginAberto = ref(false);
    const usuario = ref('');
    const senha = ref('');
    const erroLogin = ref('');
    // aria-current="page" também no link de Partidas quando a rota é /partidas/semis
    const ativo = (base) => route.path.startsWith(base);

    async function entrar() {
      try {
        store.org = await API.login(usuario.value.trim(), senha.value);
        sessionStorage.setItem('copa-org', JSON.stringify(store.org));
        loginAberto.value = false;
        toast(`Olá, ${store.org.name}!`);
      } catch (e) { erroLogin.value = e.message; }
    }
    function abrirLogin() { usuario.value = ''; senha.value = ''; erroLogin.value = ''; loginAberto.value = true; nextTick(() => document.getElementById('l-usuario')?.focus()); }
    function sair() { store.org = null; sessionStorage.removeItem('copa-org'); toast('Você saiu da organização.'); }

    onMounted(carregarTudo);
    const MENU = [
      { to: '/inscricao', base: '/inscricao', nome: 'Inscrição', icone: 'M12 4v16M4 12h16' },
      { to: '/equipes', base: '/equipes', nome: 'Equipes', icone: 'M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2-5 5-5s5 2 5 5m0 0c0-3 2-5 5-5s5 2 5 5' },
      { to: '/chaveamento', base: '/chaveamento', nome: 'Chaveamento', icone: 'M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z' },
      { to: '/partidas/quartas', base: '/partidas', nome: 'Partidas', icone: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2' },
    ];
    return { store, route, ativo, MENU, loginAberto, usuario, senha, erroLogin, entrar, abrirLogin, sair, carregarTudo };
  },
  template: `
    <a class="pular" href="#conteudo" @click.prevent="$el.parentNode.querySelector('#conteudo').focus()">Pular para o conteúdo</a>
    <header class="topo">
      <router-link to="/equipes" class="marca" aria-label="Copa Code – início">
        <img src="img/logo-copa.svg" alt="" width="44" height="44">
        <span><strong>COPA CODE</strong><small>e-sports interescolar</small></span>
      </router-link>
      <nav class="menu" aria-label="Principal">
        <router-link v-for="item in MENU" :key="item.to" :to="item.to" :class="{ active: ativo(item.base) }" :aria-current="ativo(item.base) ? 'page' : null">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="item.icone"/></svg>
          <span>{{ item.nome }}</span>
        </router-link>
      </nav>
      <div class="topo__acoes">
        <span v-if="store.org" class="org">Organização: <strong>{{ store.org.name }}</strong></span>
        <button v-if="store.org" type="button" class="btn btn--texto btn--peq" @click="sair">Sair</button>
        <button v-else type="button" class="btn btn--contorno btn--peq" @click="abrirLogin">Área da organização</button>
      </div>
    </header>

    <main id="conteudo" tabindex="-1">
      <div v-if="store.carregando" class="carregando" role="status"><span class="carregando__barras" aria-hidden="true"><i></i><i></i><i></i></span> Carregando torneio…</div>
      <div v-else-if="store.erro" class="aviso aviso--erro" role="alert">
        <strong>Não foi possível falar com a API.</strong>
        <span>{{ store.erro }}</span>
        <button type="button" class="btn btn--primario" @click="carregarTudo">Tentar novamente</button>
      </div>
      <router-view v-else v-slot="{ Component, route }">
        <Transition name="tela" mode="out-in">
          <component :is="Component" :key="route.path.split('/')[1]"></component>
        </Transition>
      </router-view>
    </main>

    <footer class="rodape">Copa Code – projeto de revisão do Módulo G (Team Challenge), 17 Tecnologias Web. Escolas, equipes e jogadores fictícios.</footer>

    <modal-base :aberto="loginAberto" titulo="Área da organização" @fechar="loginAberto = false">
      <form @submit.prevent="entrar" novalidate>
        <div class="campo"><label for="l-usuario">Usuário</label><input id="l-usuario" v-model="usuario" autocomplete="username"></div>
        <div class="campo"><label for="l-senha">Senha</label><input id="l-senha" type="password" v-model="senha" autocomplete="current-password"></div>
        <p class="erro" aria-live="polite">{{ erroLogin }}</p>
        <footer class="modal__rodape"><button type="submit" class="btn btn--primario">Entrar</button></footer>
      </form>
    </modal-base>

    <div class="toasts" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in store.toasts" :key="t.id" class="toast" :class="'toast--' + t.tipo">{{ t.texto }}</div>
      </TransitionGroup>
    </div>`,
};

Vue.createApp(App).use(router).mount('#app');
