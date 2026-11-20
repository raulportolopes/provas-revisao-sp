# PLANO – Equipe X – Copa Code

Escrito nos 20 minutos de planejamento. Serve de roteiro do pitch.

## Pacotes

| Pacote | Integrante | Arquivos (só ele mexe) | Entrega na integração 1 (1h20) | Entrega final |
|---|---|---|---|---|
| P1 API | Integrante 1 | `api/`, `config.php`, `banco/` | GET schools, GET teams, POST teams (422/409), login | check-in, bracket, placar com avanço, 401/404/405 |
| P2 Inscrição | Integrante 2 | `js/inscricao.js`, bloco "P2" do `css/telas.css` | formulário com 5 jogadores e validação ao vivo | reserva, capitão, prévia, erros do servidor, sucesso |
| P3 Equipes | Integrante 3 | `js/equipes.js`, bloco "P3" do `css/telas.css` | cartões com filtros na URL | acordeão, check-in, excluir com tag, gerar chaveamento |
| P4 Chaveamento | Integrante 4 | `js/chaveamento.js`, bloco "P4" do `css/telas.css` | chave em 4 colunas com conectores (dados de exemplo) | caminho da equipe, campeão, modo telão |
| P5 Base e Partidas | Integrante 5 | `index.html`, `js/api.js`, `js/store.js`, `js/componentes.js`, `js/app.js`, `js/partidas.js`, `css/base.css` | casca (topo, menu, rotas, login), store, modal base, toast | abas por fase, contagem regressiva, placar, 375 px, merge e publicação |

## Combinados

- Vue 3 global (sem build), arquivo local em `js/vendor/`. Cada tela é um objeto `PaginaX` num arquivo próprio, carregado antes do `app.js`.
- Estado único: `store` (reactive) em `js/store.js`. Tela que muda dado chama a API e depois `recarregarEquipes()` ou grava `store.matches` com a resposta.
- Toda chamada passa por `API` em `js/api.js` (erro chega com `.status` e `.errors`).
- Nomes do banco e da API em inglês (`teams`, `players`, `stage`, `score_a`); textos de tela em português.
- Fases: `quarterfinal` → rota `quartas`, `semifinal` → `semis`, `final` → `final` (constante `FASES`).
- Componentes comuns do P5: `<modal-base :aberto titulo @fechar>`, `<selo-equipe :equipe grande>`, `toast(texto, tipo)`.
- Integração 1 às 1h20; integração 2 às 2h00. Depois da 2, só correção e teste.

## Pitch (5 min)

1. Integrante 5: problema e proposta; menu e navegação (30 s).
2. Integrante 2: inscrição da 9.ª equipe com erro e correção (1 min).
3. Integrante 3: login, filtros na URL, check-in da 8.ª, gerar chaveamento (1 min).
4. Integrante 5: lançar placares das quartas; mostrar a contagem regressiva (1 min).
5. Integrante 4: chave atualizando, caminho da equipe, campeã e modo telão (1 min).
6. Integrante 1: Postman mostrando um 422 com `players.2.nickname` e um 409 (30 s).
