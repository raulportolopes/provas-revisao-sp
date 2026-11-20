# Dicas – Copa Code

Dicas de caminho. Não há código pronto aqui: o objetivo é a equipe não travar.

## Planejamento (20 min, sem computador)

- Leiam o `contrato-api.md` **juntos**, em voz alta. Cada um marca as rotas e os campos que a sua tela usa.
- Dividam por **arquivo**, não por tela inteira com HTML e CSS misturados. Quem cuida da base (casca, rotas, componentes comuns) começa primeiro e entrega cedo.
- Combinem antes: o nome do objeto de estado compartilhado, os nomes das fases nas rotas, o nome das funções que recarregam dados e as classes de cor de situação.
- Enquanto a API não existe, as telas podem usar uma lista de exemplo no mesmo formato do contrato. Troquem pela API na integração 1.
- Escrevam no PLANO.md os horários das duas integrações e quem fala o que no pitch.

## P1 – API

- Importe o `banco/copacode.sql` antes de tudo e confira as chaves estrangeiras: elas dizem o que pode ser apagado.
- Uma consulta para as equipes e **uma** para os jogadores de todas elas (agrupe em PHP). Consulta dentro de laço deixa a lista lenta.
- Idade "no dia do torneio": compare a data de nascimento com 28/11/2026, não com hoje.
- O 422 junta tudo num array antes de responder. Só depois que o formato está certo, confira as regras de 409.
- Gerar chaveamento e lançar placar mexem em várias linhas: pense no que acontece se a segunda gravação falhar.
- Ao criar as partidas, criar da final para as quartas facilita saber o id da "próxima partida".
- Lembre do cabeçalho Authorization no Apache (já viram isso em outra prova).

## P2 – Inscrição

- A lista de jogadores é um array no estado; cada linha precisa de uma chave estável que não seja o índice (a linha do reserva entra e sai).
- Valide com um único `computed` que devolve um objeto `campo => mensagem`, usando as **mesmas chaves** do 422 do servidor. Assim o erro do servidor cai no mesmo lugar do erro do cliente.
- Mostre o erro depois que o campo foi tocado (blur) ou no envio, não enquanto a pessoa ainda nem começou a digitar.
- No envio com erro, o foco vai para o primeiro campo inválido.
- `<input type="date">` devolve `AAAA-MM-DD`. Cuidado com `new Date('AAAA-MM-DD')`: veja o que acontece com o fuso.

## P3 – Equipes

- Filtros que "voltam com F5" moram na URL. Um `computed` com `get` e `set` lendo e escrevendo a query da rota resolve os três filtros com o mesmo código.
- Use `replace` em vez de `push` nos filtros: o botão Voltar não deve desfazer letra por letra.
- Acordeão "um aberto por vez" é um único valor no estado (o id aberto), não um booleano por cartão.
- Animar altura de conteúdo desconhecido: pesquise `grid-template-rows` de `0fr` para `1fr`.

## P4 – Chaveamento

- Agrupe as partidas de cada fase em pares (as duas que alimentam a mesma partida seguinte). O desenho da chave fica fácil com pares.
- Os conectores podem ser pseudo-elementos com borda. Se as colunas tiverem a mesma altura e cada par ocupar o mesmo espaço, os centros se alinham sozinhos.
- O "caminho" de uma equipe é só um id guardado no hover/foco; cada lado da partida decide a própria classe comparando com ele.
- Para animar quem chega numa fase, troque a `key` do elemento quando a equipe muda.
- Fullscreen API: `requestFullscreen()` no elemento e o evento `fullscreenchange` no `document` (o usuário pode sair com Esc).

## P5 – Base e Partidas

- Vue e Vue Router estão em `vendor/` (sem internet). Carregue os scripts na ordem: bibliotecas, base, telas, e por último o que monta o app.
- `createWebHashHistory` funciona em qualquer pasta do Apache.
- Abas por fase podem ser a própria rota (`/partidas/:fase`). Assim F5 e link colado funcionam.
- Padrão ARIA de abas: `role="tablist"`, `role="tab"`, `aria-selected`, `tabindex` e setas ← →.
- Relógio com `setInterval`: crie quando a tela monta e destrua quando ela sai. Teste trocando de tela várias vezes.
- O modal pode ser um `<dialog>` controlado por uma prop. Pense em como devolver o foco a quem abriu.
- Não mova o foco para o `<main>` quando só a query ou a aba mudou: a pessoa perderia o campo onde está digitando.

## Integração e pitch

- Na integração 1, publiquem no servidor e testem de outra máquina: caminhos absolutos aparecem aqui.
- Antes do pitch, rodem o fluxo inteiro a partir do banco recém-importado: inscrever → check-in → gerar → placares → campeã.
