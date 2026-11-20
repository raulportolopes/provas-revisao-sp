import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_pulso import SUB, TOTAL
IMG = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de revisão – Front-end consumindo API REST', 'Módulo D – Pulso Academias: agenda de aulas', 'SPSKILLS_MD_PULSO_REVISAO_2026')

D.h('Introdução')
D.p('A Pulso Academias tem quatro unidades em São Paulo e quer trocar a agenda de papel da recepção por um aplicativo web em que o aluno reserva as aulas coletivas (bike, funcional, yoga, boxe e outras), acompanha a frequência e cuida do próprio perfil.')
D.p('O back-end já existe: é uma API REST em PHP, entregue pronta na pasta api/, que guarda os dados em arquivos JSON. Ela exige login com token, pagina os resultados no servidor, aplica as regras da academia (lotação, conflito de horário, limite diário, prazo de cancelamento) e responde com os códigos HTTP certos. A API devolve só os ids das tabelas relacionadas: o cruzamento dos dados é trabalho do front-end.')
D.p('Sua tarefa é construir a aplicação de página única (SPA) do aluno, consumindo essa API, com cinco telas, estados de carregamento, vazio e erro, tema claro e escuro, gráficos feitos com CSS e boa experiência em 1440, 768 e 375 px.')
D.p('Este é um projeto de revisão, de 3 a 5 vezes mais trabalhoso que o Módulo D do simulado estadual. A solução comentada está na pasta solucao-comentada/ e o passo a passo em ESTUDO_GUIADO.md. A Pulso Academias é fictícia.')

D.h('Descrição do projeto')
D.p('Tempo sugerido: 4 horas (mais 30 minutos de leitura). Pontuação: 30,00.')
D.p('Você pode usar HTML5, CSS3 e JavaScript puro (módulos ES) ou Vue 3 com os recursos da lista de infraestrutura. Não use bibliotecas de componentes, de CSS ou de gráficos. Os prints da pasta design/ mostram o resultado esperado e os estados das interações; toda animação tem vídeo de referência em design/videos/ e todos estão juntos em design/Design.mp4 (o cursor aparece como um círculo azul e as teclas pressionadas aparecem na tela). As datas dos prints são as do dia em que foram gerados; a sua aplicação mostra as datas do dia em que rodar.')

D.h('A API')
D.p('Endereço base (relativo ao index.html): api/index.php. As rotas vêm depois do index.php, por exemplo api/index.php/aulas?data=2026-11-24. Se o Apache não aceitar o caminho depois do .php, use api/index.php?rota=/aulas&data=2026-11-24. O corpo das requisições POST e PATCH é JSON (Content-Type: application/json), menos o envio da foto, que é multipart (FormData).')
D.p('Rotas protegidas exigem o cabeçalho Authorization: Bearer <token>. O token vale 30 minutos. A pasta api/dados/ precisa ter permissão de escrita no servidor (ela é criada sozinha na primeira requisição).')
D.tabela([
 ('Método e rota', 'Token', 'O que faz / respostas'),
 ('POST /login', 'não', '{email, senha} → 200 {token, usuario}; 422 {erros:{email, senha}}; 401 e-mail ou senha incorretos'),
 ('POST /logout', 'sim', 'Encerra o token → 204'),
 ('GET /me', 'sim', 'Dados do aluno → 200 {dados}'),
 ('PATCH /me', 'sim', '{nome, telefone, unidade_id, meta_mensal} → 200 {dados}; 422 {erros por campo}'),
 ('POST /me/foto', 'sim', 'multipart, campo "foto" (JPG, PNG ou WEBP até 2 MB) → 200 {dados} com foto; 422'),
 ('GET /me/progresso', 'sim', '{meta_mensal, meses:[{mes:"2026-06", total}], por_modalidade:[{modalidade_id, total}], total_aulas, total_minutos}'),
 ('GET /unidades, /modalidades, /instrutores, /regras', 'não', 'Catálogos → 200 {dados:[...]}'),
 ('GET /aulas', 'opcional', 'Parâmetros: data (AAAA-MM-DD, hoje até +13 dias), unidade_id, modalidade_id (ids separados por vírgula), periodo (manha, tarde, noite), somente_vagas=1, busca, ordem (horario, vagas, modalidade), pagina, por_pagina (até 30) → 200 {dados, meta}; 422 se algum parâmetro for inválido. Com token, cada aula traz minha_reserva_id e minha_posicao_espera.'),
 ('GET /aulas/{id}', 'opcional', 'Uma aula com a descricao da modalidade → 200; 404'),
 ('POST /aulas/{id}/espera', 'sim', 'Entra na lista de espera → 201 {dados:{posicao}}; 409 AULA_COM_VAGAS ou JA_NA_ESPERA; 422 se já começou'),
 ('DELETE /aulas/{id}/espera', 'sim', 'Sai da lista de espera → 204; 404'),
 ('GET /reservas', 'sim', 'tipo (proximas, historico, canceladas), pagina, por_pagina (até 20) → 200 {dados, meta}'),
 ('POST /reservas', 'sim', '{aula_id} → 201 {dados}; 404; 422 aula já começou; 409 com codigo JA_RESERVADA, CONFLITO_HORARIO, LIMITE_DIARIO ou AULA_LOTADA'),
 ('DELETE /reservas/{id}', 'sim', 'Cancela → 200 {dados}; 422 PRAZO_ENCERRADO (menos de 2 h); 409 JA_CANCELADA ou JA_CONCLUIDA; 404'),
 ('POST /sessao/expirar', 'sim', 'Apoio ao teste: faz o token atual vencer na hora → 204'),
 ('POST /reset', 'não', 'Apoio ao teste: volta os dados ao estado inicial'),
], [0.26, 0.12, 0.62])
D.s('Formatos da API')
D.i(0, '• Lista paginada: {"dados": [...], "meta": {"pagina": 2, "por_pagina": 6, "total": 16, "total_paginas": 3}}.')
D.i(0, '• Erro: {"mensagem": "Texto para o usuário", "erros": {"campo": ["mensagem"]}, "codigo": "AULA_LOTADA"}. Os campos erros e codigo só aparecem quando fazem sentido.')
D.i(0, '• Aula: id, modalidade_id, instrutor_id, unidade_id, sala, nivel, inicio e fim (ex.: "2026-11-24T07:00:00-03:00"), duracao_min, capacidade, vagas_ocupadas, vagas_livres, lotada, fila_espera, status (agendada, em_andamento, encerrada).')
D.i(0, '• Reserva: id, aula_id, status (ativa, concluida, cancelada), modalidade_id, instrutor_id, unidade_id, sala, inicio, fim, criada_em e cancelada_em. Atenção: criada_em e cancelada_em vêm em UTC (terminam com Z).')
D.i(0, '• A API demora de propósito entre 0,2 e 0,9 s, e as respostas podem chegar fora de ordem.')
D.p('Conta de teste: aluno@pulso.com.br, senha Pulso2026!. Outra conta: ana@pulso.com.br, mesma senha.')

D.h('Telas e requisitos')
D.s('1. Estrutura, rotas e sessão')
D.i(0, '1.1. Rotas por hash, sem recarregar: #/entrar, #/agenda, #/reservas, #/progresso e #/perfil. Endereço vazio ou desconhecido abre a agenda.')
D.i(0, '1.2. Cabeçalho com logotipo, menu (ícone e texto) e, à direita, botão de tema e avatar com o primeiro nome. O link da rota atual tem a classe ativo e aria-current="page", também depois de F5 e do botão Voltar. O título da aba muda por rota ("Agenda · Pulso Academias").')
D.i(0, '1.3. Sem token, qualquer rota interna leva ao login; depois de entrar, o aluno volta para a rota que tentou abrir.')
D.i(0, '1.4. Qualquer resposta 401 da API (token vencido) apaga a sessão e leva ao login com o aviso "Sua sessão expirou. Entre novamente para continuar de onde parou."; depois do login o aluno volta para a mesma tela.')
D.i(0, '1.5. Ao trocar de rota, o foco vai para o conteúdo principal.')

D.s('2. Entrar (#/entrar)')
D.i(0, '2.1. Tela dividida: arte à esquerda (img/entrar.jpg com a frase "Seu treino. No seu ritmo.") e o formulário à direita, como no print.')
D.i(0, '2.2. Erros 422 embaixo de cada campo, com aria-invalid; erro 401 num aviso acima do formulário. Botão "Mostrar" alterna a senha (aria-pressed).')
D.i(0, '2.3. Durante o envio, o botão fica desabilitado com o texto "Entrando…" e uma rodinha.')

D.s('3. Agenda (#/agenda)')
D.i(0, '3.1. Saudação conforme a hora ("Bom dia", "Boa tarde", "Boa noite") com o primeiro nome, título "Agenda de aulas".')
D.i(0, '3.2. Faixa com 14 dias a partir de hoje, como abas ARIA: "Hoje", "Amanhã" e depois o dia da semana abreviado, o número do dia e o mês abreviado. Setas ← → (circular), Home e End trocam o dia.')
D.i(0, '3.3. Painel de filtros: Buscar (modalidade ou instrutor), Unidade (select), Período (Todos, Manhã, Tarde, Noite), Ordenar por (Horário, Mais vagas livres, Modalidade A–Z), interruptor "Só aulas com vaga", chips de modalidade com seleção múltipla e botão "Limpar filtros". Todos os filtros vão para a API como parâmetros.')
D.i(0, '3.4. A busca espera o aluno parar de digitar (cerca de 300 ms) antes de pedir à API.')
D.i(0, '3.5. Contador "16 aulas encontradas · página 1 de 3" em região aria-live.')
D.i(0, '3.6. Paginação do servidor com 6 aulas por página, conforme o modelo do print. Qualquer mudança de dia, filtro, busca ou ordem volta para a página 1.')
D.i(0, '3.7. O estado inteiro fica na URL com os parâmetros data, unidade, modalidades, periodo, vagas, busca, ordem e pagina. Exemplo: #/agenda?data=2026-11-24&modalidades=1,7&periodo=noite&vagas=1. F5 ou link colado restauram a tela.')
D.i(0, '3.8. Só a resposta do último pedido pode ser desenhada (cancele ou ignore os anteriores).')
D.i(0, '3.9. Card: faixa colorida da modalidade no topo, imagem com o horário "18:30 – 19:20" sobreposto, etiqueta de situação, nome da modalidade, instrutor com foto, unidade e sala, nível e duração, barra de ocupação (verde, laranja a partir de 75%, vermelha quando lotada) com "16 de 20 vagas ocupadas" e o botão "Ver detalhes".')
D.i(0, '3.10. Etiquetas: "Reservada", "Na fila · 2º", "Lotada · 2 na fila", "Últimas 3 vagas", "9 vagas", "Encerrada", "Em andamento". Na última hora antes do início, mostrar "começa em 25 min".')
D.i(0, '3.11. Efeito: com o mouse, o card inclina em 3D para o lado do cursor e um brilho acompanha o ponteiro (vídeo 05). Sem o efeito em telas de toque e com prefers-reduced-motion.')
D.i(0, '3.12. Estados: carregando (esqueleto com brilho), vazio ("Nenhuma aula com esses filtros") e erro com "Tentar novamente".')

D.s('4. Modal da aula')
D.i(0, '4.1. "Ver detalhes" abre um modal que busca GET /aulas/{id} e mostra imagem, etiqueta, data por extenso ("Segunda-feira, 24 de novembro de 2026, das 07:00 às 07:50"), descrição, instrutor, local com endereço, nível, intensidade (1 a 3 pontos), gasto médio em kcal e ocupação.')
D.i(0, '4.2. Acessibilidade do modal: role="dialog", aria-modal="true", aria-labelledby; o foco entra no modal e Tab não sai dele; fecha com Esc, X e clique no fundo (clique dentro não fecha); ao fechar, o foco volta ao botão que abriu; o fundo não rola.')
D.i(0, '4.3. Um único botão de ação, conforme a situação: "Reservar vaga", "Cancelar reserva", "Entrar na lista de espera", "Sair da lista de espera" ou desabilitado ("Aula encerrada" / "Aula em andamento").')
D.i(0, '4.4. Depois de cada ação, o modal e o card são atualizados sem recarregar a página e aparece um toast ("Reserva confirmada!", "Reserva cancelada.", "Você entrou na lista de espera (3º lugar).").')
D.i(0, '4.5. Erros 409 e 422: a mensagem da API aparece dentro do modal. Se o código for AULA_LOTADA, o modal é recarregado e passa a oferecer a lista de espera.')
D.i(0, '4.6. Cancelar uma reserva pede confirmação num segundo modal (não use window.confirm): "Cancelar reserva?" com os botões "Manter" e "Cancelar reserva".')

D.s('5. Minhas reservas (#/reservas)')
D.i(0, '5.1. Abas Próximas, Histórico e Canceladas (padrão ARIA, com teclado), cada uma com a quantidade vinda do meta.total.')
D.i(0, '5.2. Lista paginada pelo servidor (5 por página). Estado na URL: #/reservas?aba=historico&pagina=2.')
D.i(0, '5.3. Item: bloco de data (dia da semana, dia, mês), modalidade, horário, unidade, sala e instrutor, e a linha "Reservada em 18/11/2026 às 14:59" ou "Cancelada em ..." no horário de Brasília.')
D.i(0, '5.4. Próximas: etiqueta "amanhã" / "em 3 dias" / "em 2 h" e botão Cancelar, desabilitado com o texto "Prazo de cancelamento encerrado" quando faltar menos de 2 horas. Cancelar atualiza lista e contagens sem F5.')

D.s('6. Progresso (#/progresso)')
D.i(0, '6.1. Quatro indicadores: aulas concluídas, tempo de treino ("50h05"), média por mês com vírgula ("9,2") e anel da meta do mês atual com a porcentagem e "8/12".')
D.i(0, '6.2. Gráfico de barras dos 6 meses, só com HTML e CSS: altura proporcional, mês abreviado embaixo, linha tracejada da meta com o texto "Meta: 12 aulas", barras que bateram a meta em verde, animação de crescimento ao abrir e balão "agosto de 2026 / 11 aulas" no hover e no foco do teclado.')
D.i(0, '6.3. Rosca por modalidade com conic-gradient (cores das modalidades) e legenda com total e porcentagem.')
D.i(0, '6.4. Uma tabela com os mesmos números, escondida visualmente, para leitores de tela.')

D.s('7. Perfil (#/perfil)')
D.i(0, '7.1. Foto: botão "Escolher foto" e área de arrastar e soltar (destacada durante o arraste). Validar no navegador (JPG, PNG ou WEBP, até 2 MB), mostrar a prévia na hora, enviar com FormData no campo "foto" e, se a API recusar, voltar a foto anterior com a mensagem de erro.')
D.i(0, '7.2. Dados pessoais: nome, e-mail (só leitura), celular com máscara (11) 91234-5678 enquanto digita, unidade preferida e meta mensal (range de 4 a 30 com o valor ao lado). "Salvar alterações" só habilita quando algo muda; erros 422 embaixo dos campos; o nome do cabeçalho muda na hora.')
D.i(0, '7.3. Aparência: Claro, Escuro e Automático (segue o sistema), salvo no navegador e aplicado antes da página aparecer (sem piscar no F5). O botão do cabeçalho alterna claro/escuro e fica sincronizado com estas opções.')
D.i(0, '7.4. Regras da academia (GET /regras) em acordeão: um item aberto por vez, primeiro aberto ao carregar, botão com aria-expanded e aria-controls, abertura animada.')
D.i(0, '7.5. Botão "Sair da conta": POST /logout, apaga a sessão e volta ao login.')

D.h('Formatos')
D.i(0, '8. Datas em DD/MM/AAAA e horas em HH:MM, sempre no fuso de Brasília. Os campos com Z (UTC) precisam ser convertidos. Datas sem hora (membro_desde) não podem voltar um dia.')
D.i(0, '9. Números com separador brasileiro (9,2 e 1.200 kcal).')

D.h('Responsividade')
D.i(0, '10. 1440 px: filtros numa coluna de 300 px à esquerda, fixos ao rolar, e 3 cards por linha.')
D.i(0, '11. 768 px: filtros acima da lista, em duas colunas, e 2 cards por linha; gráficos um embaixo do outro.')
D.i(0, '12. 375 px: o menu vira barra fixa embaixo da tela, com ícone e texto, mantendo o link ativo; nada pode ficar escondido atrás dela; 1 card por linha; nenhuma rolagem horizontal; o modal vira uma folha que sobe de baixo e rola por dentro.')

D.h('Acessibilidade e código')
D.i(0, '13. Lighthouse > Acessibilidade no modo celular com 90 ou mais na agenda.')
D.i(0, '14. Link "Pular para o conteúdo", labels ligados aos campos, foco visível, imagens com alt, botões com área de toque de pelo menos 44 px.')
D.i(0, '15. CSS e JavaScript em arquivos separados (sem style, script inline ou onclick no HTML). O console não pode mostrar erros de JavaScript.')

D.h('Paleta e tipografia')
D.p('Tema claro: fundo #F6F5FA, superfície #FFFFFF, borda #DEDAEA, texto #15121F e #5B566B, primária #E5193F, secundária #5B3DF5, sucesso #15803D, aviso #B45309, perigo #C81E1E. Tema escuro: fundo #0E0C16, superfície #18151F, borda #332D40, texto #F3F1F8 e #ABA5BB, primária #FF4D6A, secundária #9B87FF. Cores das modalidades: campo cor da API.')
D.p('Fontes na pasta fonts/: Outfit (400 e 700) para títulos, menu, botões e números; Work Sans (400 e 700) para o texto.')

D.h('Materiais fornecidos')
D.tabela([
 ('Pasta/Arquivos', 'Descrição'),
 ('api/', 'API pronta (index.php, nucleo.php, .htaccess, semente/ com os dados iniciais). Não altere.'),
 ('img/', 'logo-pulso.svg, favicon.svg, vazio.svg, entrar.jpg, modalidades/ (8), instrutores/ (8), unidades/ (4)'),
 ('fonts/', 'Outfit e Work Sans (TTF) com a licença OFL'),
 ('design/', 'Prints das 5 telas em 1440 px, agenda e progresso em 768 px, as 5 telas em 375 px e a pasta estados/ com 22 interações'),
 ('design/videos/ e design/Design.mp4', '15 vídeos MP4, um por animação, e todos juntos'),
 ('DICAS.md', 'Pistas para a prova (sem código pronto)'),
], [0.3, 0.7])

D.h('Instruções de entrega')
D.i(0, '16. Projeto na pasta XX_modulo_d/ (XX = seu número), com index.html na raiz e as pastas css/, js/, api/, img/ e fonts/.')
D.i(0, '17. Publique em http://servidor/XX_modulo_d/, dê permissão de escrita em api/dados/ e api/uploads/ e teste no servidor antes do fim do tempo.')
D.i(0, '18. Se usar Vue com etapa de build, publique a pasta dist e deixe o código-fonte em XX_modulo_d/fonte/.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Descrição', 'Pontuação')]
for s in SUB: linhas.append((s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')))
linhas.append(('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)

D.pb()
D.h('Anexo A: telas em 1440 px')
for r, nome in (('entrar', 'Entrar'), ('agenda', 'Agenda'), ('reservas', 'Minhas reservas'), ('progresso', 'Progresso'), ('perfil', 'Perfil')):
    D.img(f'{IMG}/layout-1440-{r}.jpg', 15.5, f'{nome} – 1440 px')
    D.pb()
D.h('Anexo B: 768 px e 375 px')
D.imgs_lado([f'{IMG}/layout-768-agenda-topo.jpg', f'{IMG}/layout-768-progresso-topo.jpg'], 7.4, 'Agenda e Progresso em 768 px (página inteira em design/)')
D.pb()
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('entrar', 'agenda', 'reservas')], 4.9, 'Entrar, Agenda e Minhas reservas em 375 px')
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('progresso', 'perfil')] + [f'{IMG}/estado-22-modal-375.jpg'], 4.9, 'Progresso, Perfil e modal em 375 px')
D.pb()
D.h('Anexo C: vídeos das animações')
import json
leg = json.load(open(sys.path[0] + '/legendas.json'))
D.tabela([('Arquivo (design/videos/)', 'O que mostra')] + [(k + '.mp4', v.split('· ', 1)[1]) for k, v in leg.items()], [0.45, 0.55])
D.pb()
D.h('Anexo D: estados de interação')
EST = [('estado-01-login-erros-422', 'Login enviado vazio (422)'), ('estado-03-login-401', 'Senha errada (401)'),
       ('estado-04-filtros-combinados', 'Bike Indoor + HIIT, noite, só com vaga'), ('estado-05-sem-resultados', 'Busca sem resultado'),
       ('estado-06-carregando', 'Carregando (esqueleto)'), ('estado-07-erro-api', 'Erro da API'),
       ('estado-08-card-3d-hover-pagina-2', 'Página 2 com o cursor sobre o segundo card'), ('estado-09-modal-reservar', 'Modal de uma aula livre'),
       ('estado-10-reservada-toast', 'Depois de reservar'), ('estado-11-confirmar-cancelamento', 'Confirmação de cancelamento'),
       ('estado-12-modal-lotada-espera', 'Aula lotada'), ('estado-13-modal-conflito-409', 'Conflito de horário (409)'),
       ('estado-14-reservas-historico-pagina-2', 'Histórico, página 2'), ('estado-15-progresso-balao', 'Balão do gráfico'),
       ('estado-16-perfil-erros-422', 'Perfil com erros 422'), ('estado-19-tema-escuro-agenda', 'Tema escuro'),
       ('estado-20-tema-escuro-progresso', 'Progresso no tema escuro'), ('estado-21-sessao-expirada', 'Sessão expirada')]
for k, (f, cap) in enumerate(EST, 1):
    D.img(f'{IMG}/{f}.jpg', 14.0, f'{cap}.')
D.imgs_lado([f'{IMG}/estado-17-arrastando-foto.jpg', f'{IMG}/estado-18-acordeao.jpg'], 6.5, 'Arrastando a foto e acordeão das regras.')
D.save(OUT)
print('ok')
