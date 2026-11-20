/*
 * <nota-estrelas v-model="nota"> – 5 estrelas como RADIOGROUP de verdade:
 * inputs radio escondidos (o navegador já dá setas, Tab e anúncio no leitor de tela)
 * e o visual vem do CSS. Passar o mouse acende uma prévia (estado "hover"), sem mudar o valor.
 */
const { ref } = Vue;
export default {
  props: { modelValue: { type: Number, default: 0 }, nome: { type: String, default: 'nota' } },
  emits: ['update:modelValue'],
  setup() {
    const previa = ref(0);
    const rotulos = ['Péssimo', 'Ruim', 'Ok', 'Bom', 'Excelente'];
    return { previa, rotulos };
  },
  template: `
  <fieldset class="estrelas" @mouseleave="previa = 0">
    <legend class="estrelas__legenda">Sua nota</legend>
    <div class="estrelas__linha">
      <label v-for="n in 5" :key="n" class="estrela" :class="{ 'estrela--acesa': n <= (previa || modelValue) }" @mouseenter="previa = n">
        <input type="radio" class="so-leitor" :name="nome" :value="n" :checked="modelValue === n"
               @change="$emit('update:modelValue', n)">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="34" height="34"><path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z"/></svg>
        <span class="so-leitor">{{ n }} {{ n === 1 ? 'estrela' : 'estrelas' }} – {{ rotulos[n-1] }}</span>
      </label>
      <span class="estrelas__texto" aria-hidden="true">{{ rotulos[(previa || modelValue) - 1] || 'Escolha de 1 a 5' }}</span>
    </div>
  </fieldset>`,
};
