/* =====================================================================
   B3-H · Avaliação com fotos (upload, validação real, reordenar, lightbox)
   Pontos que separam uma solução "H" de uma "E":
   1. Tipo REAL do arquivo: lemos os primeiros bytes (assinatura / "magic
      number"). Um GIF renomeado para .jpg tem file.type "image/jpeg"
      (o navegador confia na extensão!), mas os bytes começam com "GIF8".
   2. Cada arquivo recusado gera uma mensagem com o MOTIVO.
   3. Uma lista (array) é a verdade; reordenar = mexer no array e redesenhar.
   ===================================================================== */

const MAX_FOTOS = 6;
const MAX_BYTES = 1.5 * 1024 * 1024;          // 1,5 MB

const $ = id => document.getElementById(id);
const zona = $('zona'), input = $('arquivos'), lista = $('fotos'), erros = $('erros');

let fotos = [];        // [{ id, nome, tamanho, url }]
let proxId = 1;

/* ---------- Utilidades ---------- */
function tamanhoBr(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / 1024 / 1024).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MB';
}
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Lê os 12 primeiros bytes e devolve 'jpeg' | 'png' | 'webp' | null
async function tipoReal(arquivo) {
  const b = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
  const txt = String.fromCharCode(...b);
  if (txt.startsWith('RIFF') && txt.slice(8, 12) === 'WEBP') return 'webp';
  return null;
}

/* ---------- Receber arquivos (input ou soltar) ---------- */
async function receber(listaArquivos) {
  const msgs = [];
  for (const arq of listaArquivos) {
    // a ordem das checagens define a mensagem que o usuário vê
    if (fotos.some(f => f.nome === arq.name && f.tamanho === arq.size)) { msgs.push(`${arq.name}: esta foto já foi adicionada.`); continue; }
    if (!(await tipoReal(arq))) { msgs.push(`${arq.name}: formato não aceito. Envie JPG, PNG ou WebP.`); continue; }
    if (arq.size > MAX_BYTES) { msgs.push(`${arq.name}: ${tamanhoBr(arq.size)}. O máximo é 1,5 MB.`); continue; }
    if (fotos.length >= MAX_FOTOS) { msgs.push(`${arq.name}: limite de ${MAX_FOTOS} fotos atingido.`); continue; }
    fotos.push({ id: proxId++, nome: arq.name, tamanho: arq.size, url: URL.createObjectURL(arq) });
  }
  erros.innerHTML = msgs.map(m => `<li>${esc(m)}</li>`).join('');
  render();
}

zona.addEventListener('click', () => input.click());
zona.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
});
input.addEventListener('change', () => { receber([...input.files]); input.value = ''; });

// só reage a arquivos (não a miniaturas sendo reordenadas)
const temArquivos = e => [...e.dataTransfer.types].includes('Files');
zona.addEventListener('dragover', e => { if (temArquivos(e)) { e.preventDefault(); zona.classList.add('arrastando'); } });
zona.addEventListener('dragleave', () => zona.classList.remove('arrastando'));
zona.addEventListener('drop', e => {
  if (!temArquivos(e)) return;
  e.preventDefault();
  zona.classList.remove('arrastando');
  receber([...e.dataTransfer.files]);
});
// soltar fora da zona não pode abrir a imagem no navegador
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

/* ---------- Desenhar ---------- */
function render() {
  lista.innerHTML = fotos.map((f, i) => `
    <li class="foto" draggable="true" data-i="${i}">
      ${i === 0 ? '<span class="capa">Capa</span>' : ''}
      <button type="button" class="foto__abrir" data-abrir aria-label="Ampliar ${esc(f.nome)}">
        <img src="${f.url}" alt="Foto ${i + 1}: ${esc(f.nome)}">
      </button>
      <p class="foto__nome" title="${esc(f.nome)}">${esc(f.nome)}</p>
      <p class="foto__tam">${tamanhoBr(f.tamanho)}</p>
      <div class="foto__acoes">
        <button type="button" data-mover="-1" aria-label="Mover ${esc(f.nome)} para a esquerda" ${i === 0 ? 'disabled' : ''}>◀</button>
        <button type="button" data-mover="1" aria-label="Mover ${esc(f.nome)} para a direita" ${i === fotos.length - 1 ? 'disabled' : ''}>▶</button>
        <button type="button" class="remover" data-remover aria-label="Remover ${esc(f.nome)}">Remover</button>
      </div>
    </li>`).join('');
  $('contador').textContent = `${fotos.length} de ${MAX_FOTOS} fotos`;
  atualizarPublicar();
}

function mover(de, para, focarSeletor) {
  if (para < 0 || para >= fotos.length) return;
  const [f] = fotos.splice(de, 1);
  fotos.splice(para, 0, f);
  render();
  // mantém o foco no botão da foto que andou (teclado não se perde)
  if (focarSeletor) lista.querySelector(`.foto[data-i="${para}"] ${focarSeletor}`)?.focus();
}

lista.addEventListener('click', e => {
  const li = e.target.closest('.foto');
  if (!li) return;
  const i = Number(li.dataset.i);
  const m = e.target.closest('[data-mover]');
  if (m) {
    const passo = Number(m.dataset.mover);
    // se chegou na ponta, o foco vai para o outro botão de mover
    const novo = i + passo;
    const sel = (novo === 0 || novo === fotos.length - 1) ? `[data-mover="${-passo}"]` : `[data-mover="${passo}"]`;
    mover(i, novo, sel);
  } else if (e.target.closest('[data-remover]')) {
    URL.revokeObjectURL(fotos[i].url);           // libera a memória da imagem
    fotos.splice(i, 1);
    render();
    (lista.querySelector(`.foto[data-i="${Math.min(i, fotos.length - 1)}"] [data-remover]`) || zona).focus();
  } else if (e.target.closest('[data-abrir]')) {
    abrirLightbox(i, e.target.closest('[data-abrir]'));
  }
});

/* ---------- Reordenar arrastando (HTML5 Drag and Drop) ---------- */
let arrastando = null;
lista.addEventListener('dragstart', e => {
  const li = e.target.closest('.foto');
  if (!li) return;
  arrastando = Number(li.dataset.i);
  li.classList.add('arrastada');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(arrastando));
});
lista.addEventListener('dragover', e => {
  const li = e.target.closest('.foto');
  if (arrastando === null || !li) return;
  e.preventDefault();                         // permite soltar aqui
  lista.querySelectorAll('.alvo').forEach(x => x.classList.remove('alvo'));
  li.classList.add('alvo');
});
lista.addEventListener('drop', e => {
  const li = e.target.closest('.foto');
  if (arrastando === null || !li) return;
  e.preventDefault();
  const para = Number(li.dataset.i);
  const de = arrastando;
  arrastando = null;
  mover(de, para);
});
lista.addEventListener('dragend', () => {
  arrastando = null;
  lista.querySelectorAll('.arrastada, .alvo').forEach(x => x.classList.remove('arrastada', 'alvo'));
});

/* ---------- Lightbox ---------- */
const lb = $('lightbox');
let lbPos = 0, lbOrigem = null;

function mostrarLightbox() {
  const f = fotos[lbPos];
  $('lb-img').src = f.url;
  $('lb-img').alt = `Foto ${lbPos + 1}: ${f.nome}`;
  $('lb-nome').textContent = f.nome;
  $('lb-pos').textContent = `${lbPos + 1} de ${fotos.length}`;
}
function abrirLightbox(i, origem) {
  lbPos = i;
  lbOrigem = origem;
  mostrarLightbox();
  lb.showModal();
  document.body.classList.add('travado');
  $('lb-fechar').focus();
}
const andar = p => { lbPos = (lbPos + p + fotos.length) % fotos.length; mostrarLightbox(); };

$('lb-ant').addEventListener('click', () => andar(-1));
$('lb-prox').addEventListener('click', () => andar(1));
$('lb-fechar').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); andar(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); andar(-1); }
});
lb.addEventListener('close', () => {
  document.body.classList.remove('travado');
  // devolve o foco para a miniatura que abriu o lightbox
  // (o Chrome já faz isso sozinho com <dialog>; fazemos explícito por garantia)
  if (lbOrigem && document.contains(lbOrigem)) lbOrigem.focus();
});

/* ---------- Publicar ---------- */
const nota = () => document.querySelector('input[name="nota"]:checked')?.value;
function atualizarPublicar() { $('publicar').disabled = !(fotos.length > 0 && nota()); }
document.querySelectorAll('input[name="nota"]').forEach(r => r.addEventListener('change', atualizarPublicar));

$('publicar').addEventListener('click', () => {
  $('resultado').textContent = `Avaliação publicada com nota ${nota()} e ${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}. Capa: ${fotos[0].nome}.`;
});

render();
