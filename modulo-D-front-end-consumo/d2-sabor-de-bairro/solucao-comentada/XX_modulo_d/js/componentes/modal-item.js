/*
 * Modal do prato: grupos de opções com mínimo e máximo, quantidade, observação e preço ao vivo.
 *  - grupo com max = 1  -> radio (troca a escolha)
 *  - grupo com max > 1  -> checkbox; ao atingir o máximo, os outros ficam desabilitados
 *  - grupo com min >= 1 -> "Obrigatório"; o botão Adicionar diz o que falta
 * O preço é COMPUTED: nada de somar "na mão" em cada clique (é onde o total desanda).
 */
import JanelaModal from './modal.js';
import { confirmar } from './confirmar.js';
import { brl } from '../formatos.js';
import { carrinho, podeAdicionar, adicionar, avisos } from '../estado.js';
const { reactive, ref, computed } = Vue;

export default {
  components: { JanelaModal },
  props: { item: Object, restaurante: Object },
  emits: ['fechar'],
  setup(props, { emit }) {
    // escolhas[grupoId] = [ids das opções marcadas]
    const escolhas = reactive(Object.fromEntries(props.item.grupos.map((g) => [g.id, []])));
    const quantidade = ref(1);
    const observacao = ref('');
    const tentou = ref(false); // só mostra erro de grupo depois da 1ª tentativa

    const opcoesEscolhidas = computed(() =>
      props.item.grupos.flatMap((g) => g.opcoes.filter((o) => escolhas[g.id].includes(o.id))));
    const precoUnitario = computed(() => props.item.preco + opcoesEscolhidas.value.reduce((s, o) => s + o.preco, 0));
    const total = computed(() => precoUnitario.value * quantidade.value);
    const faltando = computed(() => props.item.grupos.filter((g) => escolhas[g.id].length < g.min));

    function marcar(g, o, marcado) {
      if (g.max === 1) escolhas[g.id] = marcado ? [o.id] : [];
      else if (marcado && escolhas[g.id].length < g.max) escolhas[g.id].push(o.id);
      else if (!marcado) escolhas[g.id] = escolhas[g.id].filter((x) => x !== o.id);
    }
    const bloqueada = (g, o) => g.max > 1 && escolhas[g.id].length >= g.max && !escolhas[g.id].includes(o.id);
    const regra = (g) => (g.min === g.max ? `Escolha ${g.min}` : g.min === 0 ? `Até ${g.max}` : `De ${g.min} a ${g.max}`);

    async function confirmarAdicao() {
      tentou.value = true;
      if (faltando.value.length) {
        // Leva o foco ao primeiro grupo que falta: quem usa teclado não fica perdido.
        document.getElementById('grupo-' + faltando.value[0].id)?.focus();
        return;
      }
      if (!podeAdicionar(props.restaurante)) {
        const ok = await confirmar('Começar um novo carrinho?', {
          texto: `Seu carrinho tem itens de ${carrinho.restaurante.nome}. Para pedir de ${props.restaurante.nome}, o carrinho atual será esvaziado.`,
          sim: 'Esvaziar e adicionar', perigo: true,
        });
        if (!ok) return;
      }
      adicionar(props.restaurante, {
        item_id: props.item.id, nome: props.item.nome, imagem: props.item.imagem,
        opcoes: opcoesEscolhidas.value.map(({ id, nome, preco }) => ({ id, nome, preco })),
        observacao: observacao.value.trim(), preco_unitario: precoUnitario.value, quantidade: quantidade.value,
      });
      avisos.mostrar(`${quantidade.value}× ${props.item.nome} no carrinho`);
      emit('fechar');
    }

    return { escolhas, quantidade, observacao, tentou, precoUnitario, total, faltando, marcar, bloqueada, regra, confirmarAdicao, brl };
  },
  template: `
  <janela-modal :titulo="item.nome" :voltar-para="'[data-item=\\'' + item.id + '\\']'" larga @fechar="$emit('fechar')">
    <div class="prato">
      <img class="prato__foto" :src="item.imagem" alt="" width="640" height="400">
      <p class="prato__desc">{{ item.descricao }}</p>
      <p class="prato__preco">{{ item.grupos.length ? 'A partir de ' : '' }}{{ brl(item.preco) }}</p>

      <fieldset v-for="g in item.grupos" :key="g.id" :id="'grupo-' + g.id" tabindex="-1" class="grupo"
                :class="{ 'grupo--erro': tentou && faltando.includes(g) }" :aria-describedby="'regra-' + g.id">
        <legend class="grupo__nome">
          {{ g.nome }}
          <span class="selo" :class="g.min ? 'selo--forte' : ''">{{ g.min ? 'Obrigatório' : 'Opcional' }}</span>
        </legend>
        <p :id="'regra-' + g.id" class="grupo__regra">
          {{ regra(g) }} · <span>{{ escolhas[g.id].length }} de {{ g.max }}</span>
          <span v-if="tentou && faltando.includes(g)" class="erro-campo"> – escolha para continuar</span>
        </p>
        <label v-for="o in g.opcoes" :key="o.id" class="opcao" :class="{ 'opcao--off': bloqueada(g, o) }">
          <input :type="g.max === 1 ? 'radio' : 'checkbox'" :name="'g' + g.id" :value="o.id"
                 :checked="escolhas[g.id].includes(o.id)" :disabled="bloqueada(g, o)"
                 @change="marcar(g, o, $event.target.checked)">
          <span class="opcao__nome">{{ o.nome }}</span>
          <span class="opcao__preco">{{ o.preco ? '+ ' + brl(o.preco) : 'sem custo' }}</span>
        </label>
      </fieldset>

      <div class="campo">
        <label for="obs" class="campo__rotulo">Alguma observação? <span class="suave">(opcional)</span></label>
        <textarea id="obs" v-model="observacao" maxlength="140" rows="2" placeholder="Ex.: sem cebola, ponto da carne…" aria-describedby="obs-cont"></textarea>
        <small id="obs-cont" class="contador" :class="{ 'contador--quase': observacao.length > 120 }">{{ observacao.length }}/140</small>
      </div>
    </div>
    <template #rodape>
      <div class="quantidade" role="group" aria-label="Quantidade">
        <button type="button" class="botao-icone" :disabled="quantidade <= 1" aria-label="Diminuir quantidade" @click="quantidade--">−</button>
        <output aria-live="polite" class="quantidade__n">{{ quantidade }}</output>
        <button type="button" class="botao-icone" :disabled="quantidade >= 20" aria-label="Aumentar quantidade" @click="quantidade++">+</button>
      </div>
      <button type="button" class="botao botao--largo" :disabled="!restaurante.aberto_agora" @click="confirmarAdicao">
        <template v-if="!restaurante.aberto_agora">Restaurante fechado</template>
        <template v-else-if="tentou && faltando.length">Escolha: {{ faltando.map(g => g.nome).join(', ') }}</template>
        <template v-else>Adicionar · {{ brl(total) }}</template>
      </button>
    </template>
  </janela-modal>`,
};
