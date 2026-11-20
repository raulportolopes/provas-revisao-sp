# Ficha CIS da prova Garagem 47 (Módulo B). Fonte única para CIS e guia do avaliador.
# aspecto: (tipo, descrição, extra/como verificar, requerimento, seção WSOS, máximo, escala J ou None)
# Os códigos [B4.1] etc. são as linhas do checar-garagem47.php.
M = lambda d, v, extra=None, ws=5: ("M", d, extra, None, ws, v, None)
J = lambda d, v, escala, ws=5: ("J", d, None, None, ws, v, escala)
MODULO = 'B'
TITULO = '#17 Tecnologias Web · Módulo B · Garagem 47 – ordens de serviço da oficina (projeto de revisão, Laravel MVC)'

SUB = [
 ("B1", "Entrega, organização e layout", [
   M("O projeto abre em http://servidor/XX_modulo_b/ sem /public na URL e sem erro; a raiz sem login mostra o login", 0.50, "[B1.1] [B1.2] Zero se precisar de /public ou de php artisan serve", ws=1),
   M("README.md na raiz com instalação (.env, banco, storage:link) e os usuários de teste", 0.25, "Tudo ou nada", ws=2),
   M("Arquivos internos protegidos: /XX_modulo_b/.env e /XX_modulo_b/app/... não abrem no navegador", 0.25, "Abrir as duas URLs: 403 ou 404", ws=1),
   M("Páginas de erro 403 e 404 próprias, em português, dentro do layout e com link de volta", 0.25, "Descontar 0,10 por página padrão do Laravel", ws=2),
   J("Organização do código", 1.25, [
     "Regras espalhadas em closures de rota ou num controller gigante; validação e permissão repetidas ou ausentes no servidor.",
     "Controllers por recurso e validação no controller, mas a regra das situações está espalhada (if por cargo e situação em vários lugares).",
     "Form Requests, Policy/Gates para permissão e a máquina de situações em um só lugar (service, model ou enum).",
     "Além do nível 2: transações nas operações de estoque e situação, scopes nomeados, eager loading sem N+1, nomes claros e nenhum código morto."]),
   J("Layout e usabilidade das telas (Blade)", 1.00, [
     "Telas sem estilo ou quebradas; difícil achar as ações; mensagens de erro e sucesso não aparecem.",
     "Layout simples e consistente (menu, títulos, tabelas legíveis); mensagens aparecem.",
     "Além do nível 1: situação com cor própria, atraso destacado, formulários organizados e utilizáveis em 768 px.",
     "Além do nível 2: hierarquia visual clara, foco visível no teclado, labels em todos os campos e nenhuma tela que exija rolagem horizontal em 1280 px."], ws=3),
 ]),
 ("B2", "Autenticação", [
   M("Sem login, /, /ordens, /ordens/1, /clientes, /clientes/1, /servicos e /ordens/criar redirecionam para /login", 0.75, "[B2.1] Descontar 0,10 por rota que não redireciona"),
   M("Senha errada: volta ao login com \"E-mail ou senha incorretos.\" e o e-mail continua preenchido", 0.50, "[B2.2] Descontar 0,25 se o e-mail não ficar preenchido"),
   M("Usuário inativo não entra e vê a mensagem de usuário inativo", 0.50, "[B2.3] Zero se entrar"),
   M("Login correto leva ao painel com o nome e o cargo do usuário", 0.25, "[B2.4]"),
   M("Logout por POST encerra a sessão (depois dele as rotas voltam a pedir login)", 0.50, "[B2.5] Zero se o logout for link GET"),
 ]),
 ("B3", "Controle de acesso", [
   M("403 por cargo no servidor: mecânico em /clientes, /clientes/1, /servicos e /ordens/criar; atendente em /servicos e /servicos/1/editar", 1.00, "[B3.1] Descontar 0,25 por rota que não responde 403"),
   M("Mecânico abre a ordem dele e recebe 403 ao abrir a ordem de outro mecânico", 0.75, "[B3.2] Mecânico Carlos: /ordens/5 abre, /ordens/4 dá 403"),
   M("Mecânico vê na listagem e no painel só as ordens atribuídas a ele", 0.75, "[B3.3] Descontar 0,50 se o painel contar ordens de outros"),
   M("Links e botões escondidos conforme o cargo (menu do mecânico sem Clientes e Serviços; sem Apagar e sem peças em ordem entregue)", 0.75, "[B3.4] [B3.5] Descontar 0,25 por botão que aparece sem permissão"),
   M("Registro inexistente (ordem, cliente, veículo, serviço) responde 404", 0.50, "[B3.6] Descontar 0,25 se der 500"),
   M("Peça ou foto de outra ordem usada na URL (/ordens/5/pecas/{item da 10}) responde 404", 0.50, "[B8.4]"),
   M("Exportação CSV responde 403 para quem não é gerente", 0.25, "[B10.8]"),
 ]),
 ("B4", "Listagem de ordens", [
   M("Colunas: código, placa e veículo, cliente, mecânico (\"-\" se não houver), situação, abertura dd/mm/aaaa hh:mm, prazo dd/mm/aaaa e total em R$", 0.75, "[B4.2] Descontar 0,25 por coluna ausente ou fora do formato"),
   M("Padrão: prazo crescente com desempate pelo id crescente", 0.50, "[B4.1]"),
   M("Ordenar por abertura (mais recente primeiro, desempate id decrescente)", 0.25, "[B4.4]"),
   M("Ordenar por total (maior primeiro), total calculado com serviços e peças", 0.50, "[B4.5] Primeiro da lista: OS-2026-0006 (R$ 679,90)"),
   M("Paginação de 10 com \"Mostrando X–Y de Z\" e Anterior/Próxima desabilitados nas pontas", 0.50, "[B4.3] Descontar 0,25 sem o texto Mostrando"),
   M("Os links de paginação mantêm todos os filtros e a ordenação", 0.50, "Filtrar ordem=recentes, ir à página 2: a ordenação continua. Zero se perder"),
   M("Filtro por situação", 0.25, "[B4.6] aberta = 4 ordens"),
   M("Filtro por mecânico, com a opção \"Sem mecânico\"", 0.50, "[B4.7] Descontar 0,25 sem a opção Sem mecânico"),
   M("Busca única por código, placa (aceita hífen e minúscula) ou nome do cliente, combinável com os outros filtros", 0.75, "[B4.8] [B4.9] Descontar 0,25 por item; zero se a busca \"furar\" os outros filtros (OR sem agrupar)"),
   M("Período de abertura (de/até) inclusivo, com o dia final inteiro", 0.50, "[B4.10] 17/11 a 18/11: 0008, 0009, 0010, 0016"),
   M("\"Só atrasadas\": prazo antes de hoje e situação aberta, em execução ou aguardando peça", 0.50, "[B4.11] Zero se contar concluída ou se o prazo de hoje entrar"),
   M("Ordem atrasada mostra \"Atrasada há N dias\" em vermelho (\"1 dia\" no singular)", 0.25, "[B4.13]"),
   M("Os campos de filtro continuam preenchidos após filtrar; valores inválidos na URL não quebram a página", 0.25, "[B4.12] [B4.14]"),
 ]),
 ("B5", "Clientes e veículos", [
   M("Listagem de clientes em ordem de nome, CPF e telefone com máscara, número de veículos e paginação de 10", 0.50, "Descontar 0,25 por item"),
   M("Busca de cliente por parte do nome ou pelo CPF com ou sem máscara", 0.50, "[B5.1]"),
   M("CPF com dígitos verificadores inválidos é recusado", 0.50, "[B5.2]"),
   M("CPF único, comparado sem máscara; editar o cliente sem mudar o CPF não acusa duplicidade", 0.50, "[B5.3] Descontar 0,25 se a edição acusar o próprio CPF"),
   M("Erro de validação mantém o que foi digitado; edição abre preenchida", 0.50, "[B5.2] [B5.8]"),
   M("Detalhe do cliente: dados, veículos (com Nova ordem, Editar, Apagar) e histórico de ordens com situação e total", 0.50, "Descontar 0,25 sem o histórico"),
   M("Apagar cliente: página de confirmação; com ordens a exclusão é recusada com mensagem e o cliente continua", 0.50, "[B5.9]"),
   M("Cliente sem ordens é apagado junto com os veículos", 0.25, "[B5.10] Cliente 12 / UYT3R02"),
   M("Placa no padrão antigo ou Mercosul, gravada em maiúsculas e sem hífen", 0.50, "[B5.5] [B5.7]"),
   M("Placa única (abc-1234 e ABC1234 são a mesma placa)", 0.25, "[B5.6]"),
   M("Veículo com ordens não pode ser apagado (mensagem)", 0.25, "[B5.11]"),
   M("Ano do veículo entre 1950 e o ano seguinte ao atual", 0.25, "Testar 1949 e o ano atual + 2"),
 ]),
 ("B6", "Abrir e editar ordem", [
   M("Formulário oferece só serviços ativos e mecânicos ativos", 0.25, "[B6.1]"),
   M("Quilometragem não pode ser menor que a última registrada para o veículo (mensagem mostra a km)", 0.50, "[B6.2] DKQ9031: 132.400 km"),
   M("Prazo não pode ser no passado (na edição, não antes da abertura)", 0.50, "[B6.3] Descontar 0,25 por caso"),
   M("Veículo com ordem não finalizada não abre outra; a mensagem cita o código da ordem", 0.75, "[B6.4] Zero sem a regra; descontar 0,25 sem o código"),
   M("Serviço inativo enviado à força (DevTools) é recusado", 0.25, "[B6.5]"),
   M("Código OS-AAAA-NNNN sequencial dentro do ano", 0.75, "[B6.6] Próxima: OS-2026-0017. Descontar 0,50 se usar o id em vez da sequência do ano"),
   M("Abertura, atendente e situação Aberta preenchidos automaticamente; histórico com a linha de abertura", 0.25, "[B6.6]"),
   M("Preço do serviço guardado na ordem: mudar o preço no catálogo não altera ordens já abertas", 0.75, "[B6.7] [B6.8] Zero se o total mudar"),
   M("Na edição, serviço que já estava mantém o preço antigo e serviço novo entra com o preço atual", 0.50, "[B6.9]"),
   M("Edição abre com os serviços marcados; após erro de validação, os checkboxes voltam como foram enviados", 0.50, "[B6.10] [B6.3]"),
   M("Ordem em execução ou aguardando peça não pode ficar sem mecânico", 0.25, "[B6.11]"),
   M("Ordem concluída, entregue ou cancelada não pode ser editada (403)", 0.25, "[B6.12]"),
 ]),
 ("B7", "Situações da ordem", [
   M("Só as transições da tabela do enunciado são aceitas; transição inválida volta com mensagem e nada muda", 1.00, "[B7.6] [B7.8] Descontar 0,25 por transição a mais ou a menos"),
   M("Cargo sem permissão para a transição recebe 403 (atendente inicia; mecânico não responsável; mecânico entrega)", 1.00, "[B7.1] [B7.2] [B7.6] Descontar 0,50 por caso"),
   M("Iniciar a execução exige mecânico definido", 0.50, "[B7.3]"),
   M("\"Aguardando peça\" exige observação", 0.50, "[B7.5]"),
   M("Concluir exige pelo menos um serviço e grava a data e hora de conclusão", 0.50, "[B7.7] Descontar 0,25 por item"),
   M("Entregar grava a data e hora de entrega", 0.25, "[B7.9]"),
   M("Cancelar exige motivo com 10 caracteres ou mais, grava e exibe o motivo", 0.50, "[B7.10] [B7.11]"),
   M("Cancelar devolve ao estoque as peças lançadas na ordem", 0.75, "[B7.12] Óleo 5W30: 40 → 44 ao cancelar a OS-2026-0006"),
   M("Histórico com data e hora, usuário, situação anterior, nova situação e observação", 0.50, "[B7.11] Descontar 0,25 por coluna ausente"),
   M("Na tela aparecem só os botões de situação que o usuário pode usar naquele momento", 0.50, "Conferir com os 4 cargos"),
 ]),
 ("B8", "Peças e estoque", [
   M("Quantidade acima do estoque é recusada com \"Estoque insuficiente ... disponível N\"", 0.75, "[B8.1]"),
   M("Lançar baixa o estoque; a mesma peça lançada de novo soma na mesma linha", 0.75, "[B8.2] Descontar 0,25 se duplicar a linha; zero se der erro 500"),
   M("Só o mecânico responsável ou o gerente lançam e retiram peças, e só em execução ou aguardando peça (403)", 0.50, "[B8.3] [B8.6]"),
   M("Retirar a peça devolve a quantidade ao estoque", 0.50, "[B8.5]"),
   M("Detalhe da ordem com subtotal de serviços, subtotal de peças (quantidade × preço congelado) e total", 0.50, "Descontar 0,25 por subtotal ausente"),
 ]),
 ("B9", "Fotos (upload)", [
   M("Só imagens JPG, PNG ou WEBP pelo conteúdo: .txt renomeado para .jpg e PDF são recusados", 0.50, "[B9.1] [B9.2] Arquivos em assets/fotos-teste"),
   M("Imagem acima de 2 MB é recusada com mensagem", 0.25, "[B9.3]"),
   M("Várias fotos de uma vez; aparecem na ordem e abrem em /XX_modulo_b/storage/...", 0.50, "[B9.4] Descontar 0,25 se aceitar só uma por envio"),
   M("Limite de 6 fotos por ordem", 0.25, "[B9.6]"),
   M("Só quem enviou a foto ou o gerente pode apagá-la (botão escondido e 403 no servidor)", 0.50, "[B9.5]"),
   M("Apagar a foto remove o registro e o arquivo", 0.25, "[B9.7]"),
   M("Apagar a ordem remove a pasta de fotos dela", 0.25, "Conferir storage/app/public/ordens/{id}"),
 ]),
 ("B10", "Catálogo, painel, exclusão e exportação", [
   M("Apagar ordem: só gerente, só ordem cancelada, com página de confirmação", 0.50, "[B10.1] [B10.2]"),
   M("Serviço: preço aceito como 1.234,50; nome único; preço maior que zero; serviço em uso não é apagado (mensagem sugere desativar)", 0.50, "[B10.3] [B10.4] [B10.5] Descontar 0,25 por item"),
   M("Painel com o número de ordens por situação e de atrasadas; faturado do mês e ticket médio só para o gerente", 0.25, "[B10.6]"),
   M("Exportação CSV com BOM, separador ponto e vírgula, datas dd/mm/aaaa e os mesmos filtros da tela", 0.25, "[B10.7]"),
 ]),
]
TOTAL = round(sum(a[5] for _, _, asps in SUB for a in asps), 2)
if __name__ == '__main__':
    for sid, nome, asps in SUB: print(sid, round(sum(a[5] for a in asps), 2), len(asps))
    print('TOTAL', TOTAL, sum(len(a) for _, _, a in SUB))
