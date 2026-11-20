// =====================================================================
// telas/inicio.js – Início: carrossel de destaques, números e próximas sessões.
//
// CARROSSEL – checklist do enunciado:
//  [x] 4 slides (programas com destaque = true, estreia mais recente primeiro)
//  [x] troca sozinho a cada 6 s, com barra de progresso do slide
//  [x] pausa com mouse em cima OU foco dentro; botão Pausar/Continuar
//  [x] anterior/próximo em loop (do último volta ao primeiro)
//  [x] bolinhas (uma por slide) com aria-current na atual
//  [x] setas ← → do teclado quando o foco está no carrossel
//  [x] arrastar com o dedo/mouse (pointer events, 50 px)
//  [x] slides escondidos ficam inert (Tab não entra neles)
//  [x] prefers-reduced-motion: não troca sozinho
// =====================================================================
import { dados, todasSessoes } from '../api.js';
import { agora, isoDia, dataBR, diaSemana, reais, esc, plural, menosMovimento, CLASSIF } from '../util.js';
import { escalonar } from '../efeitos.js';

export const titulo = 'Início';
const INTERVALO = 6000;

export function montar(main) {
  const destaques = dados.programas.filter(p => p.destaque)
    .sort((a, b) => b.estreia.localeCompare(a.estreia));   // AAAA-MM-DD ordena como texto

  const futuras = todasSessoes().filter(s => s.inicio > agora()).sort((a, b) => a.inicio - b.inicio);
  const hoje = isoDia(agora());
  const emCartaz = new Set(futuras.map(s => s.programa_id)).size;
  const livresHoje = futuras.filter(s => s.data === hoje).reduce((soma, s) => soma + s.livres, 0);
  // Ocupação da semana para o gráfico de rosca (conic-gradient usa --pct)
  const capacidade = futuras.reduce((soma, s) => soma + s.sala.capacidade, 0);
  const vendidos = capacidade - futuras.reduce((soma, s) => soma + s.livres, 0);
  const pctOcupacao = capacidade ? Math.round((vendidos / capacidade) * 100) : 0;

  main.innerHTML = `
    <section class="carrossel" aria-roledescription="carrossel" aria-label="Destaques da semana" tabindex="0">
      <div class="carrossel__trilho">
        ${destaques.map((p, i) => `
          <article class="carrossel__slide" aria-roledescription="slide" aria-label="${i + 1} de ${destaques.length}" data-i="${i}">
            <img src="${p.imagem_destaque}" alt="" class="carrossel__img">
            <div class="carrossel__texto">
              <p class="rotulo">${esc(p.genero)} · ${CLASSIF[p.classificacao].texto}</p>
              <h2>${esc(p.titulo)}</h2>
              <p>${esc(p.sinopse)}</p>
              <a class="botao brilho" href="#/programacao?busca=${encodeURIComponent(p.titulo)}">Ver sessões</a>
            </div>
          </article>`).join('')}
      </div>
      <div class="carrossel__controles">
        <button type="button" class="carrossel__seta" data-ir="-1" aria-label="Slide anterior">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button>
        <div class="carrossel__pontos">
          ${destaques.map((p, i) => `<button type="button" class="carrossel__ponto" data-ponto="${i}" aria-label="Ir para o slide ${i + 1}: ${esc(p.titulo)}"><span></span></button>`).join('')}
        </div>
        <button type="button" class="carrossel__seta" data-ir="1" aria-label="Próximo slide">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>
        <button type="button" class="carrossel__pausa" aria-label="Pausar troca automática">
          <svg class="ic-pausa" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>
          <svg class="ic-play" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>
        </button>
      </div>
      <p class="sr-only" aria-live="polite" id="carrossel-anuncio"></p>
    </section>

    <section class="numeros" aria-label="O planetário em números">
      <div><strong>${emCartaz}</strong><span>programas em cartaz</span></div>
      <div><strong>${futuras.length}</strong><span>sessões nos próximos 7 dias</span></div>
      <div><strong>${livresHoje}</strong><span>lugares livres hoje</span></div>
      <div class="numeros__rosca">
        <span class="rosca" style="--pct:${pctOcupacao}" role="img" aria-label="Ocupação da semana: ${pctOcupacao}% dos lugares vendidos"><b>${pctOcupacao}%</b></span>
        <span>da semana já vendida</span>
      </div>
    </section>

    <section class="secao">
      <div class="secao__topo">
        <h1 class="secao__titulo">Próximas sessões</h1>
        <a class="link-seta" href="#/programacao">Ver programação completa</a>
      </div>
      <div class="lista-proximas" id="lista-proximas">
        ${futuras.slice(0, 3).map(s => `
          <article class="proxima">
            <img src="${s.programa.imagem}" alt="" width="96" height="120" loading="lazy">
            <div>
              <p class="proxima__quando"><time datetime="${s.data}T${s.hora}">${diaSemana(s.data)}, ${dataBR(s.data)} · ${s.hora}</time></p>
              <h2 class="proxima__titulo">${esc(s.programa.titulo)}</h2>
              <p class="proxima__info">${esc(s.sala.nome)} · ${s.livres ? plural(s.livres, 'lugar livre', 'lugares livres') : 'Esgotada'} · a partir de ${reais(s.preco_inteira / 2)}</p>
            </div>
            ${s.livres ? `<a class="botao botao--pequeno" href="#/sessao/${s.id}">Escolher lugares</a>`
                       : '<span class="selo selo--esgotada">Esgotada</span>'}
          </article>`).join('')}
      </div>
    </section>`;

  escalonar(main.querySelector('#lista-proximas'));
  return { limpar: carrossel(main.querySelector('.carrossel'), destaques) };
}

function carrossel(raiz, destaques) {
  const slides = [...raiz.querySelectorAll('.carrossel__slide')];
  const pontos = [...raiz.querySelectorAll('.carrossel__ponto')];
  const btnPausa = raiz.querySelector('.carrossel__pausa');
  const anuncio = raiz.querySelector('#carrossel-anuncio');
  let atual = 0, timer = null;
  let pausadoPeloUsuario = menosMovimento();   // reduzir movimento = começa pausado
  let pausadoPorHover = false;

  function mostrar(i, anunciar = false) {
    atual = (i + slides.length) % slides.length;           // loop nos dois sentidos
    slides.forEach((s, k) => {
      const sim = k === atual;
      s.classList.toggle('carrossel__slide--atual', sim);
      s.inert = !sim;                                       // Tab não entra em slide escondido
    });
    pontos.forEach((p, k) => {
      if (k === atual) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
    });
    // Reinicia a barra de progresso do ponto atual (o CSS anima de 0 a 100%)
    raiz.style.setProperty('--intervalo', `${INTERVALO}ms`);
    pontos[atual].classList.remove('carrossel__ponto--correndo'); void pontos[atual].offsetWidth;
    pontos[atual].classList.add('carrossel__ponto--correndo');
    if (anunciar) anuncio.textContent = `Slide ${atual + 1} de ${slides.length}: ${destaques[atual].titulo}`;
    agendar();
  }
  function agendar() {
    clearTimeout(timer);
    const parado = pausadoPeloUsuario || pausadoPorHover;
    raiz.classList.toggle('carrossel--pausado', parado);
    if (!parado) timer = setTimeout(() => mostrar(atual + 1), INTERVALO);
  }
  function atualizarBotaoPausa() {
    btnPausa.setAttribute('aria-label', pausadoPeloUsuario ? 'Continuar troca automática' : 'Pausar troca automática');
    btnPausa.classList.toggle('carrossel__pausa--parado', pausadoPeloUsuario);
  }

  raiz.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => mostrar(atual + Number(b.dataset.ir), true)));
  pontos.forEach(p => p.addEventListener('click', () => mostrar(Number(p.dataset.ponto), true)));
  btnPausa.addEventListener('click', () => { pausadoPeloUsuario = !pausadoPeloUsuario; atualizarBotaoPausa(); agendar(); });

  // Pausa com mouse em cima ou foco dentro
  raiz.addEventListener('mouseenter', () => { pausadoPorHover = true; agendar(); });
  raiz.addEventListener('mouseleave', () => { pausadoPorHover = raiz.contains(document.activeElement); agendar(); });
  raiz.addEventListener('focusin', () => { pausadoPorHover = true; agendar(); });
  raiz.addEventListener('focusout', e => { if (!raiz.contains(e.relatedTarget)) { pausadoPorHover = raiz.matches(':hover'); agendar(); } });

  raiz.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(atual + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(atual - 1, true); }
  });

  // Arrastar (funciona com dedo e com mouse)
  let xInicio = null;
  const trilho = raiz.querySelector('.carrossel__trilho');
  trilho.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; xInicio = e.clientX; });
  trilho.addEventListener('pointerup', e => {
    if (xInicio === null) return;
    const dx = e.clientX - xInicio; xInicio = null;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1), true);
  });

  atualizarBotaoPausa();
  mostrar(0);
  return () => clearTimeout(timer);   // limpeza ao sair da tela
}
