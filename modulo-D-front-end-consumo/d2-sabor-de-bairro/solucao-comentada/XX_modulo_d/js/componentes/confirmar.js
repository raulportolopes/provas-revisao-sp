/*
 * confirmar('Pergunta?', { sim: 'Esvaziar' }) -> Promise<boolean>
 * Um modal de confirmação que funciona como window.confirm, mas acessível e no visual do site.
 * Fica montado pelo App (<caixa-confirmacao>) e é controlado por este objeto reativo.
 */
import JanelaModal from './modal.js';
const { reactive } = Vue;

const pedido = reactive({ aberto: false, titulo: '', texto: '', sim: 'Confirmar', nao: 'Voltar', perigo: false, resolver: null });

export function confirmar(titulo, { texto = '', sim = 'Confirmar', nao = 'Voltar', perigo = false } = {}) {
  return new Promise((resolver) => Object.assign(pedido, { aberto: true, titulo, texto, sim, nao, perigo, resolver }));
}

export const CaixaConfirmacao = {
  components: { JanelaModal },
  setup() {
    const responder = (v) => { pedido.aberto = false; pedido.resolver?.(v); pedido.resolver = null; };
    return { pedido, responder };
  },
  template: `
  <janela-modal v-if="pedido.aberto" :titulo="pedido.titulo" @fechar="responder(false)">
    <p v-if="pedido.texto">{{ pedido.texto }}</p>
    <template #rodape>
      <button type="button" class="botao botao--fantasma" @click="responder(false)">{{ pedido.nao }}</button>
      <button type="button" class="botao" :class="{ 'botao--perigo': pedido.perigo }" autofocus @click="responder(true)">{{ pedido.sim }}</button>
    </template>
  </janela-modal>`,
};
