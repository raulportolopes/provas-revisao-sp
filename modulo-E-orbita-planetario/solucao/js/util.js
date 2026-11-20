// =====================================================================
// util.js – funções pequenas usadas por todas as telas.
// Regra de ouro da prova: data, moeda e texto SEMPRE passam por aqui,
// assim o formato fica igual em todas as telas.
// =====================================================================

// ---------- "Agora" da aplicação ----------
// A prova manda usar o horário de api/config.json (05/12/2026 10:00) como
// "agora". Isso deixa o teste repetível: o avaliador vê sempre as mesmas sessões.
// Lemos só a "hora de parede" (2026-12-05 10:00) e ignoramos o -03:00: assim
// a comparação com o horário das sessões (também hora de parede) dá certo
// mesmo se o computador estiver em outro fuso.
let agoraFixo = null;
export function definirAgora(iso) {
  const [, d, h] = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  agoraFixo = dataLocal(d, h);
}
export function agora() { return agoraFixo ? new Date(agoraFixo) : new Date(); }

// ---------- Datas ----------
// ARMADILHA DO FUSO: new Date('2026-12-05') é lido como meia-noite em UTC,
// que em São Paulo (UTC-3) vira 04/12 às 21h. Por isso montamos a data
// pelas partes (ano, mês, dia), que o JavaScript interpreta no horário local.
export function dataLocal(aaaaMmDd, hhMm = '00:00') {
  const [a, m, d] = aaaaMmDd.split('-').map(Number);
  const [h, min] = hhMm.split(':').map(Number);
  return new Date(a, m - 1, d, h, min);
}

// "2026-12-05" -> "05/12/2026"
export function dataBR(aaaaMmDd) {
  const [a, m, d] = aaaaMmDd.split('-');
  return `${d}/${m}/${a}`;
}

// "2026-12-05" -> "05/12"
export function diaMes(aaaaMmDd) {
  const [, m, d] = aaaaMmDd.split('-');
  return `${d}/${m}`;
}

const SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function diaSemana(aaaaMmDd, curto = false) {
  const nome = SEMANA[dataLocal(aaaaMmDd).getDay()];
  return curto ? nome.slice(0, 3) : nome;
}

// Date -> "2026-12-05" (sem passar por toISOString, que converte para UTC!)
export function isoDia(data) {
  const p = n => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

// ---------- Dinheiro ----------
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// 1234.5 -> "R$ 1.234,50"  (o Intl usa um espaço especial; trocamos por espaço normal)
export function reais(valor) { return moeda.format(valor).replace(/ /g, ' '); }

// Arredonda para 2 casas sem o erro clássico do ponto flutuante (1.005 -> 1.01)
export function centavos(valor) { return Math.round((valor + Number.EPSILON) * 100) / 100; }

// ---------- Texto ----------
// Busca sem diferenciar maiúsculas e acentos: "CEU" encontra "Céu".
export function normalizar(txt) {
  return String(txt).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Escapa texto antes de colocar em innerHTML (evita quebrar o HTML com < ou ").
export function esc(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Plural simples: plural(1, 'lugar', 'lugares') -> "1 lugar"
export function plural(n, um, varios) { return `${n} ${n === 1 ? um : varios}`; }

// ---------- Armazenamento ----------
// JSON.parse de um valor estragado quebraria a aplicação inteira; o try/catch
// devolve o valor padrão nesse caso.
export function ler(chave, padrao, area = localStorage) {
  try { const v = area.getItem(chave); return v === null ? padrao : JSON.parse(v); }
  catch { return padrao; }
}
export function gravar(chave, valor, area = localStorage) { area.setItem(chave, JSON.stringify(valor)); }

// ---------- Outros ----------
// debounce: só executa fn depois que o usuário parar de chamar por "ms" milissegundos.
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Usuário pediu menos movimento no sistema operacional?
export const menosMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Classificação indicativa (cores oficiais do ClassInd)
export const CLASSIF = {
  L: { texto: 'Livre', cor: 'l' }, 10: { texto: '10 anos', cor: 'dez' },
  12: { texto: '12 anos', cor: 'doze' }, 14: { texto: '14 anos', cor: 'catorze' },
};
