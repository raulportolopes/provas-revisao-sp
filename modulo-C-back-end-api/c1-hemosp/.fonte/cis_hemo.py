# CIS da prova de revisão HemoSP (Módulo C – Back-end API). Fonte única para a CIS e para o guia.
# aspecto: (tipo, descrição, extra, requerimento, seção WSOS, máximo, escala J ou None)
# Os códigos [C6.3] no requerimento são as linhas do checar-hemosp.php.
M = lambda d, v, extra=None, req=None, ws=5: ("M", d, extra, req, ws, v, None)
J = lambda d, v, escala, ws=5: ("J", d, None, None, ws, v, escala)

SUB = [
 ("C1", "Entrega, estrutura e erros em JSON", [
   M("A API responde em http://servidor/XX_modulo_c/api com JSON", 0.25, "[C2.1]", ws=1),
   M("README.md com instalação (.env, importar SQL, install:api) e os usuários de teste", 0.25, "Tudo ou nada", ws=2),
   M("Rota inexistente dá 404 e método errado dá 405, sempre em JSON", 0.25, "[C2.2] [C2.3]. Descontar 0,10 por item"),
   M("Sem token: 401 em JSON (mesmo sem o cabeçalho Accept), nunca 302 para /login", 0.25, "[C4.9] [C8.7]"),
   J("Organização do código", 1.50, [
     "Tudo em closures de rota ou em um controller gigante; regras repetidas.",
     "Controllers por recurso, mas regras de horário e elegibilidade espalhadas e repetidas.",
     "Regras em services (grade, elegibilidade, agendamento) usados pelas rotas; API Resource para o agendamento.",
     "Além do nível 2: máquina de estados em um só lugar, transação com lockForUpdate, scopes nomeados, mensagens em português e nenhum código morto."]),
 ]),
 ("C2", "Rotas públicas: estoque, unidades e vagas", [
   M("Estoque: volume doado nos últimos 35 dias por tipo, meta, percentual com 1 casa e nível (critico < 25 ≤ alerta < 50 ≤ ok)", 0.75, "[C3.1]. Descontar 0,25 por regra errada (janela, percentual ou nível)"),
   M("Estoque ordenado do mais crítico para o menos crítico (percentual crescente)", 0.25, "[C3.1]"),
   M("Unidades: só as ativas, em ordem de nome, com horários de semana e sábado", 0.25, "[C3.2]"),
   M("Filtros neighborhood (parte do nome) e open_on (só as abertas no dia, considerando sábado e fechamentos)", 0.50, "[C3.3] [C3.4] [C3.5]. Descontar 0,25 por filtro"),
   M("Vagas: grade de 20 min do horário de abertura até o último horário que TERMINA até o fechamento; vagas = capacidade - ocupados", 0.50, "[C3.6] [C6.10]. Descontar 0,25 se o último horário passar do fechamento"),
   M("Horários em ISO 8601 com o fuso -03:00", 0.25, "[C3.7]"),
   M("Dia fechado (domingo, sábado sem atendimento, feriado da tabela closures) responde open=false com o motivo", 0.50, "[C3.8] [C3.9] [C3.10]. Descontar 0,25 por caso"),
   M("Unidade inativa ou inexistente: 404; data inválida, passada ou além de 90 dias: 422", 0.25, "[C3.11] [C3.12]"),
 ]),
 ("C3", "Cadastro e autenticação", [
   M("Cadastro vazio: 422 com TODOS os campos obrigatórios em errors", 0.25, "[C4.1]"),
   M("CPF validado pelos dígitos verificadores, aceito com ou sem máscara e gravado só com números", 0.75, "[C4.2] [C4.6] [C4.7]. Descontar 0,25 por item"),
   M("CPF e e-mail únicos; idade mínima de 16 anos; senha com letras e números", 0.50, "[C4.3] [C4.4] [C4.5]"),
   M("Login do doador e da equipe com token Sanctum; senha errada dá 401", 0.25, "[C4.8] [C4.10]"),
   M("Token de doador nas rotas da equipe e token da equipe nas rotas do doador: 403", 0.50, "[C4.11]. Zero se um tipo de usuário entra nas rotas do outro"),
   M("Logout apaga o token atual (204) e ele deixa de funcionar", 0.25, "[C4.12]"),
 ]),
 ("C4", "Elegibilidade do doador", [
   M("Idade entre 16 e 69 anos no dia da doação (AGE_MIN / AGE_MAX)", 0.25, "[C5.9]"),
   M("16 e 17 anos só com autorização do responsável (GUARDIAN_DOCUMENT)", 0.25, "[C5.5]"),
   M("Primeira doação só até os 60 anos (FIRST_DONATION_AGE)", 0.25, "[C5.7] [C5.8]"),
   M("Peso mínimo de 50 kg (WEIGHT)", 0.25, "[C5.6]"),
   M("Intervalo de 60 dias (homem) e 90 dias (mulher) desde a última doação efetivada (INTERVAL)", 0.50, "[C5.2] [C5.3]. Descontar 0,25 por sexo errado"),
   M("Limite de 4 (homem) e 3 (mulher) doações em 12 meses (YEARLY_LIMIT)", 0.50, "[C5.4]"),
   M("next_eligible_date certo (hoje, intervalo, janela de 12 meses) e null quando o motivo é permanente", 0.50, "[C5.1] [C5.2] [C5.3] [C5.4] [C5.6]. Descontar 0,25 por caso errado"),
 ]),
 ("C5", "Agendamento", [
   M("Validação de formato: center_id de unidade ativa e starts_at no formato Y-m-d H:i (422)", 0.25, "[C6.1] [C6.2]"),
   M("Horário: na grade, dentro do expediente, dia aberto, não passado e até 90 dias (422 em starts_at)", 0.75, "[C6.3]. Descontar 0,25 por regra ausente"),
   M("Doador inapto: 422 com a lista reasons (code e message) de TODOS os motivos", 0.50, "[C6.4]"),
   M("Já tem agendamento em aberto: 409", 0.25, "[C6.5] [C6.11]"),
   M("Capacidade do horário: com as vagas ocupadas, 409; cancelado não ocupa vaga", 0.50, "[C6.9] [C7.10]"),
   M("Protocolo HEMO-AAAA-NNNNN sequencial no ano, status scheduled, starts_at e ends_at (+20 min) em ISO", 0.50, "[C6.6] [C6.7] [C6.8]. Descontar 0,25 se o número for aleatório"),
   M("Autorização do responsável: só menores (409 para adulto), só PDF/JPG/PNG até 2 MB (422), guardada fora da pasta pública", 0.50, "[C6.12] [C6.13] [C6.14]. Abrir storage/app: o arquivo não pode estar em public"),
 ]),
 ("C6", "Histórico e cancelamento do doador", [
   M("Meus agendamentos: 5 por página, mais recente primeiro, filtro status (422 se inválido) e meta com total", 0.50, "[C7.1] [C7.2] [C7.3]"),
   M("Cancelar: outra pessoa 403, inexistente 404, não agendado 409, menos de 2 h 409", 0.75, "[C7.4] [C7.5] [C7.6] [C7.8]. Descontar 0,25 por código errado"),
   M("Cancelar muda o status para cancelled e grava cancelled_at; a linha NÃO é apagada", 0.25, "[C7.7] [C7.9]"),
 ]),
 ("C7", "Rotas da equipe", [
   M("Lista com filtros date, center_id, status e search (nome ou início do CPF, com ou sem máscara)", 0.50, "[C8.1] [C8.5]"),
   M("Paginação de 10 com meta e ordenação starts_at, -starts_at e donor; sort ou status inválidos: 422", 0.50, "[C8.1] [C8.2] [C8.3] [C8.4] [C8.6]"),
   M("Máquina de estados: transição inválida dá 409 com a lista allowed", 0.50, "[C9.1] [C9.2]"),
   M("Regras de tempo: presença a partir de 30 min antes; falta só 30 min depois do horário (409)", 0.50, "[C9.3] [C9.4]"),
   M("Campos por destino: volume 300–500 ml em donated, motivo em unfit, tipo sanguíneo quando o doador não tem (e grava no doador)", 0.75, "[C9.5] [C9.6] [C9.7] [C9.8]. Descontar 0,25 por campo"),
   M("Histórico (auditoria) de cada mudança com de, para, quem e quando", 0.25, "[C9.10]"),
 ]),
 ("C8", "Exportação e relatório", [
   M("CSV para Excel: text/csv, attachment com nome, BOM, separador ; e cabeçalho", 0.50, "[C10.1] [C10.2]"),
   M("CSV com data dd/mm/aaaa, CPF com máscara e situação em português; date obrigatório (422)", 0.25, "[C10.3] [C10.4]"),
   M("Relatório mensal só para admin (403 para a triagem) e mês inválido 422", 0.25, "[C10.5] [C10.7]"),
   M("Relatório por unidade (inclusive a inativa com zeros): totais por situação, taxa de falta sem os cancelados e litros", 0.50, "[C10.6]. Descontar 0,25 se a taxa contar os cancelados"),
 ]),
]

TOTAL = round(sum(a[5] for _, _, asp in SUB for a in asp), 2)

if __name__ == "__main__":
    for s, n, a in SUB:
        print(s, n, round(sum(x[5] for x in a), 2), len(a))
    print("TOTAL", TOTAL)
