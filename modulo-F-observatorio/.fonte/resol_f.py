# Resolução comentada: ideias-chave por recurso + trechos reais da solução.
# Trecho: (arquivo relativo à solução, texto que marca a 1ª linha, nº de linhas)
R1 = [
 ('Organização do CSS e variáveis', ['css/estilo.css'], [
   'Todas as cores ficam em variáveis no :root. O tema claro só redefine as variáveis em :root[data-tema="claro"]: nenhuma regra de componente muda.',
   'O tema é aplicado por um script pequeno no <head> (js/tema.js), antes do CSS pintar: por isso a página não pisca no tema errado.',
   '@property registra variáveis numéricas (--x, --y, --raio, --angulo, --nota). Só variáveis registradas podem ter transition/animation suaves.'],
   [('css/estilo.css', '@property --raio', 3), ('js/tema.js', '', 8)]),
 ('Cabeçalho de vidro e barra de progresso', ['css/estilo.css'], [
   'Vidro = fundo semitransparente + backdrop-filter: blur().',
   'A barra de progresso não usa JavaScript: animation-timeline: scroll(root) liga a animação à rolagem da página.'],
   [('css/estilo.css', '.cabecalho__progresso', 3)]),
 ('Hero lanterna (efeito que segue o cursor)', ['css/estilo.css', 'js/inicio.js'], [
   'Duas camadas iguais em tamanho: o céu e as constelações. A camada de cima recebe mask-image com radial-gradient centrado em --x/--y.',
   'O JS só escreve --x e --y (posição do mouse dentro do hero). Como --x/--y são @property, a transition faz o círculo “perseguir” o cursor.',
   'Em (hover: none) não há mouse: o círculo fica parado e a animação respirar anima --raio.'],
   [('css/estilo.css', '.hero__constelacoes {', 8), ('js/inicio.js', "hero.addEventListener('pointermove'", 8)]),
 ('Contagem regressiva', ['js/inicio.js'], [
   'A data alvo vem com fuso (2026-12-13T23:00:00-03:00): o resultado é o mesmo em qualquer computador.',
   'Cada número só é reescrito quando muda; nessa hora recebe a classe .mudou, que dispara a animação de subir.'],
   [('js/inicio.js', 'function escrever', 7)]),
 ('Cartão 3D dos planetas', ['index.html', 'css/estilo.css', 'js/inicio.js'], [
   'Estrutura: li (perspective) > button (preserve-3d, gira) > frente e verso (backface-visibility: hidden). O verso já começa com rotateY(180deg).',
   'O hover só gira em (hover: hover). No teclado e no toque o JS alterna aria-pressed e o CSS gira por [aria-pressed="true"]: um único estado para os três jeitos.'],
   [('css/estilo.css', '.planeta__interno {', 8)]),
 ('Gráficos em CSS (barras e rosca)', ['index.html', 'css/estilo.css'], [
   'Cada barra recebe --v (0 a 1) no HTML; a altura é transform: scaleY(var(--v)). O atraso em sequência usa --i.',
   'A rosca é um conic-gradient com as fatias em graus acumulados; um círculo no meio vira o “furo”.',
   'O destaque da legenda usa :has(): .grafico-rosca:has(li:hover) apaga tudo e só o item em hover fica forte.'],
   [('css/estilo.css', '.barra__coluna', 3)]),
 ('Comparador antes/depois', ['index.html', 'css/estilo.css', 'js/inicio.js'], [
   'Um input range transparente por cima de tudo dá mouse, toque e teclado de graça. O JS só copia o valor para --p.',
   'A imagem de cima é cortada com clip-path: inset(0 calc(100% - var(--p)) 0 0).'],
   [('js/inicio.js', 'const comparador', 8)]),
 ('Borda em degradê girando', ['css/estilo.css'], [
   'O fundo do contorno é conic-gradient(from var(--angulo), ...). Como --angulo é @property <angle>, dá para animar de 0deg a 360deg.'],
   [('css/estilo.css', '.chamada {', 3)]),
 ('Agenda: estado único + desenhar()', ['js/agenda.js'], [
   'Um objeto estado guarda mês, tipo, eventos abertos e o evento sendo reservado. Todo clique muda o estado e chama desenhar(): a tela nunca fica fora de sincronia.',
   'Abas ARIA: role tablist/tab/tabpanel, aria-selected, tabindex 0 só na aba ativa; setas, Home e End mudam a aba e o foco.',
   'Acordeão com grid-template-rows 0fr → 1fr anima a altura sem medir nada no JS.'],
   [('js/agenda.js', ".addEventListener('keydown'", 10)]),
 ('Modal de reserva', ['agenda.html', 'js/agenda.js'], [
   '<dialog> + showModal() já dá fundo, Esc e foco preso. Guardamos quem abriu para devolver o foco no close.',
   'Mensagens de erro em português a partir de campo.validity (valueMissing, tooShort, typeMismatch, rangeOverflow).',
   'O protocolo usa a data do evento sem new Date (evita erro de fuso) e as vagas que sobraram.'],
   [('js/agenda.js', "form.addEventListener('submit'", 16)]),
 ('Galeria: tilt e lightbox', ['js/galeria.js', 'css/estilo.css'], [
   'No pointermove calculamos a posição relativa (0 a 1) e escrevemos rotateX/rotateY e a posição do brilho (--gx/--gy).',
   'O lightbox navega com índice circular: (atual + 1) % lista.length, usando só as fotos visíveis no filtro.'],
   [('js/galeria.js', "lb.addEventListener('keydown'", 6)]),
 ('Responsivo, movimento reduzido e Lighthouse', ['css/estilo.css'], [
   'Desktop primeiro, com dois cortes: 1023 px (menu vira botão, grades com 2 colunas) e 767 px (1 coluna).',
   'O menu do celular aparece com clip-path + visibility, que não cria rolagem horizontal (translate cria).',
   'prefers-reduced-motion: durações quase zero e nada infinito; tudo continua visível.',
   'Lighthouse: imagens .webp no tamanho certo com width/height, fontes .woff2 com font-display: swap, contraste AA nos dois temas, labels e alt.'],
   [('css/estilo.css', '@media (prefers-reduced-motion: reduce)', 6)]),
]

R2 = [
 ('Cabeçalho fixo que encolhe', ['css/estilo.css', 'js/comum.js'], [
   'O cabeçalho é position: fixed e o body tem padding-top. Com sticky, encolher o cabeçalho mudava a altura da página e o conteúdo “pulava”.',
   'O JS só coloca .cabecalho--compacto quando scrollY > 40; o CSS anima a altura.',
   'No celular o backdrop-filter é removido: um ancestral com backdrop-filter vira referência do position: fixed e a barra inferior ia parar no topo.'],
   [('css/estilo.css', '.cabecalho--compacto', 4)]),
 ('Palavras do título e vapor', ['index.html', 'css/estilo.css'], [
   'Cada palavra é um span com overflow: hidden e um span interno que sobe de translateY(110%) para 0, com atraso calc(var(--i) * 90ms).',
   'O vapor são 3 paths SVG com stroke-dasharray animado e opacidade, cada um com atraso diferente.'],
   [('css/estilo.css', '.palavra', 3)]),
 ('Botão magnético', ['js/inicio.js', 'css/estilo.css'], [
   'No pointermove: deslocamento = (posição do mouse − centro do botão) × 0,3, escrito em --mx/--my. No pointerleave volta a 0.',
   'O texto interno anda um pouco mais que o botão, o que dá profundidade.'],
   [('js/inicio.js', 'magnetico', 10)]),
 ('Faixa sem fim (marquee)', ['index.html', 'css/estilo.css'], [
   'A lista é duplicada (a cópia com aria-hidden) e o trilho anda de 0 a -50%: quando termina, a cópia está exatamente onde a original começou, sem salto.'],
   [('css/estilo.css', '.faixa__trilho', 3)]),
 ('Cartão do café: nota que conta e barras do perfil', ['js/comum.js', 'css/estilo.css'], [
   'O cartão é gerado do JSON com --alvo (nota) e --v/--i em cada barra.',
   'O número conta sem JS: --n é @property <integer>, vai de 0 a --alvo com transition e aparece por counter-reset + content: counter().',
   'No toque (hover: none) um IntersectionObserver coloca .mostrar quando o cartão aparece.'],
   [('css/estilo.css', '.nota {', 4), ('js/comum.js', 'function cartaoCafe', 14)]),
 ('Linha das etapas na rolagem', ['css/estilo.css'], [
   'animation-timeline: view() liga a animação à passagem da seção pela tela: a linha enche com scaleY de 0 a 1.'],
   [('css/estilo.css', 'animation-timeline: view()', 3)]),
 ('Carrossel com barra de tempo', ['js/inicio.js', 'css/estilo.css'], [
   'O relógio do carrossel é a própria animação CSS do ponto atual: quando ela termina (animationend), o JS passa para o próximo. Pausar = animation-play-state: paused; não existe setInterval para sincronizar.',
   'Hover, foco dentro e o botão pausam. Slides escondidos recebem inert, então o Tab não entra neles.'],
   [('js/inicio.js', 'animationend', 8)]),
 ('Interruptor mensal/anual e CEP', ['js/inicio.js'], [
   'radiogroup: aria-checked e tabindex 0 só no item marcado; setas trocam. O preço some para cima e volta com o novo valor (a troca do texto acontece no meio da animação).',
   'Máscara do CEP: tira tudo que não é dígito, corta em 8 e insere o hífen depois do 5º. O pattern \\d{5}-\\d{3} valida.'],
   [('js/inicio.js', "replace(/\\D/g", 3)]),
 ('Sacola (gaveta), frete e localStorage', ['js/comum.js'], [
   'A sacola é um array {id, qtd} salvo em localStorage; os preços vêm do catálogo. Total e frete são calculados de novo a cada mudança.',
   'Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"}) formata R$ 1.234,56.',
   'A gaveta é um diálogo: ao abrir guarda o elemento com foco, prende o Tab entre o primeiro e o último elemento focável e devolve o foco ao fechar.'],
   [('js/comum.js', 'FRETE', 4)]),
 ('Catálogo: busca sem acento e filtros na URL', ['js/cafes.js'], [
   'normalizar(t) = t.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(): “GARÇA” e “garca” ficam iguais.',
   'Estado {busca, torra, ordem} lido de URLSearchParams ao abrir e gravado com history.replaceState a cada mudança.',
   'Ordenar sempre uma cópia ([...lista].sort) para não estragar a ordem original.'],
   [('js/cafes.js', 'const normalizar', 1)]),
 ('Preparo: abas verticais, cronômetro e calculadora', ['js/preparo.js', 'css/estilo.css'], [
   'Abas verticais usam setas cima/baixo (aria-orientation="vertical").',
   'O anel do cronômetro é conic-gradient até --p (0 a 100%). Cada passo tem de/até em segundos; o passo atual é o que contém o tempo.',
   'Calculadora: g = ml / proporção, com toFixed(1) e vírgula.',
   'FAQ exclusivo sem JS: <details name="faq">. A altura anima com interpolate-size e ::details-content.'],
   [('js/preparo.js', 'function tique', 12)]),
]
