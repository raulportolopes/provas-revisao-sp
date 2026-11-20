// =====================================================================
// Acordeao.js – UM item aberto por vez.
// O estado é só um número: "aberto" (índice do item aberto, ou -1).
// Abrir outro item troca o número, então o anterior fecha sozinho.
// =====================================================================
const { ref } = Vue;
let contador = 0;   // ids únicos quando há mais de um acordeão na página

export default {
  name: 'Acordeao',
  props: { itens: { type: Array, required: true }, inicial: { type: Number, default: 0 } },
  setup(props) {
    const aberto = ref(props.inicial);
    const id = `acc${++contador}`;
    const alternar = i => (aberto.value = aberto.value === i ? -1 : i);
    return { aberto, id, alternar };
  },
  template: `
    <div class="acordeao">
      <div v-for="(item, i) in itens" :key="i" class="acordeao__item" :class="{ 'acordeao__item--aberto': aberto === i }">
        <h3 class="acordeao__cabeca">
          <button type="button" :id="id + '-b' + i" :aria-expanded="aberto === i" :aria-controls="id + '-p' + i" @click="alternar(i)">
            {{ item.titulo }}<span class="acordeao__seta" aria-hidden="true"></span>
          </button>
        </h3>
        <div :id="id + '-p' + i" class="acordeao__painel" role="region" :aria-labelledby="id + '-b' + i" :inert="aberto !== i || null">
          <div><p class="acordeao__conteudo">{{ item.texto }}</p></div>
        </div>
      </div>
    </div>`,
};
