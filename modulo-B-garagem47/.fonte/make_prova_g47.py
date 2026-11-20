# Uso: python3 make_prova_g47.py <pasta_prints> <saida.docx>
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
IMG, OUT = sys.argv[1], sys.argv[2]
D = Doc('Test Project/Revisão', 'Módulo B – Garagem 47: ordens de serviço da oficina', 'SPSKILLS_MB_GARAGEM47_REVISAO_2026')

D.h('Introdução')
D.p('A Garagem 47 é uma oficina mecânica de Sorocaba com um balcão de atendimento, dois mecânicos e uma gerente. Hoje as ordens de serviço são folhas de papel presas numa prancheta: o atendente não sabe em que pé está cada carro, o estoque de peças nunca bate e ninguém sabe quanto a oficina faturou no mês.')
D.p('Sua tarefa é construir a intranet da oficina em Laravel (MVC com Blade): cadastro de clientes e veículos, abertura e acompanhamento das ordens de serviço com as situações do fluxo da oficina, lançamento de peças com controle de estoque, fotos do veículo, catálogo de serviços, painel e exportação.')
D.p('Tempo de referência: 4 horas. Projeto de revisão: o nível de dificuldade é maior que o de uma prova real de Módulo B.')

D.h('Visão geral do sistema')
D.tabela([
 ('Elemento', 'Descrição'),
 ('Usuários', 'Equipe da oficina, com cargo atendente, mecanico ou gerente. Usuário inativo não entra.'),
 ('Clientes e veículos', 'Cada cliente tem um ou mais veículos. O CPF e a placa são únicos.'),
 ('Ordens de serviço', 'Abertas para um veículo. Têm serviços do catálogo, peças do estoque, fotos, um mecânico responsável e uma situação que muda ao longo do atendimento.'),
 ('Serviços', 'Catálogo com preço. O preço é guardado na ordem no momento em que o serviço entra nela.'),
 ('Peças', 'Estoque já cadastrado no banco. Lançar peça numa ordem baixa o estoque.'),
], [0.25, 0.75])

D.h('1. Banco de dados')
D.p('Junto da prova é fornecido o arquivo garagem47_db.sql, com o banco completo, normalizado e no padrão do Laravel (tabelas em inglês, chaves estrangeiras com nome tabela_id), já com dados de teste e com a tabela sessions. Importe o arquivo num banco chamado XX_modulo_b (XX = seu número). Não é necessário criar migrations, e as tabelas fornecidas não podem ser alteradas.')
D.tabela([
 ('Tabela', 'Colunas principais'),
 ('users', 'id, name, email, password (bcrypt), role (atendente, mecanico, gerente), active'),
 ('customers', 'id, name, cpf (11 dígitos, sem máscara), phone (só dígitos), email (opcional)'),
 ('vehicles', 'id, customer_id → customers (ON DELETE CASCADE), plate (7 caracteres, maiúsculas, sem hífen), brand, model, year'),
 ('services', 'id, name (único), price, active'),
 ('parts', 'id, sku, name, price, stock'),
 ('work_orders', 'id, code (OS-AAAA-NNNN), vehicle_id, mechanic_id → users (opcional), created_by → users, status, km, complaint, opened_at, due_date, finished_at, delivered_at, cancel_reason'),
 ('service_work_order', 'work_order_id, service_id, price (preço do serviço quando entrou na ordem)'),
 ('part_work_order', 'id, work_order_id, part_id, quantity, unit_price (preço da peça quando foi lançada); par ordem + peça é único'),
 ('work_order_status_logs', 'id, work_order_id, user_id, from_status, to_status, note, created_at'),
 ('work_order_photos', 'id, work_order_id, user_id (quem enviou), path, original_name'),
], [0.27, 0.73])
D.p('Leia as chaves estrangeiras do arquivo SQL: elas indicam o que acontece com os registros relacionados quando algo é apagado.')

D.h('2. Autenticação')
D.i(0, '• Tela de login na rota /login, com e-mail e senha conferidos com a tabela users (senhas em bcrypt).')
D.i(0, '• E-mail ou senha errados: o usuário continua no login, vê a mensagem "E-mail ou senha incorretos." e o e-mail digitado continua no campo.')
D.i(0, '• Usuário com active = 0 não entra e vê a mensagem "Usuário inativo. Procure a gerência."')
D.i(0, '• Todas as rotas, exceto /login, exigem login. Quem não está logado é redirecionado para /login.')
D.i(0, '• Depois do login, o usuário vai para o painel (/), que mostra o nome e o cargo dele. O botão Sair encerra a sessão (por POST) e volta ao login.')

D.h('3. Permissões')
D.p('As permissões devem ser verificadas no servidor. Um usuário que acessar diretamente uma rota que o cargo dele não permite recebe uma página com o status HTTP 403. Além disso, links e botões de ações não permitidas não devem aparecer. Registro inexistente responde 404. As páginas 403 e 404 devem ser próprias, em português, dentro do layout do sistema e com um link de volta.')
D.tabela([
 ('Ação', 'Atendente', 'Mecânico', 'Gerente'),
 ('Clientes e veículos (tudo)', 'Sim', 'Não', 'Sim'),
 ('Ver ordens', 'Todas', 'Só as atribuídas a ele', 'Todas'),
 ('Abrir e editar ordem', 'Sim', 'Não', 'Sim'),
 ('Mudar situação', 'Ver tabela da seção 6', 'Ver tabela da seção 6', 'Ver tabela da seção 6'),
 ('Lançar e retirar peças', 'Não', 'Só nas ordens dele', 'Sim'),
 ('Enviar fotos', 'Sim', 'Só nas ordens dele', 'Sim'),
 ('Apagar foto', 'Só as que ele enviou', 'Só as que ele enviou', 'Todas'),
 ('Apagar ordem', 'Não', 'Não', 'Só ordem cancelada'),
 ('Catálogo de serviços', 'Não', 'Não', 'Sim'),
 ('Exportar CSV', 'Não', 'Não', 'Sim'),
], [0.34, 0.22, 0.22, 0.22])
D.p('Para o mecânico, a regra "só as atribuídas a ele" vale em todos os lugares: listagem, painel, detalhes (403 na ordem de outro mecânico) e ações.')

D.h('4. Painel (/)')
D.i(0, '• Número de ordens em cada situação (cada número é um link para a listagem já filtrada) e número de ordens atrasadas (link para a listagem com o filtro de atrasadas).')
D.i(0, '• Somente para o gerente: faturado no mês corrente (soma do total das ordens entregues no mês) e ticket médio (faturado ÷ número de ordens entregues no mês).')
D.i(0, '• Menu com links para Ordens, Clientes e Serviços, conforme o cargo, e o botão Sair.')

D.h('5. Ordens de serviço')
D.s('5.1 Listagem (/ordens)')
D.p('Tabela com: código, placa e veículo (marca e modelo), cliente, mecânico (ou "-"), situação, data e hora de abertura, prazo e total da ordem. Total = soma dos preços dos serviços da ordem + soma de quantidade × preço das peças da ordem.')
D.p('Uma ordem está atrasada quando o prazo é anterior à data de hoje e a situação é aberta, em execução ou aguardando peça. Ordem atrasada mostra abaixo do prazo, em vermelho, o texto "Atrasada há N dias" ("Atrasada há 1 dia" no singular). Prazo igual a hoje ainda não é atraso.')
D.p('Filtros, todos por parâmetros na URL (GET), combináveis entre si e mantidos nos campos depois de aplicados:')
D.tabela([
 ('Parâmetro', 'Filtro'),
 ('busca', 'Parte do código da ordem, da placa (aceitar com hífen e em minúsculas) ou do nome do cliente'),
 ('status', 'Uma situação'),
 ('mecanico', 'Id de um mecânico, ou "nenhum" para ordens sem mecânico (não aparece para o mecânico)'),
 ('de, ate', 'Período da data de abertura, inclusivo (a ordem aberta às 18h do dia "até" entra)'),
 ('atrasadas', '1 = só ordens atrasadas'),
 ('ordem', 'prazo (padrão: prazo crescente), recentes (abertura decrescente) ou total (maior total primeiro). Em empate, desempate pelo id na mesma direção.'),
], [0.2, 0.8])
D.p('Paginação de 10 ordens por página, com o texto "Mostrando X–Y de Z" e os links Anterior e Próxima (desabilitados na primeira e na última página). Os links de paginação mantêm todos os filtros e a ordenação. Valores inválidos na URL (situação que não existe, data em outro formato) não podem quebrar a página: são ignorados.')

D.s('5.2 Abrir ordem (/ordens/criar)')
D.tabela([
 ('CAMPO', 'EXIGÊNCIA', 'RESTRIÇÕES'),
 ('vehicle_id', 'Obrigatório', 'Veículo existente que não tenha outra ordem não finalizada (situação diferente de entregue e cancelada). A mensagem de erro deve citar o código da ordem existente.'),
 ('km', 'Obrigatório', 'Inteiro, não pode ser menor que a maior quilometragem já registrada nas ordens daquele veículo. A mensagem deve mostrar a quilometragem registrada (ex.: 132.400 km).'),
 ('complaint', 'Obrigatório', 'Relato do cliente, de 10 a 500 caracteres'),
 ('due_date', 'Obrigatório', 'Prazo de entrega, igual ou posterior a hoje'),
 ('mechanic_id', 'Opcional', 'Usuário com cargo mecanico e ativo'),
 ('services', 'Opcional', 'Caixas de seleção com os serviços ATIVOS do catálogo (nome e preço). Serviço inativo enviado pelo DevTools deve ser recusado.'),
 ('code', 'Automático', 'OS-AAAA-NNNN: ano da abertura e sequência de 4 dígitos que recomeça a cada ano (próxima do banco fornecido: OS-2026-0017)'),
 ('status, opened_at, created_by', 'Automático', 'aberta, data e hora atual, usuário logado'),
], [0.2, 0.15, 0.65])
D.p('Ao salvar, cada serviço marcado é gravado na ordem com o preço atual do catálogo. Mudar o preço de um serviço no catálogo não altera as ordens que já têm esse serviço. A abertura gera a primeira linha do histórico (de "-" para Aberta).')
D.p('Se o formulário tiver erro, nada é gravado, o sistema volta ao formulário com a mensagem de cada problema e mantém o que foi preenchido, inclusive os serviços marcados.')

D.s('5.3 Editar ordem (/ordens/{id}/editar)')
D.i(0, '• Só enquanto a ordem está aberta, em execução ou aguardando peça. Nas outras situações, a rota responde 403.')
D.i(0, '• Campos editáveis: relato, prazo (não pode ser anterior à data de abertura), mecânico e serviços. Veículo e quilometragem não mudam.')
D.i(0, '• O formulário abre preenchido, com os serviços da ordem marcados. Um serviço inativo que já está na ordem continua aparecendo, marcado.')
D.i(0, '• Serviço que já estava na ordem mantém o preço que tinha; serviço novo entra com o preço atual do catálogo.')
D.i(0, '• Ordem em execução ou aguardando peça não pode ficar sem mecânico.')

D.s('5.4 Detalhes (/ordens/{id})')
D.p('Título "Ordem OS-AAAA-NNNN" com a situação; veículo, cliente e telefone do cliente, quilometragem, relato, mecânico, abertura (data, hora e quem abriu), prazo (com o aviso de atraso), datas de conclusão e de entrega ("-" se vazias) e, se cancelada, o motivo. Em seguida: serviços com o preço guardado na ordem e subtotal; peças com quantidade, preço unitário, subtotal da linha e subtotal de peças; TOTAL DA ORDEM; fotos; histórico de situações (data e hora, usuário, de, para, observação).')

D.h('6. Situações da ordem')
D.p('A ordem passa pelas situações abaixo. Qualquer mudança fora desta tabela deve ser recusada: o sistema volta ao detalhe com uma mensagem e nada muda. Se o cargo não pode pedir aquela mudança, a resposta é 403. Os botões de mudança de situação no detalhe mostram só as mudanças que o usuário logado pode fazer naquele momento.')
D.tabela([
 ('Para', 'De', 'Quem pode', 'Regras e efeitos'),
 ('Em execução', 'Aberta ou Aguardando peça', 'Gerente ou o mecânico responsável', 'Exige mecânico definido'),
 ('Aguardando peça', 'Em execução', 'Gerente ou o mecânico responsável', 'Observação obrigatória (qual peça)'),
 ('Concluída', 'Em execução', 'Gerente ou o mecânico responsável', 'Exige pelo menos um serviço. Grava a data e hora de conclusão'),
 ('Entregue', 'Concluída', 'Atendente ou gerente', 'Grava a data e hora de entrega'),
 ('Cancelada', 'Aberta ou Aguardando peça', 'Atendente ou gerente', 'Motivo obrigatório, mínimo de 10 caracteres, exibido no detalhe. As peças lançadas voltam ao estoque (as linhas continuam na ordem como histórico)'),
], [0.15, 0.22, 0.25, 0.38])
D.p('Toda mudança de situação grava uma linha no histórico (work_order_status_logs) com o usuário, a situação anterior, a nova e a observação ou o motivo.')

D.h('7. Peças')
D.i(0, '• No detalhe da ordem, um formulário com a peça (lista das peças com estoque, mostrando preço e estoque) e a quantidade.')
D.i(0, '• Só o mecânico responsável ou o gerente lançam e retiram peças, e só com a ordem em execução ou aguardando peça. Fora disso: 403.')
D.i(0, '• Quantidade maior que o estoque é recusada com a mensagem "Estoque insuficiente para <peça>: disponível N."')
D.i(0, '• Lançar baixa o estoque. A mesma peça lançada de novo na mesma ordem soma na linha existente. O preço unitário é o da peça no momento do primeiro lançamento.')
D.i(0, '• Retirar uma linha devolve a quantidade dela ao estoque.')
D.i(0, '• Uma peça ou foto só pode ser acessada pela URL da sua própria ordem: /ordens/5/pecas/{id de uma peça da ordem 10} responde 404.')

D.h('8. Fotos')
D.i(0, '• Envio de uma ou mais fotos de uma vez no detalhe da ordem, por quem pode ver a ordem, até ela ser entregue ou cancelada.')
D.i(0, '• Só imagens JPG, PNG ou WEBP (o tipo é conferido pelo conteúdo do arquivo, não pela extensão), com até 2 MB cada, e no máximo 6 fotos por ordem.')
D.i(0, '• As fotos ficam acessíveis em http://servidor/XX_modulo_b/storage/... e aparecem em miniatura no detalhe, com quem enviou e quando.')
D.i(0, '• Só quem enviou a foto, ou o gerente, pode apagá-la. Apagar remove o registro e o arquivo.')

D.h('9. Clientes e veículos')
D.s('9.1 Clientes')
D.tabela([
 ('CAMPO', 'EXIGÊNCIA', 'RESTRIÇÕES'),
 ('name', 'Obrigatório', 'De 3 a 100 caracteres'),
 ('cpf', 'Obrigatório', 'Aceitar com ou sem máscara. CPF válido (dígitos verificadores) e único. Gravar só os dígitos; exibir como 000.000.000-00'),
 ('phone', 'Obrigatório', 'Aceitar com ou sem máscara, 10 ou 11 dígitos com DDD. Exibir como (15) 3232-4545 ou (15) 99123-4567'),
 ('email', 'Opcional', 'E-mail válido'),
], [0.2, 0.15, 0.65])
D.i(0, '• Listagem em /clientes em ordem de nome, com CPF, telefone e número de veículos, paginação de 10 e busca por parte do nome ou pelo CPF (com ou sem máscara).')
D.i(0, '• Detalhes com os dados, a lista de veículos (com os botões Nova ordem, Editar e Apagar) e o histórico de ordens do cliente (código, placa, abertura, situação, total).')
D.i(0, '• Apagar pela página de confirmação /clientes/{id}/apagar. Cliente com qualquer ordem de serviço não pode ser apagado (mensagem). Cliente sem ordens é apagado junto com os veículos.')
D.s('9.2 Veículos')
D.tabela([
 ('CAMPO', 'EXIGÊNCIA', 'RESTRIÇÕES'),
 ('plate', 'Obrigatório', 'Padrão antigo (ABC1234) ou Mercosul (ABC1D23); aceitar com hífen e minúsculas; gravar em maiúsculas sem hífen; única'),
 ('brand, model', 'Obrigatório', 'Até 40 e 60 caracteres'),
 ('year', 'Obrigatório', 'Inteiro de 1950 até o ano seguinte ao atual'),
 ('customer_id', 'Automático', 'Cliente da página em que o veículo foi cadastrado (/clientes/{id}/veiculos/criar)'),
], [0.2, 0.15, 0.65])
D.p('Veículo com ordens não pode ser apagado (mensagem).')

D.h('10. Catálogo de serviços (/servicos, só gerente)')
D.i(0, '• Listagem com nome, preço, situação (ativo ou inativo) e em quantas ordens o serviço aparece.')
D.i(0, '• Cadastro e edição: nome único (até 80 caracteres), preço maior que zero com até duas casas (aceitar 1.234,50 e 1234.50) e caixa "Ativo".')
D.i(0, '• Apagar pela página de confirmação. Serviço que aparece em alguma ordem não pode ser apagado: a mensagem sugere desativar.')

D.h('11. Apagar ordem')
D.p('Só o gerente, só ordem cancelada, pela página de confirmação /ordens/{id}/apagar. Apagar a ordem apaga também os serviços, peças, histórico e fotos dela, inclusive os arquivos das fotos.')

D.h('12. Exportação (/ordens/exportar, só gerente)')
D.p('Botão "Exportar CSV" na listagem, que baixa as ordens com os mesmos filtros da tela (sem paginação). Arquivo UTF-8 com BOM, separador ponto e vírgula, colunas Código;Placa;Cliente;Mecânico;Situação;Abertura;Prazo;Total, datas em dd/mm/aaaa e total com vírgula decimal (ex.: 1.234,50).')

D.h('13. Formatos')
D.i(0, '• Todas as datas exibidas em dd/mm/aaaa; data e hora em dd/mm/aaaa hh:mm.')
D.i(0, '• Todos os valores em reais no formato R$ 1.234,56.')
D.i(0, '• Quilometragem com separador de milhar (132.400 km).')
D.i(0, '• Mensagens de validação em português.')

D.h('Instruções para o(a) competidor(a)')
D.i(0, '• O projeto deve abrir em http://000.000.00.00/XX_modulo_b/ (sem /public na URL). Todas as rotas deste documento são relativas a esse caminho.')
D.i(0, '• Laravel com Blade e MySQL/MariaDB, seguindo o padrão MVC. O visual é livre, mas é avaliado (layout e usabilidade). As imagens do anexo são meramente ilustrativas.')
D.i(0, '• Arquivos internos do projeto (.env, app/, storage/logs) não podem abrir pelo navegador.')
D.i(0, '• Inclua um README.md na raiz com os passos de instalação e os usuários de teste.')
D.i(0, '• Materiais: garagem47_db.sql e a pasta fotos-teste/ com imagens válidas e inválidas para testar o upload.')

D.h('Anexo A – Usuários de teste (senha ProvaB2026!)')
D.tabela([
 ('Cargo', 'E-mail', 'Observação'),
 ('gerente', 'gerente.prova@garagem47.com', 'Helena Duarte'),
 ('atendente', 'atendente.prova@garagem47.com', 'Otávio Lins'),
 ('mecanico', 'mecanico.prova@garagem47.com', 'Carlos Menezes'),
 ('mecanico', 'mecanico2.prova@garagem47.com', 'Bruna Siqueira'),
 ('mecanico', 'inativo.prova@garagem47.com', 'Jair Pontes, inativo (não entra)'),
], [0.2, 0.5, 0.3])

D.h('Anexo B – Telas (meramente ilustrativas)')
for f, leg in [('02-ordens.png', 'Listagem de ordens com filtros, atraso e paginação'), ('03-ordem-detalhe.png', 'Detalhe da ordem com situação, peças, fotos e histórico'),
               ('01-painel.png', 'Painel do gerente'), ('05-cliente.png', 'Detalhe do cliente')]:
    D.img(os.path.join(IMG, f), 15.5, leg)
D.save(OUT)
print('ok')
