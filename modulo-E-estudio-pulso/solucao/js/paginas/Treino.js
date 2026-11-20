// =====================================================================
// Treino.js – MONTADOR DE TREINO.
//  - catálogo com busca (sem acento/maiúscula) e filtro por grupo muscular
//  - adicionar: no máximo config.max_exercicios_treino, sem repetir
//  - REORDENAR: arrastar e soltar (HTML5 Drag and Drop) E teclado
//    (botões ↑ ↓ e Alt+↑ / Alt+↓ com foco no item) – quem não usa mouse
//    também precisa conseguir
//  - séries (1–6) e repetições (1–30) editáveis, com validação
//  - tempo estimado = Σ séries × (segundos_por_serie + 60 s de descanso)
//  - barra empilhada com a divisão por grupo muscular (% das séries)
//  - exportar (.json com Blob) e importar (FileReader) com validação
// Tudo salvo no localStorage pelo watch do store.
// =====================================================================
import { store, exercicio, avisar } from '../store.js';
import { normalizar, baixar, isoDia } from '../util.js';
const { ref, computed, nextTick } = Vue;

const CORES = { Peito: '#F43F5E', Costas: '#3B82F6', Pernas: '#F59E0B', Ombros: '#8B5CF6', Braços: '#14B8A6', Core: '#EC4899' };

export default {
  setup() {
    const busca = ref('');
    const grupo = ref('');
    const grupos = Object.keys(CORES);
    const max = computed(() => store.dados.config.max_exercicios_treino);

    const catalogo = computed(() => store.dados.exercicios.filter(e =>
      (!grupo.value || e.grupo === grupo.value) && (!busca.value || normalizar(e.nome).includes(normalizar(busca.value)))));
    const noTreino = id => store.treino.some(t => t.exercicioId === id);

    function adicionar(e) {
      if (noTreino(e.id)) return;
      if (store.treino.length >= max.value) { avisar(`O treino pode ter no máximo ${max.value} exercícios.`, { tipo: 'erro' }); return; }
      store.treino.push({ exercicioId: e.id, series: 3, reps: 12 });
    }
    function remover(i) {
      const [tirado] = store.treino.splice(i, 1);
      avisar(`${exercicio(tirado.exercicioId).nome} removido.`, { acao: { texto: 'Desfazer', executar: () => store.treino.splice(i, 0, tirado) } });
    }

    // ---------- mover (usado pelo teclado e pelo arrastar) ----------
    const lista = ref(null);
    function mover(de, para, focar = false) {
      if (para < 0 || para >= store.treino.length || de === para) return;
      const [item] = store.treino.splice(de, 1);
      store.treino.splice(para, 0, item);
      anuncio.value = `${exercicio(item.exercicioId).nome} agora é o ${para + 1}º de ${store.treino.length}.`;
      // ref num componente (TransitionGroup) devolve o componente: o elemento <ol> fica em $el
      if (focar) nextTick(() => lista.value.$el.children[para]?.querySelector('.alca').focus());
    }
    const anuncio = ref('');   // texto lido pelo leitor de tela (aria-live)
    function teclaItem(e, i) {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); mover(i, i - 1, true); }
      if (e.key === 'ArrowDown') { e.preventDefault(); mover(i, i + 1, true); }
    }

    // ---------- arrastar e soltar ----------
    const arrastando = ref(null), sobre = ref(null);
    function inicioArraste(e, i) {
      arrastando.value = i;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));   // o Firefox só arrasta se houver dados
    }
    function sobreItem(e, i) { e.preventDefault(); sobre.value = i; }   // preventDefault = "aqui pode soltar"
    function soltar(e, i) {
      e.preventDefault();
      if (arrastando.value !== null) mover(arrastando.value, i);
      arrastando.value = sobre.value = null;
    }
    function fimArraste() { arrastando.value = sobre.value = null; }

    // ---------- validação de séries e repetições ----------
    const erros = ref({});
    function atualizar(i, campo, valor, min, maxv) {
      const n = Number(valor);
      const chave = `${i}-${campo}`;
      if (!Number.isInteger(n) || n < min || n > maxv) { erros.value[chave] = `Use um número inteiro de ${min} a ${maxv}.`; return; }
      delete erros.value[chave];
      store.treino[i][campo] = n;
    }

    // ---------- números do treino ----------
    const totalSeries = computed(() => store.treino.reduce((s, t) => s + t.series, 0));
    const minutosEstimados = computed(() => Math.round(store.treino.reduce((s, t) => s + t.series * (exercicio(t.exercicioId).segundos_por_serie + 60), 0) / 60));
    const divisao = computed(() => {
      const porGrupo = {};
      store.treino.forEach(t => { const g = exercicio(t.exercicioId).grupo; porGrupo[g] = (porGrupo[g] || 0) + t.series; });
      return Object.entries(porGrupo).map(([g, s]) => ({ g, pct: Math.round((s / totalSeries.value) * 100), cor: CORES[g] })).sort((a, b) => b.pct - a.pct);
    });

    // ---------- exportar / importar ----------
    function exportar() {
      const dados = store.treino.map(t => ({ exercicioId: t.exercicioId, nome: exercicio(t.exercicioId).nome, series: t.series, reps: t.reps }));
      baixar(`treino-pulso-${isoDia(new Date())}.json`, JSON.stringify({ versao: 1, exercicios: dados }, null, 2));
    }
    const arquivo = ref(null);
    const erroImportar = ref('');
    function importar(e) {
      const f = e.target.files[0]; e.target.value = '';      // limpa para poder escolher o mesmo arquivo de novo
      if (!f) return;
      erroImportar.value = '';
      if (!f.name.toLowerCase().endsWith('.json')) { erroImportar.value = 'Escolha um arquivo .json.'; return; }
      const leitor = new FileReader();
      leitor.onload = () => {
        try {
          const json = JSON.parse(leitor.result);
          const itens = json.exercicios;
          if (!Array.isArray(itens) || !itens.length) throw new Error('O arquivo não tem a lista "exercicios".');
          if (itens.length > max.value) throw new Error(`O arquivo tem ${itens.length} exercícios; o máximo é ${max.value}.`);
          const vistos = new Set();
          const novos = itens.map((t, k) => {
            if (!exercicio(t.exercicioId)) throw new Error(`Item ${k + 1}: exercício ${t.exercicioId} não existe.`);
            if (vistos.has(t.exercicioId)) throw new Error(`Item ${k + 1}: exercício repetido.`);
            if (!Number.isInteger(t.series) || t.series < 1 || t.series > 6) throw new Error(`Item ${k + 1}: séries inválidas.`);
            if (!Number.isInteger(t.reps) || t.reps < 1 || t.reps > 30) throw new Error(`Item ${k + 1}: repetições inválidas.`);
            vistos.add(t.exercicioId);
            return { exercicioId: t.exercicioId, series: t.series, reps: t.reps };
          });
          store.treino.splice(0, store.treino.length, ...novos);   // troca tudo de uma vez
          avisar(`Treino importado: ${novos.length} exercícios.`, { tipo: 'sucesso' });
        } catch (err) {
          erroImportar.value = err instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : err.message;
        }
      };
      leitor.readAsText(f);
    }

    return { store, busca, grupo, grupos, CORES, max, catalogo, noTreino, adicionar, remover, exercicio, lista, mover, teclaItem, anuncio,
      arrastando, sobre, inicioArraste, sobreItem, soltar, fimArraste, erros, atualizar, totalSeries, minutosEstimados, divisao,
      exportar, arquivo, importar, erroImportar };
  },
  template: `<div class="pagina">
    <div class="cabecalho-pagina">
      <h1>Montar treino</h1>
      <p>Escolha até {{ max }} exercícios e arraste para definir a ordem.</p>
    </div>
    <div class="montador">
      <section class="painel" aria-labelledby="t-cat">
        <h2 id="t-cat">Exercícios</h2>
        <label class="campo">Buscar <input type="search" v-model="busca" placeholder="Ex.: agachamento"></label>
        <div class="chips" role="group" aria-label="Grupo muscular">
          <button type="button" class="chip" :aria-pressed="grupo === ''" @click="grupo = ''">Todos</button>
          <button v-for="g in grupos" :key="g" type="button" class="chip" :style="{ '--cor': CORES[g] }" :aria-pressed="grupo === g" @click="grupo = g">{{ g }}</button>
        </div>
        <ul class="catalogo-ex">
          <li v-for="e in catalogo" :key="e.id">
            <span><b>{{ e.nome }}</b><small>{{ e.grupo }} · {{ e.equipamento }}</small></span>
            <button type="button" class="botao-redondo" :disabled="noTreino(e.id)" @click="adicionar(e)"
                    :aria-label="noTreino(e.id) ? e.nome + ' já está no treino' : 'Adicionar ' + e.nome">{{ noTreino(e.id) ? '✓' : '+' }}</button>
          </li>
          <li v-if="!catalogo.length" class="vazio">Nenhum exercício encontrado.</li>
        </ul>
      </section>

      <section class="painel" aria-labelledby="t-meu">
        <div class="painel__topo">
          <h2 id="t-meu">Meu treino <small>{{ store.treino.length }}/{{ max }}</small></h2>
          <div class="painel__acoes">
            <button type="button" class="botao botao--contorno botao--pequeno" :disabled="!store.treino.length" @click="exportar">Exportar</button>
            <label class="botao botao--contorno botao--pequeno">Importar<input type="file" accept=".json,application/json" class="sr-only" ref="arquivo" @change="importar"></label>
          </div>
        </div>
        <p v-if="erroImportar" class="erro-campo" role="alert">{{ erroImportar }}</p>
        <p class="sr-only" aria-live="assertive">{{ anuncio }}</p>
        <p class="dica">Arraste pela alça ⋮⋮ ou use Alt + ↑/↓ com o foco na alça.</p>

        <TransitionGroup tag="ol" name="lista" class="meu-treino" ref="lista">
          <li v-for="(t, i) in store.treino" :key="t.exercicioId" class="item-treino"
              :class="{ arrastando: arrastando === i, sobre: sobre === i && arrastando !== i }"
              :style="{ '--cor': CORES[exercicio(t.exercicioId).grupo] }"
              draggable="true" @dragstart="inicioArraste($event, i)" @dragover="sobreItem($event, i)" @drop="soltar($event, i)" @dragend="fimArraste">
            <button type="button" class="alca" :aria-label="'Mover ' + exercicio(t.exercicioId).nome + ', posição ' + (i + 1) + '. Alt + seta para cima ou para baixo'" @keydown="teclaItem($event, i)">⋮⋮</button>
            <span class="item-treino__num">{{ i + 1 }}</span>
            <span class="item-treino__nome"><b>{{ exercicio(t.exercicioId).nome }}</b><small>{{ exercicio(t.exercicioId).grupo }}</small></span>
            <label class="mini">Séries <input type="number" min="1" max="6" :value="t.series" :aria-invalid="!!erros[i + '-series']" @input="atualizar(i, 'series', $event.target.value, 1, 6)"></label>
            <label class="mini">Reps <input type="number" min="1" max="30" :value="t.reps" :aria-invalid="!!erros[i + '-reps']" @input="atualizar(i, 'reps', $event.target.value, 1, 30)"></label>
            <span class="item-treino__setas">
              <button type="button" :disabled="i === 0" :aria-label="'Subir ' + exercicio(t.exercicioId).nome" @click="mover(i, i - 1)">↑</button>
              <button type="button" :disabled="i === store.treino.length - 1" :aria-label="'Descer ' + exercicio(t.exercicioId).nome" @click="mover(i, i + 1)">↓</button>
            </span>
            <button type="button" class="remover" :aria-label="'Remover ' + exercicio(t.exercicioId).nome" @click="remover(i)">✕</button>
            <p v-if="erros[i + '-series'] || erros[i + '-reps']" class="erro-campo item-treino__erro">{{ erros[i + '-series'] || erros[i + '-reps'] }}</p>
          </li>
        </TransitionGroup>
        <p v-if="!store.treino.length" class="vazio">Seu treino está vazio. Adicione exercícios da lista.</p>

        <div v-else class="resumo-treino">
          <p><b>{{ totalSeries }}</b> séries · cerca de <b>{{ minutosEstimados }} min</b></p>
          <div class="divisao" role="img" :aria-label="'Divisão por grupo: ' + divisao.map(d => d.g + ' ' + d.pct + '%').join(', ')">
            <span v-for="d in divisao" :key="d.g" :style="{ '--v': d.pct, '--cor': d.cor }" :title="d.g + ' ' + d.pct + '%'"></span>
          </div>
          <ul class="divisao__legenda"><li v-for="d in divisao" :key="d.g" :style="{ '--cor': d.cor }">{{ d.g }} {{ d.pct }}%</li></ul>
        </div>
      </section>
    </div>
  </div>`,
};
