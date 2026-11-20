/*
 * Acompanhamento do pedido.
 *  POLLING com setTimeout encadeado (nunca setInterval): a próxima consulta só é marcada
 *  quando a anterior TERMINA, então as respostas nunca se atropelam.
 *  Para quando: o pedido termina (entregue/cancelado), a tela sai (onBeforeUnmount)
 *  ou a aba fica escondida (volta a consultar quando a pessoa retorna).
 *  Mudança de status é anunciada no aria-live.
 */
import { api, erroDe } from '../api.js';
import { brl, hora, dataHora, NOME_STATUS, NOME_PAGAMENTO } from '../formatos.js';
import { confirmar } from '../componentes/confirmar.js';
import { avisos } from '../estado.js';
import NotaEstrelas from '../componentes/estrelas.js';
const { ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;
const { useRoute } = VueRouter;

const ETAPAS = ['recebido', 'em_preparo', 'a_caminho', 'entregue'];
const INTERVALO = 5000;

export default {
  components: { NotaEstrelas },
  setup() {
    const rota = useRoute();
    const pedido = ref(null);
    const erro = ref(null);
    const anuncio = ref('');
    const cancelando = ref(false);
    const aval = reactive({ nota: 0, comentario: '', erro: null, enviando: false });

    let timer = null, ctrl = null, ativo = true;
    const terminou = (p) => p && ['entregue', 'cancelado'].includes(p.status);

    async function consultar() {
      clearTimeout(timer);
      ctrl?.abort();
      const meu = (ctrl = new AbortController());
      try {
        const novo = (await api('/pedidos/' + rota.params.id, { signal: meu.signal })).dados;
        if (pedido.value && novo.status !== pedido.value.status) anuncio.value = `Status atualizado: ${NOME_STATUS[novo.status]}.`;
        pedido.value = novo; erro.value = null;
      } catch (e) {
        if (e.name === 'AbortError') return;
        erro.value = e;
        if (e.status === 404 || e.status === 401) return;      // não adianta insistir
      }
      if (ativo && !document.hidden && !terminou(pedido.value)) timer = setTimeout(consultar, INTERVALO);
    }
    function aoMudarVisibilidade() { if (!document.hidden && ativo && !terminou(pedido.value)) consultar(); else clearTimeout(timer); }

    onMounted(() => { consultar(); document.addEventListener('visibilitychange', aoMudarVisibilidade); });
    onBeforeUnmount(() => { ativo = false; clearTimeout(timer); ctrl?.abort(); document.removeEventListener('visibilitychange', aoMudarVisibilidade); });
    watch(() => rota.params.id, (id) => { if (id) { pedido.value = null; consultar(); } });

    const indice = computed(() => ETAPAS.indexOf(pedido.value?.status));
    // Hora em que cada etapa aconteceu (vem do histórico, em UTC).
    const quando = (etapa) => pedido.value?.historico.find((h) => h.status === etapa)?.em;

    async function cancelar() {
      const ok = await confirmar('Cancelar este pedido?', { texto: 'O restaurante ainda não começou o preparo. Esta ação não pode ser desfeita.', sim: 'Cancelar pedido', nao: 'Manter pedido', perigo: true });
      if (!ok) return;
      cancelando.value = true;
      try {
        pedido.value = (await api(`/pedidos/${pedido.value.id}/cancelar`, { metodo: 'POST' })).dados;
        avisos.mostrar('Pedido cancelado.');
      } catch (e) {
        // 409: o status avançou entre a tela e o clique. Mostra o motivo e atualiza.
        avisos.mostrar(e.message, 'erro', 6000);
        consultar();
      } finally { cancelando.value = false; }
    }

    async function avaliar() {
      aval.erro = null;
      // Mesma regra da API, para avisar antes de enviar.
      if (!aval.nota) { aval.erro = { erros: { nota: ['Escolha de 1 a 5 estrelas.'] } }; return; }
      if (aval.nota <= 2 && aval.comentario.trim().length < 10) { aval.erro = { erros: { comentario: ['Para notas 1 e 2, conte o que aconteceu (mínimo de 10 caracteres).'] } }; document.getElementById('f-coment')?.focus(); return; }
      aval.enviando = true;
      try {
        pedido.value = (await api(`/pedidos/${pedido.value.id}/avaliacao`, { metodo: 'POST', corpo: { nota: aval.nota, comentario: aval.comentario } })).dados;
        avisos.mostrar('Obrigado pela avaliação!');
      } catch (e) { aval.erro = e; }
      finally { aval.enviando = false; }
    }

    return { pedido, erro, anuncio, cancelando, aval, ETAPAS, indice, quando, cancelar, avaliar, erroDe, brl, hora, dataHora, NOME_STATUS, NOME_PAGAMENTO };
  },
  template: `
  <p class="so-leitor" aria-live="polite">{{ anuncio }}</p>
  <section v-if="erro && !pedido" class="pagina pagina--estreita vazio">
    <h1>{{ erro.status === 404 ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido' }}</h1>
    <router-link to="/pedidos" class="botao">Meus pedidos</router-link>
  </section>
  <div v-else-if="!pedido" class="pagina pagina--estreita" aria-busy="true"><div class="capa capa--esqueleto capa--p"></div></div>

  <section v-else class="pagina pagina--estreita acompanhar">
    <router-link to="/pedidos" class="voltar">← Meus pedidos</router-link>
    <h1>Pedido #{{ pedido.id }}</h1>
    <p class="suave">Feito em {{ dataHora(pedido.criado_em) }}</p>

    <div v-if="pedido.status === 'cancelado'" class="alerta alerta--erro">Pedido cancelado às {{ hora(pedido.cancelado_em) }}.</div>
    <template v-else>
      <p class="previsao" :class="{ 'previsao--ok': pedido.status === 'entregue' }">
        <template v-if="pedido.status === 'entregue'">Entregue às {{ hora(quando('entregue')) }}. Bom apetite!</template>
        <template v-else>Previsão de entrega: <strong>até {{ hora(pedido.previsao_entrega) }}</strong></template>
      </p>
      <ol class="linha-tempo" :style="{ '--etapa': indice }" aria-label="Andamento do pedido">
        <li v-for="(e, i) in ETAPAS" :key="e" class="etapa"
            :class="{ 'etapa--feita': i < indice, 'etapa--atual': i === indice }" :aria-current="i === indice ? 'step' : null">
          <span class="etapa__bolinha" aria-hidden="true"></span>
          <span class="etapa__nome">{{ NOME_STATUS[e] }}</span>
          <span class="etapa__hora">{{ quando(e) ? hora(quando(e)) : '' }}</span>
        </li>
      </ol>
    </template>

    <button v-if="pedido.pode_cancelar" type="button" class="botao botao--perigo-fantasma" :disabled="cancelando" @click="cancelar">
      {{ cancelando ? 'Cancelando…' : 'Cancelar pedido' }}
    </button>

    <form v-if="pedido.pode_avaliar" class="avaliar" novalidate @submit.prevent="avaliar">
      <h2>Como foi o pedido?</h2>
      <nota-estrelas v-model="aval.nota"></nota-estrelas>
      <small class="erro-campo">{{ erroDe(aval.erro, 'nota') }}</small>
      <div class="campo">
        <label for="f-coment" class="campo__rotulo">Comentário <span class="suave">{{ aval.nota && aval.nota <= 2 ? '(obrigatório para notas 1 e 2)' : '(opcional)' }}</span></label>
        <textarea id="f-coment" v-model="aval.comentario" rows="3" maxlength="280" :aria-invalid="erroDe(aval.erro, 'comentario') ? 'true' : null" aria-describedby="e-coment c-coment"></textarea>
        <small id="c-coment" class="contador">{{ aval.comentario.length }}/280</small>
        <small id="e-coment" class="erro-campo">{{ erroDe(aval.erro, 'comentario') }}</small>
      </div>
      <p v-if="aval.erro && aval.erro.status === 409" class="alerta alerta--erro" role="alert">{{ aval.erro.message }}</p>
      <button class="botao" :disabled="aval.enviando">{{ aval.enviando ? 'Enviando…' : 'Enviar avaliação' }}</button>
    </form>
    <div v-else-if="pedido.avaliacao" class="avaliado">
      <p><strong>Sua avaliação:</strong> <span class="nota" :aria-label="pedido.avaliacao.nota + ' de 5 estrelas'">{{ '★'.repeat(pedido.avaliacao.nota) }}<span class="suave">{{ '★'.repeat(5 - pedido.avaliacao.nota) }}</span></span></p>
      <p v-if="pedido.avaliacao.comentario">“{{ pedido.avaliacao.comentario }}”</p>
    </div>

    <h2 class="acompanhar__sub">Itens</h2>
    <ul class="resumo__itens">
      <li v-for="(l, k) in pedido.itens" :key="k">
        <span>{{ l.quantidade }}× {{ l.nome }}<small v-if="l.opcoes.length">{{ l.opcoes.join(', ') }}</small><small v-if="l.observacao" class="suave">“{{ l.observacao }}”</small></span>
        <span>{{ brl(l.total) }}</span>
      </li>
    </ul>
    <dl class="resumo__contas">
      <div><dt>Subtotal</dt><dd>{{ brl(pedido.subtotal) }}</dd></div>
      <div><dt>Entrega</dt><dd>{{ pedido.taxa_entrega ? brl(pedido.taxa_entrega) : 'Grátis' }}</dd></div>
      <div v-if="pedido.desconto" class="resumo__desconto"><dt>Desconto ({{ pedido.cupom }})</dt><dd>− {{ brl(pedido.desconto) }}</dd></div>
      <div class="resumo__total"><dt>Total</dt><dd>{{ brl(pedido.total) }}</dd></div>
    </dl>
    <p class="suave">{{ NOME_PAGAMENTO[pedido.pagamento] }}{{ pedido.troco_para ? ' · troco para ' + brl(pedido.troco_para) : '' }} · {{ pedido.endereco.logradouro }}, {{ pedido.endereco.numero }}{{ pedido.endereco.complemento ? ' – ' + pedido.endereco.complemento : '' }} · {{ pedido.endereco.bairro }}</p>
  </section>`,
};
