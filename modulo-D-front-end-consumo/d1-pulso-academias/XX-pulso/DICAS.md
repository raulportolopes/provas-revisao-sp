# Dicas – Pulso Academias (Módulo D)

Pistas para a prova. Não tem código pronto.

1. **Leia a tabela da API antes de abrir o editor.** Anote quais rotas pedem token e quais códigos de erro cada uma devolve. Metade da ficha é tratar essas respostas.
2. **Uma função só para o fetch.** Se o token, o JSON e o 401 estiverem num lugar só, você nunca esquece.
3. **A API filtra e pagina.** Não filtre o array no navegador: mande os parâmetros e desenhe o `meta` que voltou.
4. **A API demora e responde fora de ordem de propósito.** Pense no que acontece se a resposta do dia anterior chegar depois da resposta do dia atual.
5. **Teste a URL o tempo todo:** depois de cada filtro, dê F5. A tela tem de voltar igual.
6. **Campos que terminam com Z estão em UTC.** Datas sem hora não podem voltar um dia no Windows em horário de Brasília.
7. **Depois de redesenhar a lista, onde está o foco?** Teste o modal só com o teclado, inclusive depois de reservar.
8. **O tema não pode piscar no F5.** Pense em *quando* o seu código de tema roda.
9. **Barra fixa no celular:** se ela aparecer no lugar errado, procure propriedades no elemento pai que mudam a referência do `position: fixed`.
10. **Gráfico sem biblioteca:** a altura de cada barra pode vir do JS numa variável CSS.
11. Para zerar os dados durante o desenvolvimento: `POST api/index.php/reset`. Para testar o token vencido: `POST api/index.php/sessao/expirar` com o token.
