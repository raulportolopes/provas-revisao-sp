# Módulo E – Órbita: Planetário Paulista (projeto pronto de revisão)

Front-end Funcionalidades em **JavaScript puro** (módulos ES, sem framework). Prova de **4 h / 20 pontos**, bem mais pesada que o Módulo E do simulado Estadual/Jacareí, montada em cima dos pontos fracos do Eduardo: interação de estado (modal com teclado e foco, abas, acordeão, carrossel, paginação, filtros combinados na URL, tema), regras de negócio no cliente, datas sem erro de fuso, efeitos CSS que seguem o cursor, gráficos só com CSS e layout em 375 px.

| Pasta | Para quem | O que tem |
|---|---|---|
| `enunciado/` | competidor | Projeto de teste (docx e pdf) com capa SP Skills |
| `assets/` (e `assets_modulo_e_orbita.zip`) | competidor | api/, img/, fonts/, design/ (prints 1440/768/375, 17 estados, 12 vídeos MP4 + Design.mp4) e DICAS.md (só pistas) |
| `avaliador/` | avaliador | CIS (xlsx, coluna O = nota obtida, Q = evidência) e Guia do avaliador com roteiro e gabarito |
| `solucao/` (e `solucao_modulo_e_orbita.zip`) | revisão | Solução de referência comentada e testada. Comece por `solucao/LEIA-ME-SOLUCAO.md` |
| `.fonte/` | manutenção | Geradores dos dados, ilustrações, prints/vídeos e documentos |

## Rodar a solução
```bash
cd solucao && python3 -m http.server 8000   # http://localhost:8000
```

## Como usar na revisão
1. Eduardo lê o enunciado e tenta 30–40 min de um bloco (ex.: filtros + URL).
2. Abre a solução no mesmo bloco e lê o arquivo indicado no LEIA-ME (os comentários explicam o porquê de cada decisão).
3. Refaz sem olhar e confere pelo Guia do avaliador.

Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.
