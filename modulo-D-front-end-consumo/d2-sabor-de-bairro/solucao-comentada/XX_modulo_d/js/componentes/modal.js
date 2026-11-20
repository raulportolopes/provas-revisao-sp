/*
 * <janela-modal> – base de TODO modal e da gaveta do carrinho.
 * Cuida das 5 coisas que a ficha cobra em modal:
 *   1. foco vai para dentro ao abrir;  2. Tab/Shift+Tab ficam presos dentro;
 *   3. Esc fecha;  4. clique no fundo fecha;  5. ao fechar, o foco VOLTA para quem abriu.
 * O "quem abriu" é guardado no mounted(). Se esse botão sumiu da tela (a lista foi redesenhada),
 * usamos a prop voltarPara (seletor CSS) para achar o substituto.
 */
const { ref, onMounted, onBeforeUnmount, nextTick } = Vue;

// Pilha de modais abertos: só o de CIMA responde ao Esc/Tab (confirmação aberta sobre a gaveta).
const pilha = [];
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default {
  name: 'JanelaModal',
  props: {
    titulo: { type: String, required: true },
    variante: { type: String, default: 'centro' }, // 'centro' | 'gaveta'
    voltarPara: { type: String, default: '' },
    larga: Boolean,
  },
  emits: ['fechar'],
  setup(props, { emit }) {
    const caixa = ref(null);
    const idTitulo = 'modal-titulo-' + Math.random().toString(36).slice(2, 8);
    let origem = null;

    /* O ouvinte fica no DOCUMENTO, não na caixa: se o elemento focado sumir (ex.: removeu a linha
       do carrinho), o foco cai no <body> e um ouvinte na caixa nunca mais receberia o Esc. */
    function aoTeclar(e) {
      if (pilha[pilha.length - 1] !== caixa.value) return;
      if (e.key === 'Escape') { e.preventDefault(); emit('fechar'); return; }
      if (e.key !== 'Tab') return;
      const itens = [...caixa.value.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
      if (!itens.length) { e.preventDefault(); return; }
      const primeiro = itens[0], ultimo = itens[itens.length - 1];
      const dentro = caixa.value.contains(document.activeElement);
      if (!dentro) { e.preventDefault(); (e.shiftKey ? ultimo : primeiro).focus(); }
      else if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }

    onMounted(async () => {
      origem = document.activeElement;
      document.body.classList.add('sem-rolagem');
      await nextTick();
      pilha.push(caixa.value);
      document.addEventListener('keydown', aoTeclar);
      // [autofocus] dentro do modal ganha; senão, o primeiro focável; senão, a própria caixa.
      const alvo = caixa.value.querySelector('[autofocus]') || caixa.value.querySelector(FOCAVEIS) || caixa.value;
      alvo.focus();
    });
    onBeforeUnmount(() => {
      const i = pilha.indexOf(caixa.value); if (i >= 0) pilha.splice(i, 1);
      document.removeEventListener('keydown', aoTeclar);
      if (!pilha.length) document.body.classList.remove('sem-rolagem');
      // Espera o Vue redesenhar a tela de baixo e só então devolve o foco.
      const devolver = () => {
        // Aberto pelo F5 (?item=36), a "origem" é o <body>: aí vale o seletor voltarPara.
        if (origem && origem !== document.body && document.contains(origem)) origem.focus();
        else if (props.voltarPara) document.querySelector(props.voltarPara)?.focus();
      };
      requestAnimationFrame(devolver);
    });

    return { caixa, idTitulo };
  },
  template: `
  <teleport to="body">
    <div class="fundo-modal" :class="'fundo-modal--' + variante" @mousedown.self="$emit('fechar')">
      <div ref="caixa" class="modal" :class="['modal--' + variante, { 'modal--larga': larga }]"
           role="dialog" aria-modal="true" :aria-labelledby="idTitulo" tabindex="-1">
        <header class="modal__topo">
          <h2 :id="idTitulo" class="modal__titulo">{{ titulo }}</h2>
          <button type="button" class="botao-icone" aria-label="Fechar" @click="$emit('fechar')">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>
        <div class="modal__corpo"><slot></slot></div>
        <footer v-if="$slots.rodape" class="modal__rodape"><slot name="rodape"></slot></footer>
      </div>
    </div>
  </teleport>`,
};
