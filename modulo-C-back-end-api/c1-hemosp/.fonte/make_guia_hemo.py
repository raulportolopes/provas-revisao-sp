import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
from cis_hemo import SUB, TOTAL
OUT = sys.argv[1]
D = Doc('Roteiro de teste do avaliador', 'Módulo C – HemoSP: API de agendamento de doação de sangue', 'SPSKILLS_MC_HEMOSP_ROTEIRO')
f = lambda v: f'{v:.2f}'.replace('.', ',')
D.h('Uso deste roteiro')
D.p('Documento do avaliador. A solução de referência comentada está em solucao/ e o script de conferência em gabarito-avaliador/checar-hemosp.php (com o esperado.json ao lado). Como esta é uma prova de revisão, o aluno pode ler a solução depois de tentar.')
D.p('A prova cobre o Módulo C do simulado (EcoSP) em versão de 3 a 5 vezes maior e os pontos fracos registrados do Eduardo: regras de estado no back-end (401 em JSON, 403, 404, 409, máquina de estados), formato e fuso de data, cancelamento sem apagar a linha, auditoria e organização das regras em um só lugar.')

D.h('Distribuição dos pontos')
D.tabela([('Subcritério', 'Nome', 'Pontos')] + [(s, n, f(sum(a[5] for a in asp))) for s, n, asp in SUB] + [('TOTAL', '', f(TOTAL))], [0.18, 0.62, 0.2])
n = sum(len(a) for _, _, a in SUB)
D.p(f'São {n} aspectos ({n - 1} de medição e 1 de julgamento).')

D.h('Preparação (10 minutos)')
D.i(0, '1. Copie o projeto do competidor para o servidor. Confira o .env (DB_DATABASE=hemosp_db) e rode composer install se a pasta vendor não veio.')
D.i(0, '2. Importe o hemosp_db.sql ORIGINAL. As datas são relativas ao dia da importação, então importe no dia da correção.')
D.i(0, '3. Rode php artisan migrate (só cria a personal_access_tokens do Sanctum, se o competidor fez o install:api).')
D.i(0, '4. Rode: php checar-hemosp.php http://servidor/XX_modulo_c/api (precisa da extensão curl, que vem ligada no XAMPP; o esperado.json fica na mesma pasta). O script cria, cancela e muda agendamentos: para rodar de novo, importe o SQL de novo.')
D.i(0, '5. Os códigos entre colchetes na CIS ([C6.3] etc.) são as linhas do script. Um FALHA pode ser só um nome de campo diferente: abra a resposta no Postman antes de zerar.')
D.i(0, '6. Leia o código para o julgamento de organização (C1) e confira em storage/app onde ficou a autorização do responsável (C5).')

D.h('Roteiro por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome} ({f(sum(a[5] for a in asp))} pt)')
    for k, (t, desc, extra, req, wsos, mx, esc) in enumerate(asp, 1):
        D.i(0, f'{sid}.{k} [{t} {f(mx)}] {desc}.')
        if t == 'M':
            D.i(1, 'Verificação: ' + '. '.join(x.rstrip('.') for x in (extra, req) if x) + '.')
        else:
            D.i(1, 'Escala: ' + ' / '.join(f'{i} = {j.rstrip(".")}' for i, j in enumerate(esc)) + '.')

D.h('Dados esperados (gabarito)')
D.tabela([
 ('Teste', 'Resultado esperado'),
 ('Estoque (35 dias)', 'AB- 0% critico; O+ 6,5% critico; O- 22,0% critico; A- 26,0% alerta; A+ 26,7% alerta; B- 28,4% alerta; AB+ 58,6% ok; B+ 59,1% ok (nesta ordem)'),
 ('Unidades', 'Hemocentro Paulista (1), Posto de Coleta Mooca (2), Posto de Coleta Santo Amaro (3). Itaquera (4) inativa. Sábado: 1 e 3'),
 ('Grade do Hemocentro', '33 horários (07:00 a 17:40), 3 vagas; Mooca 08:00–17:00 com 2 vagas; Santo Amaro 08:00–16:00 com 2 vagas'),
 ('Ana', 'Apta hoje (duas doações, a última há 120 dias)'),
 ('Bruno', 'INTERVAL, próxima data = hoje + 30 (homem, doou há 30 dias)'),
 ('Camila', 'INTERVAL, próxima data = hoje + 20 (mulher, doou há 70 dias: precisa de 90)'),
 ('Diego', 'YEARLY_LIMIT, próxima data = hoje + 65 (4 doações: há 300, 230, 160 e 75 dias)'),
 ('Eduarda / Felipe', '17 anos: Eduarda sem autorização (GUARDIAN_DOCUMENT); Felipe com autorização (apto)'),
 ('Gabriela / Heitor / João Pedro', 'WEIGHT (48 kg) / FIRST_DONATION_AGE (63 anos, nunca doou) / AGE_MAX (70 anos); next_eligible_date null'),
 ('Isabel', '66 anos e já doou: apta'),
 ('Karina', 'Agendamento daqui a 3 dias: novo agendamento dá 409; presença e falta dão 409 (cedo demais)'),
 ('Lucas', 'Agendamento daqui a 1 hora: cancelar dá 409 (menos de 2 h)'),
 ('Marcos / Natália / Otávio', 'Começou há 2 h (falta permitida) / começa em 10 min (presença permitida) / já compareceu e não tem tipo sanguíneo'),
 ('Paula', 'Doação já efetivada: qualquer transição dá 409 com allowed vazio'),
 ('Equipe, 10/06/2025', '14 agendamentos (2 páginas de 10). Relatório 06/2025: Hemocentro 24 (12 doaram, 16,7% de falta, 5,40 L), Mooca 23 (9, 33,3%, 4,09 L), Santo Amaro 23 (17, 0%, 7,63 L), Itaquera 0'),
], [0.3, 0.7])

D.h('Onde o competidor costuma perder')
for t in [
 '401 virando 302 para /login porque a requisição veio sem Accept: application/json.',
 'Token de doador entrando nas rotas da equipe: faltou separar com habilidades (abilities) do Sanctum.',
 'Carbon 3: diffInYears e diffInDays devolvem número com casas decimais (e com sinal). Idade 17,9 vira 17 só com (int).',
 'Último horário da grade passando do fechamento (17:40 + 20 = 18:00 pode; 18:00 não).',
 'Contar agendamento cancelado como vaga ocupada, ou apagar a linha ao cancelar.',
 'Parar no primeiro motivo de inaptidão em vez de listar todos em reasons.',
 'Protocolo aleatório em vez de sequencial, ou número que não recomeça no ano novo.',
 'Taxa de falta dividindo pelo total com os cancelados; relatório que esquece a unidade inativa.',
 'CSV sem BOM (acentos quebram no Excel) ou com vírgula como separador.',
 'Autorização do responsável salva em public/ com o nome original: documento pessoal exposto.',
 'Máquina de estados espalhada em vários if pelos controllers (perde no julgamento).']:
    D.i(0, '• ' + t)

D.h('Plano de tempo sugerido (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('Importar SQL, projeto, .env, install:api, fuso, erros JSON', '0:00–0:20', 'C1'),
 ('Models, relações, estoque, unidades e grade de vagas', '0:20–1:10', 'C2'),
 ('Cadastro com CPF, login com habilidades, logout', '1:10–1:40', 'C3'),
 ('Service de elegibilidade e /me', '1:40–2:20', 'C4'),
 ('Agendamento (ordem das regras, 409, protocolo), autorização', '2:20–3:00', 'C5'),
 ('Meus agendamentos e cancelamento', '3:00–3:15', 'C6'),
 ('Equipe: lista, máquina de estados, histórico', '3:15–3:45', 'C7'),
 ('CSV, relatório e README', '3:45–4:00', 'C8'),
], [0.55, 0.18, 0.27])
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
