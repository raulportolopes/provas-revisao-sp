// =====================================================================
// main.js – liga tudo: cria o app Vue, registra o router e componentes
// globais e carrega a API ANTES de montar (as guardas de rota e as telas
// precisam dos dados).
// =====================================================================
import App from './App.js';
import { router } from './router.js';
import { carregar } from './store.js';
import ModalBase from './componentes/Modal.js';
import Acordeao from './componentes/Acordeao.js';

const app = Vue.createApp(App);
app.component('ModalBase', ModalBase);   // disponível em qualquer template como <modal-base>
app.component('Acordeao', Acordeao);
app.use(router);

carregar();                 // o App mostra "Carregando…" e depois o conteúdo (ou o erro)
app.mount('#app');
