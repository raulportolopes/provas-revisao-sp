# Ficha CIS da prova Allegro (Módulo B). Fonte única para CIS e guia do avaliador.
# aspecto: (tipo, descrição, extra/como verificar, requerimento, seção WSOS, máximo, escala J ou None)
# Os códigos [B4.1] etc. são as linhas do checar-allegro.php.
M = lambda d, v, extra=None, ws=5: ("M", d, extra, None, ws, v, None)
J = lambda d, v, escala, ws=5: ("J", d, None, None, ws, v, escala)
MODULO = 'B'
TITULO = '#17 Tecnologias Web · Módulo B · Allegro – turmas, matrículas e mensalidades da escola de música (projeto de revisão, Laravel MVC)'

SUB = [
 ("B1", "Entrega, organização e layout", [
   M("O projeto abre em http://servidor/XX_modulo_b/ sem /public na URL e sem erro; a raiz sem login mostra o login", 0.50, "[B1.1] [B1.2] Zero se precisar de /public ou de php artisan serve", ws=1),
   M("README.md na raiz com instalação (.env, banco) e os usuários de teste", 0.25, "Tudo ou nada", ws=2),
   M("Arquivos internos protegidos: /XX_modulo_b/.env e /XX_modulo_b/app/... não abrem no navegador", 0.25, "Abrir as duas URLs: 403 ou 404", ws=1),
   M("Páginas de erro 403 e 404 próprias, em português, dentro do layout e com link de volta", 0.25, "Descontar 0,10 por página padrão do Laravel", ws=2),
   J("Organização do código", 1.50, [
     "Regras espalhadas em closures de rota ou num controller gigante; validação e permissão repetidas ou ausentes no servidor.",
     "Controllers por recurso e validação no controller, mas as regras de matrícula, espera e mensalidade estão espalhadas e repetidas.",
     "Form Requests, Policy/Gates para permissão e as regras de matrícula (vaga, espera, promoção, mensalidades) em um só lugar (service ou model).",
     "Além do nível 2: transação com trava na matrícula, cálculo de multa e juros num só método, scopes nomeados, eager loading sem N+1 e nenhum código morto."]),
   J("Layout e usabilidade das telas (Blade)", 1.25, [
     "Telas sem estilo ou quebradas; difícil achar as ações; mensagens de erro e sucesso não aparecem.",
     "Layout simples e consistente (menu, títulos, tabelas legíveis); mensagens aparecem.",
     "Além do nível 1: turma cheia e mensalidade vencida destacadas, situação com cor própria, formulários organizados e utilizáveis em 768 px.",
     "Além do nível 2: hierarquia visual clara, foco visível no teclado, labels em todos os campos e nenhuma tela que exija rolagem horizontal em 1280 px."], ws=3),
 ]),
 ("B2", "Autenticação", [
   M("Sem login, /, /turmas, /turmas/1, /alunos, /alunos/1, /mensalidades e /relatorios/inadimplencia redirecionam para /login", 0.75, "[B2.1] Descontar 0,10 por rota que não redireciona"),
   M("Senha errada: volta ao login com \"E-mail ou senha incorretos.\" e o e-mail continua preenchido", 0.50, "[B2.2] Descontar 0,25 se o e-mail não ficar preenchido"),
   M("Usuário inativo não entra e vê \"Usuário inativo. Procure a coordenação.\"", 0.50, "[B2.3] Zero se entrar"),
   M("Login correto leva ao painel com o nome e o cargo do usuário", 0.25, "[B2.4]"),
   M("Logout por POST encerra a sessão (depois dele as rotas voltam a pedir login)", 0.50, "[B2.5] Zero se o logout for link GET"),
 ]),
 ("B3", "Controle de acesso", [
   M("403 por cargo no servidor: professor em /alunos, /alunos/1, /mensalidades e /relatorios/inadimplencia; secretaria em /turmas/criar, /turmas/1/editar, /relatorios/inadimplencia e /mensalidades/exportar", 1.25, "[B3.1] Descontar 0,25 por rota que não responde 403"),
   M("Professora abre a turma dela e recebe 403 ao abrir a turma de outro professor", 0.75, "[B3.2] Marta: /turmas/1 abre, /turmas/3 dá 403"),
   M("Professor vê na listagem só as turmas dele, sem a coluna de mensalidade (nenhum valor em R$)", 0.75, "[B3.3] Descontar 0,50 se aparecer turma de outro"),
   M("Links e botões escondidos conforme o cargo (menu do professor sem Alunos, Mensalidades e Inadimplência; secretaria sem Editar/Apagar turma e sem Estornar)", 0.75, "[B3.4] [B3.5] Descontar 0,25 por botão que aparece sem permissão"),
   M("Registro inexistente (turma, aluno, mensalidade) responde 404", 0.50, "[B3.6] Descontar 0,25 se der 500"),
   M("Estorno por quem não é coordenação responde 403 (POST direto)", 0.50, "[B3.7]"),
 ]),
 ("B4", "Turmas: listagem e detalhe", [
   M("Ordem: dia da semana, horário de início e código", 0.50, "[B4.1]"),
   M("Colunas: código, instrumento, nível, professor(a), sala, \"Segunda, 18:00–19:30\", ocupação ativos/vagas, espera e mensalidade em R$", 0.75, "[B4.2] Descontar 0,25 por coluna ausente ou fora do formato"),
   M("Filtro \"só com vaga\" exclui turmas cheias e inativas", 0.50, "[B4.3] Zero se contar alunos em espera ou cancelados como ocupação"),
   M("Filtros por instrumento, dia, nível e professor(a), combinados e mantidos nos campos", 0.50, "[B4.4]"),
   M("Detalhe: lista de espera em ordem de chegada com a posição, e aviso \"Turma cheia\"", 0.75, "[B4.5] Zero se a ordem for por nome ou por id"),
   M("Detalhe: alunos ativos com idade e data de matrícula em dd/mm/aaaa", 0.50, "[B4.6]"),
 ]),
 ("B5", "Cadastro de turma e grade de horários", [
   M("Conflito de sala: outra turma ATIVA na mesma sala, mesmo dia, com horário sobreposto; a mensagem cita a turma e o horário", 1.00, "[B5.1] Descontar 0,50 se a mensagem não citar a turma"),
   M("Conflito de professor(a): mesma regra para o professor", 0.75, "[B5.2]"),
   M("Os dois conflitos aparecem juntos quando existem os dois", 0.25, "[B5.3]"),
   M("Horários que só encostam (19:30 termina, 19:30 começa) não conflitam", 0.50, "[B5.8] Zero se usar <= em vez de <"),
   M("Turma inativa não gera conflito", 0.25, "[B5.9]"),
   M("Horário: término depois do início, entre 08:00 e 22:00; duração de 30 min a 3 h", 0.50, "[B5.4] [B5.5] Descontar 0,25 por regra"),
   M("Vagas não passam da capacidade da sala; professor inativo é recusado", 0.50, "[B5.6] [B5.7]"),
   M("Código em maiúsculas e único; mensalidade aceita 1.250,00 e é exibida como R$ 1.250,00", 0.50, "[B5.8] [B5.10]"),
   M("Edição: vagas não podem ficar abaixo dos alunos ativos; turma com matrícula ativa ou em espera não pode ser desativada", 0.75, "[B5.11] Descontar 0,25 por regra"),
   M("Edição abre preenchida (hora em hh:mm, mensalidade 180,00); erro de validação mantém o que foi digitado", 0.25, "[B5.12]"),
   M("Mudar a mensalidade da turma não altera mensalidades já geradas", 0.50, "[B5.13] Zero se as mensalidades mudarem"),
   M("Apagar pela página de confirmação; turma com qualquer matrícula não é apagada (mensagem sugere desativar)", 0.25, "[B5.14]"),
 ]),
 ("B6", "Alunos", [
   M("Listagem em ordem de nome, 15 por página com \"Mostrando X–Y de Z\", idade, telefone com máscara e turmas ativas", 0.50, "[B6.1]"),
   M("Filtro \"só em débito\" (mensalidade vencida e não paga) e filtro por turma (só matrícula ativa), combináveis com a busca", 0.75, "[B6.2] [B6.3] Descontar 0,25 por filtro"),
   M("Menor de 18 anos exige nome e telefone do responsável; o formulário mantém o que foi digitado", 0.75, "[B6.4] Zero sem a regra"),
   M("Quem faz 18 anos hoje já é maior e aparece com 18 anos (idade calculada pela data, não pelo ano)", 0.50, "[B6.5] Zero se usar só o ano"),
   M("Aluno com menos de 5 anos é recusado; e-mail repetido é recusado (editar sem mudar o e-mail não acusa)", 0.50, "[B6.6] [B6.7]"),
   M("Detalhe: nascimento dd/mm/aaaa com idade, responsável, telefones com máscara, matrículas e mensalidades", 0.75, "[B6.8] Descontar 0,25 por item ausente"),
   M("Aluno com qualquer matrícula (inclusive em espera ou cancelada) não é apagado; sem matrículas é apagado pela página de confirmação", 0.75, "[B6.9] [B7.14]"),
 ]),
 ("B7", "Matrículas e lista de espera", [
   M("Turma com vaga: matrícula ativa com a data de hoje e mensalidades do mês atual até dezembro", 1.00, "[B7.1] Descontar 0,50 se gerar o ano todo ou só uma"),
   M("Primeira mensalidade vence no dia 10 ou, se o dia 10 já chegou, hoje + 5; valor = mensalidade atual da turma", 0.75, "[B7.2] Descontar 0,50 se vencer no passado"),
   M("Turma cheia: aluno entra na lista de espera, com a posição na mensagem, sem gerar mensalidade", 0.75, "[B7.3] Zero se passar das vagas"),
   M("Matrícula repetida e espera repetida são recusadas com mensagens diferentes; turma inativa não aceita matrícula", 0.50, "[B7.4] [B7.6]"),
   M("Conflito de horário do aluno (outra turma em que ele está ATIVO, mesmo dia, horário sobreposto) citando a turma", 0.75, "[B7.5]"),
   M("Cancelar matrícula ativa promove o primeiro da espera que NÃO tem conflito de horário", 1.00, "[B7.7] [B7.10] Descontar 0,50 se promover quem tem conflito"),
   M("O promovido fica ativo com a data de hoje e ganha as mensalidades", 0.50, "[B7.9]"),
   M("Cancelar apaga só as mensalidades em aberto que vencem hoje ou depois; pagas e vencidas não pagas continuam", 1.00, "[B7.8] [B7.11] Zero se apagar a linha da matrícula ou a dívida"),
   M("Matrícula cancelada mostra \"Cancelada em dd/mm/aaaa\"; cancelar de novo é recusado", 0.50, "[B7.8] [B7.12]"),
   M("Cancelar uma espera não promove ninguém", 0.25, "[B7.13]"),
 ]),
 ("B8", "Mensalidades e pagamento", [
   M("Listagem com aluno, turma, referência mm/aaaa, vencimento dd/mm/aaaa, valor e situação (Paga, Em aberto, Vencida) calculada pela data", 0.50, "[B8.4] Descontar 0,25 se a situação for coluna gravada"),
   M("Vencida mostra \"Vencida há N dias\" e o valor atualizado: 2% de multa + 1% ao mês proporcional aos dias", 1.00, "[B8.2] Descontar 0,50 se só mostrar a multa"),
   M("Filtros mês, situação, aluno e turma combináveis, mantidos nos campos, com totais (recebido, em aberto, vencido atualizado) de TODAS as linhas filtradas", 1.00, "[B8.1] [B8.3] Descontar 0,50 se o total for só da página"),
   M("Paginação de 15 com \"Mostrando\" mantendo os filtros", 0.50, "[B8.5] [B8.6]"),
   M("Pagamento: data obrigatória, não no futuro e não antes da matrícula (mensagem com a data)", 0.75, "[B8.7] [B8.8]"),
   M("Valor pago calculado no servidor até a data do pagamento; pagar no vencimento não tem multa; valor enviado pelo formulário é ignorado", 1.00, "[B8.9] [B8.10] Zero se aceitar o valor do formulário"),
   M("Mensalidade paga não é paga de novo; estorno (só coordenação) volta à situação calculada", 0.75, "[B8.11] [B8.12]"),
 ]),
 ("B9", "Relatório, painel e exportação", [
   M("Inadimplência: um aluno por linha, quantidade, vencimento mais antigo, valor original e atualizado, do maior atualizado para o menor", 1.00, "[B9.1] [B9.2] Zero se a ordem for pelo valor original"),
   M("Painel administrativo: alunos ativos, vagas livres, na lista de espera, vencidas; \"Recebido em\" só para a coordenação", 0.50, "[B9.3]"),
   M("Painel do professor: aulas de hoje (dia da semana atual) com sala e alunos", 0.25, "[B9.4]"),
   M("CSV (só coordenação) com BOM, ponto e vírgula, datas dd/mm/aaaa e os mesmos filtros da tela", 0.75, "[B8.13] Descontar 0,25 por item"),
 ]),
]
TOTAL = round(sum(a[5] for _, _, asps in SUB for a in asps), 2)
if __name__ == '__main__':
    for sid, nome, asps in SUB: print(sid, round(sum(a[5] for a in asps), 2), len(asps))
    print('TOTAL', TOTAL, sum(len(a) for _, _, a in SUB))
