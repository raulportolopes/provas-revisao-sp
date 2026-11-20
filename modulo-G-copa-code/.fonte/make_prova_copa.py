import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_copa import SUB, TOTAL
DES = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de prova – Team Challenge (desafio em equipe)', 'Módulo G – Copa Code: torneio interescolar de e-sports', 'SPSKILLS_MG_COPACODE_REVISAO_2026')

D.h('Introdução')
D.p('Seis escolas técnicas da região de Sorocaba organizam a Copa Code, um torneio de e-sports entre equipes de estudantes, no sábado 28/11/2026. Hoje a inscrição é por planilha, o check-in é feito no papel e a chave do torneio é desenhada num quadro branco que ninguém consegue ver do fundo do ginásio.')
D.p('A coordenação quer um site em que as equipes se inscrevem sozinhas, a organização faz o check-in das 8 primeiras que chegam, gera o chaveamento com um clique, lança os placares da melhor de 3 e projeta a chave no telão, com a campeã aparecendo no fim do dia.')
D.p('Neste Team Challenge, a equipe constrói o produto inteiro (API em PHP com MySQL e front-end em Vue 3) dividindo o trabalho em cinco pacotes ligados por um contrato de API já combinado. No fim, a equipe apresenta o produto funcionando ao vivo.')
D.p('Esta é uma prova de revisão, mais difícil que o Team Challenge do simulado de Jacareí: o escopo é fechado, todas as funções são obrigatórias, o front-end usa um framework e a nota mede a integração entre as partes.')

D.h('Formato e tempo')
D.tabela([
 ('Item', 'Como funciona'),
 ('Equipe', '3 a 5 competidores. Com 4, a tela Partidas (P5) vai para o integrante do P4. Com 3, um integrante faz P1, outro P2 + P3 e outro P4 + P5.'),
 ('Planejamento', '20 minutos, todos juntos, sem computador ligado: ler o contrato, dividir os pacotes e escrever o PLANO.md.'),
 ('Desenvolvimento', '2 horas e 10 minutos. Integração 1 obrigatória por volta da metade; integração 2 trinta minutos antes do fim.'),
 ('Apresentação', '3 a 5 minutos por equipe, com demonstração ao vivo no servidor, logo após o fim do tempo.'),
 ('Internet', 'Não. Documentação offline (Zeal) permitida.'),
 ('Tecnologias', 'PHP 8 sem framework com PDO e MySQL (banco fornecido); Vue 3 e Vue Router 4 pelos arquivos de vendor/ (sem build, sem npm); HTML e CSS. Nenhuma outra biblioteca.'),
], [0.22, 0.78])

D.h('Materiais fornecidos (pasta XX-copa-code)')
D.tabela([
 ('Arquivo ou pasta', 'Conteúdo'),
 ('contrato-api.md', 'Contrato completo da API: rotas, corpos, respostas, códigos HTTP, mensagens de validação, regras de negócio e montagem do chaveamento. É a lei da prova.'),
 ('banco/copacode.sql', 'Banco MySQL pronto e normalizado (schools, teams, players, matches, organizers, api_tokens) com a carga inicial: 6 escolas, 9 equipes (7 confirmadas), 48 jogadores e o usuário org / Copa@2026. Importar de novo volta ao estado inicial.'),
 ('vendor/', 'vue.global.prod.js e vue-router.global.prod.js (builds globais) e a licença.'),
 ('img/', 'logo-copa.svg e favicon.svg.'),
 ('fonts/', 'Oswald (Medium e Bold) e Roboto (Regular e Bold) em woff2 e a licença.'),
 ('design/', 'Prints de cada tela em 1440, 768 e 375 px e a pasta estados/ com 16 prints de interações.'),
 ('design/videos/', 'Um vídeo MP4 por animação ou interação (13 vídeos), com o cursor visível, as teclas na tela e uma legenda amarela explicando o efeito. design/Design.mp4 junta todos (3 min 13 s).'),
 ('DICAS.md', 'Dicas de caminho para o planejamento e para cada pacote (sem código).'),
], [0.26, 0.74])
D.p('Se o texto deste enunciado e uma imagem divergirem, vale o texto. Os vídeos mostram tempo e tipo das animações; não é preciso acertar o milissegundo. O formato do campo de data (dd/mm/aaaa) segue o idioma do navegador.')

D.h('Os cinco pacotes')
D.p('Cada pacote tem seus próprios arquivos. Ninguém edita o arquivo de outro pacote sem combinar. O pacote P5 também é o responsável por juntar tudo e publicar.')
D.tabela([
 ('Pacote', 'Responsabilidade', 'Depende de'),
 ('P1 – API', 'Todas as rotas do contrato em api/, conexão PDO em config.php, transações, login com token, proteção de config.php e do .sql.', 'Banco (começa já)'),
 ('P2 – Inscrição', 'Tela de inscrição com lista dinâmica de jogadores, validação ao vivo, prévia, erros do servidor e sucesso.', 'Contrato; base do P5'),
 ('P3 – Equipes', 'Lista de equipes com filtros na URL, acordeão de jogadores, progresso, check-in, exclusão e o botão Gerar chaveamento.', 'Contrato; base do P5'),
 ('P4 – Chaveamento', 'Chave visual com conectores, caminho da equipe, animação de quem avança, campeã e modo telão.', 'Contrato; base do P5'),
 ('P5 – Base e Partidas', 'index.html, cliente da API, estado compartilhado, rotas, cabeçalho e menu, login, modal, toast, carregando/erro, tela Partidas, responsividade, merge e publicação.', 'Nada (começa já)'),
], [0.2, 0.55, 0.25])

D.h('Requisitos')
D.s('1. Entrega e organização')
D.i(0, '1.1. Pasta TEAM_X_modulo_g (X = letra da equipe) no servidor, abrindo em http://IP/TEAM_X_modulo_g/ sem erro no console. Vue e Vue Router carregados da própria pasta. Nenhum caminho absoluto de máquina.')
D.i(0, '1.2. PLANO.md na raiz: nome de cada integrante, pacote, arquivos de cada um, horários das integrações e o roteiro do pitch.')
D.i(0, '1.3. config.php e o arquivo .sql não podem ser lidos pelo navegador. Nenhuma resposta da API mostra senha, caminho do servidor ou mensagem do PDO.')

D.s('2. API (P1) – conforme contrato-api.md')
D.i(0, '2.1. Todas as rotas do contrato, sempre em JSON, com 404 para rota inexistente e 405 para método errado. Ordem das verificações: 401, 404, 422, 409.')
D.i(0, '2.2. GET teams com a escola aninhada e os jogadores (capitão primeiro) com a idade calculada para 28/11/2026. Sem consulta dentro de laço.')
D.i(0, '2.3. POST teams: 422 com todos os erros de uma vez, incluindo as chaves players.N.campo; 409 para as regras de negócio; equipe e jogadores gravados numa transação; 201 com a equipe criada.')
D.i(0, '2.4. Check-in só para equipe inscrita, no máximo 8 confirmadas; exclusão apaga os jogadores junto (ON DELETE CASCADE do banco); nada disso depois do chaveamento.')
D.i(0, '2.5. Chaveamento: exatamente 8 confirmadas, seed pela ordem de check-in, confrontos e horários do contrato, partidas futuras ligadas por next_match_id e next_slot.')
D.i(0, '2.6. Placar: só resultados possíveis da melhor de 3; o vencedor entra sozinho na próxima partida; correção permitida só enquanto a próxima não tiver resultado.')
D.i(0, '2.7. Rotas da organização com Authorization: Bearer; login devolve token e nome.')

D.s('3. Base, rotas e componentes (P5)')
D.i(0, '3.1. Quatro telas sem recarregar a página: #/inscricao, #/equipes, #/chaveamento e #/partidas/:fase (quartas, semis ou final; #/partidas abre quartas). # e rota desconhecida abrem Equipes.')
D.i(0, '3.2. Link da tela atual com a classe active e aria-current="page", também em /partidas/semis e depois de F5 e do Voltar. Título da aba no formato "Chaveamento – Copa Code". A tela nova entra com transição.')
D.i(0, '3.3. Cabeçalho com logotipo (leva a Equipes), menu com ícone e texto e o botão "Área da organização", que vira "Organização: nome" + "Sair" depois do login. O login fica salvo durante a sessão do navegador.')
D.i(0, '3.4. Modal único reutilizado por todas as telas: fecha com Esc, X e clique no fundo, prende a rolagem da página e devolve o foco a quem abriu.')
D.i(0, '3.5. Estado de carregamento e estado de erro da API com "Tentar novamente", que refaz os pedidos sem F5. Mensagens curtas (toast) para sucesso e erro. Uma resposta 401 em qualquer tela desfaz o login.')
D.i(0, '3.6. Ao trocar de tela, o foco vai para o conteúdo principal; ao mudar só filtro ou aba, o foco não sai do lugar.')

D.s('4. Inscrição (P2)')
D.i(0, '4.1. Campos da equipe: nome, tag (sempre em maiúsculas, só letras e números, até 4) e escola. Escolas que já têm 2 equipes aparecem desabilitadas. Uma prévia mostra o selo com a tag e a cor da escola, o nome e a escola enquanto a pessoa digita.')
D.i(0, '4.2. Cinco linhas de jogador (nick, nome completo, nascimento) e um rádio de capitão em cada titular. "+ Adicionar reserva" cria a sexta linha (marcada como reserva, sem rádio) e põe o foco no nick dela; "Remover reserva" tira a linha e devolve o foco ao botão. A linha entra e sai animada.')
D.i(0, '4.3. Validação ao vivo com as mesmas regras e mensagens do contrato: o erro aparece embaixo do campo depois que ele foi tocado e some quando é corrigido. Nome, tag ou nick já usados por outra equipe são avisados antes do envio. Ao lado do rótulo de nascimento aparece "N anos em 28/11".')
D.i(0, '4.4. Ao enviar com erro, todos os erros aparecem e o foco vai para o primeiro campo inválido. Erro 422 do servidor aparece no campo da chave correspondente (players.2.nickname = nick da 3.ª linha); 409 aparece em toast.')
D.i(0, '4.5. Sucesso: o formulário dá lugar a um cartão com o selo, "<nome> está inscrita!", a escola e os botões "Inscrever outra" e "Ver equipes". Depois do chaveamento, a tela mostra "Inscrições encerradas" com o atalho para a chave.')

D.s('5. Equipes (P3)')
D.i(0, '5.1. Barra de progresso "N de 8 confirmadas" (role="progressbar") que cresce animada.')
D.i(0, '5.2. Filtros combinados: busca por nome, tag ou nick de jogador sem diferenciar acentos e maiúsculas; select de escola; chips Todas, Confirmadas e Aguardando check-in (aria-pressed). Os três ficam na URL (busca, escola, status), voltam com F5 e não enchem o histórico do Voltar. Contador "N equipes". Sem resultado: aviso com "Limpar filtros".')
D.i(0, '5.3. Cartão: faixa e selo na cor da escola, nome, escola e cidade, situação (Confirmada/Aguardando), "Cabeça de chave nº N", "Check-in DD/MM/AAAA HH:MM" ou "Sem check-in", e o botão "N jogadores" que abre a lista (nick, nome, idade, Capitão/Reserva). Um aberto por vez, com animação de altura. Os cartões entram, saem e se reorganizam animados.')
D.i(0, '5.4. Só para a organização e antes do chaveamento: "Fazer check-in" (vira "Lista de espera" desabilitado quando já há 8), "Excluir" (modal que só habilita o botão quando a tag é digitada) e "Gerar chaveamento" (habilitado só com 8 confirmadas; ao gerar, vai para a chave).')

D.s('6. Chaveamento (P4)')
D.i(0, '6.1. Antes de gerar: aviso com o atalho "Ver confirmadas (N/8)" que abre Equipes já filtrada.')
D.i(0, '6.2. Quatro colunas: Quartas (em dois pares), Semifinais, Final e Campeão, com linhas de conexão entre as fases. Cada partida mostra a data e hora, as duas equipes (ou "A definir"), o placar; vencedor destacado e perdedor apagado. Clicar na partida abre a aba da fase em Partidas.')
D.i(0, '6.3. Hover ou foco numa equipe destaca todas as aparições dela (o caminho) e apaga o resto.')
D.i(0, '6.4. Quando uma equipe chega numa fase, ela entra deslizando no lugar de "A definir".')
D.i(0, '6.5. Com a final decidida, a coluna Campeão mostra o troféu brilhando, o selo grande, o nome e confete caindo (só CSS). Antes disso, "Final em 28/11 às 17:00".')
D.i(0, '6.6. Botão "Modo telão": a área da chave ocupa a tela inteira (Fullscreen API) com o título "COPA CODE 2026" e letras maiores. O botão vira "Sair do telão" (aria-pressed) e volta ao normal também quando a pessoa sai com Esc.')

D.s('7. Partidas (P5)')
D.i(0, '7.1. Quadro "Próxima partida" com fase, data, equipes e contagem regressiva em dias, horas, minutos e segundos atualizada a cada segundo ("AO VIVO" pulsando quando o horário passa; "Torneio encerrado – Campeã: nome" no fim). O relógio para de rodar quando a pessoa sai da tela.')
D.i(0, '7.2. Abas Quartas de final, Semifinais e Final com o contador "jogadas/total". A aba ativa é a da rota (F5 mantém); setas ← → trocam de aba e levam o foco junto (padrão ARIA de abas).')
D.i(0, '7.3. Cartão de partida: hora, situação (Aguardando, Agendada, Encerrada), selos e nomes, placar e, para a organização, "Lançar placar" ou "Corrigir placar".')
D.i(0, '7.4. Modal de placar com as quatro opções da melhor de 3 (tags, placar e "vence <equipe>"). Depois de salvar: toast "<equipe> avança." ou "<equipe> é campeã da Copa Code!"; 409 em toast.')

D.s('8. Responsividade, acessibilidade e apresentação')
D.i(0, '8.1. 768 px: menu em segunda linha do cabeçalho, formulário em uma coluna, sem nada cortado.')
D.i(0, '8.2. 375 px: menu em barra inferior fixa (ícone + texto), cartões em uma coluna, chave com rolagem lateral só dentro dela, nenhuma rolagem horizontal da página e nada escondido atrás da barra.')
D.i(0, '8.3. Link "Pular para o conteúdo", foco visível, label em todos os campos e prefers-reduced-motion respeitado.')
D.i(0, '8.4. Pitch de 3 a 5 minutos com todos os integrantes. Fluxo obrigatório: inscrever uma equipe → check-in até 8 → gerar → lançar placares → campeã no telão.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Nome', 'Pontos')] + [(s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')) for s in SUB] + [('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ','))]
D.tabela(linhas, [0.18, 0.62, 0.2])
D.p('A ficha tem 5,00 pontos para dar peso de revisão. Para usar na escala do simulado de Jacareí (1,00 ponto), multiplique a nota por 0,2.')

D.h('Instruções para os competidores')
for k, t in enumerate([
 'Os 20 minutos de planejamento são em equipe e sem computador. Saiam deles com o PLANO.md escrito.',
 'Importem o banco antes de qualquer outra coisa e confiram usuário e senha do MySQL do servidor.',
 'Desenvolvam cada pacote nos próprios arquivos e integrem nos dois horários combinados.',
 'A pasta final se chama TEAM_X_modulo_g e fica em http://IP/TEAM_X_modulo_g/ (o IP é informado pelos avaliadores).',
 'Depois da integração 2, ninguém começa função nova: reimportem o banco e testem o fluxo do pitch do começo ao fim.',
 'Ao final do tempo, a equipe apresenta com todos os integrantes.'], 1):
    D.i(0, f'{k}. {t}')

D.pb()
D.h('Anexo A – Layout de referência (1440 px)')
for n, leg in (('equipes', 'Equipes'), ('inscricao', 'Inscrição'), ('chaveamento', 'Chaveamento (quartas jogadas)'), ('partidas', 'Partidas – Semifinais')):
    D.img(f'{DES}/layout-1440-{n}.png', 15.5, f'{leg} – 1440 px')
D.pb()
D.h('Anexo B – 768 px e 375 px')
D.imgs_lado([f'{DES}/layout-768-equipes.png', f'{DES}/layout-375-equipes.png'], 7.2, 'Equipes em 768 px e 375 px')
D.imgs_lado([f'{DES}/layout-375-inscricao.png', f'{DES}/layout-375-chaveamento.png', f'{DES}/layout-375-partidas.png'], 5, 'Inscrição, Chaveamento e Partidas em 375 px')
D.pb()
D.h('Anexo C – Estados das interações')
est = [('01-filtros-na-url', 'Filtros vindos da URL'), ('02-acordeao-e-hover', 'Acordeão e hover'), ('03-inscricao-erros', 'Inscrição: todos os erros'),
       ('04-inscricao-reserva-e-idade', 'Reserva, idade e nick já usado'), ('06-inscricao-sucesso', 'Inscrição concluída'), ('07-login-organizacao', 'Área da organização'),
       ('08-equipes-organizacao', 'Equipes para a organização'), ('09-excluir-exige-tag', 'Excluir exige a tag'), ('10-chaveamento-gerado', 'Chaveamento gerado'),
       ('11-caminho-da-equipe', 'Caminho da equipe'), ('12-modal-placar', 'Modal de placar'), ('13-campea', 'Campeã'),
       ('14-torneio-encerrado', 'Partidas: torneio encerrado'), ('15-modo-telao', 'Modo telão'), ('16-erro-api', 'Erro da API')]
for i in range(0, len(est), 2):
    par = est[i:i + 2]
    D.imgs_lado([f'{DES}/estados/estado-{n}.png' for n, _ in par], 7.8, ' | '.join(l for _, l in par))
D.h('Anexo D – Vídeos de referência')
D.tabela([('Vídeo (design/videos/)', 'O que mostra')] + [
 ('01-menu-link-ativo-e-transicao-de-tela', 'Link ativo com barrinha, transição entre telas, título da aba, F5 e Voltar'),
 ('02-filtros-na-url-e-cartoes', 'Hover dos cartões, busca sem acento, select e chips na URL, cartões reorganizando, Limpar filtros'),
 ('03-acordeao-jogadores', 'Acordeão um por vez com animação de altura e seta'),
 ('04-inscricao-validacao-e-reserva', 'Erros juntos, foco no primeiro, tag em maiúsculas, prévia, idade, reserva entrando e saindo'),
 ('05-inscricao-envio-e-sucesso', 'Capitão, envio, cartão de sucesso, toast'),
 ('06-login-checkin-e-progresso', 'Login com erro e acerto, check-in, barra crescendo, lista de espera'),
 ('07-excluir-exige-tag', 'Modal de exclusão, botão habilitando com a tag, Esc, cartão saindo'),
 ('08-gerar-chaveamento', 'Aviso antes de gerar, atalho filtrado, gerar e ir para a chave'),
 ('09-partidas-abas-contagem-e-placar', 'Contagem regressiva, abas com setas, modal de placar, resultado'),
 ('10-chave-caminho-e-chegada', 'Caminho da equipe e equipe chegando na fase seguinte'),
 ('11-campea-e-modo-telao', 'Placar da final, troféu e confete, modo telão'),
 ('12-celular-375', 'Barra inferior, chave com rolagem lateral, modal em 375 px'),
 ('13-carregando-e-erro', 'Carregando, erro e Tentar novamente'),
], [0.45, 0.55])
D.save(OUT)
print('ok', OUT)
