// =====================================================================
// carrinho.js – os lugares "segurados" enquanto o cliente compra.
//
// Estado (fica no sessionStorage, chave 'orbita:carrinho', para sobreviver ao F5):
//   { sessaoId, lugares: [{ id: 'B5', tipo: 'inteira' }], expiraEm: 1733400000000 }
//
// Regras:
//  - o cronômetro de 5:00 começa quando o PRIMEIRO lugar é marcado
//  - F5 não reinicia o cronômetro (guardamos o horário de expiração, não os segundos)
//  - faltando 1 minuto, aviso; no zero, os lugares são liberados
//  - o cronômetro usa o relógio REAL (Date.now), não o "agora" fixo da API
// =====================================================================
import { ler, gravar } from './util.js';
import { dados } from './api.js';
import { avisar } from './avisos.js';

const CHAVE = 'orbita:carrinho';
const pilula = document.getElementById('cronometro');
const tempo = document.getElementById('cronometro-tempo');
let intervalo = null;
let avisouUmMinuto = false;

export function carrinho() { return ler(CHAVE, null, sessionStorage); }

export function salvarCarrinho(c) {
  if (!c || !c.lugares.length) { limparCarrinho(); return; }
  if (!c.expiraEm) c.expiraEm = Date.now() + dados.config.tempo_reserva_segundos * 1000;
  gravar(CHAVE, c, sessionStorage);
  ligarCronometro();
}

export function limparCarrinho() {
  sessionStorage.removeItem(CHAVE);
  clearInterval(intervalo); intervalo = null;
  pilula.hidden = true;
  avisouUmMinuto = false;
}

export function segundosRestantes() {
  const c = carrinho();
  return c ? Math.max(0, Math.ceil((c.expiraEm - Date.now()) / 1000)) : 0;
}

export function mmss(seg) {
  return `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
}

// Chamado no início da aplicação (para continuar depois do F5) e a cada salvar.
export function ligarCronometro() {
  const c = carrinho();
  if (!c) return;
  pilula.href = `#/sessao/${c.sessaoId}`;
  pilula.hidden = false;
  if (intervalo) return;
  const tique = () => {
    const s = segundosRestantes();
    tempo.textContent = mmss(s);
    pilula.classList.toggle('cronometro--urgente', s <= 60);
    // Avisa na tela e também atualiza quem estiver mostrando o tempo
    document.querySelectorAll('[data-tempo-restante]').forEach(el => (el.textContent = mmss(s)));
    if (s <= 60 && s > 0 && !avisouUmMinuto) {
      avisouUmMinuto = true;
      avisar('Falta 1 minuto para seus lugares serem liberados.', { tipo: 'info' });
    }
    if (s === 0) {
      limparCarrinho();
      avisar('O tempo acabou e os lugares foram liberados. Escolha de novo.', { tipo: 'erro', duracao: 6000 });
      // Avisa a tela atual (mapa de lugares ou pagamento) para se redesenhar.
      window.dispatchEvent(new CustomEvent('carrinho-expirou'));
    }
  };
  tique();
  intervalo = setInterval(tique, 1000);
}
