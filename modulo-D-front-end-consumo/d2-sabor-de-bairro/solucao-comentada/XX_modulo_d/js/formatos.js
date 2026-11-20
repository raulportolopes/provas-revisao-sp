/*
 * Formatação. Regra de ouro: a API manda dinheiro em CENTAVOS (inteiro)
 * e datas com "Z" (UTC). Só aqui, na hora de mostrar, viramos reais e hora de Brasília.
 */
const FUSO = 'America/Sao_Paulo';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** 5490 -> "R$ 54,90". Nunca divida e some em reais: some em centavos e divida no fim. */
export const brl = (centavos) => moeda.format((centavos || 0) / 100);

const fHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
const fDataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fDiaCurto = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit' });

/** "2026-11-20T21:05:00Z" -> "18:05" (Brasília), qualquer que seja o fuso do computador. */
export const hora = (iso) => (iso ? fHora.format(new Date(iso)) : '');
/** "20/11/2026, 18:05" -> trocamos a vírgula por " às " para ler melhor. */
export const dataHora = (iso) => (iso ? fDataHora.format(new Date(iso)).replace(', ', ' às ') : '');

/** Texto de "abre em" para restaurante fechado: hoje às 18:00 / amanhã às 10:30 / sáb., 22/11 às 13:00. */
export function quandoAbre(iso) {
  if (!iso) return 'Fechado';
  const d = new Date(iso);
  const dia = (x) => new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(x); // AAAA-MM-DD no fuso de SP
  const hoje = dia(new Date());
  const amanha = dia(new Date(Date.now() + 864e5));
  const prefixo = dia(d) === hoje ? 'hoje' : dia(d) === amanha ? 'amanhã' : fDiaCurto.format(d);
  return `Abre ${prefixo} às ${hora(iso)}`;
}

/** Máscara de CEP: aceita só dígitos e põe o hífen depois do 5º. */
export function mascaraCep(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Campo de dinheiro digitado: "50" ou "50,00" ou "R$ 50,5" -> 5000 / 5050 centavos. */
export function paraCentavos(texto) {
  const limpo = String(texto).replace(/[^\d,]/g, '').replace(/,(?=.*,)/g, '');
  if (!limpo) return null;
  const [inteiro, frac = ''] = limpo.split(',');
  return Number(inteiro || 0) * 100 + Number((frac + '00').slice(0, 2));
}

export const NOME_STATUS = {
  recebido: 'Pedido recebido',
  em_preparo: 'Em preparo',
  a_caminho: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
export const NOME_PAGAMENTO = { pix: 'Pix', cartao: 'Cartão na entrega', dinheiro: 'Dinheiro' };

/** Plural simples: plural(1,'item','itens') -> "1 item". */
export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
