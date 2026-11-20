# Módulo E – Estúdio Pulso: academia e aulas coletivas (projeto pronto de revisão)

Front-end Funcionalidades com **Vue 3 + Vue Router 4 sem build** (versões globais em `js/vendor/`). Prova de **4 h / 20 pontos**, tema e técnica diferentes do Órbita: estado global reativo, rota filha para o modal, guarda de navegação com login simulado, grade semanal em CSS Grid com aulas sobrepostas, regras de reserva (limite por dia, conflito de horário, prazo de cancelamento, lista de espera), drag and drop com alternativa de teclado, upload com validação, gráficos só com CSS e layout em 375 px.

| Pasta | Para quem | O que tem |
|---|---|---|
| `enunciado/` | competidor | Projeto de teste (docx e pdf) com capa SP Skills |
| `assets/` (e `assets_modulo_e_pulso.zip`) | competidor | api/, img/, fonts/, js/vendor/ (Vue), design/ (prints, 20 estados, 12 vídeos MP4 + Design.mp4), arquivos-teste/ e DICAS.md (só pistas) |
| `avaliador/` | avaliador | CIS (xlsx, coluna O = nota obtida, Q = evidência) e Guia do avaliador com roteiro e gabarito |
| `solucao/` (e `solucao_modulo_e_pulso.zip`) | revisão | Solução de referência comentada e testada. Comece por `solucao/LEIA-ME-SOLUCAO.md` |
| `.fonte/` | manutenção | Geradores dos dados, ilustrações, prints/vídeos e documentos |

## Rodar a solução
```bash
cd solucao && python3 -m http.server 8000   # http://localhost:8000  ·  bia@pulso.com / Pulso2026!
```

## Como usar na revisão
1. Comparar com o Órbita: a mesma ideia (filtros na URL, modal acessível, abas, acordeão) feita em JS puro lá e em Vue aqui.
2. Ler `js/store.js` → `situacao()` antes das telas: é ali que estão as regras de estado.
3. Refazer a grade (CSS Grid de 15 min) do zero e conferir pelo Guia do avaliador.

Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.
