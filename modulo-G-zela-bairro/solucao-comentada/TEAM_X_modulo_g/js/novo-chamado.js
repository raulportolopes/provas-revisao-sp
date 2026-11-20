/*
 * novo-chamado.js – Pacote P3: modal "Abrir chamado"
 * ---------------------------------------------------
 * - validação ao vivo com as MESMAS regras da API (para o 422 quase nunca aparecer)
 * - local no mapa por clique ou teclado (setas)
 * - foto com prévia (FileReader), arrastar e soltar, trocar e remover
 * - envio em multipart (FormData) e tela de sucesso com o protocolo
 */
const modalNovo = document.getElementById('modal-novo');
const formNovo = document.getElementById('form-novo');
const miniMapa = document.getElementById('mini-mapa');
const pinoNovo = document.getElementById('pino-novo');
const inputFoto = document.getElementById('n-foto');
let local = null;      // { x, y } em porcentagem
let fotoEscolhida = null;

/* Regras de validação: uma função por campo, devolve a mensagem ou ''. */
const REGRAS = {
  titulo: (v) => (v.trim().length < 5 || v.trim().length > 80 ? 'O título deve ter entre 5 e 80 caracteres.' : ''),
  categoria_id: (v) => (!v ? 'Escolha uma categoria válida.' : ''),
  descricao: (v) => (v.trim().length < 15 ? 'Descreva o problema com pelo menos 15 caracteres.' : ''),
  rua: (v) => (!v.trim() ? 'Informe a rua ou o ponto de referência.' : ''),
};

function mostrarErro(campo, mensagem) {
  const el = document.getElementById(`e-${campo}`);
  if (el) el.textContent = mensagem;
  const input = formNovo.elements[campo] || (campo === 'local' ? miniMapa : null);
  if (!input) return;
  if (mensagem) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function validarCampo(nome) {
  const msg = REGRAS[nome](formNovo.elements[nome].value);
  mostrarErro(nome, msg);
  return !msg;
}

/* "Ao vivo": valida ao sair do campo e, depois que o campo já mostrou
 * erro uma vez, a cada tecla (assim o erro some assim que corrige). */
Object.keys(REGRAS).forEach((nome) => {
  const el = formNovo.elements[nome];
  el.addEventListener('blur', () => validarCampo(nome));
  el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) validarCampo(nome); });
  el.addEventListener('change', () => validarCampo(nome));
});
formNovo.elements.descricao.addEventListener('input', (e) => {
  document.getElementById('n-contador').textContent = `${e.target.value.length}/400`;
});

/* ---------- Local no mapa ---------- */
function colocarPino(x, y) {
  local = { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  pinoNovo.hidden = false;
  pinoNovo.style.left = local.x + '%';
  pinoNovo.style.top = local.y + '%';
  pinoNovo.classList.remove('pino--cair');
  void pinoNovo.offsetWidth;            // reinicia a animação de "cair"
  pinoNovo.classList.add('pino--cair');
  mostrarErro('local', '');
}
miniMapa.addEventListener('click', (e) => {
  const r = miniMapa.getBoundingClientRect();
  colocarPino(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
});
miniMapa.addEventListener('keydown', (e) => {
  const passo = e.shiftKey ? 5 : 1;
  const mov = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
  if (e.key === 'Enter' && !local) { e.preventDefault(); colocarPino(50, 50); return; }
  if (!mov) return;
  e.preventDefault();
  const base = local || { x: 50, y: 50 };
  colocarPino(base.x + mov[0], base.y + mov[1]);
});

/* ---------- Foto ---------- */
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
function escolherFoto(arquivo) {
  if (!arquivo) return;
  if (!TIPOS.includes(arquivo.type)) { mostrarErro('foto', 'A foto deve ser JPG, PNG ou WEBP.'); return limparFoto(false); }
  if (arquivo.size > 2 * 1024 * 1024) { mostrarErro('foto', 'A foto deve ter no máximo 2 MB.'); return limparFoto(false); }
  mostrarErro('foto', '');
  fotoEscolhida = arquivo;
  const leitor = new FileReader();
  leitor.onload = () => {
    document.getElementById('foto-img').src = leitor.result;
    document.getElementById('foto-nome').textContent = `${arquivo.name} · ${(arquivo.size / 1024).toFixed(0)} KB`;
    document.getElementById('foto-previa').hidden = false;
    document.getElementById('foto-soltar').hidden = true;
  };
  leitor.readAsDataURL(arquivo);
}
function limparFoto(limparErro = true) {
  fotoEscolhida = null;
  inputFoto.value = '';
  document.getElementById('foto-previa').hidden = true;
  document.getElementById('foto-soltar').hidden = false;
  if (limparErro) mostrarErro('foto', '');
}
inputFoto.addEventListener('change', () => escolherFoto(inputFoto.files[0]));
document.getElementById('foto-remover').addEventListener('click', () => { limparFoto(); document.getElementById('foto-soltar').focus(); });
const areaFoto = document.getElementById('foto-area');
['dragenter', 'dragover'].forEach((ev) => areaFoto.addEventListener(ev, (e) => { e.preventDefault(); areaFoto.classList.add('foto--sobre'); }));
['dragleave', 'drop'].forEach((ev) => areaFoto.addEventListener(ev, () => areaFoto.classList.remove('foto--sobre')));
areaFoto.addEventListener('drop', (e) => { e.preventDefault(); escolherFoto(e.dataTransfer.files[0]); });
/* A label "escolha um arquivo" precisa funcionar com Enter/Espaço no teclado */
document.getElementById('foto-soltar').tabIndex = 0;
document.getElementById('foto-soltar').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputFoto.click(); }
});

/* ---------- Abrir / resetar ---------- */
function abrirNovoChamado() {
  formNovo.reset();
  formNovo.hidden = false;
  document.getElementById('novo-sucesso').hidden = true;
  document.getElementById('n-contador').textContent = '0/400';
  local = null;
  pinoNovo.hidden = true;
  limparFoto();
  ['titulo', 'categoria_id', 'descricao', 'rua', 'local', 'foto'].forEach((c) => mostrarErro(c, ''));
  const sel = document.getElementById('n-categoria');
  sel.innerHTML = '<option value="">Escolha…</option>' +
    Estado.categorias.map((c) => `<option value="${c.id}">${esc(c.nome)} (prazo ${c.prazo_dias} dias)</option>`).join('');
  abrirModal(modalNovo);
  document.getElementById('n-titulo').focus();
}

/* ---------- Envio ---------- */
formNovo.addEventListener('submit', async (e) => {
  e.preventDefault();
  const okCampos = Object.keys(REGRAS).map(validarCampo).every(Boolean); // valida TODOS, não para no 1º
  if (!local) mostrarErro('local', 'Marque o local no mapa.');
  if (!okCampos || !local) {
    formNovo.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const dados = new FormData(formNovo);
  dados.set('x', local.x.toFixed(1));
  dados.set('y', local.y.toFixed(1));
  if (!fotoEscolhida) dados.delete('foto'); else dados.set('foto', fotoEscolhida); // foto pode ter vindo do arrastar

  const botao = document.getElementById('n-enviar');
  botao.disabled = true;
  botao.textContent = 'Enviando…';
  try {
    const novo = await API.criar(dados);
    trocarChamado(novo);
    Estado.ultimoMovido = novo.id;
    renderTudo();
    formNovo.hidden = true;
    const sucesso = document.getElementById('novo-sucesso');
    document.getElementById('novo-protocolo').textContent = novo.protocolo;
    sucesso.hidden = false;
    sucesso.focus();
  } catch (erro) {
    if (erro.status === 422) {
      // erros do servidor vão para os mesmos lugares dos erros do cliente
      Object.entries(erro.erros).forEach(([campo, msg]) => mostrarErro(campo, msg));
      formNovo.querySelector('[aria-invalid="true"]')?.focus();
    } else {
      toast(erro.message, 'erro');
    }
  } finally {
    botao.disabled = false;
    botao.textContent = 'Enviar chamado';
  }
});

document.getElementById('copiar-protocolo').addEventListener('click', async (e) => {
  await copiar(document.getElementById('novo-protocolo').textContent);
  e.target.textContent = 'Copiado!';
  setTimeout(() => (e.target.textContent = 'Copiar protocolo'), 1500);
});
