import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
OUT = sys.argv[1]
D = Doc('Test Project/Adapted · Prova de revisão', 'Módulo C – HemoSP: API de agendamento de doação de sangue', 'SPSKILLS_MC_HEMOSP_REVISAO_2026')

D.h('Introdução')
D.p('O HemoSP é a rede de coleta de sangue da cidade de São Paulo: um hemocentro e três postos de coleta. Hoje o doador liga para marcar horário, a triagem anota numa planilha e ninguém sabe ao certo quanto sangue de cada tipo há no estoque.')
D.p('Sua tarefa é construir a API RESTful que vai atender o aplicativo do doador e o tablet da equipe de triagem. A API precisa aplicar as regras do Ministério da Saúde para quem pode doar, controlar as vagas de cada horário, registrar o atendimento e gerar os números do estoque e dos relatórios.')
D.p('Esta é uma prova de revisão, de 3 a 5 vezes maior que o Módulo C do simulado (EcoSP). O banco vem pronto: o trabalho é todo na API.', 'Tempo sugerido: 4 horas. ')

D.h('Descrição do projeto e tarefas')
D.p('Use Laravel (versão da lista de infraestrutura) com MySQL/MariaDB e Laravel Sanctum para os tokens (php artisan install:api). Não há telas: tudo é JSON.')
D.p('A API deve ficar acessível em http://servidor/XX_modulo_c/api (XX = seu número). Todas as rotas abaixo são relativas a esse endereço.')
D.p('O fuso horário é America/Sao_Paulo. Toda data e hora devolvida pela API usa o formato ISO 8601 com o fuso, por exemplo 2026-12-01T08:20:00-03:00. Datas sem hora usam AAAA-MM-DD.')

D.s('Arquivos fornecidos (assets)')
D.tabela([
 ('Arquivo', 'Conteúdo'),
 ('hemosp_db.sql', 'Cria o banco hemosp_db com todas as tabelas e os dados. As datas dos doadores e agendamentos são relativas ao dia da importação. Importe de novo sempre que quiser recomeçar.'),
 ('api-testes/HemoSP.postman_collection.json', 'Requisições de exemplo para importar no Postman ou no Thunder Client (variável base_url).'),
 ('DICAS.md', 'Dicas de Laravel para esta prova.'),
], [0.35, 0.65])

D.h('1. Banco de dados (pronto)')
D.p('O banco já está normalizado e segue o padrão do Laravel. Você não precisa criar migrations, só os models e as relações. Não rode migrate:fresh: ele apaga as tabelas fornecidas.')
D.tabela([
 ('Tabela', 'Colunas principais'),
 ('blood_types', 'id, code (A+, A-, B+, B-, AB+, AB-, O+, O-), stock_goal_ml (meta de estoque em ml)'),
 ('centers', 'id, name, neighborhood, address, weekday_opens_at, weekday_closes_at, saturday_opens_at e saturday_closes_at (NULL = não abre sábado), slot_capacity (doadores por horário), active'),
 ('closures', 'id, center_id (NULL = todas as unidades), date, reason: dias sem atendimento (feriados e fechamentos)'),
 ('donors', 'id, name, cpf (só números), email, password, birth_date, sex (M ou F), weight_kg, blood_type_id (pode ser NULL), guardian_document_path'),
 ('appointments', 'id, protocol, donor_id, center_id, starts_at, status, volume_ml, unfit_reason, cancelled_at'),
 ('appointment_events', 'id, appointment_id, from_status, to_status, user_id (NULL = o próprio doador), note, created_at: histórico de cada mudança'),
 ('users', 'id, name, email, password, role (admin ou triagem): equipe'),
], [0.25, 0.75])
D.p('Senhas: doadores Doador@2026 (ex.: ana@doador.test); equipe Hemo@2026 (admin@hemosp.test e triagem@hemosp.test).')

D.h('2. Regras gerais da API')
D.i(0, '• Toda resposta é JSON, inclusive os erros. Erros têm a chave message.')
D.i(0, '• Erros de validação: 422 no formato {"message": "Dados inválidos.", "errors": {"campo": ["mensagem"]}} com TODOS os campos com problema.')
D.i(0, '• Sem token ou token inválido: 401 {"message": "Não autenticado."}, mesmo que a requisição não mande o cabeçalho Accept.')
D.i(0, '• Token de doador nas rotas da equipe, ou da equipe nas rotas do doador: 403.')
D.i(0, '• Recurso ou rota inexistente: 404. Método errado: 405.')
D.i(0, '• Regra de negócio que impede a ação por causa do estado atual (vaga lotada, situação errada, prazo): 409.')
D.i(0, '• Listas paginadas devolvem {"data": [...], "meta": {"current_page", "last_page", "per_page", "total"}}.')

D.h('3. Rotas públicas')
D.s('3.1 GET /blood-stock: estoque')
D.p('Para cada tipo sanguíneo, some o volume (volume_ml) dos agendamentos com status donated cujo starts_at está nos últimos 35 dias (hoje e os 34 dias anteriores), pelo tipo sanguíneo do doador. Compare com a meta:')
D.i(0, '• percent = volume ÷ meta × 100, arredondado com 1 casa decimal.')
D.i(0, '• level: critico se percent < 25; alerta se percent < 50; ok nos outros casos.')
D.i(0, '• Ordem: do percentual mais baixo para o mais alto (empate: código do tipo).')
D.code('[\n  {"blood_type": "AB-", "volume_ml": 0, "goal_ml": 2000, "percent": 0, "level": "critico"},\n  {"blood_type": "O+", "volume_ml": 1299, "goal_ml": 20000, "percent": 6.5, "level": "critico"}\n]')
D.s('3.2 GET /centers: unidades')
D.p('Só as unidades ativas, em ordem de nome. Filtros opcionais: neighborhood (parte do bairro, sem diferenciar maiúsculas) e open_on=AAAA-MM-DD (só as que atendem nesse dia, considerando domingo, sábado e a tabela closures; data inválida dá 422).')
D.code('[{"id": 1, "name": "Hemocentro Paulista", "neighborhood": "Cerqueira César", "address": "...",\n  "slot_capacity": 3, "hours": {"weekdays": "07:00-18:00", "saturday": "08:00-12:00"}}]')
D.s('3.3 GET /centers/{id}/slots?date=AAAA-MM-DD: vagas do dia')
D.i(0, '• Cada horário dura 20 minutos. Os horários começam na abertura e vão de 20 em 20 minutos. O último horário precisa TERMINAR até o fechamento (07:00–18:00 tem 33 horários, de 07:00 a 17:40).')
D.i(0, '• available = slot_capacity menos os agendamentos daquele horário que não estão cancelados.')
D.i(0, '• Se a data for hoje, não mostre horários que já começaram.')
D.i(0, '• Dia fechado (domingo, sábado numa unidade que não abre, data na tabela closures da unidade ou geral): 200 com open false, o motivo em reason e slots vazio.')
D.i(0, '• Unidade inexistente ou inativa: 404. Data ausente, inválida (2026-02-30), passada ou a mais de 90 dias de hoje: 422.')
D.code('{"center_id": 1, "date": "2026-12-01", "open": true, "reason": null, "slots": [\n  {"time": "07:00", "starts_at": "2026-12-01T07:00:00-03:00", "available": 3}, ...]}')

D.h('4. Cadastro e login')
D.s('4.1 POST /register: cadastro do doador')
D.code('{"name": "Maria Lima", "cpf": "529.982.247-25", "email": "maria@email.com", "password": "Senha1234",\n "birth_date": "1990-05-10", "sex": "F", "weight_kg": 64.5, "blood_type": "AB-"}')
D.i(0, '• Todos obrigatórios, menos blood_type (se vier, precisa ser um código da tabela blood_types).')
D.i(0, '• CPF com ou sem máscara, validado pelos dois dígitos verificadores e gravado só com números. CPF e e-mail não podem repetir.')
D.i(0, '• Senha com pelo menos 8 caracteres, com letras e números. Pelo menos 16 anos de idade. weight_kg entre 30 e 300. sex M ou F.')
D.i(0, '• Sucesso: 201 {"token": "...", "donor": {"id", "name"}}.')
D.s('4.2 POST /login, POST /staff/login e POST /logout')
D.p('/login é do doador e /staff/login é da equipe; os dois recebem email e password e devolvem 200 com token (e donor ou user com id, name e role). Senha errada: 401. Os tokens de doador e da equipe têm permissões diferentes (dica: habilidades do Sanctum). /logout apaga o token usado e responde 204.')

D.h('5. Rotas do doador (token de doador)')
D.s('5.1 GET /me: perfil e elegibilidade')
D.p('Devolve id, name, email, cpf (com máscara), sex, age, weight_kg, blood_type (código ou null), guardian_document (true/false) e eligibility com eligible_today, next_eligible_date e reasons.')
D.p('Regras de elegibilidade para doar numa data (todas são verificadas; cada uma que falha entra em reasons com code e message):')
D.tabela([
 ('code', 'Regra'),
 ('AGE_MIN / AGE_MAX', 'Idade, no dia da doação, entre 16 e 69 anos.'),
 ('GUARDIAN_DOCUMENT', 'Quem tem 16 ou 17 anos precisa ter enviado a autorização do responsável.'),
 ('FIRST_DONATION_AGE', 'Quem tem mais de 60 anos só pode doar se já doou antes (status donated).'),
 ('WEIGHT', 'Peso mínimo de 50 kg.'),
 ('INTERVAL', 'Desde a última doação efetivada: pelo menos 60 dias para homens e 90 dias para mulheres.'),
 ('YEARLY_LIMIT', 'Nos 12 meses anteriores (365 dias): no máximo 4 doações para homens e 3 para mulheres.'),
], [0.3, 0.7])
D.p('next_eligible_date é o primeiro dia, a partir de hoje, em que as regras de data (idade mínima, intervalo e limite anual) ficam cumpridas. Se houver motivo que o tempo não resolve (AGE_MAX, FIRST_DONATION_AGE ou WEIGHT), é null.')
D.code('"eligibility": {"eligible_today": false, "next_eligible_date": "2026-12-19",\n  "reasons": [{"code": "INTERVAL", "message": "Intervalo mínimo entre doações não cumprido. Próxima data: 19/12/2026."}]}')
D.s('5.2 POST /me/appointments: agendar')
D.code('{"center_id": 1, "starts_at": "2026-12-01 08:20"}')
D.p('Verifique nesta ordem e pare no primeiro grupo que falhar:')
D.i(0, '1. Formato: center_id de unidade ativa e starts_at no formato AAAA-MM-DD HH:MM. Erro: 422 com errors.')
D.i(0, '2. Horário: no futuro, até 90 dias, dia aberto, dentro do expediente e na grade de 20 minutos. Erro: 422 com errors.starts_at.')
D.i(0, '3. Elegibilidade na data do agendamento: 422 {"message": "Doador inapto para esta data.", "reasons": [...]} com todos os motivos.')
D.i(0, '4. Conflitos: o doador já tem um agendamento scheduled no futuro (409) ou o horário está lotado (409). Duas pessoas pedindo a última vaga ao mesmo tempo não podem passar as duas.')
D.p('Sucesso: 201 com o agendamento. O protocolo tem o formato HEMO-AAAA-NNNNN: ano atual e número sequencial dentro do ano (o maior número do ano + 1).')
D.code('{"id": 121, "protocol": "HEMO-2026-00121", "status": "scheduled", "status_label": "Agendado",\n "starts_at": "2026-12-01T08:20:00-03:00", "ends_at": "2026-12-01T08:40:00-03:00",\n "center": {"id": 1, "name": "Hemocentro Paulista"}, "volume_ml": null, "unfit_reason": null, "cancelled_at": null}')
D.s('5.3 GET /me/appointments?status=&page=')
D.p('Agendamentos do doador, 5 por página, do mais recente para o mais antigo. status filtra (422 se não for uma das seis situações).')
D.s('5.4 DELETE /me/appointments/{id}: cancelar')
D.p('Não apague a linha: mude status para cancelled e grave cancelled_at. Agendamento de outra pessoa: 403. Inexistente: 404. Situação diferente de scheduled: 409. Faltando menos de 2 horas para o horário: 409. Sucesso: 200 com o agendamento.')
D.s('5.5 POST /me/guardian-document: autorização do responsável')
D.p('Multipart com o campo document (PDF, JPG ou PNG, até 2 MB; senão 422). Só para doadores com menos de 18 anos (senão 409). É um documento pessoal: guarde fora da pasta pública, com nome gerado pelo sistema, e grave o caminho em guardian_document_path. Resposta 201.')

D.h('6. Rotas da equipe (token da equipe)')
D.s('6.1 GET /staff/appointments')
D.p('Filtros opcionais: date (AAAA-MM-DD), center_id, status e search (parte do nome do doador ou começo do CPF, com ou sem máscara). Ordenação sort: starts_at (padrão), -starts_at ou donor (nome). 10 por página. Valores inválidos de date, status ou sort: 422. Cada item inclui donor com id, name e cpf com máscara.')
D.s('6.2 PATCH /staff/appointments/{id}/status')
D.p('Corpo: {"status": "...", "volume_ml": 450, "unfit_reason": "...", "blood_type": "O-"}. A situação segue esta máquina de estados:')
D.tabela([
 ('De', 'Pode ir para', 'Regras'),
 ('scheduled', 'attended, no_show, cancelled', 'attended só a partir de 30 min antes do horário; no_show só 30 min depois do horário (senão 409).'),
 ('attended', 'donated, unfit', 'donated exige volume_ml inteiro entre 300 e 500 e, se o doador ainda não tem tipo sanguíneo, blood_type (que passa a ser gravado no doador). unfit exige unfit_reason (mínimo 5 caracteres). Faltando: 422.'),
 ('donated, unfit, no_show, cancelled', '(nenhum)', 'Situações finais.'),
], [0.22, 0.28, 0.5])
D.p('Transição que não está na tabela: 409 {"message": "Transição inválida: donated → attended.", "allowed": []}. Status desconhecido: 422. Toda mudança grava uma linha em appointment_events com quem fez.')
D.s('6.3 GET /staff/appointments/{id}/history')
D.code('{"protocol": "HEMO-2026-00119", "events": [\n  {"from": null, "to": "scheduled", "by": "Doador", "note": "Agendado pelo doador", "at": "..."},\n  {"from": "scheduled", "to": "attended", "by": "Tânia Triagem", "note": null, "at": "..."}]}')
D.s('6.4 GET /staff/appointments/export?date=AAAA-MM-DD')
D.p('Arquivo CSV para abrir no Excel: Content-Type text/csv, download com o nome agendamentos-AAAA-MM-DD.csv, UTF-8 com BOM, separador ponto e vírgula, quebra de linha CRLF e cabeçalho Protocolo;Data;Hora;Doador;CPF;Unidade;Situação. Data dd/mm/aaaa, CPF com máscara e situação em português (Agendado, Compareceu, Doou, Inapto, Faltou, Cancelado). Ordem por horário. Sem date: 422.')
D.s('6.5 GET /staff/reports/monthly?month=AAAA-MM (só admin)')
D.p('Triagem recebe 403. Mês inválido: 422. Uma linha por unidade (todas, inclusive a inativa, em ordem de id) com total, donated, unfit, no_show, cancelled, no_show_rate (faltas ÷ agendamentos não cancelados × 100, 1 casa) e volume_liters (2 casas), e um bloco totals.')

D.h('Instruções para o competidor')
D.i(0, '1. Importe o hemosp_db.sql e configure o .env com DB_DATABASE=hemosp_db.')
D.i(0, '2. Rode php artisan install:api (cria a tabela personal_access_tokens). Não use migrate:fresh.')
D.i(0, '3. Deixe o fuso America/Sao_Paulo (no Laravel 12, direto no config/app.php).')
D.i(0, '4. Escreva o README.md na raiz com os passos de instalação e os usuários de teste.')
D.i(0, '5. A qualidade do código também é avaliada: regras em um só lugar, nomes claros e nenhum código morto.')
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
