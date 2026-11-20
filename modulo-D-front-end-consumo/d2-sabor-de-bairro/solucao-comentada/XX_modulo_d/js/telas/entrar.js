/*
 * Login. 422 -> erro embaixo de cada campo (aria-invalid + aria-describedby);
 * 401 -> mensagem geral. Depois do login volta para onde a pessoa estava (?voltar=/checkout).
 */
import { api, erroDe } from '../api.js';
import { sessao, avisos } from '../estado.js';
const { ref, reactive } = Vue;
const { useRoute, useRouter } = VueRouter;

export default {
  setup() {
    const rota = useRoute();
    const router = useRouter();
    const form = reactive({ email: '', senha: '' });
    const erro = ref(null);
    const enviando = ref(false);
    const verSenha = ref(false);

    async function enviar() {
      if (enviando.value) return;           // duplo clique não manda dois logins
      enviando.value = true; erro.value = null;
      try {
        const r = await api('/login', { metodo: 'POST', corpo: form });
        sessao.entrar(r.token, r.usuario);
        avisos.mostrar(`Bem-vindo(a), ${r.usuario.nome.split(' ')[0]}!`);
        // Só aceita caminho interno: "?voltar=https://site-malicioso" não pode redirecionar para fora.
        const voltar = String(rota.query.voltar || '');
        router.replace(voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : '/');
      } catch (e) {
        erro.value = e;
        // Foco no primeiro campo com erro (ou no alerta geral).
        requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], #erro-login')?.focus());
      } finally { enviando.value = false; }
    }
    const veioDoCheckout = String(rota.query.voltar || '').startsWith('/checkout');
    return { form, erro, enviando, verSenha, enviar, erroDe, veioDoCheckout };
  },
  template: `
  <section class="entrar">
    <div class="entrar__foto" aria-hidden="true"></div>
    <form class="entrar__form" novalidate @submit.prevent="enviar">
      <h1>Entrar</h1>
      <p class="suave">{{ veioDoCheckout ? 'Entre para finalizar o seu pedido. O carrinho continua salvo.' : 'Acompanhe seus pedidos e peça mais rápido.' }}</p>
      <p v-if="erro && erro.status !== 422" id="erro-login" class="alerta alerta--erro" role="alert" tabindex="-1">{{ erro.message }}</p>

      <div class="campo">
        <label for="email" class="campo__rotulo">E-mail</label>
        <input id="email" type="email" v-model.trim="form.email" autocomplete="username" required
               :aria-invalid="erroDe(erro, 'email') ? 'true' : null" :aria-describedby="erroDe(erro, 'email') ? 'e-email' : null">
        <small v-if="erroDe(erro, 'email')" id="e-email" class="erro-campo">{{ erroDe(erro, 'email') }}</small>
      </div>
      <div class="campo">
        <label for="senha" class="campo__rotulo">Senha</label>
        <div class="campo__com-botao">
          <input id="senha" :type="verSenha ? 'text' : 'password'" v-model="form.senha" autocomplete="current-password" required
                 :aria-invalid="erroDe(erro, 'senha') ? 'true' : null" :aria-describedby="erroDe(erro, 'senha') ? 'e-senha' : null">
          <button type="button" class="link-botao" :aria-pressed="verSenha" @click="verSenha = !verSenha">{{ verSenha ? 'Ocultar' : 'Mostrar' }}</button>
        </div>
        <small v-if="erroDe(erro, 'senha')" id="e-senha" class="erro-campo">{{ erroDe(erro, 'senha') }}</small>
      </div>
      <button class="botao botao--largo" :disabled="enviando" :aria-busy="enviando ? 'true' : 'false'">{{ enviando ? 'Entrando…' : 'Entrar' }}</button>
    </form>
  </section>`,
};
