# Módulo F · Implementação de Design · Observatório Estrela da Serra (revisão)

Projeto pronto de revisão para o Estadual SP Skills 2026 (#17 Tecnologias Web). 3 páginas (Início, Agenda e Galeria; tema escuro/claro), 4 h de referência, 30,00 pontos, de 3 a 5 vezes mais trabalhoso que o Módulo F do simulado de Jacareí.
Elaborado por Raul Porto Lopes (Avaliador).

| Arquivo | Para quem | O que é |
|---|---|---|
| Projeto_Teste_Modulo_F_Observatorio.pdf/.docx | competidor | enunciado (descritivo) com capa SP Skills |
| assets_observatorio/ (e .zip) | competidor | designs PNG 1440/768/375 + estados, textos.txt, 15 vídeos MP4 + Design.mp4, imagens originais, ícones, fontes, dados JSON e DICAS.md |
| solucao-comentada/XX_modulo_f/ (e .zip) | estudo | solução completa e comentada |
| solucao-comentada/Resolucao_Comentada_Modulo_F_Observatorio.pdf | estudo | ideias-chave de cada efeito com trechos da solução e erros comuns |
| Guia_Avaliador_Modulo_F_Observatorio.pdf/.docx | avaliador | roteiro de teste de cada aspecto (mesma numeração da CIS) |
| CIS_Modulo_F_Observatorio.xlsx | avaliador | ficha de avaliação (coluna O = nota obtida, Q = evidência) |
| gabarito-avaliador/checar-observatorio.js | avaliador | 43 verificações automáticas (Node + Playwright) |
| .fonte/ | manutenção | geradores de imagens, vídeos, layouts e documentos |

Solução conferida em 20/11/2026: 43 de 43 verificações automáticas OK, HTML válido, Console sem erros, Lighthouse 96 a 100 (celular).

Para publicar: copie solucao-comentada/XX_modulo_f/ para o Apache (ou rode `python3 -m http.server` na pasta de cima) e abra /XX_modulo_f/. Para rodar o gabarito: `node checar-observatorio.js` com Playwright instalado, ajustando a constante BASE no início do arquivo.
