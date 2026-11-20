/* Toasts. role="status" + aria-live: o leitor de tela anuncia sem tirar o foco do usuário. */
import { avisos } from '../estado.js';
export default {
  setup: () => ({ avisos }),
  template: `
  <div class="avisos" role="status" aria-live="polite">
    <transition-group name="aviso">
      <div v-for="t in avisos.lista" :key="t.id" class="aviso" :class="'aviso--' + t.tipo">
        <span>{{ t.texto }}</span>
        <button type="button" class="botao-icone botao-icone--p" aria-label="Fechar aviso" @click="avisos.fechar(t.id)">×</button>
      </div>
    </transition-group>
  </div>`,
};
