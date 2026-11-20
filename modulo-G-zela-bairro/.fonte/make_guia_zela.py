import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_zela import SUB, TOTAL
OUT = sys.argv[1]
D = Doc('Guia do avaliador – roteiro de teste', 'Módulo G – Zela Bairro (Team Challenge)', 'SPSKILLS_MG_ZELABAIRRO_GUIA_2026')

D.h('Introdução')
D.p(f'Este guia conduz a correção do Team Challenge Zela Bairro, igual para todas as equipes. São {len(SUB)} subcritérios e {sum(len(s[2]) for s in SUB)} aspectos, total {TOTAL:.2f} pontos ('.replace('.', ',') + 'na escala do simulado de Jacareí, multiplique por 0,2). A planilha CIS_Modulo_G_Zela_Bairro.xlsx tem a coluna O "Nota obtida" e a coluna Q para a evidência.')
D.p('Ordem recomendada: G6 durante o pitch (julgamento, três avaliadores), depois G1 e G2 com Postman, depois G3, G4 e G5 no navegador.')

D.h('Preparação')
D.i(0, '1. Chrome com DevTools aberto na aba Rede (Network) e Console. Janela normal para o morador e janela anônima para a equipe.')
D.i(0, '2. Postman com a variável base_url = http://IP/TEAM_X_modulo_g/api. Ou use o arquivo gabarito-avaliador/testes-api.sh (curl), que imprime o código HTTP de cada caso.')
D.i(0, '3. Uma foto JPG pequena (até 2 MB), uma imagem com mais de 2 MB e um arquivo texto renomeado para falso.jpg.')
D.i(0, '4. Usuário da equipe: marta / Zela@2026.')
D.i(0, '5. Se a equipe já mexeu nos dados durante o pitch, os números mudam. Os valores esperados abaixo valem para a carga inicial e para a data de 19/11/2026; "atrasado" depende do dia: confira pela regra (prazo_em menor que agora e situação em andamento).')
D.i(0, '6. gabarito-avaliador/checar-zela.js (Playwright) roda 24 verificações automáticas contra a solução de referência. Serve para comparar comportamento, não substitui o roteiro.')

D.h('Valores de referência (carga inicial, 19/11/2026)')
D.tabela([
 ('Conferência', 'Esperado'),
 ('GET api/chamados', '16 chamados; o primeiro é ZB-2026-0011 (aberto em 18/11/2026 18:20)'),
 ('Por situação', 'aberto 5 · triagem 3 · execução 3 · concluído 4 · cancelado 1'),
 ('Atrasados', 'Depende do dia da correção: use a tabela de prazos abaixo (atrasado = prazo já passou). Em 19/11/2026 às 10h eram 4: 0001, 0005, 0006 e 0015.'),
 ('Indicadores', '% no prazo 50 (2 de 4 concluídos) · tempo médio 3,3 dias'),
 ('ZB-2026-0006', 'Calçada, aberto 03/11/2026 10:20, prazo 18/11/2026 (15 dias)'),
 ('ZB-2026-0007', 'Concluído, aberto 28/10/2026 14:00, concluído 31/10/2026 16:30, no prazo'),
 ('Busca "CALCADA"', '3 cards (Entulho na calçada da escola, Calçada quebrada perto da UBS, Cano estourado na calçada)'),
], [0.35, 0.65])

D.s('Prazos dos chamados em andamento (carga inicial)')
D.tabela([('Protocolo', 'Situação', 'Prazo (vence em)')] + [('ZB-2026-0006', 'triagem', '18/11/2026 10:20'), ('ZB-2026-0015', 'execucao', '16/11/2026 13:30'), ('ZB-2026-0001', 'execucao', '14/11/2026 08:12'), ('ZB-2026-0012', 'aberto', '26/11/2026 11:10'), ('ZB-2026-0003', 'triagem', '22/11/2026 07:30'), ('ZB-2026-0005', 'execucao', '16/11/2026 09:00'), ('ZB-2026-0002', 'aberto', '19/11/2026 19:40'), ('ZB-2026-0004', 'aberto', '21/11/2026 12:05'), ('ZB-2026-0014', 'triagem', '20/11/2026 21:00'), ('ZB-2026-0009', 'aberto', '28/11/2026 08:45'), ('ZB-2026-0011', 'aberto', '23/11/2026 18:20')], [0.3, 0.3, 0.4])

D.h('Roteiro por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome}')
    for k, (t, desc, ded, req, wsos, mx, jud) in enumerate(asp, 1):
        D.p(f'{desc}', f'{sid}.{k} ({t}, {mx:.2f}) – '.replace('.', ',', 1) if False else f'{sid}.{k} ({t}, {str(f"{mx:.2f}").replace(".", ",")}) – ')
        if t == 'M':
            D.i(1, f'Como verificar: {req}')
            D.i(1, f'Pontuação: {ded}')
        else:
            for n, txt in enumerate(jud):
                D.i(1, f'{n} – {txt}')

D.h('Casos de API (G2) passo a passo')
D.code('''# 1. Lista e campos calculados
GET  {{base_url}}/chamados                       -> 200, sem "apoiadores"
# 2. Criação
POST {{base_url}}/chamados   (corpo vazio)       -> 422 com titulo, descricao, categoria_id, rua, local
POST {{base_url}}/chamados   form-data completo  -> 201, protocolo ZB-2026-0017
POST ... foto=falso.jpg (texto)                  -> 422 erros.foto
# 3. Autenticação
PATCH {{base_url}}/chamados/2/status  {"status":"triagem"}            -> 401
POST  {{base_url}}/login {"usuario":"marta","senha":"x"}               -> 401
POST  {{base_url}}/login {"usuario":"marta","senha":"Zela@2026"}       -> 200 + token
# 4. Máquina de estados (Authorization: Bearer TOKEN)
PATCH /chamados/2/status {"status":"concluido"}                        -> 409
PATCH /chamados/2/status {"status":"voando"}                           -> 422
PATCH /chamados/3/status {"status":"aberto"}            (sem nota)     -> 422 erros.nota
PATCH /chamados/1/status {"status":"concluido"}                        -> 200, concluido_em preenchido
PATCH /chamados/1/status {"status":"triagem","nota":"reabrir..."}       -> 409 (concluído é final)
# 5. Apoio
POST /chamados/4/apoios {"dispositivo":"abc12345"}  -> 201
POST /chamados/4/apoios {"dispositivo":"abc12345"}  -> 409
POST /chamados/7/apoios {"dispositivo":"abc99999"}  -> 409 (encerrado)
# 6. Rotas
DELETE {{base_url}}/chamados -> 405      GET {{base_url}}/xyz -> 404''')

D.h('Plano de tempo esperado (para comentar no feedback)')
D.tabela([
 ('Momento', 'O que uma equipe bem organizada faz'),
 ('0:00–0:20', 'Planejamento: lê o contrato junto, divide pacotes, combina nomes (Estado, status, classes, funções) e escreve o PLANO.md.'),
 ('0:20–0:50', 'P1 entrega GET categorias e GET chamados; P5 entrega tokens, cabeçalho, rotas e modal base; P2/P3/P4 trabalham com o seed.'),
 ('0:50–1:25', 'P1 faz POST, PATCH, login e apoio; os outros trocam o seed pela API. Integração 1 por volta de 1:25.'),
 ('1:25–2:00', 'Interações finas (arrastar, teclado, gráficos, 375 px, tema).'),
 ('2:00–2:30', 'Integração 2, publicação, teste do fluxo do pitch, ensaio. Nada novo.'),
], [0.2, 0.8])

D.h('Erros mais prováveis (o que observar)')
for t in [
 'Equipe dividida por tela e não por arquivo: conflitos no mesmo index.html e CSS sobrescrito na integração.',
 'API sem Authorization chegando ao PHP (falta a linha SetEnvIf no .htaccess): tudo dá 401 mesmo com token.',
 '422 que devolve só o primeiro erro; 409 e 422 trocados; ordem das verificações errada (409 antes de 401).',
 'Datas com new Date("AAAA-MM-DD") mostrando o dia anterior.',
 'crypto.randomUUID() ou navigator.clipboard funcionando em localhost e quebrando no http://IP do servidor.',
 'Barra inferior do celular aparecendo no topo por causa de backdrop-filter no cabeçalho.',
 'Pino desalinhado porque a imagem do mapa ficou com altura fixa (letterbox).',
 'Pitch com só um integrante falando ou demonstração sem o fluxo completo.']:
    D.i(0, '• ' + t)
D.save(OUT)
print('ok', OUT)
