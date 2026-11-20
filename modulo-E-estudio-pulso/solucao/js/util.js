// =====================================================================
// util.js – formatação e funções puras (sem Vue). Usadas em todo lugar.
// =====================================================================

// "2026-12-08" + "07:30" -> Date no horário LOCAL.
// Nunca use new Date('2026-12-08'): isso é meia-noite em UTC = 07/12 às 21h em SP.
export function dataLocal(aaaaMmDd, hhMm = '00:00') {
  const [a, m, d] = aaaaMmDd.split('-').map(Number);
  const [h, min] = hhMm.split(':').map(Number);
  return new Date(a, m - 1, d, h, min);
}
// Date -> "2026-12-08" (sem toISOString, que converte para UTC)
export function isoDia(data) {
  const p = n => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}
export const dataBR = aaaaMmDd => aaaaMmDd.split('-').reverse().join('/');
export const diaMes = aaaaMmDd => aaaaMmDd.slice(8, 10) + '/' + aaaaMmDd.slice(5, 7);

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// "07:30" -> 450 (minutos desde meia-noite). Facilita comparar e somar horários.
export const minutos = hhMm => { const [h, m] = hhMm.split(':').map(Number); return h * 60 + m; };
export const hhmm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Segunda-feira da semana da data (a grade começa na segunda)
export function segundaDaSemana(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const dia = d.getDay();                      // 0 = domingo
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  return d;
}
export function somarDias(data, n) { return new Date(data.getFullYear(), data.getMonth(), data.getDate() + n); }

const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const reais = v => fmtMoeda.format(v).replace(/ /g, ' ');
export const centavos = v => Math.round((v + Number.EPSILON) * 100) / 100;

export const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function ler(chave, padrao) {
  try { const v = localStorage.getItem(chave); return v === null ? padrao : JSON.parse(v); } catch { return padrao; }
}
export function gravar(chave, valor) { localStorage.setItem(chave, JSON.stringify(valor)); }

export const menosMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Baixa um texto como arquivo (Blob + <a download>)
export function baixar(nomeArquivo, texto, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
