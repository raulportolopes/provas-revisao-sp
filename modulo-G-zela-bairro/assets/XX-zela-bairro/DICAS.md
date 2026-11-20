# Dicas – Zela Bairro (Team Challenge)

Dicas de caminho, não de código. Leiam juntos nos 20 minutos de planejamento.

## Planejamento (os 20 minutos que decidem a prova)

1. Leiam o contrato da API **juntos**. Ele é o que deixa cinco pessoas trabalharem ao mesmo tempo sem esperar umas pelas outras.
2. Dividam por pacote (P1 a P5), não por tela. Cada pacote tem seus próprios arquivos: assim ninguém sobrescreve o trabalho do outro.
3. Combinem nomes antes de começar: nome do objeto de estado, nomes dos status, nomes das classes de status e de categoria, nome das funções que cada um expõe (ex.: "P3 chama a função de redesenhar do P2 depois de criar").
4. Marquem dois horários de integração (ex.: na metade e 30 minutos antes do fim). Depois do segundo, ninguém começa coisa nova.
5. Escrevam o PLANO.md já nos 20 minutos. Ele vale ponto e serve de roteiro do pitch.

## P1 (API)

- Um roteador simples: o `.htaccess` manda tudo para um `index.php`, e o PHP decide pela rota e pelo método.
- Escreva a máquina de estados como **tabela** (de → lista de destinos), não como uma escada de `if`.
- Pense na ordem das verificações: quem é você → o chamado existe → os dados são válidos → a transição é permitida.
- Leitura e gravação de arquivo JSON com duas pessoas ao mesmo tempo pode perder dados. Procure por trava de arquivo no manual do PHP.
- Para saber o tipo real de um arquivo enviado, não confie na extensão nem no tipo que o navegador manda.
- O Apache, por padrão, não entrega o cabeçalho `Authorization` ao PHP. Existe uma linha de `.htaccess` para isso.
- Entregue primeiro as rotas GET: o front inteiro depende delas.

## P2 (painel)

- Um único estado e uma única função que redesenha o quadro a partir dele.
- Um listener na área do quadro (delegação de eventos) é melhor que um por botão, porque os cards são recriados.
- Para guardar filtros na URL sem disparar a troca de tela, existe um método do `history` que troca o endereço sem criar entrada nova.
- Arrastar e soltar: a coluna só aceita o card se o evento de "arrastar por cima" for cancelado. Use isso para aceitar ou não.
- `new Date("2026-11-16")` no Brasil pode mostrar o dia anterior. Para exibir a data, talvez nem precise de `Date`.

## P3 (abrir chamado)

- O elemento `<dialog>` com `showModal()` já resolve fundo, Esc e foco preso. O que falta: fechar clicando no fundo e devolver o foco.
- A posição do clique no mapa em porcentagem sai do `getBoundingClientRect()` do mapa.
- Para mandar arquivo junto com os campos, `FormData`. Não defina o `Content-Type` à mão.
- Para a prévia da imagem, procure `FileReader`.
- Mostre os erros do servidor (422) nos mesmos lugares dos erros do cliente.

## P4 (mapa e indicadores)

- Pino posicionado em `%` funciona em qualquer largura da tela.
- Destaque "nos dois sentidos" = uma função `destacar(id)` chamada pelos dois lados.
- Barras: a largura pode vir de uma variável CSS. O atraso de cada barra também.
- Rosca: `conic-gradient` com as porcentagens acumuladas.
- `crypto.randomUUID()` e `navigator.clipboard` **não existem** em `http://` (só em https ou localhost). O servidor da prova é `http://IP`.

## P5 (design e integração)

- Tema: variáveis CSS num seletor do `<html>`; aplique o tema salvo antes de a página pintar.
- No celular, uma barra `position: fixed` dentro de um elemento com `backdrop-filter` (ou `transform`) não fica presa à tela, e sim ao pai.
- O atributo `hidden` perde para `display: flex` de uma classe. Garanta que ele sempre vença.
- Quem fica com P5 faz o merge, publica no servidor e testa o fluxo completo antes do pitch.

## Pitch

- Fluxo de demonstração: morador abre um chamado com foto → aparece no painel e no mapa → equipe entra e move até concluir → indicadores mudam.
- Cada integrante mostra o próprio pacote. Ensaiem uma vez nos últimos 10 minutos.
