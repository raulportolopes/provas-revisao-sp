# Módulo D – Front-end consumindo API: dois projetos prontos para revisão

Base: Módulo D do Simulado Estadual 2026 (Jacareí, EcoSP, 15 pt com JSON estático), em versão de 3 a 5 vezes maior. Cada prova vale 30 pontos (4 h sugeridas), traz uma API PHP pronta (token Bearer, paginação no servidor, 401/404/409/422, datas em UTC e atraso aleatório para forçar respostas fora de ordem) e vem completa.

| Pasta | Tema | Tecnologia | O que treina |
|---|---|---|---|
| `d1-pulso-academias/` | Pulso Academias: agenda de aulas | JavaScript puro (módulos ES) | roteador por hash com guarda, abas ARIA com teclado, filtros e paginação no servidor com estado na URL, debounce + AbortController, modal acessível com regras 409/422, acordeão, upload com FormData, gráficos só com CSS, card 3D que segue o cursor, tema sem piscar |
| `d2-sabor-de-bairro/` | Sabor de Bairro: delivery de comida | Vue 3 + Vue Router (global build, sem npm) | URL como fonte da verdade, store reativa do carrinho, computed para preços em centavos, modal de opções com mínimo/máximo, scrollspy, checkout em 3 passos com CEP e cupom, total_esperado e 409, polling que para, estrelas como radiogroup |

Em cada pasta:
- `Projeto_Teste_*.docx/.pdf`: enunciado (capa SP Skills, tabela da API, requisitos e anexos com prints).
- `CIS_*.xlsx`: ficha de correção (30 pontos, coluna O "Nota obtida").
- `Guia_Avaliador_*.docx/.pdf`: roteiro por aspecto, gabarito e erros comuns.
- `XX-<tema>/` e `assets_*.zip`: o que o aluno recebe (API, imagens, fontes, prints de layout e de estados, um MP4 por animação + `Design.mp4`, `DICAS.md` só com pistas).
- `solucao-comentada/XX_modulo_d/` e `solucao_*.zip`: solução pronta e comentada.
- `ESTUDO_GUIADO.md`: os 10 padrões de cada projeto, plano de 4 h e exercícios "refaça sem olhar".
- `gabarito-avaliador/`: script Playwright `checar-*.js` (Pulso 34 testes, Sabor 71 testes; os dois passam 100% com a solução).
- `.fonte/`: geradores (dados, imagens, prints, vídeos, CIS e documentos).

Como rodar: copiar `solucao-comentada/XX_modulo_d/` para o `htdocs` (ou `php -S localhost:8000` dentro da pasta) e abrir no navegador. Contas: `aluno@pulso.com.br` / `Pulso2026!` e `cliente@sabor.com.br` / `Sabor2026!`. Para zerar os dados: `POST api/index.php/reset`.

Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.
