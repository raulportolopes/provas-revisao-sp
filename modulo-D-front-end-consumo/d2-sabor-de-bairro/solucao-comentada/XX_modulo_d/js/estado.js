/*
 * Estado compartilhado do app (sem Pinia: com o global build, um reactive() exportado
 * já é uma "store"). Cada parte salva no localStorage o que precisa sobreviver ao F5.
 */
const { reactive, computed, watch } = Vue;

function lerJSON(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
}

/* ---------------- Sessão ---------------- */
export const sessao = reactive({
  token: localStorage.getItem('sabor.token'),
  usuario: lerJSON('sabor.usuario', null),
  get logado() { return !!this.token; },
  entrar(token, usuario) {
    this.token = token; this.usuario = usuario;
    localStorage.setItem('sabor.token', token);
    localStorage.setItem('sabor.usuario', JSON.stringify(usuario));
  },
  sair() {
    this.token = null; this.usuario = null;
    localStorage.removeItem('sabor.token'); localStorage.removeItem('sabor.usuario');
  },
});

/* ---------------- Toasts (avisos rápidos) ---------------- */
let seqToast = 0;
export const avisos = reactive({
  lista: [],
  mostrar(texto, tipo = 'ok', ms = 4000) {
    const id = ++seqToast;
    this.lista.push({ id, texto, tipo });
    setTimeout(() => this.fechar(id), ms);
  },
  fechar(id) { this.lista = this.lista.filter((t) => t.id !== id); },
});

/* ---------------- Carrinho ----------------
 * Uma linha = item + opções escolhidas + observação. Dois "X-Burger" com pontos de carne
 * diferentes são DUAS linhas; o mesmo item com as mesmas opções soma na quantidade.
 * O carrinho guarda só UM restaurante por vez (regra do enunciado).
 */
const salvo = lerJSON('sabor.carrinho', { restaurante: null, linhas: [] });
export const carrinho = reactive({
  restaurante: salvo.restaurante, // { id, slug, nome, taxa_entrega, pedido_minimo }
  linhas: salvo.linhas,           // { chave, item_id, nome, imagem, opcoes:[{id,nome,preco}], observacao, preco_unitario, quantidade }
  aberto: false,                  // gaveta visível?
});

export const totalItens = computed(() => carrinho.linhas.reduce((s, l) => s + l.quantidade, 0));
export const subtotal = computed(() => carrinho.linhas.reduce((s, l) => s + l.preco_unitario * l.quantidade, 0));
export const faltaMinimo = computed(() =>
  carrinho.restaurante ? Math.max(0, carrinho.restaurante.pedido_minimo - subtotal.value) : 0);

/** Chave estável da linha: ids das opções ORDENADOS (a ordem de clique não importa). */
export const chaveLinha = (itemId, opcoes, obs) =>
  `${itemId}|${opcoes.map((o) => o.id).sort((a, b) => a - b).join(',')}|${obs.trim().toLowerCase()}`;

/** Devolve false se o item é de outro restaurante (a tela pergunta antes de esvaziar). */
export function podeAdicionar(restaurante) {
  return !carrinho.restaurante || carrinho.restaurante.id === restaurante.id || carrinho.linhas.length === 0;
}

export function adicionar(restaurante, linha) {
  if (!podeAdicionar(restaurante)) esvaziar();
  carrinho.restaurante = {
    id: restaurante.id, slug: restaurante.slug, nome: restaurante.nome,
    taxa_entrega: restaurante.taxa_entrega, pedido_minimo: restaurante.pedido_minimo,
  };
  const chave = chaveLinha(linha.item_id, linha.opcoes, linha.observacao);
  const existente = carrinho.linhas.find((l) => l.chave === chave);
  if (existente) existente.quantidade = Math.min(20, existente.quantidade + linha.quantidade);
  else carrinho.linhas.push({ ...linha, chave });
}

export function mudarQuantidade(chave, delta) {
  const l = carrinho.linhas.find((x) => x.chave === chave);
  if (!l) return;
  l.quantidade = Math.min(20, l.quantidade + delta);
  if (l.quantidade <= 0) remover(chave);
}
export function remover(chave) {
  carrinho.linhas = carrinho.linhas.filter((l) => l.chave !== chave);
  if (!carrinho.linhas.length) carrinho.restaurante = null;
}
export function esvaziar() { carrinho.linhas = []; carrinho.restaurante = null; }

// deep: true porque mudar a quantidade de UMA linha também precisa salvar.
watch(() => [carrinho.restaurante, carrinho.linhas], () => {
  localStorage.setItem('sabor.carrinho', JSON.stringify({ restaurante: carrinho.restaurante, linhas: carrinho.linhas }));
}, { deep: true });

// Outra aba mudou o carrinho? Acompanha (evento "storage" só dispara nas OUTRAS abas).
window.addEventListener('storage', (e) => {
  if (e.key !== 'sabor.carrinho') return;
  const novo = lerJSON('sabor.carrinho', { restaurante: null, linhas: [] });
  carrinho.restaurante = novo.restaurante; carrinho.linhas = novo.linhas;
});

/* ---------------- Tema ---------------- */
export const tema = reactive({
  atual: document.documentElement.dataset.tema || 'claro',
  alternar() {
    this.atual = this.atual === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = this.atual;
    localStorage.setItem('sabor.tema', this.atual);
  },
});
