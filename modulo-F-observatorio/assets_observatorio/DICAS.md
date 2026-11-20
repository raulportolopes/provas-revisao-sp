# Dicas – Observatório Estrela da Serra (Módulo F)

Dicas de caminho, não a resposta. Tente primeiro; use a dica quando travar.

## Antes de começar
- Monte primeiro as variáveis de cor no `:root` com os dois temas da tabela do enunciado. Se tudo usar variável, o tema claro sai quase de graça.
- O tema tem que ser aplicado **antes** do CSS pintar a página. Pense em onde colocar esse script.
- Faça desktop primeiro, mas abra 375 px de vez em quando para não acumular problemas.

## Hero lanterna
- Pense em duas camadas do mesmo tamanho, uma sobre a outra. Qual propriedade CSS deixa ver só uma parte de uma camada, em forma de círculo?
- O JavaScript não precisa mover nenhum elemento: ele só pode avisar ao CSS onde o mouse está.
- Para o círculo “perseguir” o cursor, a variável precisa ser animável. Pesquise `@property`.

## Contagem regressiva
- Uma data em texto ISO pode carregar o fuso no final. Use isso para não depender do relógio da máquina do avaliador.

## Cartão 3D
- Três peças: quem tem a perspectiva, quem gira e as duas faces. Uma das faces já começa virada.
- Hover, teclado e toque podem ligar o mesmo estado. Um atributo ARIA pode ser esse estado.

## Gráficos
- Uma barra pode ter a altura certa sem calcular pixels: guarde o valor de 0 a 1 numa variável e use transform.
- A rosca é um único fundo com várias cores em “fatias”. Some os percentuais e converta para graus.
- Para apagar as outras fatias quando o mouse está na legenda, existe um seletor que olha “se dentro de mim tem…”.

## Comparador
- Existe um elemento de formulário nativo que já funciona com mouse, toque e setas. Ele pode ficar invisível por cima da imagem.
- Recortar uma imagem sem mudar o tamanho dela: `clip-path`.

## Borda girando
- O ângulo inicial de um degradê cônico pode vir de uma variável. Essa variável precisa ser do tipo ângulo para animar.

## Agenda
- Guarde tudo o que muda num único objeto (estado) e escreva uma função que redesenha a lista a partir dele.
- Leia o padrão de abas do WAI-ARIA (tablist, tab, tabpanel): quem recebe tabindex 0?
- Altura animada sem medir: `grid-template-rows` de `0fr` para `1fr`.
- O elemento `<dialog>` com `showModal()` já resolve fundo, Esc e foco preso. Falta só devolver o foco.
- `campo.validity` diz qual regra falhou; você escolhe a mensagem em português.
- Cuidado com `new Date('2026-12-04')`: em Brasília ela vira dia 3.

## Galeria
- Posição do mouse dentro do cartão de 0 a 1 em X e Y → ângulos de rotação e posição do brilho.
- Navegação circular: o resto da divisão (`%`) volta ao início.

## Qualidade
- Barra de progresso e animações por rolagem: pesquise `animation-timeline`.
- Lighthouse: tamanho real das imagens, formato moderno, `width`/`height`, fontes com `font-display`, contraste nos dois temas.
