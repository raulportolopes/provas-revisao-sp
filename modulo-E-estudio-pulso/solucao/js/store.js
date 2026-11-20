// =====================================================================
// store.js – ESTADO GLOBAL da aplicação (sem Pinia: só reactive() do Vue).
// Qualquer componente que importar "store" enxerga e altera o mesmo estado,
// e a tela se atualiza sozinha. As regras de negócio também ficam aqui,
// longe dos templates, para serem fáceis de achar e de testar.
// =====================================================================
import { dataLocal, isoDia, minutos, hhmm, segundaDaSemana, somarDias, ler, gravar, DIAS } from './util.js';
const { reactive, watch } = Vue;

export const store = reactive({
  carregando: true,
  erro: null,
  dados: { config: null, modalidades: [], professores: [], aulas: [], exercicios: [], planos: [], faq: [], aluna: null },
  usuario: ler('pulso:usuario', null),          // { email, nome, plano_id, meta_mensal, historico, avatar }
  reservas: ler('pulso:reservas', []),           // [{ aulaId, data, status: 'confirmada'|'espera', posicao, criadaEm }]
  treino: ler('pulso:treino', []),               // [{ exercicioId, series, reps }]
  prefs: ler('pulso:prefs', { tema: null, fonte: 1 }),   // fonte: 0.9 | 1 | 1.15
  avisos: [],
});

// Tudo que muda é gravado no localStorage automaticamente (deep: true olha dentro dos arrays).
watch(() => store.reservas, v => gravar('pulso:reservas', v), { deep: true });
watch(() => store.treino, v => gravar('pulso:treino', v), { deep: true });
watch(() => store.prefs, v => gravar('pulso:prefs', v), { deep: true });
watch(() => store.usuario, v => (v ? gravar('pulso:usuario', v) : localStorage.removeItem('pulso:usuario')), { deep: true });

// ---------------- API ----------------
const ARQUIVOS = { config: 'config', modalidades: 'modalidades', professores: 'professores', aulas: 'aulas',
  exercicios: 'exercicios', planos: 'planos', faq: 'faq', aluna: 'aluna-demo' };

export async function carregar() {
  store.carregando = true; store.erro = null;
  try {
    const partes = await Promise.all(Object.entries(ARQUIVOS).map(async ([chave, arq]) => {
      const r = await fetch(`api/${arq}.json`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${arq}.json: HTTP ${r.status}`);
      return [chave, await r.json()];
    }));
    store.dados = Object.fromEntries(partes);
  } catch (e) {
    console.error(e);
    store.erro = 'Não foi possível carregar os dados do estúdio.';
  } finally {
    store.carregando = false;
  }
}

// "Agora" da aplicação = config.agora (hora de parede, sem fuso). Deixa o teste repetível.
export function agora() {
  const iso = store.dados.config?.agora;
  if (!iso) return new Date();
  const [, d, h] = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return dataLocal(d, h);
}

// ---------------- Cruzamentos ----------------
export const modalidade = id => store.dados.modalidades.find(m => m.id === id);
export const professor = id => store.dados.professores.find(p => p.id === id);
export const aulaPorId = id => store.dados.aulas.find(a => a.id === id);
export const exercicio = id => store.dados.exercicios.find(e => e.id === id);

/**
 * Aulas de UMA semana já com data real.
 * semana = 0 (esta), 1 (próxima), 2 (daqui a duas).
 * Cada item: { aula, data: '2026-12-08', inicio: Date, fim: Date, ini: 420, fimMin: 465, ... }
 */
export function ocorrenciasDaSemana(semana) {
  const seg = somarDias(segundaDaSemana(agora()), semana * 7);
  return store.dados.aulas.map(aula => {
    const dia = somarDias(seg, aula.dia_semana - 1);
    const data = isoDia(dia);
    const ini = minutos(aula.inicio);
    return { aula, data, ini, fimMin: ini + aula.duracao_min,
      inicio: dataLocal(data, aula.inicio), fim: dataLocal(data, hhmm(ini + aula.duracao_min)),
      modalidade: modalidade(aula.modalidade_id), professor: professor(aula.professor_id) };
  });
}
export function ocorrencia(aulaId, data) {
  const aula = aulaPorId(aulaId);
  if (!aula) return null;
  const ini = minutos(aula.inicio);
  return { aula, data, ini, fimMin: ini + aula.duracao_min, inicio: dataLocal(data, aula.inicio),
    fim: dataLocal(data, hhmm(ini + aula.duracao_min)), modalidade: modalidade(aula.modalidade_id), professor: professor(aula.professor_id) };
}

export const minhaReserva = (aulaId, data) => store.reservas.find(r => r.aulaId === aulaId && r.data === data);

// Vagas livres: capacidade - inscritos da API - eu (se estou confirmado)
export function vagas(oc) {
  const eu = minhaReserva(oc.aula.id, oc.data)?.status === 'confirmada' ? 1 : 0;
  return Math.max(0, oc.aula.capacidade - oc.aula.inscritos - eu);
}

// ---------------- REGRAS DE RESERVA ----------------
// Devolve o que o botão do modal deve fazer e, se não puder, o motivo.
export function situacao(oc) {
  const cfg = store.dados.config;
  const minha = minhaReserva(oc.aula.id, oc.data);
  const faltamMin = (oc.inicio - agora()) / 60000;

  if (oc.inicio <= agora()) return { acao: null, motivo: oc.fim <= agora() ? 'Esta aula já terminou.' : 'Esta aula já começou.' };
  if (minha) {
    if (faltamMin < cfg.cancelamento_minimo_minutos)
      return { acao: null, minha, motivo: `Não é mais possível cancelar: faltam menos de ${cfg.cancelamento_minimo_minutos} minutos para o início.` };
    return { acao: 'cancelar', minha };
  }
  if (!store.usuario) return { acao: 'entrar' };

  const doDia = store.reservas.filter(r => r.data === oc.data);
  if (doDia.length >= cfg.max_aulas_por_dia)
    return { acao: null, motivo: `Você já tem ${cfg.max_aulas_por_dia} aulas neste dia (limite diário).` };

  // Conflito: [ini, fim) de uma se sobrepõe ao [ini, fim) da outra
  for (const r of doDia) {
    const o = ocorrencia(r.aulaId, r.data);
    if (o.ini < oc.fimMin && oc.ini < o.fimMin)
      return { acao: null, motivo: `Conflito de horário com ${o.modalidade.nome} (${o.aula.inicio}–${hhmm(o.fimMin)}).` };
  }
  return { acao: vagas(oc) > 0 ? 'reservar' : 'espera' };
}

export function reservar(oc) {
  const s = situacao(oc);
  if (s.acao !== 'reservar' && s.acao !== 'espera') return s;
  const r = { aulaId: oc.aula.id, data: oc.data, status: s.acao === 'reservar' ? 'confirmada' : 'espera',
    posicao: s.acao === 'espera' ? oc.aula.lista_espera + 1 : null, criadaEm: new Date().toISOString() };
  store.reservas.push(r);
  return { ok: true, reserva: r };
}

export function cancelar(oc) {
  const i = store.reservas.findIndex(r => r.aulaId === oc.aula.id && r.data === oc.data);
  if (i < 0) return null;
  return store.reservas.splice(i, 1)[0];      // devolve a reserva removida (para o "Desfazer")
}

export const rotuloAula = oc => `${oc.modalidade.nome} · ${DIAS[oc.inicio.getDay()]} ${oc.data.slice(8, 10)}/${oc.data.slice(5, 7)} às ${oc.aula.inicio}`;

// ---------------- Login (simulado: compara com api/aluna-demo.json) ----------------
export function entrar(email, senha) {
  const a = store.dados.aluna;
  if (email.trim().toLowerCase() !== a.email || senha !== a.senha) return false;
  const { senha: _ignorada, ...semSenha } = a;          // nunca guardar a senha no localStorage
  store.usuario = { ...semSenha, avatar: ler('pulso:avatar', null) };
  return true;
}
export function sair() { store.usuario = null; }

// ---------------- Avisos (toasts) ----------------
let idAviso = 0;
export function avisar(texto, { tipo = 'info', duracao = 4500, acao = null } = {}) {
  const id = ++idAviso;
  store.avisos.push({ id, texto, tipo, acao });
  setTimeout(() => fecharAviso(id), duracao);
}
export function fecharAviso(id) {
  const i = store.avisos.findIndex(a => a.id === id);
  if (i >= 0) store.avisos.splice(i, 1);
}
