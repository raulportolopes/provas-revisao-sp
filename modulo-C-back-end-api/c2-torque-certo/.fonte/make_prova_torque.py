import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
OUT = sys.argv[1]
D = Doc('Test Project/Adapted · Prova de revisão', 'Módulo C – Torque Certo: API da oficina mecânica', 'SPSKILLS_MC_TORQUE_REVISAO_2026')

D.h('Introdução')
D.p('A Torque Certo é uma oficina mecânica da zona sul de São Paulo. As ordens de serviço (OS) são feitas em papel, o estoque de peças é contado no olho e já aconteceu de duas OS usarem a mesma última pastilha de freio.')
D.p('Sua tarefa é construir a API RESTful usada pelo balcão (atendentes), pelos tablets dos mecânicos e pelo dono (admin): clientes e veículos, catálogo de peças, ordens de serviço com orçamento, desconto, aprovação com baixa de estoque, fotos do veículo, lixeira e relatórios.')
D.p('Esta é uma prova de revisão, de 3 a 5 vezes maior que o Módulo C do simulado (EcoSP). O banco vem pronto: o trabalho é todo na API.', 'Tempo sugerido: 4 horas. ')

D.h('Descrição do projeto e tarefas')
D.p('Use Laravel (versão da lista de infraestrutura) com MySQL/MariaDB e Laravel Sanctum (php artisan install:api). Não há telas: tudo é JSON. A API fica em http://servidor/XX_modulo_c/api e todas as rotas abaixo são relativas a esse endereço.')
D.p('Fuso America/Sao_Paulo; datas e horas em ISO 8601 com o fuso (2026-11-10T08:15:00-03:00). Todas as rotas, menos GET / e POST /login, exigem token.')
D.p('Dinheiro: o banco guarda tudo em centavos (inteiros). A API devolve os valores em centavos (campos _cents) e, onde pedido, também formatado como R$ 1.234,56. Nunca some dinheiro em float.')

D.s('Arquivos fornecidos (assets)')
D.tabela([
 ('Arquivo', 'Conteúdo'),
 ('torque_db.sql', 'Cria o banco torque_db com todas as tabelas e os dados. Importe de novo sempre que quiser recomeçar.'),
 ('api-testes/TorqueCerto.postman_collection.json', 'Requisições de exemplo para o Postman ou o Thunder Client (variável base_url).'),
 ('DICAS.md', 'Dicas de Laravel para esta prova.'),
], [0.38, 0.62])

D.h('1. Banco de dados (pronto)')
D.tabela([
 ('Tabela', 'Colunas principais'),
 ('users', 'id, name, email, password, role (admin, atendente ou mecanico)'),
 ('customers', 'id, name, cpf (só números), phone (só números, com DDD), email'),
 ('vehicles', 'id, customer_id, plate (maiúsculas, sem hífen), brand, model, year'),
 ('parts', 'id, sku, name, price_cents, stock_qty, min_stock'),
 ('services', 'id, name, price_cents, minutes (catálogo de mão de obra)'),
 ('service_orders', 'id, number, vehicle_id, mechanic_id, status, complaint, discount_percent, opened_at, delivered_at, deleted_at'),
 ('service_order_items', 'id, service_order_id, part_id OU service_id, quantity, unit_price_cents (preço no momento do orçamento)'),
 ('service_order_photos', 'id, service_order_id, path, thumb_path, original_name'),
 ('service_order_events', 'id, service_order_id, from_status, to_status, user_id, created_at (histórico)'),
], [0.27, 0.73])
D.p('O estoque de parts já está baixado para as OS que estão aprovadas ou depois disso. Usuários: admin@torque.test, atendente@torque.test, joao@torque.test e pedro@torque.test (mecânicos), todos com a senha Torque@2026.')

D.h('2. Regras gerais')
D.i(0, '• Toda resposta é JSON, inclusive erros (chave message). Validação: 422 com {"message": "Dados inválidos.", "errors": {...}} com todos os campos com problema.')
D.i(0, '• Sem token: 401 (mesmo sem o cabeçalho Accept). Perfil sem permissão: 403. Inexistente: 404. Ação impossível no estado atual: 409.')
D.i(0, '• Listas paginadas: 10 por página, com {"data": [...], "meta": {"current_page", "last_page", "per_page", "total"}}.')
D.i(0, '• Permissões por perfil (no servidor, não só na tela):')
D.tabela([
 ('Ação', 'admin', 'atendente', 'mecanico'),
 ('Listar clientes, peças e OS; ver OS', 'sim', 'sim', 'só as OS dele'),
 ('Cadastrar cliente e veículo; abrir OS; itens; desconto; estoque baixo', 'sim', 'sim', '403'),
 ('Mudar situação da OS', 'todas', 'todas, menos concluir', 'só concluir a própria'),
 ('Excluir, lixeira, restaurar; faturamento', 'sim', '403', '403'),
], [0.52, 0.14, 0.17, 0.17])

D.h('3. Autenticação')
D.p('POST /login {email, password}: 200 com token e user (id, name, email, role); senha errada 401. POST /logout: apaga o token atual, 204. GET /me: dados do usuário logado.')

D.h('4. Clientes, veículos e peças')
D.s('4.1 GET /customers?search=')
D.p('Em ordem de nome, com os veículos de cada cliente. search procura em parte do nome, no começo do CPF (com ou sem máscara) e na placa (com ou sem hífen, maiúscula ou minúscula). CPF e telefone saem com máscara: 123.456.789-09 e (11) 98765-4321 ou (11) 3322-4455.')
D.s('4.2 POST /customers')
D.p('name (mín. 3), cpf (dígitos verificadores válidos, não pode ser todos iguais, único), phone (com DDD: 10 ou 11 números) e email (opcional). CPF e telefone com ou sem máscara; grave só os números. 201 com o cliente.')
D.s('4.3 POST /customers/{id}/vehicles')
D.p('plate, brand, model e year. A placa é normalizada (maiúscula, sem hífen e espaços) e precisa ser do formato antigo (ABC1234) ou Mercosul (ABC1D23), e única. year entre 1950 e o ano que vem. Cliente inexistente: 404. 201 com o veículo.')
D.s('4.4 GET /parts?search=&low_stock=1&sort=')
D.p('search em nome ou SKU; low_stock=1 só as peças com stock_qty abaixo de min_stock; sort: name (padrão), -name, price, -price, stock, -stock (outro valor: 422). Cada peça: id, sku, name, price_cents, price_formatted, stock_qty, min_stock e low_stock (true/false).')

D.h('5. Ordens de serviço')
D.s('5.1 POST /orders {vehicle_id, complaint}')
D.p('Cria a OS com status aberta, opened_at agora e número OS-AAAA-NNNN: ano atual e sequência dentro do ano (o maior número do ano + 1, contando também as OS na lixeira). Grava o primeiro evento do histórico. 201 com o detalhe.')
D.s('5.2 GET /orders/{id}: detalhe')
D.code('{"id": 23, "number": "OS-2026-0003", "status": "orcada", "status_label": "Orçada",\n "opened_at": "2026-11-11T09:00:00-03:00", "delivered_at": null,\n "vehicle": {"id": 5, "plate": "HJK2C89", "model": "Hyundai HB20"}, "customer": {"id": 4, "name": "Danilo Prates"},\n "mechanic": null, "complaint": "Freio fazendo barulho",\n "items": [{"id": 62, "type": "part", "item_id": 5, "description": "Pastilha de freio dianteira (jogo)",\n            "quantity": 3, "unit_price_cents": 18900, "total_cents": 56700}],\n "totals": {"parts_cents": 63680, "services_cents": 15000, "subtotal_cents": 78680, "discount_percent": 0,\n            "discount_cents": 0, "total_cents": 78680, "total_formatted": "R$ 786,80"},\n "photos": [], "history": [{"from": null, "to": "aberta", "by": "Bianca Atendente", "at": "..."}]}')
D.p('discount_cents = subtotal × percentual ÷ 100, arredondado no centavo (meio para cima). total = subtotal − desconto.')
D.s('5.3 Itens: POST /orders/{id}/items e DELETE /orders/{id}/items/{item}')
D.p('Corpo: {"type": "part" ou "service", "item_id": 5, "quantity": 2}. Peça de 1 a 99; serviço só quantidade 1. O preço do catálogo é copiado para unit_price_cents. A mesma peça de novo soma na linha existente; o mesmo serviço de novo dá 409. Itens só mudam com a OS aberta (409). Apagar um item que não é daquela OS: 404. Adicionar: 201 com o detalhe; apagar: 204.')
D.s('5.4 PATCH /orders/{id}/discount {percent}')
D.p('De 0 a 20, com no máximo uma casa decimal (acima de 20: 422). Atendente pode dar até 10% (acima: 403); admin até 20%. Só com a OS aberta ou orçada (409). 200 com o detalhe.')
D.s('5.5 POST /orders/{id}/transition {to, mechanic_id}')
D.tabela([
 ('De', 'Pode ir para', 'Regras'),
 ('aberta', 'orcada, cancelada', 'Para orçar, a OS precisa ter pelo menos um item (409).'),
 ('orcada', 'aberta, aprovada, cancelada', 'Aprovar baixa o estoque das peças. Confira TODAS antes: se faltar qualquer uma, 409 com missing [{sku, name, needed, available}] e nenhuma quantidade muda. Duas aprovações ao mesmo tempo não podem usar a mesma peça.'),
 ('aprovada', 'em_execucao, cancelada', 'em_execucao exige mechanic_id de um usuário mecânico (422). Cancelar devolve as peças ao estoque.'),
 ('em_execucao', 'concluida', 'Só o mecânico responsável ou o admin (403).'),
 ('concluida', 'entregue', 'Grava delivered_at.'),
 ('entregue, cancelada', '(nenhum)', 'Situações finais.'),
], [0.18, 0.25, 0.57])
D.p('Transição fora da tabela: 409 {"message": "Transição inválida: aberta → entregue.", "allowed": ["orcada", "cancelada"]}. Situação desconhecida: 422. Toda mudança grava um evento com quem fez. 200 com o detalhe.')
D.s('5.6 GET /orders')
D.p('Filtros: status, search (número, placa ou nome do cliente), from e to (AAAA-MM-DD, pela data de abertura, incluindo o dia inteiro; to antes de from: 422). sort: -opened_at (padrão), opened_at, total, -total (total com desconto). Cada item: id, number, status, status_label, opened_at, delivered_at, vehicle, customer, mechanic, total_cents e total_formatted. O mecânico só vê as OS em que é o responsável e recebe 403 ao abrir a de outro.')
D.s('5.7 POST /orders/{id}/photos (multipart, campo photo)')
D.p('JPG ou PNG de verdade (confira o conteúdo, não só a extensão), até 4 MB, com pelo menos 320 × 200 px (senão 422). No máximo 5 fotos por OS (409). Guarde com nome gerado pelo sistema em storage/app/public e gere no servidor uma miniatura JPEG com 320 px de largura e altura proporcional (biblioteca GD). Resposta 201: {"id", "url", "thumb_url", "thumb_width", "thumb_height"}. As URLs precisam abrir no navegador (php artisan storage:link).')
D.s('5.8 Lixeira')
D.i(0, '• DELETE /orders/{id}: exclusão lógica (deleted_at), só OS aberta ou cancelada (409), 204. A OS some das consultas (404).')
D.i(0, '• GET /orders/trash: as OS excluídas (id, number, status, plate, deleted_at).')
D.i(0, '• POST /orders/{id}/restore: 200 com o detalhe; OS que não está na lixeira 409; inexistente 404.')

D.h('6. Relatórios')
D.s('6.1 GET /reports/revenue?year=AAAA (só admin)')
D.p('Os 12 meses do ano (inclusive os sem movimento) com month (AAAA-MM), orders (OS entregues no mês, pela data de entrega), revenue_cents (soma dos totais com desconto), revenue_formatted e average_ticket_cents (média arredondada), e um bloco totals. Ano inválido: 422.')
D.s('6.2 GET /reports/low-stock')
D.p('Peças com stock_qty abaixo de min_stock, da mais crítica (menor estoque ÷ mínimo) para a menos crítica, com suggested_purchase = 2 × min_stock − stock_qty.')

D.h('Instruções para o competidor')
D.i(0, '1. Importe o torque_db.sql e configure o .env com DB_DATABASE=torque_db.')
D.i(0, '2. Rode php artisan install:api e php artisan storage:link. Não use migrate:fresh.')
D.i(0, '3. Deixe o fuso America/Sao_Paulo.')
D.i(0, '4. Escreva o README.md com a instalação e os usuários de teste.')
D.i(0, '5. A qualidade do código também é avaliada: regras em um só lugar, dinheiro em centavos e nenhum código morto.')
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
