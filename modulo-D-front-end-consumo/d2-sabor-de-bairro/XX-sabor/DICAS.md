# Dicas – Sabor de Bairro (Módulo D, Vue 3)

Pistas para a prova. Não tem código pronto.

1. **Leia a tabela da API antes de abrir o editor.** Anote os códigos 409, os nomes dos campos do 422 (eles usam ponto: `endereco.cep`) e quais rotas pedem token.
2. **Dinheiro vem em centavos.** Some sempre em centavos e só formate na hora de mostrar. Se aparecer `49.900000001`, a conta foi feita em reais.
3. **Uma função só para o fetch.** Token, JSON, erro e 401 num lugar só.
4. **A URL pode guardar o estado da tela.** Pense em quem manda em quem: o clique muda a URL, ou o clique chama a API? Teste com F5 e com o botão Voltar.
5. **A API demora e responde fora de ordem de propósito.** O que acontece se a resposta de "Pizza" chegar depois da de "Hambúrguer"?
6. **Tudo que é derivado pode ser `computed`.** Preço do prato, subtotal, taxa, desconto, total, "faltam R$ X".
7. **Modal:** depois de fechar, onde está o foco? E se o modal foi aberto pelo F5? E se o botão focado dentro dele sumiu?
8. **Frete grátis:** releia como a taxa de entrega é formada.
9. **Polling:** quando a consulta deve parar? Pense em pelo menos três situações.
10. **Campos que terminam com Z estão em UTC.** Mude o fuso do Windows e veja se a hora muda na tela.
11. **O tema não pode piscar no F5.** Pense em *quando* o seu código de tema roda (módulo é sempre adiado).
12. **Barra fixa no celular:** se ela aparecer no lugar errado, procure propriedades no elemento pai que mudam a referência do `position: fixed`.
13. Para zerar os dados: `POST api/index.php/reset`. Para testar o token vencido: `POST api/index.php/sessao/expirar` com o token. Restaurantes 24 h para testar a qualquer hora: Smash do Bairro, Bowl & Cia, Açaí da Esquina, Pastelaria Madrugada.
