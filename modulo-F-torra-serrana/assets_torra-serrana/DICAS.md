# Dicas – Torrefação Torra Serrana (Módulo F)

Dicas de caminho, não a resposta. Tente primeiro; use a dica quando travar.

## Cabeçalho que encolhe
- Se o cabeçalho ocupa espaço no fluxo da página, encolher ele empurra todo o conteúdo. Como fazer o cabeçalho não ocupar espaço e o conteúdo não ficar escondido?
- No celular, cuidado: algumas propriedades num elemento pai mudam a referência do `position: fixed` dos filhos (teste a barra inferior).

## Hero
- Para uma palavra “subir de dentro de uma linha”, ela precisa de uma janela que esconda o que está fora (overflow) e de um atraso por palavra (uma variável com o índice ajuda).
- Vapor: caminhos SVG com traço; anime a posição e a opacidade.

## Botão magnético
- Distância entre o mouse e o centro do botão × um fator pequeno = deslocamento. Na saída, volte a zero com transição.

## Faixa sem fim
- Se o conteúdo estiver duas vezes seguidas, mover até a metade e recomeçar não dá salto. A cópia não deve ser lida pelo leitor de tela.

## Cartão do café
- Monte o cartão a partir do JSON com uma função que recebe o café e devolve o HTML.
- Um número pode “contar” só com CSS: variável do tipo inteiro registrada + `counter-reset` + `content: counter()`.
- Barras do perfil: largura por `transform` com o valor de 1 a 5 numa variável; atraso pelo índice.
- No celular não há hover: o que mostra o efeito quando o cartão aparece na tela?

## Linha das etapas
- Existe uma linha do tempo de animação que segue a passagem de um elemento pela tela, sem JavaScript.

## Carrossel
- A barra que enche no ponto pode ser a própria marcação do tempo: há um evento que avisa quando uma animação CSS termina.
- Pausar uma animação CSS: `animation-play-state`.
- Slides escondidos não podem receber foco: pesquise o atributo `inert`.

## Clube
- Interruptor = `radiogroup` com dois `radio`. Setas trocam a opção.
- Máscara do CEP: limpe tudo que não é dígito e monte de novo.

## Sacola
- Guarde só id e quantidade; o preço vem do catálogo. Recalcule tudo em uma função.
- Moeda brasileira: `Intl.NumberFormat`.
- Gaveta modal: guarde quem tinha o foco, prenda o Tab e devolva ao fechar.

## Catálogo
- Busca sem acento: `normalize('NFD')` separa a letra do acento.
- Filtros no endereço: `URLSearchParams` + `history.replaceState`.

## Preparo
- Anel do cronômetro: degradê cônico até uma porcentagem.
- Passo atual = o passo cujo intervalo contém o tempo.
- Acordeão exclusivo sem JS: um atributo do `<details>` agrupa vários.
