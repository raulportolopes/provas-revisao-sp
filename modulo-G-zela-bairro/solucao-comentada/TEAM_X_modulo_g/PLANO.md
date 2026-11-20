# PLANO – Equipe X – Zela Bairro

Escrito nos 20 minutos de planejamento. Serve de roteiro do pitch.

## Pacotes

| Pacote | Integrante | Arquivos (só ele mexe) | Entrega na integração 1 (1h05) | Entrega final |
|---|---|---|---|---|
| P1 API | Integrante 1 | `api/`, `dados/`, `uploads/.htaccess` | GET categorias, GET chamados, login | todas as rotas do contrato |
| P2 Painel | Integrante 2 | `js/painel.js`, parte "P2" do `css/telas.css` | quadro com filtros lendo `dados/seed/chamados.json` | mover, arrastar, apoio, detalhe |
| P3 Abrir chamado | Integrante 3 | `js/novo-chamado.js`, modal "Abrir chamado" no `index.html` | formulário com validação | mapa, foto, envio, sucesso |
| P4 Mapa e indicadores | Integrante 4 | `js/mapa.js`, `js/indicadores.js`, parte "P4" do `css/telas.css` | pinos no mapa | destaque ligado, gráficos |
| P5 Design e integração | Integrante 5 | `css/tokens.css`, `css/layout.css`, `css/componentes.css`, `js/util.js`, `js/api.js`, `js/app.js` | tokens, cabeçalho, rotas, modal base | tema, 375 px, merge e publicação |

## Combinados

- Estado único: objeto `Estado` em `js/util.js`. Ninguém cria variável global de dados.
- Status: `aberto`, `triagem`, `execucao`, `concluido`, `cancelado` (iguais aos da API).
- Classes: `.status--<status>`, `.badge--cat<id>`, `.pino--<status>`, `.coluna--<status>`.
- Funções expostas: `renderPainel()` (P2), `abrirDetalhe(id, origem)` (P2), `abrirNovoChamado()` (P3), `renderMapa()` e `renderIndicadores()` (P4), `renderTudo()`, `abrirModal()`, `fecharModal()`, `toast()` (P5).
- Toda chamada à API passa por `js/api.js`.
- Integração 1 às 1h05; integração 2 às 1h40. Depois da 2, só correção e teste.

## Pitch (5 min)

1. Integrante 5: problema e proposta (30 s).
2. Integrante 3: morador abre um chamado com foto e local (1 min).
3. Integrante 2: chamado aparece no painel; apoio; filtros na URL (1 min).
4. Integrante 1: login da equipe, mover até concluir; mostrar um 409 no Postman (1 min).
5. Integrante 4: mapa e indicadores mudando (1 min).
6. Integrante 5: tema escuro e celular; fechamento (30 s).
