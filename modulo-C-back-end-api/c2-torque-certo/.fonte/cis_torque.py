# CIS da prova de revisão Torque Certo (oficina mecânica, Módulo C – Back-end API).
# Os códigos [C7.4] no requerimento são as linhas do checar-torque.php.
M = lambda d, v, extra=None, req=None, ws=5: ("M", d, extra, req, ws, v, None)
J = lambda d, v, escala, ws=5: ("J", d, None, None, ws, v, escala)

SUB = [
 ("C1", "Entrega, autenticação e perfis", [
   M("A API responde em http://servidor/XX_modulo_c/api; rota inexistente 404 em JSON", 0.25, "[C1.1] [C1.2]", ws=1),
   M("README.md com instalação (.env, importar SQL, install:api, storage:link) e os usuários", 0.25, "Tudo ou nada", ws=2),
   M("Sem token 401 em JSON (nunca 302); login com senha errada 401; /me com o perfil; logout invalida o token", 0.50, "[C1.3] [C1.4] [C1.5] [C1.6]. Descontar 0,25 por item"),
   M("Permissão por perfil no servidor: mecânico 403 em cliente, OS nova, itens, desconto e estoque baixo; só admin exclui e vê faturamento", 0.75, "[C2.3] [C2.6] [C3.5] [C5.2] [C6.8] [C9.1]. Descontar 0,25 por rota liberada indevidamente"),
   J("Organização do código", 1.50, [
     "Regras nos controllers, repetidas, com dinheiro em float.",
     "Controllers por recurso, mas máquina de estados e estoque espalhados em vários if.",
     "Regras da OS em um service; totais em centavos num método só usado pelo detalhe e pelos relatórios; resource para o JSON.",
     "Além do nível 2: middleware de perfil, transação com lockForUpdate no estoque, scopes, preço copiado no item e nenhum código morto."]),
 ]),
 ("C2", "Clientes, veículos e peças", [
   M("Busca de clientes por nome, começo do CPF (com máscara) e placa (com hífen), com os veículos", 0.50, "[C3.1] [C3.2]. Descontar 0,25 por forma de busca"),
   M("Cadastro de cliente: 422 com todos os campos, CPF pelos dígitos verificadores e único, telefone com DDD", 0.50, "[C3.3] [C3.4]"),
   M("CPF e telefone gravados só com números e devolvidos com máscara", 0.25, "[C3.6] [C3.1]"),
   M("Veículo: placa normalizada (maiúscula, sem hífen), formato antigo ou Mercosul, única, ano válido; cliente inexistente 404", 0.75, "[C3.7] [C3.8] [C3.9]"),
   M("Peças: 10 por página, busca por nome ou SKU, low_stock, ordenação (422 se inválida), preço em centavos e formatado", 0.50, "[C4.1] [C4.2] [C4.3] [C4.4] [C4.5]"),
 ]),
 ("C3", "Ordem de serviço e dinheiro", [
   M("Abrir OS: 422 sem dados; 201 com número OS-AAAA-NNNN sequencial no ano e histórico da abertura", 0.75, "[C5.1] [C5.3] [C5.4]. Descontar 0,25 se o número for aleatório ou não contar as OS da lixeira"),
   M("Totais em centavos: peças, serviços, subtotal, desconto arredondado no centavo e total", 1.00, "[C5.5] [C6.7]"),
   M("Valor formatado R$ 1.234,56 (milhar com ponto, decimal com vírgula)", 0.25, "[C5.6]"),
   M("Detalhe com veículo, cliente, itens com descrição, fotos e histórico", 0.25, "[C5.7]"),
 ]),
 ("C4", "Itens e desconto", [
   M("Mesma peça duas vezes vira uma linha com a soma; preço do catálogo copiado para o item", 0.50, "[C6.1]"),
   M("Validação do item: tipo, item existente, serviço só com quantidade 1 (422)", 0.25, "[C6.2]"),
   M("Itens só mudam com a OS aberta (409); item de outra OS pela URL desta dá 404", 0.50, "[C6.3] [C6.4] [C6.5]"),
   M("Desconto: atendente até 10% (403 acima), admin até 20% (422 acima), só antes da aprovação (409)", 1.00, "[C6.6] [C6.7] [C6.8]. Descontar 0,25 por regra"),
 ]),
 ("C5", "Máquina de estados e estoque", [
   M("Transição inválida 409 com allowed; situação desconhecida 422; OS sem itens não é orçada (409)", 0.50, "[C7.1] [C7.2] [C7.3] [C7.13]"),
   M("Aprovar confere TODAS as peças: 409 com missing (sku, needed, available) e nenhum estoque muda", 1.00, "[C7.4] [C7.5]. Descontar 0,50 se baixar parte do estoque antes de recusar"),
   M("Aprovar baixa o estoque; cancelar OS aprovada devolve as peças", 1.00, "[C7.6] [C7.14]"),
   M("Em execução exige mecânico válido (422)", 0.25, "[C7.7] [C7.8]"),
   M("Só o mecânico responsável ou o admin conclui; mecânico não faz outras transições (403)", 0.50, "[C7.9] [C7.10] [C7.11]"),
   M("Entregar grava delivered_at; histórico com de, para, quem e quando", 0.25, "[C7.12] [C7.15]"),
   M("Mecânico só lista e abre as OS dele (403 na de outro)", 0.25, "[C7.16]"),
 ]),
 ("C6", "Fotos com miniatura", [
   M("Upload multipart: só JPG/PNG de verdade, até 4 MB e com tamanho mínimo (422)", 0.50, "[C8.3]"),
   M("Miniatura gerada no servidor com 320 px de largura e altura proporcional", 1.00, "[C8.1]. Zero se a miniatura for a mesma imagem"),
   M("Foto e miniatura acessíveis pela URL devolvida (storage:link), nome gerado pelo sistema", 0.25, "[C8.2]"),
   M("Limite de 5 fotos por OS (409)", 0.25, "[C8.4]"),
 ]),
 ("C7", "Lixeira (exclusão lógica)", [
   M("Excluir: só admin (403), só OS aberta ou cancelada (409), 204 e some da consulta (404)", 0.50, "[C9.1] [C9.2]"),
   M("Lixeira lista as excluídas; restaurar 200, de novo 409, inexistente 404", 0.75, "[C9.3] [C9.4]"),
   M("OS excluída não aparece na lista normal", 0.25, "[C9.5]"),
 ]),
 ("C8", "Lista de OS e relatórios", [
   M("Filtros from/to incluindo o dia inteiro, status e search por número, placa ou cliente; 422 em valores inválidos", 0.75, "[C10.1] [C10.2] [C10.5]"),
   M("Ordenação por total (calculado com desconto) e por abertura; paginação de 10 com meta", 0.50, "[C10.3] [C10.4]"),
   M("Faturamento anual: 12 meses inclusive os zerados, só OS entregues, total com desconto, ticket médio", 1.00, "[C2.1] [C2.2]. Descontar 0,25 se faltar mês zerado"),
   M("Estoque baixo: abaixo do mínimo, mais crítico primeiro, sugestão 2 × mínimo − estoque", 0.25, "[C2.4] [C2.5]"),
 ]),
]

TOTAL = round(sum(a[5] for _, _, asp in SUB for a in asp), 2)

if __name__ == "__main__":
    for s, n, a in SUB:
        print(s, n, round(sum(x[5] for x in a), 2), len(a))
    print("TOTAL", TOTAL)
