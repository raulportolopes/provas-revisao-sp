// =====================================================================
// api.js – carrega os arquivos da pasta api/ e CRUZA os dados.
// A tela nunca mostra id: sessão -> programa (programa_id) e sala (sala_id).
// =====================================================================
import { dataLocal, definirAgora, ler, gravar } from './util.js';

export const dados = { config: null, programas: [], salas: [], sessoes: [], ceu: null };

async function pegar(arquivo) {
  const resp = await fetch(`api/${arquivo}`, { cache: 'no-store' });
  // fetch só rejeita em erro de rede; 404/500 precisam ser testados à mão.
  if (!resp.ok) throw new Error(`${arquivo}: HTTP ${resp.status}`);
  return resp.json();
}

export async function carregarTudo() {
  // Promise.all: os 5 pedidos saem juntos; se UM falhar, cai no catch de quem chamou.
  const [config, programas, salas, sessoes, ceu] = await Promise.all(
    ['config.json', 'programas.json', 'salas.json', 'sessoes.json', 'ceu.json'].map(pegar));
  Object.assign(dados, { config, programas, salas, sessoes, ceu });
  definirAgora(config.agora);

  // Primeira visita: ainda não existe a chave no localStorage -> carrega os exemplos.
  if (localStorage.getItem('orbita:reservas') === null) {
    gravar('orbita:reservas', await pegar('reservas-exemplo.json'));
  }
}

// ---------- Cruzamentos ----------
export const programa = id => dados.programas.find(p => p.id === id);
export const sala = id => dados.salas.find(s => s.id === id);

// Lugares vendidos por ESTE navegador ficam no localStorage e são somados aos
// "ocupados" da API (a API é só leitura).
export function ocupadosLocais(sessaoId) { return ler(`orbita:ocupados:${sessaoId}`, []); }
export function gravarOcupadosLocais(sessaoId, lista) { gravar(`orbita:ocupados:${sessaoId}`, lista); }

export function ocupados(sessao) {
  return new Set([...sessao.ocupados, ...ocupadosLocais(sessao.id)]);
}

// Lista de todos os lugares da sala, lida do desenho (layout).
// A = assento comum, C = cadeirante, _ = corredor, . = vazio.
// A numeração recomeça em cada fileira e pula corredores e vazios.
export function lugaresDaSala(s) {
  const lista = [];
  s.layout.forEach((linha, r) => {
    const fileira = String.fromCharCode(65 + r);
    let n = 0;
    [...linha].forEach((ch, col) => {
      if (ch === 'A' || ch === 'C') { n++; lista.push({ id: `${fileira}${n}`, fileira, numero: n, col, acessivel: ch === 'C' }); }
    });
  });
  return lista;
}

// Sessão "completa": já com programa, sala, data de início e lugares livres.
export function sessaoCompleta(s) {
  const sl = sala(s.sala_id);
  const livres = sl.capacidade - ocupados(s).size;
  return { ...s, programa: programa(s.programa_id), sala: sl, inicio: dataLocal(s.data, s.hora), livres };
}

export const todasSessoes = () => dados.sessoes.map(sessaoCompleta);
export const sessaoPorId = id => { const s = dados.sessoes.find(x => x.id === id); return s ? sessaoCompleta(s) : null; };
