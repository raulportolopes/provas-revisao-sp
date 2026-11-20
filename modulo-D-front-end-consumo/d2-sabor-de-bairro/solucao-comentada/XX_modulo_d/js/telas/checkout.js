/*
 * Finalização em 3 passos: Endereço -> Pagamento -> Revisão.
 *  - O passo atual fica na URL (?passo=2) e o rascunho no sessionStorage: F5 não perde nada.
 *  - CEP: máscara + busca automática ao completar 8 dígitos (com AbortController, a resposta
 *    de um CEP antigo não pode sobrescrever a do novo).
 *  - Dinheiro sempre em centavos. O total que a tela mostra vai como total_esperado:
 *    se o servidor calcular diferente, ele devolve 409 TOTAL_DIVERGENTE.
 *  - 422 volta para o passo do primeiro campo com erro e foca nele.
 */
import { api, erroDe } from '../api.js';
import { brl, mascaraCep, paraCentavos, NOME_PAGAMENTO, plural } from '../formatos.js';
import { carrinho, subtotal, totalItens, faltaMinimo, esvaziar, avisos } from '../estado.js';
const { ref, reactive, computed, watch, onBeforeUnmount, nextTick } = Vue;
const { useRoute, useRouter } = VueRouter;

const CHAVE = 'sabor.checkout';
const PASSOS = ['Endereço', 'Pagamento', 'Revisão'];
// Em que passo mora cada campo do 422.
const PASSO_DO_CAMPO = (campo) => (campo.startsWith('endereco') ? 1 : ['pagamento', 'troco_para'].includes(campo) ? 2 : 3);

export default {
  setup() {
    const rota = useRoute();
    const router = useRouter();
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE) || '{}');

    const form = reactive({
      cep: salvo.cep || '', numero: salvo.numero || '', complemento: salvo.complemento || '',
      pagamento: salvo.pagamento || '', trocoTexto: salvo.trocoTexto || '', precisaTroco: !!salvo.precisaTroco,
    });
    const cepInfo = ref(salvo.cepInfo || null);
    const cepErro = ref('');
    const buscandoCep = ref(false);
    const cupomTexto = ref('');
    const cupom = ref(salvo.cupom || null);  // { codigo, tipo, descricao, desconto }
    const cupomErro = ref('');
    const validandoCupom = ref(false);
    const erroLocal = reactive({});          // validação no navegador, antes de chamar a API
    const erroApi = ref(null);               // ErroApi do POST /pedidos
    const enviando = ref(false);

    const passo = computed(() => Math.min(3, Math.max(1, Number(rota.query.passo) || 1)));
    const irPasso = (n) => router.replace({ query: { passo: n } });

    // Salva o rascunho a cada mudança (sessionStorage: some quando a aba fecha).
    watch([form, cepInfo, cupom], () => sessionStorage.setItem(CHAVE, JSON.stringify({ ...form, cepInfo: cepInfo.value, cupom: cupom.value })), { deep: true });

    /* ---------- CEP ---------- */
    let ctrlCep;
    async function buscarCep(cep) {
      ctrlCep?.abort();
      cepInfo.value = null; cepErro.value = '';
      if (cep.length !== 9) return;
      const meu = (ctrlCep = new AbortController());
      buscandoCep.value = true;
      try { cepInfo.value = (await api('/ceps/' + cep, { signal: meu.signal })).dados; }
      catch (e) { if (e.name !== 'AbortError') cepErro.value = e.message; }
      finally { if (meu === ctrlCep) buscandoCep.value = false; }
    }
    function digitarCep(e) {
      delete erroLocal.cep;               // começou a corrigir: tira o erro antigo
      form.cep = mascaraCep(e.target.value);
      e.target.value = form.cep;          // mantém o campo igual à máscara, mesmo se digitarem letra
      buscarCep(form.cep);
    }
    // Corrigiu o campo? O erro antigo some.
    watch(() => form.numero, () => delete erroLocal.numero);
    watch(() => [form.pagamento, form.trocoTexto, form.precisaTroco], () => { delete erroLocal.pagamento; delete erroLocal.troco; });
    // Rascunho com CEP mas sem cepInfo (ex.: a busca não terminou antes do F5): busca de novo.
    if (form.cep.length === 9 && !cepInfo.value) buscarCep(form.cep);

    /* ---------- Totais (tudo computed, em centavos) ---------- */
    const taxa = computed(() => (carrinho.restaurante?.taxa_entrega || 0) + (cepInfo.value?.acrescimo_taxa || 0));
    // Cupom de frete grátis desconta a taxa INTEIRA (com o acréscimo do bairro): por isso é recalculado aqui.
    const desconto = computed(() => (!cupom.value ? 0 : cupom.value.tipo === 'frete' ? taxa.value : cupom.value.desconto));
    const total = computed(() => subtotal.value + taxa.value - desconto.value);
    const troco = computed(() => (form.pagamento === 'dinheiro' && form.precisaTroco ? paraCentavos(form.trocoTexto) : null));

    // Se o carrinho mudar (outra aba), o cupom pode não valer mais: tira e avisa.
    watch(subtotal, () => { if (cupom.value) { cupom.value = null; avisos.mostrar('O carrinho mudou: aplique o cupom de novo.', 'erro'); } });

    /* ---------- Validação local de cada passo ---------- */
    function validar(n) {
      Object.keys(erroLocal).forEach((k) => delete erroLocal[k]);
      if (n === 1) {
        if (!/^\d{5}-\d{3}$/.test(form.cep)) erroLocal.cep = 'Digite o CEP com 8 números.';
        else if (!cepInfo.value) erroLocal.cep = cepErro.value || 'Aguarde a busca do CEP.';
        if (!form.numero.trim()) erroLocal.numero = 'Informe o número.';
      }
      if (n === 2) {
        if (!form.pagamento) erroLocal.pagamento = 'Escolha como vai pagar.';
        if (form.pagamento === 'dinheiro' && form.precisaTroco && (troco.value == null || troco.value <= total.value))
          erroLocal.troco = `O troco precisa ser para mais de ${brl(total.value)}.`;
      }
      const primeiro = Object.keys(erroLocal)[0];
      if (primeiro) nextTick(() => document.getElementById('f-' + primeiro)?.focus());
      return !primeiro;
    }
    function avancar() { if (validar(passo.value)) irPasso(passo.value + 1); }
    // Pular para um passo à frente pela barra exige os anteriores válidos.
    function clicarPasso(n) {
      if (n < passo.value) return irPasso(n);
      for (let p = passo.value; p < n; p++) if (!validar(p)) return irPasso(p);
      irPasso(n);
    }
    // Ao trocar de passo, foco no título do passo (o leitor de tela anuncia onde está).
    watch(passo, async () => { await nextTick(); document.getElementById('t-passo')?.focus(); });

    /* ---------- Cupom ---------- */
    async function aplicarCupom() {
      cupomErro.value = '';
      if (!cupomTexto.value.trim()) { cupomErro.value = 'Digite o código do cupom.'; return; }
      validandoCupom.value = true;
      try {
        const r = await api('/cupons/validar', { metodo: 'POST', corpo: { restaurante_id: carrinho.restaurante.id, subtotal: subtotal.value, codigo: cupomTexto.value } });
        cupom.value = r.dados; cupomTexto.value = '';
        avisos.mostrar(`Cupom ${r.dados.codigo} aplicado.`);
      } catch (e) { cupomErro.value = erroDe(e, 'codigo') || e.message; }
      finally { validandoCupom.value = false; }
    }

    /* ---------- Envio ---------- */
    async function confirmar() {
      if (enviando.value) return;
      for (const p of [1, 2]) if (!validar(p)) return irPasso(p);
      enviando.value = true; erroApi.value = null;
      try {
        const r = await api('/pedidos', {
          metodo: 'POST',
          corpo: {
            restaurante_id: carrinho.restaurante.id,
            itens: carrinho.linhas.map((l) => ({ item_id: l.item_id, quantidade: l.quantidade, opcoes: l.opcoes.map((o) => o.id), observacao: l.observacao })),
            endereco: { cep: form.cep, numero: form.numero.trim(), complemento: form.complemento.trim() },
            pagamento: form.pagamento,
            troco_para: troco.value,
            cupom: cupom.value?.codigo || null,
            total_esperado: total.value,
          },
        });
        cupom.value = null;   // antes de esvaziar: senão o watch(subtotal) avisaria "o carrinho mudou"
        esvaziar();
        sessionStorage.removeItem(CHAVE);
        avisos.mostrar('Pedido enviado! Acompanhe aqui.');
        router.replace('/pedidos/' + r.dados.id);
      } catch (e) {
        erroApi.value = e;
        if (e.status === 422) {
          const campos = Object.keys(e.erros);
          const destino = Math.min(...campos.map(PASSO_DO_CAMPO));
          if (destino !== passo.value) irPasso(destino);
          if (e.erros.cupom) cupom.value = null;
        }
        await nextTick();
        document.getElementById('alerta-pedido')?.focus();
      } finally { enviando.value = false; }
    }
    const errosItens = computed(() => Object.entries(erroApi.value?.erros || {}).filter(([k]) => k.startsWith('itens')).flatMap(([, v]) => v));
    const erroCampo = (local, api_) => erroLocal[local] || erroDe(erroApi.value, api_);

    onBeforeUnmount(() => ctrlCep?.abort());

    return { PASSOS, passo, form, cepInfo, cepErro, buscandoCep, digitarCep, cupomTexto, cupom, cupomErro, validandoCupom, aplicarCupom,
      taxa, desconto, total, erroLocal, erroApi, errosItens, erroCampo, enviando, avancar, clicarPasso, irPasso, confirmar,
      carrinho, subtotal, totalItens, faltaMinimo, erroDe, brl, plural, NOME_PAGAMENTO };
  },
  template: `
  <section v-if="!carrinho.linhas.length" class="pagina pagina--estreita vazio">
    <img src="img/vazio-carrinho.svg" alt="" width="160" height="120">
    <h1>Seu carrinho está vazio</h1>
    <router-link to="/" class="botao">Escolher restaurante</router-link>
  </section>

  <section v-else class="pagina checkout">
    <h1 class="checkout__titulo">Finalizar pedido</h1>
    <ol class="passos">
      <li v-for="(nome, i) in PASSOS" :key="nome" class="passos__item" :class="{ 'passos__item--feito': i + 1 < passo }">
        <button type="button" class="passos__botao" :aria-current="passo === i + 1 ? 'step' : null" @click="clicarPasso(i + 1)">
          <span class="passos__n" aria-hidden="true">{{ i + 1 < passo ? '✓' : i + 1 }}</span>{{ nome }}
        </button>
      </li>
    </ol>

    <div class="checkout__grade">
      <form class="checkout__passo" novalidate @submit.prevent="passo < 3 ? avancar() : confirmar()">
        <div v-if="erroApi" id="alerta-pedido" class="alerta alerta--erro" role="alert" tabindex="-1">
          <p><strong>{{ erroApi.status === 422 ? 'Confira os campos destacados.' : erroApi.message }}</strong></p>
          <ul v-if="errosItens.length"><li v-for="m in errosItens" :key="m">{{ m }}</li></ul>
          <p v-if="erroApi.codigo === 'TOTAL_DIVERGENTE'">Atualize o carrinho e confira os valores antes de confirmar.</p>
          <p v-if="erroApi.codigo === 'PEDIDO_MINIMO' || erroApi.codigo === 'RESTAURANTE_FECHADO'">
            <router-link :to="'/restaurante/' + carrinho.restaurante.slug">Voltar ao cardápio</router-link>
          </p>
        </div>

        <!-- PASSO 1 -->
        <template v-if="passo === 1">
          <h2 id="t-passo" tabindex="-1">Onde entregar?</h2>
          <div class="campo campo--cep">
            <label for="f-cep" class="campo__rotulo">CEP</label>
            <input id="f-cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9"
                   :value="form.cep" @input="digitarCep" :aria-invalid="erroCampo('cep', 'endereco.cep') || cepErro ? 'true' : null"
                   aria-describedby="cep-status">
            <small id="cep-status" aria-live="polite" :class="erroCampo('cep', 'endereco.cep') || cepErro ? 'erro-campo' : 'suave'">
              <template v-if="buscandoCep">Buscando endereço…</template>
              <template v-else-if="cepErro">{{ cepErro }}</template>
              <template v-else-if="erroCampo('cep', 'endereco.cep')">{{ erroCampo('cep', 'endereco.cep') }}</template>
              <template v-else-if="cepInfo">{{ cepInfo.logradouro }} · {{ cepInfo.bairro }}, {{ cepInfo.cidade }}/{{ cepInfo.uf }}{{ cepInfo.acrescimo_taxa ? ' · +' + brl(cepInfo.acrescimo_taxa) + ' na entrega' : '' }}</template>
              <template v-else>Entregamos na Mooca e bairros vizinhos.</template>
            </small>
          </div>
          <div class="linha-campos">
            <div class="campo">
              <label for="f-numero" class="campo__rotulo">Número</label>
              <input id="f-numero" v-model="form.numero" autocomplete="address-line2" :aria-invalid="erroCampo('numero', 'endereco.numero') ? 'true' : null" aria-describedby="e-numero">
              <small id="e-numero" class="erro-campo">{{ erroCampo('numero', 'endereco.numero') }}</small>
            </div>
            <div class="campo">
              <label for="f-compl" class="campo__rotulo">Complemento <span class="suave">(opcional)</span></label>
              <input id="f-compl" v-model="form.complemento" maxlength="60">
            </div>
          </div>
        </template>

        <!-- PASSO 2 -->
        <template v-if="passo === 2">
          <h2 id="t-passo" tabindex="-1">Como vai pagar?</h2>
          <p class="suave">O pagamento é feito na entrega.</p>
          <fieldset class="pagamentos" :aria-describedby="erroCampo('pagamento','pagamento') ? 'e-pag' : null">
            <legend class="so-leitor">Forma de pagamento</legend>
            <label v-for="(nome, v) in NOME_PAGAMENTO" :key="v" class="pagamento" :class="{ 'pagamento--marcado': form.pagamento === v }">
              <input type="radio" name="pag" :id="v === 'pix' ? 'f-pagamento' : null" :value="v" v-model="form.pagamento">
              <span class="pagamento__icone" aria-hidden="true">{{ { pix: '◆', cartao: '▭', dinheiro: '$' }[v] }}</span>
              <span>{{ nome }}</span>
            </label>
          </fieldset>
          <small id="e-pag" class="erro-campo">{{ erroCampo('pagamento', 'pagamento') }}</small>
          <div v-if="form.pagamento === 'dinheiro'" class="troco">
            <label class="interruptor"><input type="checkbox" v-model="form.precisaTroco"><span>Preciso de troco</span></label>
            <div v-if="form.precisaTroco" class="campo">
              <label for="f-troco" class="campo__rotulo">Troco para quanto?</label>
              <input id="f-troco" inputmode="decimal" v-model="form.trocoTexto" placeholder="Ex.: 100,00"
                     :aria-invalid="erroCampo('troco', 'troco_para') ? 'true' : null" aria-describedby="e-troco">
              <small id="e-troco" class="erro-campo">{{ erroCampo('troco', 'troco_para') }}</small>
            </div>
          </div>
        </template>

        <!-- PASSO 3 -->
        <template v-if="passo === 3">
          <h2 id="t-passo" tabindex="-1">Confira e confirme</h2>
          <dl class="revisao">
            <div><dt>Entregar em</dt><dd>{{ cepInfo?.logradouro }}, {{ form.numero }}{{ form.complemento ? ' – ' + form.complemento : '' }} · {{ cepInfo?.bairro }} · {{ form.cep }} <button type="button" class="link-botao" @click="irPasso(1)">Alterar</button></dd></div>
            <div><dt>Pagamento</dt><dd>{{ NOME_PAGAMENTO[form.pagamento] }}{{ form.pagamento === 'dinheiro' && form.precisaTroco ? ' · troco para ' + form.trocoTexto : '' }} <button type="button" class="link-botao" @click="irPasso(2)">Alterar</button></dd></div>
          </dl>
          <div class="cupom">
            <template v-if="cupom">
              <p class="cupom__ok"><strong>{{ cupom.codigo }}</strong> · {{ cupom.descricao }}</p>
              <button type="button" class="link-botao" @click="cupom = null">Remover cupom</button>
            </template>
            <template v-else>
              <label for="f-cupom" class="campo__rotulo">Cupom de desconto</label>
              <div class="campo__com-botao">
                <input id="f-cupom" v-model="cupomTexto" autocapitalize="characters" :aria-invalid="cupomErro || erroDe(erroApi, 'cupom') ? 'true' : null" aria-describedby="e-cupom" @keydown.enter.prevent="aplicarCupom">
                <button type="button" class="botao botao--fantasma botao--p" :disabled="validandoCupom" @click="aplicarCupom">{{ validandoCupom ? 'Validando…' : 'Aplicar' }}</button>
              </div>
              <small id="e-cupom" class="erro-campo" aria-live="polite">{{ cupomErro || erroDe(erroApi, 'cupom') }}</small>
            </template>
          </div>
        </template>

        <div class="checkout__botoes">
          <button v-if="passo > 1" type="button" class="botao botao--fantasma" @click="irPasso(passo - 1)">Voltar</button>
          <button v-if="passo < 3" class="botao">Continuar</button>
          <button v-else class="botao" :disabled="enviando || faltaMinimo > 0" :aria-busy="enviando ? 'true' : 'false'">{{ enviando ? 'Enviando pedido…' : 'Confirmar pedido · ' + brl(total) }}</button>
        </div>
      </form>

      <aside class="resumo" aria-labelledby="t-resumo">
        <h2 id="t-resumo" class="resumo__titulo">{{ carrinho.restaurante.nome }}</h2>
        <ul class="resumo__itens">
          <li v-for="l in carrinho.linhas" :key="l.chave">
            <span>{{ l.quantidade }}× {{ l.nome }}<small v-if="l.opcoes.length">{{ l.opcoes.map(o => o.nome).join(', ') }}</small></span>
            <span>{{ brl(l.preco_unitario * l.quantidade) }}</span>
          </li>
        </ul>
        <dl class="resumo__contas">
          <div><dt>Subtotal ({{ plural(totalItens, 'item', 'itens') }})</dt><dd>{{ brl(subtotal) }}</dd></div>
          <div><dt>Entrega</dt><dd>{{ cepInfo ? (taxa ? brl(taxa) : 'Grátis') : 'informe o CEP' }}</dd></div>
          <div v-if="desconto" class="resumo__desconto"><dt>Desconto ({{ cupom.codigo }})</dt><dd>− {{ brl(desconto) }}</dd></div>
          <div class="resumo__total"><dt>Total</dt><dd>{{ brl(total) }}</dd></div>
        </dl>
      </aside>
    </div>
  </section>`,
};
