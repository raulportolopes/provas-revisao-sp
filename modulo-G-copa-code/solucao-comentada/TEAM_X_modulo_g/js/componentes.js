/*
 * componentes.js – Pacote P5: peças reutilizadas por todas as telas
 *   <modal-base>   modal com <dialog>: Esc, fundo, foco preso e foco de volta
 *   <selo-equipe>  quadradinho com a tag e a cor da escola
 */
const { ref, watch, nextTick, onMounted, onUnmounted } = Vue;

const ModalBase = {
  name: 'ModalBase',
  props: { aberto: Boolean, titulo: String },
  emits: ['fechar'],
  setup(props, { emit }) {
    const dialog = ref(null);
    const fechando = ref(false);
    let origem = null;
    const tituloId = 'modal-titulo-' + Math.random().toString(36).slice(2, 8);

    // a prop "aberto" manda; o <dialog> só obedece
    watch(() => props.aberto, async (abrir) => {
      await nextTick();
      if (abrir && !dialog.value.open) {
        origem = document.activeElement;
        document.body.classList.add('sem-rolagem');
        dialog.value.showModal();
      } else if (!abrir && dialog.value.open) {
        fechando.value = true;
        setTimeout(() => {                    // espera a animação de saída
          fechando.value = false;
          dialog.value.close();
          document.body.classList.remove('sem-rolagem');
          if (origem && document.contains(origem)) origem.focus();
        }, 180);
      }
    });
    const cancelar = (e) => { e.preventDefault(); emit('fechar'); };            // tecla Esc
    const cliqueFundo = (e) => { if (e.target === dialog.value) emit('fechar'); }; // clique no ::backdrop
    return { dialog, fechando, cancelar, cliqueFundo, tituloId };
  },
  template: `
    <dialog ref="dialog" class="modal" :class="{ fechando }" :aria-labelledby="tituloId"
            @cancel="cancelar" @click="cliqueFundo">
      <div class="modal__caixa">
        <header class="modal__topo">
          <h2 :id="tituloId">{{ titulo }}</h2>
          <button type="button" class="btn-icone" aria-label="Fechar" @click="$emit('fechar')">✕</button>
        </header>
        <slot></slot>
      </div>
    </dialog>`,
};

const SeloEquipe = {
  name: 'SeloEquipe',
  props: { equipe: Object, grande: Boolean },
  template: `
    <span class="selo" :class="{ 'selo--grande': grande }" :style="{ '--cor': equipe?.color || equipe?.school?.color || '#475569' }">
      {{ equipe?.tag || '?' }}
    </span>`,
};
