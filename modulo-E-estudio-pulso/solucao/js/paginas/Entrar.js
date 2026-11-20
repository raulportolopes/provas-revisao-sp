// =====================================================================
// Entrar.js – login simulado. Depois de entrar, volta para ?volta=…
// (só aceita caminhos internos que começam com "/", para não virar
// "open redirect" para outro site).
// =====================================================================
import { store, entrar, avisar } from '../store.js';
const { ref, reactive } = Vue;
const { useRoute, useRouter } = VueRouter;

export default {
  setup() {
    const route = useRoute(), router = useRouter();
    const form = reactive({ email: '', senha: '' });
    const erros = reactive({ email: '', senha: '', geral: '' });
    const mostrar = ref(false);
    const tentativas = ref(0);

    function validar() {
      erros.email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email) ? '' : 'Informe um e-mail válido.';
      erros.senha = form.senha.length >= 6 ? '' : 'A senha tem pelo menos 6 caracteres.';
      return !erros.email && !erros.senha;
    }
    function enviar() {
      erros.geral = '';
      if (!validar()) { document.querySelector(erros.email ? '#l-email' : '#l-senha').focus(); return; }
      if (!entrar(form.email, form.senha)) {
        tentativas.value++;
        erros.geral = 'E-mail ou senha incorretos.';
        form.senha = '';
        document.querySelector('#l-senha').focus();
        return;
      }
      avisar(`Olá, ${store.usuario.nome.split(' ')[0]}!`, { tipo: 'sucesso' });
      const volta = String(route.query.volta || '');
      router.replace(volta.startsWith('/') && !volta.startsWith('//') ? volta : '/minha-area');
    }
    return { form, erros, mostrar, tentativas, enviar, route };
  },
  template: `<div class="pagina pagina--estreita">
    <div class="cartao-login">
      <h1>Entrar</h1>
      <p v-if="route.query.volta" class="aviso-inline">Entre na sua conta para continuar.</p>
      <form novalidate @submit.prevent="enviar">
        <div class="campo">
          <label for="l-email">E-mail</label>
          <input id="l-email" type="email" v-model.trim="form.email" autocomplete="username" :aria-invalid="!!erros.email" aria-describedby="e-email">
          <p id="e-email" class="erro-campo">{{ erros.email }}</p>
        </div>
        <div class="campo">
          <label for="l-senha">Senha</label>
          <div class="senha">
            <input id="l-senha" :type="mostrar ? 'text' : 'password'" v-model="form.senha" autocomplete="current-password" :aria-invalid="!!erros.senha" aria-describedby="e-senha">
            <button type="button" class="botao botao--texto" :aria-pressed="mostrar" @click="mostrar = !mostrar">{{ mostrar ? 'Ocultar' : 'Mostrar' }}<span class="sr-only"> senha</span></button>
          </div>
          <p id="e-senha" class="erro-campo">{{ erros.senha }}</p>
        </div>
        <p v-if="erros.geral" class="erro-geral" role="alert">{{ erros.geral }}</p>
        <button type="submit" class="botao botao--largo">Entrar</button>
      </form>
      <p class="suave">Conta de demonstração: <b>bia@pulso.com</b> / <b>Pulso2026!</b></p>
    </div>
  </div>`,
};
