// =====================================================================
// AulaModal.js – rota filha #/aulas/:aulaId/:data (abre por cima da grade).
// Fechar = voltar para /aulas mantendo os filtros (query).
// O botão principal muda conforme situacao() do store:
//   reservar | espera | cancelar | entrar | (desabilitado com motivo)
// =====================================================================
import { store, ocorrencia, situacao, reservar, cancelar, vagas, avisar, rotuloAula } from '../store.js';
import { DIAS, dataBR, hhmm } from '../util.js';
const { computed } = Vue;
const { useRoute, useRouter } = VueRouter;

export default {
  props: { aulaId: String, data: String },
  setup(props) {
    const route = useRoute(), router = useRouter();
    const oc = computed(() => ocorrencia(Number(props.aulaId), props.data));
    const sit = computed(() => (oc.value ? situacao(oc.value) : null));
    const ocupacao = computed(() => oc.value ? Math.round(((oc.value.aula.capacidade - vagas(oc.value)) / oc.value.aula.capacidade) * 100) : 0);

    const fechar = () => router.push({ path: '/aulas', query: route.query });

    function acao() {
      const o = oc.value, s = sit.value;
      if (s.acao === 'entrar') { router.push({ path: '/entrar', query: { volta: route.fullPath } }); return; }
      if (s.acao === 'cancelar') {
        const removida = cancelar(o);
        avisar(`Reserva de ${rotuloAula(o)} cancelada.`, {
          tipo: 'sucesso', duracao: 6000,
          // Desfazer: devolve exatamente a mesma reserva
          acao: { texto: 'Desfazer', executar: () => { store.reservas.push(removida); avisar('Reserva recuperada.'); } },
        });
        return;
      }
      const r = reservar(o);
      if (r.ok) avisar(r.reserva.status === 'confirmada' ? `Vaga confirmada: ${rotuloAula(o)}.` : `Aula cheia: você entrou na lista de espera (${r.reserva.posicao}º).`, { tipo: 'sucesso' });
      else avisar(r.motivo, { tipo: 'erro' });
    }
    const textoBotao = computed(() => ({ reservar: 'Reservar vaga', espera: 'Entrar na lista de espera', cancelar: sit.value?.minha?.status === 'espera' ? 'Sair da lista de espera' : 'Cancelar reserva', entrar: 'Entrar para reservar' }[sit.value?.acao]));

    return { oc, sit, ocupacao, fechar, acao, textoBotao, vagas, DIAS, dataBR, hhmm };
  },
  template: `
    <modal-base v-if="oc" :titulo="oc.modalidade.nome" @fechar="fechar">
      <div class="aula-detalhe" :style="{ '--cor': oc.modalidade.cor }">
        <p class="aula-detalhe__quando">{{ DIAS[oc.inicio.getDay()] }}, {{ dataBR(oc.data) }} · {{ oc.aula.inicio }}–{{ hhmm(oc.fimMin) }} ({{ oc.aula.duracao_min }} min)</p>
        <p>{{ oc.modalidade.descricao }}</p>
        <div class="aula-detalhe__prof">
          <img :src="oc.professor.foto" :alt="'Foto de ' + oc.professor.nome" width="64" height="77">
          <div><b>{{ oc.professor.nome }}</b><span>{{ oc.professor.especialidade }}</span></div>
        </div>
        <dl class="ficha">
          <div><dt>Sala</dt><dd>{{ oc.aula.sala }}</dd></div>
          <div><dt>Intensidade</dt><dd>{{ ['', 'Leve', 'Média', 'Forte'][oc.modalidade.intensidade] }}</dd></div>
          <div><dt>Vagas</dt><dd>{{ vagas(oc) }} de {{ oc.aula.capacidade }}</dd></div>
          <div><dt>Lista de espera</dt><dd>{{ oc.aula.lista_espera }} {{ oc.aula.lista_espera === 1 ? 'pessoa' : 'pessoas' }}</dd></div>
        </dl>
        <div class="ocupacao" :style="{ '--v': ocupacao }" role="img" :aria-label="'Ocupação ' + ocupacao + '%'">
          <span></span><small>{{ ocupacao }}% ocupada</small>
        </div>
        <p v-if="sit.minha" class="minha-situacao">
          {{ sit.minha.status === 'confirmada' ? 'Sua vaga está confirmada.' : 'Você é o ' + sit.minha.posicao + 'º da lista de espera.' }}
        </p>
        <p v-if="sit.motivo" class="motivo" role="status">{{ sit.motivo }}</p>
        <button v-if="sit.acao" type="button" class="botao botao--largo" :class="{ 'botao--perigo': sit.acao === 'cancelar' }" @click="acao">{{ textoBotao }}</button>
      </div>
    </modal-base>
    <modal-base v-else titulo="Aula não encontrada" @fechar="fechar">
      <p>Essa aula não existe. Volte para a grade e escolha outra.</p>
    </modal-base>`,
};
