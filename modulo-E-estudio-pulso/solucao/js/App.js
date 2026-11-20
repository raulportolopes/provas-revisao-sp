// =====================================================================
// App.js – casca da aplicação: cabeçalho, menu, preferências, <RouterView>,
// rodapé e avisos. As telas ficam em js/paginas/.
// =====================================================================
import { store, carregar, sair, avisar, fecharAviso } from './store.js';
const { computed, watchEffect } = Vue;
const { useRouter } = VueRouter;

const LINKS = [
  { para: '/inicio', texto: 'Início', icone: 'M3 11 12 3l9 8v10h-6v-6H9v6H3z' },
  { para: '/aulas', texto: 'Aulas', icone: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4' },
  { para: '/planos', texto: 'Planos', icone: 'M4 7h16v12H4zM4 11h16M8 15h3' },
  { para: '/treino', texto: 'Treino', icone: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12' },
  { para: '/minha-area', texto: 'Minha área', icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
];
const FONTES = [{ v: 0.9, rotulo: 'A−', nome: 'Texto menor' }, { v: 1, rotulo: 'A', nome: 'Texto normal' }, { v: 1.15, rotulo: 'A+', nome: 'Texto maior' }];

export default {
  setup() {
    const router = useRouter();
    const sistemaClaro = matchMedia('(prefers-color-scheme: light)');
    const tema = computed(() => store.prefs.tema || (sistemaClaro.matches ? 'claro' : 'escuro'));

    // watchEffect roda de novo sempre que algo que ele LÊ mudar (tema ou fonte).
    watchEffect(() => {
      document.documentElement.dataset.tema = tema.value;
      document.documentElement.style.fontSize = `${store.prefs.fonte * 100}%`;
    });

    function alternarTema() { store.prefs.tema = tema.value === 'claro' ? 'escuro' : 'claro'; }
    // Primeiro sai da tela protegida, DEPOIS apaga o usuário
    // (senão a Minha área tentaria desenhar um usuário que não existe mais).
    async function sairDaConta() {
      if (router.currentRoute.value.meta.requerLogin) await router.push('/inicio');
      sair();
      avisar('Você saiu da sua conta.');
    }
    function executarAcao(a) { a.acao.executar(); fecharAviso(a.id); }

    return { store, LINKS, FONTES, tema, alternarTema, sairDaConta, carregar, fecharAviso, executarAcao };
  },
  template: `
    <a class="pular" href="#conteudo" @click.prevent="$refs.main.focus()">Pular para o conteúdo</a>
    <header class="topo">
      <div class="topo__interno">
        <RouterLink to="/inicio" class="topo__logo" aria-label="Estúdio Pulso – início">
          <!-- Logo em SVG inline: fill="currentColor" herda a cor do texto, então troca sozinho com o tema -->
          <svg class="logo" viewBox="0 0 200 48" aria-hidden="true">
            <rect x="2" y="6" width="36" height="36" rx="10" fill="#F43F5E" stroke="none"/>
            <path d="M7 25 H14 L18 16 L23 34 L27 22 L30 25 H34" stroke="#fff" stroke-width="3"/>
            <text x="48" y="33" font-family="Oswald, sans-serif" font-weight="700" font-size="26" fill="currentColor" stroke="none" letter-spacing="1.5">PULSO</text>
            <text x="134" y="33" font-family="Oswald, sans-serif" font-weight="500" font-size="14" fill="#F43F5E" stroke="none" letter-spacing="2">ESTÚDIO</text>
          </svg>
        </RouterLink>
        <nav class="menu" aria-label="Principal">
          <!-- v-slot dá acesso a isActive: aria-current fica certo também em /aulas/12/... -->
          <RouterLink v-for="l in LINKS" :key="l.para" :to="l.para" custom v-slot="{ href, navigate, isActive }">
            <a :href="href" @click="navigate" :class="{ ativo: isActive }" :aria-current="isActive ? 'page' : null">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path :d="l.icone"/></svg>
              <span>{{ l.texto }}</span>
            </a>
          </RouterLink>
        </nav>
        <div class="topo__acoes">
          <div class="fonte" role="group" aria-label="Tamanho do texto">
            <button v-for="f in FONTES" :key="f.v" type="button" :aria-pressed="store.prefs.fonte === f.v"
                    :aria-label="f.nome" @click="store.prefs.fonte = f.v">{{ f.rotulo }}</button>
          </div>
          <button type="button" class="botao-tema" :aria-pressed="tema === 'claro'" @click="alternarTema"
                  :title="tema === 'claro' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'">
            <span class="sr-only">Tema claro</span>
            <svg v-if="tema === 'claro'" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>
            <svg v-else aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>
          </button>
          <template v-if="store.usuario">
            <RouterLink to="/minha-area" class="usuario" :aria-label="'Minha área de ' + store.usuario.nome">
              <img v-if="store.usuario.avatar" :src="store.usuario.avatar" alt="" class="usuario__foto">
              <span v-else class="usuario__foto usuario__foto--iniciais" aria-hidden="true">{{ store.usuario.nome.split(' ').map(p => p[0]).join('') }}</span>
            </RouterLink>
            <button type="button" class="botao botao--contorno botao--pequeno" @click="sairDaConta">Sair</button>
          </template>
          <RouterLink v-else to="/entrar" class="botao botao--pequeno">Entrar</RouterLink>
        </div>
      </div>
    </header>

    <main id="conteudo" ref="main" class="conteudo" tabindex="-1">
      <div v-if="store.carregando" class="estado" role="status">
        <span class="giro" aria-hidden="true"></span><p>Carregando o estúdio…</p>
      </div>
      <div v-else-if="store.erro" class="estado estado--erro" role="alert">
        <h1>Ops! Algo deu errado</h1>
        <p>{{ store.erro }}</p>
        <button type="button" class="botao" @click="carregar">Tentar novamente</button>
      </div>
      <!-- Transição entre telas. "mode=out-in": a tela velha sai antes da nova entrar. -->
      <RouterView v-else v-slot="{ Component, route }">
        <Transition name="pagina" mode="out-in">
          <component :is="Component" :key="route.matched[0]?.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="rodape">
      <p>Estúdio Pulso é um projeto fictício de treino para a ocupação 17 Tecnologias Web. Ilustrações originais.</p>
    </footer>

    <div class="avisos" aria-live="polite">
      <TransitionGroup name="aviso">
        <div v-for="a in store.avisos" :key="a.id" class="aviso" :class="'aviso--' + a.tipo" :role="a.tipo === 'erro' ? 'alert' : 'status'">
          <p>{{ a.texto }}</p>
          <button v-if="a.acao" type="button" class="aviso__acao" @click="executarAcao(a)">{{ a.acao.texto }}</button>
          <button type="button" class="aviso__fechar" aria-label="Fechar aviso" @click="fecharAviso(a.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>`,
};
