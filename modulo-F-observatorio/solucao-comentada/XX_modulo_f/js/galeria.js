/* galeria.js — filtro por categoria + cartão com inclinação 3D (tilt) + lightbox com teclado. */

const estado = { fotos: [], categoria: '', atual: 0 };
const NOMES = { nebulosas: 'Nebulosas', galaxias: 'Galáxias e aglomerados', 'sistema-solar': 'Sistema Solar', paisagens: 'Paisagens' };
const grade = document.getElementById('galeria');
const contador = document.querySelector('.agenda__contador');
const chips = [...document.querySelectorAll('.chip')];
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

fetch('dados/fotos.json')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((dados) => { estado.fotos = dados; desenhar(); })
  .catch(() => { contador.textContent = 'Não foi possível carregar a galeria.'; });

const visiveis = () => estado.fotos.filter((f) => !estado.categoria || f.categoria === estado.categoria);

function desenhar() {
  const fotos = visiveis();
  contador.textContent = `${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`;
  grade.innerHTML = fotos.map((f, i) => `
    <li class="foto" style="--i:${i}">
      <button class="foto__botao" type="button" data-indice="${i}" aria-label="Ampliar: ${f.titulo}">
        <img src="img/${f.arquivo}-mini.jpg" alt="${f.textoAlternativo}" width="800" height="533" loading="lazy">
        <span class="foto__legenda"><strong>${f.titulo}</strong><span>${f.autor} · ${NOMES[f.categoria]}</span></span>
      </button>
    </li>`).join('');
}

chips.forEach((chip) => chip.addEventListener('click', () => {
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  estado.categoria = chip.dataset.categoria;
  desenhar();
}));

// ---------- TILT 3D ----------
// Posição do mouse dentro do cartão vira um número de -0,5 a 0,5 em cada eixo.
// Mouse à direita → gira em Y positivo; mouse em cima → gira em X positivo.
const MAX = 10; // graus
grade.addEventListener('pointermove', (e) => {
  const cartao = e.target.closest('.foto__botao');
  if (!cartao || e.pointerType !== 'mouse' || reduzir) return;
  const caixa = cartao.getBoundingClientRect();
  const px = (e.clientX - caixa.left) / caixa.width;   // 0 a 1
  const py = (e.clientY - caixa.top) / caixa.height;
  cartao.classList.add('inclinando');
  cartao.style.setProperty('--ry', `${((px - 0.5) * 2 * MAX).toFixed(2)}deg`);
  cartao.style.setProperty('--rx', `${((0.5 - py) * 2 * MAX).toFixed(2)}deg`);
  cartao.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
  cartao.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
});
// pointerleave não "borbulha": usamos pointerout e conferimos se saiu de verdade do cartão
grade.addEventListener('pointerout', (e) => {
  const cartao = e.target.closest('.foto__botao');
  if (!cartao || cartao.contains(e.relatedTarget)) return;
  cartao.classList.remove('inclinando');               // a transição longa do CSS faz a volta suave
  cartao.style.setProperty('--rx', '0deg');
  cartao.style.setProperty('--ry', '0deg');
});

// ---------- LIGHTBOX ----------
const lb = document.getElementById('lightbox');
const img = document.getElementById('lb-img');
let quemAbriu = null;

function mostrar(indice) {
  const fotos = visiveis();
  estado.atual = (indice + fotos.length) % fotos.length;   // circular: depois da última vem a primeira
  const f = fotos[estado.atual];
  img.src = `img/${f.arquivo}.jpg`;
  img.alt = f.textoAlternativo;
  img.classList.remove('trocando'); void img.offsetWidth; img.classList.add('trocando');
  document.getElementById('lb-titulo').textContent = f.titulo;
  document.getElementById('lb-texto').textContent = `${f.autor} · ${f.equipamento} · ${dataBR(f.data)}`;
  document.getElementById('lb-contador').textContent = `${estado.atual + 1} de ${fotos.length}`;
}
grade.addEventListener('click', (e) => {
  const cartao = e.target.closest('.foto__botao');
  if (!cartao) return;
  quemAbriu = cartao;
  mostrar(Number(cartao.dataset.indice));
  lb.showModal();
  document.body.classList.add('travado');
  lb.querySelector('.modal__fechar').focus();
});
document.getElementById('lb-ant').addEventListener('click', () => mostrar(estado.atual - 1));
document.getElementById('lb-prox').addEventListener('click', () => mostrar(estado.atual + 1));
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') mostrar(estado.atual + 1);
  if (e.key === 'ArrowLeft') mostrar(estado.atual - 1);
});
lb.querySelector('.modal__fechar').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener('close', () => {
  document.body.classList.remove('travado');
  if (quemAbriu) quemAbriu.focus();
});
