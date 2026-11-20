import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_pulso import SUB, TOTAL
OUT = sys.argv[1]
D = Doc('Guia do avaliador – roteiro de teste e gabarito', 'Módulo D – Pulso Academias: agenda de aulas', 'SPSKILLS_MD_PULSO_GUIA_AVALIADOR')
D.h('Uso deste guia')
D.p('Documento do avaliador. Como este é um projeto de revisão, a solução comentada (solucao-comentada/XX_modulo_d/) e o ESTUDO_GUIADO.md podem ir para o competidor depois que ele tentar fazer sozinho. O script de apoio está em gabarito-avaliador/checar-pulso.js.')
D.p('O projeto cobre os pontos fracos registrados do Eduardo, em versão 3 a 5 vezes maior que o Módulo D do simulado estadual (EcoSP, 15 pt, JSON estático): interação JS de estado (modal com foco, abas, acordeão, paginação, filtros, tema), 375 px e Lighthouse, efeitos CSS (card 3D e brilho que seguem o cursor, gráficos no hover), regras de estado vindas do back-end (401, 409, 422) e formato de data (UTC → Brasília, data sem hora).')

D.h('Distribuição dos pontos')
D.tabela([
 ('Foco', 'Subcritérios', 'Pontos'),
 ('Sessão, token, 401 e guarda de rota', 'D1', '3,50'),
 ('Consumo de API, cruzamento e estados', 'D2', '3,25'),
 ('Abas, filtros na API, debounce e URL', 'D3', '4,50'),
 ('Paginação do servidor e corrida de requisições', 'D4', '2,50'),
 ('Modal acessível e regras 409/422', 'D5', '4,50'),
 ('Reservas: abas, cancelamento, UTC', 'D6', '3,00'),
 ('Gráficos só com CSS', 'D7', '2,25'),
 ('Perfil (PATCH, upload, máscara), tema, acordeão', 'D8', '3,00'),
 ('Responsivo, fidelidade e efeito 3D', 'D9', '2,25'),
 ('Lighthouse e código', 'D10', '1,25'),
 ('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')),
], [0.55, 0.25, 0.2], prot=1)
w = {}
for s in SUB:
    for a in s[2]: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
D.p(f'WSOS 3 = {w[3]:.2f} e WSOS 4 = {w[4]:.2f}. São {sum(len(s[2]) for s in SUB)} aspectos, 54 de medição e 2 de julgamento.'.replace('.', ',', 2))

D.h('Preparação')
D.i(0, '1. Publique a entrega no Apache (ou rode php -S localhost:8000 dentro da pasta). Dê permissão de escrita em api/dados/ e api/uploads/.')
D.i(0, '2. Antes de começar, zere os dados: no console do navegador, fetch("api/index.php/reset", {method: "POST"}). Faça isso também entre um competidor e outro.')
D.i(0, '3. Windows no fuso de Brasília. Os aspectos de data dependem disso.')
D.i(0, '4. Para testar o token vencido (D1.5), com o aluno logado, rode no console:')
D.code('const s = JSON.parse(localStorage.getItem("pulso.sessao"));\nfetch("api/index.php/sessao/expirar", { method: "POST", headers: { Authorization: "Bearer " + s.token } });')
D.p('Se o competidor guardou o token com outro nome, procure em Application > Local Storage e troque a primeira linha.')
D.i(0, '5. Para testar respostas fora de ordem (D4.3): DevTools > Rede > Fast 3G e clicar rápido em três dias seguidos. A lista final tem de ser a do último dia clicado (confira a aba selecionada e as horas).')
D.i(0, '6. Script de apoio: node checar-pulso.js http://servidor/XX_modulo_d/ (Node + Playwright). Ele foi escrito para a solução de referência: seletores diferentes podem falhar sem que o requisito falhe. Use como evidência, não como nota.')
D.i(0, '7. Compare as animações com os vídeos de design/videos/, que o competidor também recebe.')

D.h('Roteiro de teste por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome} ({sum(a[5] for a in asp):.2f} pt)'.replace('.', ','))
    for k, (t, desc, extra, req, wsos, mx, jud) in enumerate(asp, 1):
        valor = f'{mx:.2f}'.replace('.', ',')
        if t == 'M':
            D.i(0, f'{sid}.{k} [M {valor}] {desc}.')
            D.i(1, f'Como testar: {req}. Dedução: {extra}.')
        else:
            D.i(0, f'{sid}.{k} [J {valor}] {desc}.')
            D.i(1, 'Escala: ' + ' / '.join(f'{n} = {j}' for n, j in enumerate(jud)) + '.')

D.h('Comportamento esperado da API (gabarito)')
D.p('Como as aulas são geradas a partir da data de hoje, o gabarito é por regra, não por valor fixo.')
D.tabela([
 ('Teste', 'Resultado esperado'),
 ('Dia útil sem filtro', '16 aulas, 3 páginas de 6 (sábado 8, domingo 3)'),
 ('Contas', 'aluno@pulso.com.br e ana@pulso.com.br, senha Pulso2026!'),
 ('Depois do reset', 'Aluno com 2 reservas próximas (amanhã e daqui a 3 dias), cerca de 55 aulas no histórico e 5 canceladas'),
 ('Reservar 3 aulas no mesmo dia', 'A terceira volta 409 LIMITE_DIARIO'),
 ('Reservar 2 aulas no mesmo horário', '409 CONFLITO_HORARIO'),
 ('Reservar aula lotada', '409 AULA_LOTADA; POST /aulas/{id}/espera devolve 201 com a posição'),
 ('Cancelar aula que começa em menos de 2 h', '422 PRAZO_ENCERRADO'),
 ('criada_em "2026-11-18T17:59:51Z"', 'Tela: 18/11/2026 às 14:59'),
 ('membro_desde "2025-03-10"', 'Tela: 10/03/2025 (com new Date("2025-03-10") aparece 09/03/2025)'),
 ('PATCH /me com nome "Edu" e telefone "(11) 1234"', '422 com erros em nome e telefone'),
 ('Foto .txt', 'Recusada no navegador; se passar, a API responde 422'),
], [0.38, 0.62])

D.h('Pontos de atenção (onde o competidor costuma perder)')
for t in [
 'Token salvo, mas não enviado em todas as requisições (cada fetch escrito à mão).',
 '401 tratado só numa tela; nas outras a página fica em branco.',
 'Filtrar o array da página atual em vez de mandar os filtros para a API (a paginação fica errada).',
 'Busca disparando uma requisição por tecla e a lista "piscando" com respostas antigas.',
 'aria-busy ou carregando desligado pela resposta cancelada (finally do pedido antigo).',
 'Modal que perde o foco depois de reservar, porque a lista foi redesenhada e o botão de origem sumiu.',
 'Usar window.confirm para cancelar.',
 'Exibir criada_em cortando a string (17:59) em vez de converter para Brasília (14:59).',
 'backdrop-filter ou transform no cabeçalho: a barra fixa do celular gruda no topo em vez de embaixo.',
 'Tema aplicado no DOMContentLoaded: a página pisca branca no F5 do tema escuro.',
 'Acordeão que abre vários itens ou que esconde só com height e deixa o conteúdo fechado focável.',
]:
    D.i(0, '• ' + t)

D.h('Plano de tempo sugerido (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('Ler API e prints, montar checklist', '0:00–0:15', 'Plano'),
 ('Camada de API (token, erros, 401) e roteador com guarda', '0:15–0:45', 'D1'),
 ('Agenda: catálogos, abas de dia, filtros, URL, paginação', '0:45–1:45', 'D2, D3, D4'),
 ('Modal com reservar, espera, 409/422 e confirmação', '1:45–2:30', 'D5'),
 ('Minhas reservas', '2:30–3:00', 'D6'),
 ('Perfil, tema, acordeão', '3:00–3:25', 'D8'),
 ('Progresso (gráficos)', '3:25–3:40', 'D7'),
 ('375 px, Lighthouse, publicar e testar no servidor', '3:40–4:00', 'D9, D10'),
], [0.5, 0.2, 0.3])
D.p('Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
