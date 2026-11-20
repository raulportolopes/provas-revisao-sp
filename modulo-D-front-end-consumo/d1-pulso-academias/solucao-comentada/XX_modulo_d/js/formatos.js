/*
 * formatos.js – datas, horas e números SEMPRE no padrão brasileiro.
 *
 * ARMADILHAS que a prova cobra:
 *  - new Date('2026-11-24') é lido como meia-noite em UTC -> no Brasil vira 23/11 às 21h (dia anterior!).
 *    Para datas sem hora, monte a data "na mão" com new Date(ano, mes - 1, dia).
 *  - A API manda 'inicio' com fuso (-03:00) e 'criada_em' em UTC (termina com Z).
 *    new Date() entende os dois corretamente; o erro é exibir com getUTCHours() ou cortar a string.
 *    Sempre exiba com Intl/toLocale... e timeZone: 'America/Sao_Paulo'.
 */
const FUSO = 'America/Sao_Paulo';
const fmt = (op) => new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, ...op });

const fData = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' });
const fHora = fmt({ hour: '2-digit', minute: '2-digit' });
const fDiaCurto = fmt({ weekday: 'short', day: '2-digit', month: '2-digit' });
const fExtenso = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fMes = fmt({ month: 'short' });
const fMesAno = fmt({ month: 'long', year: 'numeric' });

/** 'AAAA-MM-DD' -> Date local (sem o bug do fuso). */
export function dataLocal(iso) {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d, 12); // meio-dia: longe de qualquer virada de dia
}
/** Date -> 'AAAA-MM-DD' usando o calendário local (toISOString() usaria UTC!). */
export function isoDia(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const data = (v) => fData.format(new Date(v));                 // 24/11/2026
export const hora = (v) => fHora.format(new Date(v));                 // 07:00
export const dataHora = (v) => `${data(v)} às ${hora(v)}`;            // 24/11/2026 às 07:00
export const extenso = (v) => fExtenso.format(new Date(v));           // segunda-feira, 24 de novembro de 2026
export const diaCurto = (d) => fDiaCurto.format(d).replace('.,', ',');// seg, 24/11
export const mesCurto = (aaaamm) => fMes.format(dataLocal(aaaamm + '-01')).replace('.', ''); // jun
export const mesAno = (aaaamm) => fMesAno.format(dataLocal(aaaamm + '-01'));                // junho de 2026
export const numero = (n) => new Intl.NumberFormat('pt-BR').format(n);

/** "em 25 min", "em 3 h", "amanhã", "em 4 dias" – usado nos cards e nas reservas. */
export function quanto(v, agora = Date.now()) {
  const ms = new Date(v).getTime() - agora;
  const min = Math.round(ms / 60000);
  if (min < 0) return 'já começou';
  if (min < 60) return `em ${min} min`;
  const hojeISO = isoDia(new Date(agora));
  const alvo = new Date(v);
  const dias = Math.round((dataLocal(isoDia(alvo)) - dataLocal(hojeISO)) / 86400000);
  if (dias === 0) return `em ${Math.floor(min / 60)} h`;
  if (dias === 1) return 'amanhã';
  return `em ${dias} dias`;
}

/** Escapa texto antes de colocar em innerHTML (evita quebrar o HTML com < ou &). */
export function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
