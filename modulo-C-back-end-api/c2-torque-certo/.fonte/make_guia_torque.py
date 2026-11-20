import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbase import Doc
from cis_torque import SUB, TOTAL
OUT, ESP = sys.argv[1], json.load(open(sys.argv[2]))
D = Doc('Roteiro de teste do avaliador', 'Módulo C – Torque Certo: API da oficina mecânica', 'SPSKILLS_MC_TORQUE_ROTEIRO')
f = lambda v: f'{v:.2f}'.replace('.', ',')
brl = lambda c: 'R$ ' + f'{c // 100:,}'.replace(',', '.') + f',{c % 100:02d}'
D.h('Uso deste roteiro')
D.p('Documento do avaliador. A solução de referência comentada está em solucao/ e o script de conferência em gabarito-avaliador/checar-torque.php (com o esperado.json ao lado). Como esta é uma prova de revisão, o aluno pode ler a solução depois de tentar.')
D.p('A prova cobre o Módulo C do simulado (EcoSP) em versão de 3 a 5 vezes maior e os pontos fracos do Eduardo: regras de estado no back-end (401, 403 por perfil, 404, 409, máquina de estados), permissão checada no servidor, exclusão lógica em vez de apagar, upload seguro e cálculo de dinheiro.')

D.h('Distribuição dos pontos')
D.tabela([('Subcritério', 'Nome', 'Pontos')] + [(s, n, f(sum(a[5] for a in asp))) for s, n, asp in SUB] + [('TOTAL', '', f(TOTAL))], [0.18, 0.62, 0.2])
n = sum(len(a) for _, _, a in SUB)
D.p(f'São {n} aspectos ({n - 1} de medição e 1 de julgamento).')

D.h('Preparação (10 minutos)')
D.i(0, '1. Copie o projeto do competidor para o servidor. Confira o .env (DB_DATABASE=torque_db) e rode composer install se a pasta vendor não veio.')
D.i(0, '2. Importe o torque_db.sql ORIGINAL, rode php artisan migrate (cria a personal_access_tokens) e php artisan storage:link.')
D.i(0, '3. Rode: php checar-torque.php http://servidor/XX_modulo_c/api (precisa das extensões curl e gd, ligadas no XAMPP). O script muda estoque e situações: para rodar de novo, importe o SQL de novo e apague storage/app/public/orders.')
D.i(0, '4. Os códigos entre colchetes na CIS são as linhas do script. Um FALHA pode ser só um nome de campo diferente: abra a resposta no Postman antes de zerar.')
D.i(0, '5. Leia o código para o julgamento (C1) e abra uma miniatura gerada no navegador (C6).')

D.h('Roteiro por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome} ({f(sum(a[5] for a in asp))} pt)')
    for k, (t, desc, extra, req, wsos, mx, esc) in enumerate(asp, 1):
        D.i(0, f'{sid}.{k} [{t} {f(mx)}] {desc}.')
        if t == 'M':
            D.i(1, 'Verificação: ' + '. '.join(x.rstrip('.') for x in (extra, req) if x) + '.')
        else:
            D.i(1, 'Escala: ' + ' / '.join(f'{i} = {j.rstrip(".")}' for i, j in enumerate(esc)) + '.')

T = ESP['totais']
D.h('Dados esperados (gabarito)')
D.tabela([
 ('Teste', 'Resultado esperado'),
 ('Faturamento 2025', '; '.join(f"{r['month'][5:]}: {r['orders']} OS, {brl(r['revenue_cents'])}" for r in ESP['revenue_2025']) + f". Total {brl(ESP['revenue_2025_total'])}"),
 ('Estoque baixo', ', '.join(f"{p['sku']} ({p['stock_qty']}/{p['min_stock']}, comprar {p['suggested_purchase']})" for p in ESP['low_stock'])),
 ('OS-2026-0002 (aberta)', 'Edição de itens e desconto. Subtotal inicial ' + brl(T['OS-2026-0002']['subtotal_cents'])),
 ('OS-2026-0003 (orçada)', 'Aprovar dá 409: faltam PAS-DIA01 (precisa 3, tem 2) e LAM-H4 (precisa 2, tem 0)'),
 ('OS-2026-0004 (orçada, 5%)', f"Subtotal {brl(T['OS-2026-0004']['subtotal_cents'])}, desconto {brl(T['OS-2026-0004']['discount_cents'])}, total {brl(T['OS-2026-0004']['total_cents'])}. Aprovar baixa 5 OLE-5W30 e 1 FIL-OLE01"),
 ('OS-2026-0005 (aprovada)', 'Precisa de mecânico para entrar em execução'),
 ('OS-2026-0006 (em execução, João)', 'Pedro e a atendente recebem 403 ao concluir; João conclui'),
 ('OS-2026-0007 (concluída, Pedro)', 'Atendente entrega; mecânico recebe 403'),
 ('OS-2026-0008 (entregue)', 'Nenhuma transição (409, allowed vazio)'),
 ('OS-2026-0009 (aberta, sem itens)', 'Orçar dá 409; usada no teste de fotos'),
 ('OS-2026-0010 / 0011', 'Cancelada (vai para a lixeira) / já está na lixeira'),
 ('OS-2026-0012 (aprovada)', 'Cancelar devolve 2 AMO-DIA01 ao estoque'),
 ('OS-2025-0002', 'Total ' + ESP['brl']['OS-2025-0002'] + ' (formato com milhar)'),
], [0.3, 0.7])

D.h('Onde o competidor costuma perder')
for t in [
 'Permissão só "escondida": o mecânico consegue chamar a rota de desconto ou de cliente. Teste sempre com o token do mecânico.',
 'Dinheiro em float (0,1 + 0,2) e desconto sem arredondar no centavo.',
 'Aprovação que baixa a primeira peça e só depois descobre que falta a segunda (sem transação).',
 'Cancelar OS aprovada sem devolver as peças.',
 'DELETE que apaga a linha de verdade (sem SoftDeletes) ou restore que procura sem withTrashed.',
 'Número da OS que repete porque a OS da lixeira não foi contada.',
 'to=2026-11-12 virando 2026-11-12 00:00 e perdendo o último dia.',
 'Miniatura que é só a mesma imagem com outro nome, ou upload que aceita qualquer arquivo com extensão .jpg.',
 'Faturamento que pula os meses sem entrega.',
 'Ordenar por total em PHP depois de paginar (ordena só a página).']:
    D.i(0, '• ' + t)

D.h('Plano de tempo sugerido (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('Importar SQL, projeto, .env, install:api, erros JSON, login, middleware de perfil', '0:00–0:30', 'C1'),
 ('Clientes, veículos e peças', '0:30–1:10', 'C2'),
 ('OS: abertura, número, detalhe com totais em centavos', '1:10–1:45', 'C3'),
 ('Itens e desconto', '1:45–2:15', 'C4'),
 ('Máquina de estados e estoque (transação)', '2:15–3:00', 'C5'),
 ('Fotos e miniatura', '3:00–3:20', 'C6'),
 ('Lixeira, lista com filtros e relatórios, README', '3:20–4:00', 'C7 e C8'),
], [0.55, 0.18, 0.27])
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
