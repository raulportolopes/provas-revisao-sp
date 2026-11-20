/* =====================================================================
   B3-H · Mapa Estelar Interativo (canvas)
   Ideias principais:
   1. O canvas tem tamanho LÓGICO 800x500, mas o CSS estica. Todo clique
      precisa ser convertido: x_lógico = (clientX - rect.left) * 800 / rect.width.
   2. Desfazer/Refazer por "fotos" (snapshots): a cada mudança guardamos a
      lista de ligações anterior em "passado". Desfazer = volta uma foto;
      refazer = avança. Funciona igual para ligar, limpar e importar.
   3. Tudo que muda chama desenhar() e salvar(): uma única fonte da verdade.
   ===================================================================== */

const LARG = 800, ALT = 500, RAIO_CLIQUE = 12;
const CHAVE = 'mapa-estelar-ligacoes';

const canvas = document.getElementById('mapa');
const ctx = canvas.getContext('2d');
const area = document.getElementById('area');
const dica = document.getElementById('dica');
const msg = document.getElementById('mensagem');
const $ = id => document.getElementById(id);

let estrelas = [];          // vindas do estrelas.json
let ligacoes = [];          // [[idA, idB], ...]
let passado = [];           // fotos para desfazer
let futuro = [];            // fotos para refazer
let selecionada = null;     // id da 1ª estrela clicada
let sobMouse = null;        // id da estrela sob o mouse
let focoTeclado = null;     // índice da estrela escolhida pelo teclado

/* ---------- Utilidades ---------- */
const fmtMag = m => m.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const porId = id => estrelas.find(e => e.id === id);
const raio = mag => Math.max(2.5, 7 - mag * 1.4);     // mais brilhante (menor mag) = maior

function avisar(texto, erro = false) {
  msg.textContent = texto;
  msg.classList.toggle('erro', erro);
}

// mouse (px na tela) → coordenada lógica do canvas
function pontoLogico(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * LARG / r.width, y: (ev.clientY - r.top) * ALT / r.height };
}

function estrelaEm(p) {
  let melhor = null, dist = RAIO_CLIQUE;
  for (const e of estrelas) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= dist) { dist = d; melhor = e; }
  }
  return melhor;
}

const mesmaLigacao = (l, a, b) => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a);

/* ---------- Desenho ---------- */
function desenhar(paraExportar = false) {
  // fundo
  const g = ctx.createRadialGradient(LARG / 2, ALT / 2, 50, LARG / 2, ALT / 2, 500);
  g.addColorStop(0, '#1B2350');
  g.addColorStop(1, '#070A1A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARG, ALT);

  // ligações
  ctx.strokeStyle = 'rgba(34, 211, 238, .8)';
  ctx.lineWidth = 2;
  for (const [a, b] of ligacoes) {
    const A = porId(a), B = porId(b);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }

  // estrelas
  for (const e of estrelas) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, raio(e.mag), 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#BFD4FF';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (paraExportar) return;       // a imagem exportada não leva seleção nem foco

  // anel amarelo na selecionada; anel tracejado na estrela do teclado
  if (selecionada) anel(porId(selecionada), '#FFD166', []);
  if (focoTeclado !== null && document.activeElement === canvas) anel(estrelas[focoTeclado], '#22D3EE', [4, 3]);
}

function anel(e, cor, traco) {
  ctx.beginPath();
  ctx.setLineDash(traco);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.arc(e.x, e.y, raio(e.mag) + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ---------- Estado + histórico ---------- */
function mudarLigacoes(novas) {
  passado.push(ligacoes.map(l => [...l]));   // foto do estado atual
  futuro = [];                               // ação nova apaga o "refazer"
  ligacoes = novas;
  atualizar();
}

function desfazer() {
  if (!passado.length) return;
  futuro.push(ligacoes);
  ligacoes = passado.pop();
  atualizar();
}

function refazer() {
  if (!futuro.length) return;
  passado.push(ligacoes);
  ligacoes = futuro.pop();
  atualizar();
}

function atualizar() {
  $('desfazer').disabled = passado.length === 0;
  $('refazer').disabled = futuro.length === 0;
  $('contador').textContent = ligacoes.length === 1 ? '1 ligação' : `${ligacoes.length} ligações`;
  localStorage.setItem(CHAVE, JSON.stringify(ligacoes));
  desenhar();
}

/* ---------- Clique em estrela (mouse ou teclado) ---------- */
function escolher(e) {
  if (!e) { selecionada = null; desenhar(); return; }           // área vazia: cancela
  if (selecionada === null) { selecionada = e.id; avisar(`${e.nome} selecionada. Escolha a segunda estrela.`); desenhar(); return; }
  if (selecionada === e.id) { selecionada = null; avisar('Seleção cancelada.'); desenhar(); return; }

  const a = selecionada;
  selecionada = null;
  if (ligacoes.some(l => mesmaLigacao(l, a, e.id))) {
    avisar('Essa ligação já existe.', true);
    desenhar();
    return;
  }
  mudarLigacoes([...ligacoes, [a, e.id]]);
  avisar(`${porId(a).nome} ligada a ${e.nome}.`);
}

canvas.addEventListener('click', ev => escolher(estrelaEm(pontoLogico(ev))));

canvas.addEventListener('mousemove', ev => {
  const e = estrelaEm(pontoLogico(ev));
  sobMouse = e ? e.id : null;
  canvas.style.cursor = e ? 'pointer' : 'default';
  if (!e) { dica.hidden = true; return; }
  // posição da dica em px da tela (lógico → tela)
  const r = canvas.getBoundingClientRect();
  dica.style.left = (e.x * r.width / LARG) + 'px';
  dica.style.top = (e.y * r.height / ALT) + 'px';
  dica.textContent = `${e.nome} (mag ${fmtMag(e.mag)})`;
  dica.hidden = false;
});
canvas.addEventListener('mouseleave', () => { dica.hidden = true; });

/* ---------- Teclado no canvas ---------- */
canvas.addEventListener('focus', () => { if (focoTeclado === null) focoTeclado = 0; desenhar(); });
canvas.addEventListener('blur', () => desenhar());
canvas.addEventListener('keydown', ev => {
  if (!estrelas.length) return;
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); focoTeclado = (focoTeclado + 1) % estrelas.length; }
  else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); focoTeclado = (focoTeclado - 1 + estrelas.length) % estrelas.length; }
  else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); escolher(estrelas[focoTeclado]); return; }
  else if (ev.key === 'Escape') { selecionada = null; }
  else return;
  avisar(`Estrela: ${estrelas[focoTeclado].nome}`);
  desenhar();
});

/* ---------- Atalhos globais Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z ---------- */
document.addEventListener('keydown', ev => {
  if (!(ev.ctrlKey || ev.metaKey)) return;
  const k = ev.key.toLowerCase();
  if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); desfazer(); }
  else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); refazer(); }
});

$('desfazer').addEventListener('click', desfazer);
$('refazer').addEventListener('click', refazer);
$('limpar').addEventListener('click', () => {
  if (!ligacoes.length) return;
  mudarLigacoes([]);                 // limpar também pode ser desfeito
  avisar('Mapa limpo. Use Desfazer para voltar.');
});

/* ---------- Exportar ---------- */
function baixar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// data LOCAL no formato AAAA-MM-DD (toISOString usaria UTC e erraria à noite)
function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

$('png').addEventListener('click', () => {
  desenhar(true);                                    // versão limpa
  canvas.toBlob(blob => { baixar(blob, `mapa-estelar-${hoje()}.png`); desenhar(); }, 'image/png');
});

$('json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ versao: 1, ligacoes }, null, 2)], { type: 'application/json' });
  baixar(blob, 'mapa-estelar.json');
});

/* ---------- Importar (input ou arrastar e soltar) ---------- */
function importar(arquivo) {
  if (!arquivo) return;
  if (!/\.json$/i.test(arquivo.name)) { avisar('Envie um arquivo .json.', true); return; }
  const leitor = new FileReader();
  leitor.onload = () => {
    let dados;
    try { dados = JSON.parse(leitor.result); } catch { avisar('Arquivo JSON inválido.', true); return; }

    const lista = dados && dados.ligacoes;
    const ids = new Set(estrelas.map(e => e.id));
    const ok = Array.isArray(lista) && lista.every(l =>
      Array.isArray(l) && l.length === 2 && ids.has(l[0]) && ids.has(l[1]) && l[0] !== l[1]);
    if (!ok) { avisar('O arquivo não tem ligações válidas para este mapa.', true); return; }

    // remove repetidas (A-B e B-A contam como a mesma)
    const unicas = [];
    lista.forEach(([a, b]) => { if (!unicas.some(l => mesmaLigacao(l, a, b))) unicas.push([a, b]); });
    selecionada = null;
    mudarLigacoes(unicas);
    avisar(`${unicas.length} ligações importadas.`);
  };
  leitor.readAsText(arquivo);
}

$('arquivo').addEventListener('change', e => { importar(e.target.files[0]); e.target.value = ''; });

// dragover precisa de preventDefault, senão o navegador abre o arquivo
area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('arrastando'); });
area.addEventListener('dragleave', () => area.classList.remove('arrastando'));
area.addEventListener('drop', e => {
  e.preventDefault();
  area.classList.remove('arrastando');
  importar(e.dataTransfer.files[0]);
});

/* ---------- Início ---------- */
async function iniciar() {
  try {
    const r = await fetch('estrelas.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    estrelas = await r.json();
  } catch {
    avisar('Não foi possível carregar as estrelas.', true);
    return;
  }
  // restaura do localStorage, descartando lixo
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE)) || [];
    const ids = new Set(estrelas.map(e => e.id));
    ligacoes = salvas.filter(l => Array.isArray(l) && ids.has(l[0]) && ids.has(l[1]));
  } catch { ligacoes = []; }
  atualizar();
}

iniciar();
