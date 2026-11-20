import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_copa import SUB, TOTAL
OUT = sys.argv[1]
D = Doc('Guia do avaliador – roteiro de teste', 'Módulo G – Copa Code (Team Challenge)', 'SPSKILLS_MG_COPACODE_GUIA_2026')

D.h('Introdução')
D.p(f'Este guia conduz a correção do Team Challenge Copa Code, igual para todas as equipes. São {len(SUB)} subcritérios e {sum(len(s[2]) for s in SUB)} aspectos, total ' + f'{TOTAL:.2f}'.replace('.', ',') + ' pontos (na escala do simulado de Jacareí, multiplique por 0,2). A planilha CIS_Modulo_G_Copa_Code.xlsx tem a coluna O "Nota obtida" e a coluna Q para a evidência.')
D.p('Ordem recomendada: G6 durante o pitch (julgamento, três avaliadores); depois reimporte o banco da equipe e faça G1 e G2 com Postman ou com o script; por fim G3, G4 e G5 no navegador, seguindo o fluxo do torneio (inscrever → check-in → gerar → placares → campeã).')

D.h('Preparação')
D.i(0, '1. Chrome com DevTools aberto na aba Rede (Network) e Console. Janela normal para o público e janela anônima para a organização.')
D.i(0, '2. Postman com a variável base_url = http://IP/TEAM_X_modulo_g/api. Ou rode gabarito-avaliador/testes-api.sh (curl): 29 casos, imprime esperado | obtido | caso. Ele altera o banco: reimporte banco/copacode.sql antes e depois.')
D.i(0, '3. Usuário da organização: org / Copa@2026.')
D.i(0, '4. gabarito-avaliador/checar-copa.js (Playwright) roda verificações automáticas de navegador contra a solução de referência. Serve para comparar comportamento, não substitui o roteiro.')
D.i(0, '5. A contagem regressiva depende do relógio da máquina. Para ver o "AO VIVO", basta lançar placares até a próxima partida ter horário passado, ou mudar a data do computador para 28/11/2026.')

D.h('Valores de referência (banco recém-importado)')
D.tabela([
 ('Conferência', 'Esperado'),
 ('GET schools', '6 escolas, a primeira em ordem de nome é Colégio Técnico Itu'),
 ('GET teams', '9 equipes, 7 confirmadas. Ordem: Fênix Rubra, Bits Voadores, Lobos do Cerrado, Trovão Itu, Código Roxo, Maré Alta, Kernel Panic (check-ins de 18/11/2026 18:02 a 18:31), depois Sorocrew e Ipês Gamers'),
 ('Idades', 'Calculadas para 28/11/2026. Mako54 (Fênix Rubra, capitã, nascida em 06/05/2010) tem 16 anos'),
 ('Escolas lotadas', 'ETEC Fernando Prestes, SENAI Gaspar Ricardo Júnior e EE Júlio Prestes de Albuquerque já têm 2 equipes'),
 ('Filtro #/equipes?status=confirmed&escola=2', '2 equipes: Bits Voadores e Kernel Panic'),
 ('Busca "fenix"', '1 equipe (Fênix Rubra)'),
 ('Check-in da Sorocrew (id 8) e gerar', 'Seeds: 1 FNX, 2 BITS, 3 LOBO, 4 TRV, 5 CRX, 6 MARE, 7 KP, 8 SRC'),
 ('Quartas', 'Q1 09:00 FNX × SRC · Q2 10:00 TRV × CRX · Q3 11:00 BITS × KP · Q4 12:00 LOBO × MARE (todas em 28/11/2026)'),
 ('Semis e final', 'S1 14:00 = vencedor Q1 (lado a) × vencedor Q2 (lado b) · S2 15:00 = Q3 × Q4 · Final 17:00'),
 ('Ids das partidas na solução', 'final 1, semis 2 e 3, quartas 4 a 7 (a equipe pode ter outros ids; confira pela stage e position)'),
], [0.35, 0.65])

D.h('Roteiro por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome}')
    for k, (t, desc, ded, req, wsos, mx, jud) in enumerate(asp, 1):
        D.p(desc, f'{sid}.{k} ({t}, {str(f"{mx:.2f}").replace(".", ",")}) – ')
        if t == 'M':
            D.i(1, f'Como verificar: {req}')
            D.i(1, f'Pontuação: {ded}')
        else:
            for n, txt in enumerate(jud):
                D.i(1, f'{n} – {txt}')

D.h('Casos de API (G2) passo a passo')
D.code('''# Banco recém-importado. Corpo JSON (Content-Type: application/json)
GET   {{base_url}}/teams                          -> 200, 9 equipes, players com age
POST  {{base_url}}/teams  {}                      -> 422 name, tag, school_id, players
POST  ... tag "n-e", capitão nascido em 2014      -> 422 tag e players.0.birth_date
POST  ... name "Kernel Panic"                     -> 409 nome repetido
POST  ... school_id 1 (já tem 2)                  -> 409 escola com 2 equipes
POST  ... equipe válida                           -> 201 status registered
POST  ... nick já usado em outra equipe           -> 409 Nick já inscrito...
POST  {{base_url}}/teams/8/check-in  (sem token)  -> 401
POST  {{base_url}}/login {"username":"org","password":"Copa@2026"} -> 200 token
# com Authorization: Bearer TOKEN
POST  /bracket                  (7 confirmadas)   -> 409 "São necessárias 8... Há 7."
POST  /teams/1/check-in                           -> 409 já fez check-in
POST  /teams/8/check-in                           -> 200
POST  /teams/9/check-in                           -> 409 lista de espera
POST  /bracket                                    -> 201, 7 partidas
POST  /bracket                                    -> 409 já gerado
POST  /teams (válida)                             -> 409 inscrições encerradas
DELETE /teams/9                                   -> 409 depois do chaveamento
PATCH /matches/{Q1}/score {"score_a":3,"score_b":0} -> 422 errors.score
PATCH /matches/{S1}/score {"score_a":2,"score_b":0} -> 409 sem as duas equipes
PATCH /matches/{Q1}/score {"score_a":2,"score_b":1} -> 200, S1.team_a = FNX
PATCH /matches/{Q1}/score {"score_a":0,"score_b":2} -> 200, S1.team_a = SRC (correção)
PATCH /matches/{Q2}/score ... e /matches/{S1}/score  -> 200
PATCH /matches/{Q1}/score ...                     -> 409 próxima já tem resultado
DELETE /bracket                                   -> 409 já há placar
PUT   /teams -> 405        GET /xyz -> 404        PATCH /matches/999/score -> 404 (com token)''')

D.h('Roteiro de navegador (G3 a G5) em ordem')
for t in [
 'Abrir #/xyz: vai para Equipes. Conferir aria-current no link e o título da aba.',
 'Equipes: digitar "fenix", escolher escola, clicar nos chips; dar F5 e Voltar. Abrir dois acordeões seguidos.',
 'Inscrição: enviar vazio (foco no nome), digitar "Kernel Panic" no nome (aviso de repetido), tag "c m t" (vira CMT), escola lotada desabilitada, adicionar e remover reserva, data 01/01/2015 (erro de idade). Inscrever uma equipe válida na escola SESI Salto ou ETEC Rubens de Faria.',
 'Área da organização: senha errada, depois certa. F5 mantém o login. Excluir a equipe criada digitando a tag.',
 'Fazer o check-in da Sorocrew: barra 8/8, Ipês vira "Lista de espera", Gerar habilita. Gerar: vai para a chave; Inscrição mostra "encerradas".',
 'Partidas: setas nas abas, contagem rodando, lançar as quartas e conferir a chave (vencedor chegando animado nas semis). Lançar semis e final: troféu e confete.',
 'Sair de Partidas e voltar várias vezes: o relógio não pode acelerar (sinal de setInterval não destruído).',
 'Modo telão: entrar pelo botão e sair com Esc; o texto do botão volta para "Modo telão".',
 'Em outra aba, apagar os tokens (DELETE FROM api_tokens) e tentar lançar um placar: toast de erro e a organização sai.',
 'DevTools 375 × 812 e 768 × 1024 em todas as telas: sem rolagem horizontal da página.']:
    D.i(0, '• ' + t)

D.h('Plano de tempo esperado (para comentar no feedback)')
D.tabela([
 ('Momento', 'O que uma equipe bem organizada faz'),
 ('0:00–0:20', 'Planejamento: lê o contrato junto, divide pacotes, combina store, nomes das fases e componentes comuns e escreve o PLANO.md.'),
 ('0:20–0:50', 'P1 importa o banco e entrega GET schools/teams e login; P5 entrega index.html, store, rotas, casca e modal; P2/P3/P4 montam as telas com dados de exemplo.'),
 ('0:50–1:20', 'P1 faz POST teams (422/409), check-in, bracket e score; telas trocam o exemplo pela API. Integração 1 por volta de 1:20.'),
 ('1:20–2:00', 'Interações finas (reserva animada, acordeão, caminho na chave, telão, contagem, 375 px).'),
 ('2:00–2:30', 'Integração 2, publicação, reimportar o banco, fluxo do pitch, ensaio. Nada novo.'),
], [0.2, 0.8])

D.h('Erros mais prováveis (o que observar)')
for t in [
 'Vue carregado de CDN: sem internet a tela fica branca.',
 'Scripts na ordem errada: tela usada antes de ser definida, ou app montado antes das telas existirem.',
 'API sem Authorization chegando ao PHP (falta SetEnvIf no .htaccess): tudo dá 401 mesmo com token.',
 'PDO sem ERRMODE_EXCEPTION ou mensagem do PDOException devolvida ao navegador (mostra usuário e tabela).',
 '422 que devolve só o primeiro erro, ou erro de jogador sem a chave players.N.campo.',
 'Idade calculada para hoje em vez de 28/11/2026; datas com new Date("AAAA-MM-DD") mostrando o dia anterior.',
 'Equipe criada sem transação: jogador inválido no meio deixa equipe sem jogadores no banco.',
 'Vencedor não vai para a próxima partida, ou vai para o lado errado (next_slot ignorado).',
 'setInterval não destruído no onUnmounted: o relógio acelera a cada visita.',
 'Foco pulando para o <main> a cada letra digitada na busca (afterEach que não confere a mudança de tela).',
 'Pitch com só um integrante falando ou demonstração sem o fluxo completo.']:
    D.i(0, '• ' + t)
D.save(OUT)
print('ok', OUT)
