/*
 * store.js – Pacote P5: estado compartilhado e funções de formato
 * ---------------------------------------------------------------
 * Em Vue sem build, o jeito mais simples de compartilhar estado entre
 * telas é um objeto reactive() global. Toda tela LÊ daqui; quem
 * altera dados chama as funções carregar...() depois da API responder.
 */
const { reactive, computed } = Vue;

const store = reactive({
  schools: [],
  teams: [],
  matches: [],
  org: JSON.parse(sessionStorage.getItem('copa-org') || 'null'), // { token, name } do organizador
  carregando: true,
  erro: '',
  toasts: [],
});

const FASES = [
  { chave: 'quarterfinal', rota: 'quartas', nome: 'Quartas de final' },
  { chave: 'semifinal', rota: 'semis', nome: 'Semifinais' },
  { chave: 'final', rota: 'final', nome: 'Final' },
];
const DATA_TORNEIO = '2026-11-28';

/* ---------- carga ---------- */
async function carregarTudo() {
  store.carregando = true;
  store.erro = '';
  try {
    [store.schools, store.teams, store.matches] = await Promise.all([API.schools(), API.teams(), API.matches()]);
  } catch (e) {
    store.erro = e.message;
  } finally {
    store.carregando = false;
  }
}
async function recarregarEquipes() { store.teams = await API.teams(); }
async function recarregarPartidas() { store.matches = await API.matches(); }

/* ---------- valores derivados usados por várias telas ---------- */
const derivados = {
  confirmadas: computed(() => store.teams.filter((t) => t.status === 'confirmed').length),
  chaveamentoGerado: computed(() => store.matches.length > 0),
  campeao: computed(() => {
    const final = store.matches.find((m) => m.stage === 'final');
    if (!final || !final.winner_id) return null;
    return final.team_a?.id === final.winner_id ? final.team_a : final.team_b;
  }),
};

/* ---------- toast ---------- */
let idToast = 0;
function toast(texto, tipo = 'ok') {
  const t = { id: ++idToast, texto, tipo };
  store.toasts.push(t);
  setTimeout(() => { store.toasts = store.toasts.filter((x) => x.id !== t.id); }, 3500);
}

/* ---------- formatos ----------
 * Datas chegam como "2026-11-28 09:00:00". Exibir sem new Date()
 * evita o erro de fuso (meia-noite UTC = dia anterior no Brasil). */
function dataBR(texto) {
  const [a, m, d] = texto.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
function dataHoraBR(texto) { return `${dataBR(texto)} ${texto.slice(11, 16)}`; }
function paraDate(texto) {
  const [a, m, d, h = 0, mi = 0, s = 0] = texto.split(/[- :]/).map(Number);
  return new Date(a, m - 1, d, h, mi, s);
}
/* idade completa no dia do torneio (mesma regra da API) */
function idadeNoTorneio(nascimento) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null;
  const [a, m, d] = nascimento.split('-').map(Number);
  const [ta, tm, td] = DATA_TORNEIO.split('-').map(Number);
  let idade = ta - a;
  if (tm < m || (tm === m && td < d)) idade--;
  return idade;
}
const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nomeFase = (chave) => FASES.find((f) => f.chave === chave)?.nome || chave;
const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
