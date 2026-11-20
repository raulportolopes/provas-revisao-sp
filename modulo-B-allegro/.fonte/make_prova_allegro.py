# Uso: python3 make_prova_allegro.py <pasta_prints> <saida.docx>
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
IMG, OUT = sys.argv[1], sys.argv[2]
D = Doc('Test Project/Revisão', 'Módulo B – Allegro: turmas, matrículas e mensalidades', 'SPSKILLS_MB_ALLEGRO_REVISAO_2026')

D.h('Introdução')
D.p('A Allegro é uma escola de música com quatro salas, três professores e cerca de trinta alunos de violão, violino, piano, canto e teclado. A secretaria controla turmas, lista de espera e mensalidades numa planilha: aluno entra em turma lotada, duas turmas caem na mesma sala no mesmo horário e ninguém sabe quanto cada aluno deve com multa e juros.')
D.p('Sua tarefa é construir a intranet da escola em Laravel (MVC com Blade): grade de turmas com controle de conflitos de sala e de professor, cadastro de alunos, matrículas com lista de espera e promoção automática, geração e pagamento de mensalidades com multa e juros, relatório de inadimplência, painel e exportação.')
D.p('Tempo de referência: 4 horas. Projeto de revisão: o nível de dificuldade é maior que o de uma prova real de Módulo B.')

D.h('Visão geral do sistema')
D.tabela([
 ('Elemento', 'Descrição'),
 ('Usuários', 'Equipe da escola, com cargo secretaria, professor ou coordenacao. Usuário inativo não entra.'),
 ('Turmas', 'Um instrumento, um nível, um professor, uma sala, um dia da semana e um horário fixo, com número de vagas e mensalidade.'),
 ('Alunos', 'Cadastro com data de nascimento. Menor de 18 anos precisa de responsável.'),
 ('Matrículas', 'Ligam aluno e turma. Situação ativa, espera (turma cheia) ou cancelada.'),
 ('Mensalidades', 'Geradas quando a matrícula fica ativa, uma por mês até dezembro. A situação (paga, em aberto, vencida) é calculada pela data.'),
], [0.25, 0.75])

D.h('1. Banco de dados')
D.p('Junto da prova é fornecido o arquivo allegro_db.sql, com o banco completo, normalizado e no padrão do Laravel (tabelas em inglês, chaves estrangeiras com nome tabela_id), já com dados de teste e com a tabela sessions. Importe o arquivo num banco chamado XX_modulo_b (XX = seu número). Não é necessário criar migrations, e as tabelas fornecidas não podem ser alteradas.')
D.tabela([
 ('Tabela', 'Colunas principais'),
 ('users', 'id, name, email, password (bcrypt), role (secretaria, professor, coordenacao), active'),
 ('instruments', 'id, name'),
 ('rooms', 'id, name, capacity (lugares na sala)'),
 ('school_classes', 'id, code (único), instrument_id, teacher_id → users, room_id, level (basico, intermediario, avancado), weekday (1 = segunda ... 6 = sábado), start_time, end_time, capacity (vagas), monthly_fee, active'),
 ('students', 'id, name, birth_date, email (opcional, único), phone (só dígitos), guardian_name, guardian_phone'),
 ('enrollments', 'id, student_id, school_class_id, status (ativa, espera, cancelada), enrolled_at (dia em que ficou ativa), waitlisted_at (data e hora em que entrou na espera), cancelled_at'),
 ('invoices', 'id, enrollment_id, reference_month (sempre o dia 1 do mês), due_date, amount, paid_at, paid_amount; par matrícula + mês é único'),
], [0.22, 0.78])
D.p('Leia as chaves estrangeiras do arquivo SQL: elas são ON DELETE RESTRICT e indicam o que pode e o que não pode ser apagado.')

D.h('2. Autenticação')
D.i(0, '• Tela de login na rota /login, com e-mail e senha conferidos com a tabela users (senhas em bcrypt).')
D.i(0, '• E-mail ou senha errados: o usuário continua no login, vê a mensagem "E-mail ou senha incorretos." e o e-mail digitado continua no campo.')
D.i(0, '• Usuário com active = 0 não entra e vê a mensagem "Usuário inativo. Procure a coordenação."')
D.i(0, '• Todas as rotas, exceto /login, exigem login. Quem não está logado é redirecionado para /login.')
D.i(0, '• Depois do login, o usuário vai para o painel (/), que mostra o nome e o cargo dele. O botão Sair encerra a sessão (por POST) e volta ao login.')

D.h('3. Permissões')
D.p('As permissões devem ser verificadas no servidor. Um usuário que acessar diretamente uma rota que o cargo dele não permite recebe uma página com o status HTTP 403. Além disso, links e botões de ações não permitidas não devem aparecer. Registro inexistente responde 404. As páginas 403 e 404 devem ser próprias, em português, dentro do layout do sistema e com um link de volta.')
D.tabela([
 ('Ação', 'Secretaria', 'Professor', 'Coordenação'),
 ('Ver turmas', 'Todas', 'Só as dele, sem valores em R$', 'Todas'),
 ('Cadastrar, editar e apagar turma', 'Não', 'Não', 'Sim'),
 ('Alunos e matrículas (tudo)', 'Sim', 'Não', 'Sim'),
 ('Ver mensalidades e registrar pagamento', 'Sim', 'Não', 'Sim'),
 ('Estornar pagamento', 'Não', 'Não', 'Sim'),
 ('Relatório de inadimplência e exportar CSV', 'Não', 'Não', 'Sim'),
], [0.37, 0.18, 0.25, 0.2])
D.p('Para o professor, a regra "só as dele" vale em todos os lugares: listagem, painel e detalhe (403 na turma de outro professor). Na turma dele, o professor vê os alunos, mas o nome não é link para a ficha do aluno.')

D.h('4. Painel (/)')
D.i(0, '• Secretaria e coordenação: número de alunos com matrícula ativa (cada aluno conta uma vez), turmas ativas, vagas livres (soma das vagas não ocupadas das turmas ativas, link para a listagem "só com vaga"), matrículas na lista de espera e mensalidades vencidas com o valor atualizado total (link para a listagem filtrada).')
D.i(0, '• Somente para a coordenação: "Recebido em mm/aaaa", a soma dos valores pagos com data de pagamento no mês corrente.')
D.i(0, '• Professor: as aulas de hoje (turmas ativas dele no dia da semana atual, em ordem de horário) com horário, turma, instrumento, sala e número de alunos, ou "Nenhuma aula hoje.".')

D.h('5. Turmas')
D.s('5.1 Listagem (/turmas)')
D.p('Tabela com: código (com a marca "Inativa" quando for o caso), instrumento, nível, professor(a), sala, dia e horário no formato "Segunda, 18:00–19:30", alunos ativos/vagas (ex.: 4/4, destacado quando a turma está cheia), número na lista de espera e mensalidade em R$ (coluna que não aparece para o professor). Ordem: dia da semana, horário de início e código.')
D.p('Filtros por GET, combináveis e mantidos nos campos: instrumento, dia, nível, professor(a) (não aparece para o professor) e a caixa "Só com vaga" (turmas ativas com menos alunos ativos que vagas; quem está na espera ou cancelado não ocupa vaga).')
D.s('5.2 Detalhe (/turmas/{id})')
D.p('Instrumento e nível, professor(a), sala com a capacidade, dia e horário, ocupação ("4 de 4 ocupadas", com o aviso "Turma cheia" quando for o caso), mensalidade (não para o professor), a tabela de alunos ativos em ordem de nome (aluno, idade, matriculado em dd/mm/aaaa) e a lista de espera em ordem de chegada (posição, aluno, desde dd/mm/aaaa hh:mm).')
D.s('5.3 Cadastrar e editar (/turmas/criar e /turmas/{id}/editar, só coordenação)')
D.tabela([
 ('CAMPO', 'EXIGÊNCIA', 'RESTRIÇÕES'),
 ('code', 'Obrigatório', 'Até 20 caracteres, só letras, números e hífen, gravado em maiúsculas, único'),
 ('instrument_id, room_id', 'Obrigatório', 'Registros existentes'),
 ('teacher_id', 'Obrigatório', 'Usuário com cargo professor e ativo'),
 ('level', 'Obrigatório', 'basico, intermediario ou avancado (exibir Básico, Intermediário, Avançado)'),
 ('weekday', 'Obrigatório', '1 (segunda) a 6 (sábado)'),
 ('start_time, end_time', 'Obrigatório', 'hh:mm, entre 08:00 e 22:00, término depois do início, aula de 30 minutos a 3 horas'),
 ('capacity', 'Obrigatório', 'Inteiro, no mínimo 1 e no máximo a capacidade da sala ("A <sala> comporta no máximo N alunos."). Na edição, não pode ser menor que o número de alunos ativos'),
 ('monthly_fee', 'Obrigatório', 'Maior que zero, aceitar 1.250,00 e 1250.00'),
 ('active', 'Opcional', 'Caixa "Ativa". Turma com matrícula ativa ou em espera não pode ser desativada'),
], [0.22, 0.14, 0.64])
D.p('Conflitos de grade (só quando a turma salva estiver ativa, e comparando só com outras turmas ativas): dois horários no mesmo dia se sobrepõem quando um começa antes de o outro terminar e termina depois de o outro começar. Horários que só encostam (uma termina às 19:30 e a outra começa às 19:30) NÃO conflitam.')
D.i(0, '• Sala: "<sala> ocupada pela turma <código> (<dia>, <início>–<fim>)."')
D.i(0, '• Professor: "<professor> já dá aula na turma <código> (<dia>, <início>–<fim>)."')
D.i(0, '• Se houver os dois conflitos, as duas mensagens aparecem juntas. Na edição, a turma não conflita com ela mesma.')
D.p('Se o formulário tiver erro, nada é gravado, o sistema volta com a mensagem de cada problema e mantém o que foi preenchido. A edição abre preenchida (horários em hh:mm e mensalidade como 180,00). Mudar a mensalidade de uma turma vale só para as mensalidades geradas depois: as que já existem não mudam.')
D.s('5.4 Apagar (/turmas/{id}/apagar, só coordenação)')
D.p('Página de confirmação. Turma com qualquer matrícula (ativa, em espera ou cancelada) não pode ser apagada: a mensagem sugere desativar a turma.')

D.h('6. Alunos (/alunos)')
D.tabela([
 ('CAMPO', 'EXIGÊNCIA', 'RESTRIÇÕES'),
 ('name', 'Obrigatório', 'De 3 a 100 caracteres'),
 ('birth_date', 'Obrigatório', 'Data válida; o aluno deve ter pelo menos 5 anos'),
 ('email', 'Opcional', 'E-mail válido e único entre os alunos'),
 ('phone', 'Obrigatório', 'Aceitar com ou sem máscara, 10 ou 11 dígitos com DDD; gravar só os dígitos e exibir como (15) 3232-4545 ou (15) 99123-4567'),
 ('guardian_name, guardian_phone', 'Condicional', 'Obrigatórios quando o aluno tem menos de 18 anos na data de hoje. Quem faz 18 anos hoje já é maior de idade'),
], [0.22, 0.14, 0.64])
D.i(0, '• Listagem em ordem de nome, 15 por página com "Mostrando X–Y de Z", com nome, idade (calculada pela data de nascimento completa, não só pelo ano), telefone, turmas ativas e a marca "Em débito".')
D.i(0, '• Filtros por GET, combináveis e mantidos: busca por parte do nome, turma (alunos com matrícula ATIVA na turma) e a caixa "Só em débito" (alunos com mensalidade vencida e não paga). A paginação mantém os filtros.')
D.i(0, '• Detalhe: dados (nascimento dd/mm/aaaa e idade, e-mail, telefones, responsável), matrículas (turma, situação: "Ativa desde dd/mm/aaaa", "Lista de espera · posição N" ou "Cancelada em dd/mm/aaaa", botão Cancelar), o formulário de nova matrícula e as mensalidades do aluno com o botão de pagamento.')
D.i(0, '• Apagar pela página de confirmação /alunos/{id}/apagar. Aluno com qualquer matrícula, mesmo em espera ou cancelada, não pode ser apagado (mensagem).')

D.h('7. Matrículas')
D.s('7.1 Matricular (POST /alunos/{id}/matriculas, no detalhe do aluno)')
D.p('O formulário lista as turmas ativas com a ocupação. Antes de gravar, nesta ordem:')
D.i(0, '1. Turma inativa: "A turma <código> está inativa."')
D.i(0, '2. O aluno já tem matrícula ativa na turma: "O aluno já está matriculado nesta turma." Já está na espera: "O aluno já está na lista de espera desta turma."')
D.i(0, '3. Conflito de horário: o aluno tem matrícula ATIVA em outra turma no mesmo dia com horário sobreposto (mesma regra da seção 5.3): "Conflito de horário com a turma <código> (<dia>, <início>–<fim>)."')
D.p('Passou nas regras: se a turma tem vaga (alunos ativos menos que as vagas), a matrícula fica ativa com enrolled_at = hoje e as mensalidades são geradas (seção 8.1). Se a turma está cheia, a matrícula fica em espera com waitlisted_at = agora, sem mensalidades, e a mensagem mostra a posição: "Turma <código> cheia: o aluno entrou na lista de espera (posição N)." Duas matrículas ao mesmo tempo não podem ocupar a mesma última vaga.')
D.s('7.2 Cancelar (POST /matriculas/{id}/cancelar)')
D.i(0, '• A matrícula fica cancelada com cancelled_at = hoje (a linha não é apagada). Cancelar uma matrícula já cancelada é recusado ("Esta matrícula já está cancelada.").')
D.i(0, '• Mensalidades em aberto que vencem hoje ou depois são apagadas. Mensalidades pagas e vencidas não pagas continuam (histórico e dívida).')
D.i(0, '• Se a matrícula cancelada era ativa, abriu uma vaga: o primeiro da lista de espera (ordem de chegada) que NÃO tem conflito de horário passa a ativo com enrolled_at = hoje e ganha as mensalidades. Quem tem conflito continua na espera, na mesma posição. A mensagem diz quem foi matriculado ("<nome> saiu da lista de espera e foi matriculado(a).").')
D.i(0, '• Cancelar uma matrícula em espera não promove ninguém.')

D.h('8. Mensalidades')
D.s('8.1 Geração')
D.p('Quando a matrícula fica ativa, é gerada uma mensalidade para cada mês, do mês atual até dezembro do ano atual. reference_month é o dia 1 do mês; o vencimento é o dia 10 do mês. Exceção: se o dia 10 do mês atual é hoje ou já passou, a primeira mensalidade vence hoje + 5 dias. O valor é a mensalidade da turma no momento da geração.')
D.s('8.2 Situação e valor atualizado')
D.i(0, '• Paga: tem paid_at. Mostrar "Paga em dd/mm/aaaa · R$ valor pago".')
D.i(0, '• Em aberto: não paga e o vencimento é hoje ou depois.')
D.i(0, '• Vencida: não paga e o vencimento é anterior a hoje. Mostrar "Vencida há N dias" ("1 dia" no singular) e o valor atualizado.')
D.p('Valor atualizado = valor × (1 + 0,02 + 0,01 × dias de atraso ÷ 30), arredondado em centavos (multa de 2% e juros de 1% ao mês proporcionais aos dias). Exemplo: R$ 200,00 pagos 15 dias depois do vencimento = R$ 205,00. Pago no dia do vencimento, não há multa.')
D.s('8.3 Listagem (/mensalidades)')
D.p('Tabela com aluno (link para a ficha), turma, referência mm/aaaa, vencimento dd/mm/aaaa, valor, situação e o botão de pagamento ou de estorno. Ordem: vencimento crescente, desempate pelo id. Filtros por GET, combináveis e mantidos: mês de referência (campo month, aaaa-mm), situação, parte do nome do aluno e turma. Paginação de 15 com "Mostrando X–Y de Z", mantendo os filtros. Acima da tabela, três totais sobre TODAS as mensalidades filtradas (não só a página): recebido (soma do valor pago), em aberto (soma do valor) e vencido (soma do valor atualizado hoje).')
D.s('8.4 Pagamento (POST /mensalidades/{id}/pagar)')
D.i(0, '• O formulário pede só a data do pagamento: obrigatória, não pode ser no futuro ("A data do pagamento não pode ser no futuro.") nem anterior à matrícula ("... anterior à matrícula (dd/mm/aaaa).").')
D.i(0, '• O valor pago é calculado no servidor com a fórmula da seção 8.2 até a data do pagamento. Qualquer valor enviado pelo formulário é ignorado. Mensagem: "Pagamento de R$ X registrado."')
D.i(0, '• Mensalidade já paga não é paga de novo ("Esta mensalidade já está paga.").')
D.i(0, '• Estorno (POST /mensalidades/{id}/estornar, só coordenação): apaga a data e o valor pagos; a situação volta a ser calculada pela data.')

D.h('9. Relatório de inadimplência (/relatorios/inadimplencia, só coordenação)')
D.p('Um aluno por linha, só alunos com mensalidade vencida e não paga: aluno, turmas dessas mensalidades, quantidade de mensalidades vencidas, vencimento mais antigo (dd/mm/aaaa), valor original somado e valor atualizado somado. Ordem: valor atualizado decrescente, desempate pelo nome.')

D.h('10. Exportação (/mensalidades/exportar, só coordenação)')
D.p('Botão "Exportar CSV" na listagem de mensalidades, que baixa as mensalidades com os mesmos filtros da tela (sem paginação). Arquivo UTF-8 com BOM, separador ponto e vírgula, colunas Aluno;Turma;Referência;Vencimento;Valor;Situação;Pago em;Valor pago, referência mm/aaaa, datas dd/mm/aaaa e valores com vírgula decimal (ex.: 1.234,50).')

D.h('11. Formatos')
D.i(0, '• Todas as datas exibidas em dd/mm/aaaa; data e hora em dd/mm/aaaa hh:mm; horário de aula em hh:mm.')
D.i(0, '• Todos os valores em reais no formato R$ 1.234,56.')
D.i(0, '• Dias da semana por extenso (Segunda, Terça, ... Sábado) e níveis com acento.')
D.i(0, '• Mensagens de validação em português. Fuso horário America/Sao_Paulo.')

D.h('Instruções para o(a) competidor(a)')
D.i(0, '• O projeto deve abrir em http://000.000.00.00/XX_modulo_b/ (sem /public na URL). Todas as rotas deste documento são relativas a esse caminho.')
D.i(0, '• Laravel com Blade e MySQL/MariaDB, seguindo o padrão MVC. O visual é livre, mas é avaliado (layout e usabilidade). As imagens do anexo são meramente ilustrativas.')
D.i(0, '• Arquivos internos do projeto (.env, app/, storage/logs) não podem abrir pelo navegador.')
D.i(0, '• Inclua um README.md na raiz com os passos de instalação e os usuários de teste.')
D.i(0, '• Material: allegro_db.sql.')

D.h('Anexo A – Usuários de teste (senha ProvaB2026!)')
D.tabela([
 ('Cargo', 'E-mail', 'Observação'),
 ('coordenacao', 'coordenacao.prova@allegro.com', 'Beatriz Amaral'),
 ('secretaria', 'secretaria.prova@allegro.com', 'Felipe Rangel'),
 ('professor', 'professor.prova@allegro.com', 'Marta Ilha'),
 ('professor', 'professor2.prova@allegro.com', 'Davi Prates'),
 ('professor', 'professor3.prova@allegro.com', 'Lúcia Ferraz'),
 ('professor', 'inativo.prova@allegro.com', 'Renan Costa, inativo (não entra)'),
], [0.2, 0.5, 0.3])

D.h('Anexo B – Telas (meramente ilustrativas)')
for f, leg in [('02-turmas.png', 'Listagem de turmas com filtros e ocupação'), ('03-turma.png', 'Detalhe da turma com alunos ativos e lista de espera'),
               ('04-aluno.png', 'Ficha do aluno com matrículas e mensalidades'), ('05-mensalidades.png', 'Mensalidades com filtros e totais'),
               ('06-inadimplencia.png', 'Relatório de inadimplência'), ('01-painel.png', 'Painel da coordenação')]:
    D.img(os.path.join(IMG, f), 15.5, leg)
D.save(OUT)
print('ok')
