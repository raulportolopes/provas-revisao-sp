// =====================================================================
// Modal.js – modal acessível reutilizável (Vue).
// Uso:  <modal-base titulo="..." @fechar="..."> conteúdo </modal-base>
//  - <Teleport to="body">: o modal é desenhado no fim do <body>, fora do
//    layout da página (z-index e overflow do pai não atrapalham)
//  - <Transition>: entrada e saída animadas
//  - foco: entra no modal ao abrir, fica preso nele (Tab/Shift+Tab), volta
//    para quem abriu ao fechar
//  - fecha com Esc, com o X e clicando no fundo
//  - trava a rolagem do <body> enquanto aberto
// =====================================================================
const { ref, onMounted, onBeforeUnmount, nextTick } = Vue;
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

export default {
  name: 'ModalBase',
  props: { titulo: { type: String, required: true }, largura: { type: String, default: '640px' } },
  emits: ['fechar'],
  setup(props, { emit }) {
    const caixa = ref(null);
    const visivel = ref(false);
    const quemAbriu = document.activeElement;

    function teclado(e) {
      if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
      if (e.key !== 'Tab' || !caixa.value) return;
      const lista = [...caixa.value.querySelectorAll(FOCAVEIS)].filter(el => el.offsetParent !== null);
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista.at(-1);
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === caixa.value)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
    function fechar() { visivel.value = false; }          // a Transition anima a saída...
    function depoisDeSair() { emit('fechar'); }           // ...e só então avisamos o pai

    onMounted(async () => {
      document.body.classList.add('sem-rolagem');
      document.addEventListener('keydown', teclado);
      visivel.value = true;
      await nextTick();
      caixa.value?.focus();
    });
    onBeforeUnmount(() => {
      document.body.classList.remove('sem-rolagem');
      document.removeEventListener('keydown', teclado);
      if (quemAbriu && document.contains(quemAbriu)) quemAbriu.focus();
    });
    return { caixa, visivel, fechar, depoisDeSair };
  },
  template: `
    <Teleport to="body">
      <Transition name="modal" appear @after-leave="depoisDeSair">
        <div v-if="visivel" class="modal">
          <div class="modal__fundo" @click="fechar"></div>
          <div ref="caixa" class="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="modal-titulo"
               tabindex="-1" :style="{ '--largura': largura }">
            <button type="button" class="modal__fechar" aria-label="Fechar" @click="fechar">✕</button>
            <h2 id="modal-titulo" class="modal__titulo">{{ titulo }}</h2>
            <slot :fechar="fechar"></slot>
          </div>
        </div>
      </Transition>
    </Teleport>`,
};
