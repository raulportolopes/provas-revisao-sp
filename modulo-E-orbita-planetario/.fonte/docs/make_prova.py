import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_orbita import SUB, TOTAL
IMG = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de prova – Front-end Funcionalidades', 'Módulo E – Órbita: Planetário Paulista', 'SPSKILLS_ME_ORBITA_REVISAO_2026')

D.h('Introdução')
D.p('O Órbita – Planetário Paulista tem duas cúpulas de projeção, a Galileu (136 lugares) e a Hipátia (56 lugares), e uma programação que muda toda semana: sessões de astronomia, ciência, música imersiva, sessões infantis e sessões ao vivo com astrônomos.')
D.p('Hoje a venda de ingressos é feita só na bilheteria. O planetário quer um site onde o visitante veja a programação, escolha os lugares no mapa da cúpula, pague em três passos e acompanhe as reservas, tudo sem recarregar a página. O site também traz um guia do céu de dezembro para quem quer observar à noite.')
D.p('Os dados vêm de uma API em JSON. O time de design entregou o layout em três larguras, prints dos estados de interação e um vídeo para cada animação. Sua tarefa é construir a aplicação de página única (SPA) com todas as regras de negócio descritas neste documento.')
D.p('Observação: o Órbita é um projeto fictício de treino. Todas as imagens fornecidas são ilustrações originais.')

D.h('Descrição do projeto')
D.p('Tempo de prova: 4 horas (mais 30 minutos de leitura antes do início, fora do tempo de prova).')
D.p('A aplicação tem seis telas: Início, Programação, Mapa de lugares, Pagamento, Minhas reservas e Guia do céu. Os prints da pasta design/ mostram o resultado esperado em 1440 px, 768 px e 375 px; design/estados/ mostra 17 interações. Cada animação tem vídeo de referência em design/videos/ e todas juntas estão em design/Design.mp4. Nos vídeos o cursor aparece como um círculo amarelo, as teclas aparecem na tela e a legenda amarela no canto diz o que está sendo mostrado.')
D.p('Use HTML5, CSS3 e JavaScript puro (módulos ES são bem-vindos). Não é permitido usar frameworks nem bibliotecas de componentes ou de CSS. Não existe servidor de back-end: tudo que o visitante faz (carrinho, reservas, tema) fica no navegador (localStorage e sessionStorage).')
D.p('Data e hora "atuais": a aplicação deve usar o campo agora de api/config.json (sábado, 05/12/2026, 10:00, horário de Brasília) como o momento atual para montar a programação, saber se uma sessão já começou e decidir se uma reserva ainda pode ser cancelada. A única exceção é o cronômetro do carrinho, que usa o relógio real.')

D.h('A API')
D.p('A pasta api/ simula a API. Cada arquivo é um recurso; os recursos se ligam pelos ids e a tela sempre mostra nomes, nunca ids.')
D.tabela([
 ('Recurso', 'Campos', 'Observações'),
 ('api/config.json', 'agora, limite_lugares, tempo_reserva_segundos, taxa_servico_percentual, cancelamento_minimo_horas, meia_maximo_percentual', 'Regras do negócio. Não escreva esses números direto no código.'),
 ('api/programas.json (12)', 'id, titulo, genero, classificacao, duracao_min, destaque, estreia, avaliacao, imagem, imagem_destaque, sinopse', 'classificacao: L, 10, 12 ou 14'),
 ('api/salas.json (2)', 'id, nome, capacidade, layout', 'layout: uma string por fileira (A, B, C...). A = lugar, C = lugar de cadeirante, _ = corredor, . = espaço vazio'),
 ('api/sessoes.json (40)', 'id, programa_id, sala_id, data, hora, preco_inteira, idioma, ocupados', 'ocupados: lista de lugares já vendidos (ex.: "C7"). Meia = metade da inteira.'),
 ('api/ceu.json', 'planetas (com visibilidade de jan a dez), constelacoes, lua, faq', 'Conteúdo do Guia do céu'),
 ('api/reservas-exemplo.json (2)', 'codigo, sessao, lugares, subtotal, taxa, total, status, criada_em, cancelada_em, cliente, pagamento', 'Reservas antigas para preencher Encerradas e Canceladas na primeira visita'),
], [0.24, 0.42, 0.34])
D.p('Importante: o fetch não funciona com o index.html aberto direto do disco (file://). Desenvolva e teste pelo servidor web.')

D.h('Telas e requisitos')
D.s('1. Estrutura, rotas e preferências')
D.i(0, '1.1. Cabeçalho com o logotipo (img/logo-orbita.svg, link para o Início), o menu Início, Programação, Reservas e Guia do céu (ícone + texto) e o botão de tema.')
D.i(0, '1.2. Rotas pelo hash: #/inicio, #/programacao, #/sessao/:id, #/pagamento, #/reservas e #/ceu. Sem hash abre o Início. Rota desconhecida mostra a tela "Página não encontrada" com link para o Início. Sessão inexistente mostra "Sessão não encontrada".')
D.i(0, '1.3. O item do menu da tela atual recebe a classe ativo e aria-current="page" (Sessão e Pagamento marcam Programação). Precisa estar certo depois de F5 e do botão Voltar.')
D.i(0, '1.4. Título da aba no formato "Programação – Órbita". Ao trocar de tela, a página volta ao topo, o conteúdo entra com transição e o foco vai para o título da tela.')
D.i(0, '1.5. Splash na primeira visita da sessão do navegador: logo, barra e porcentagem que andam juntas de 0 a 100% em 2,5 s. Só some (fade-out) quando passaram os 2,5 s e a API já carregou. Botão Pular. Não aparece de novo no F5 nem com prefers-reduced-motion.')
D.i(0, '1.6. Tema escuro e claro. Na primeira visita segue o sistema (prefers-color-scheme); depois vale a escolha, guardada no localStorage. Cores como variáveis CSS.')
D.i(0, '1.7. Enquanto carrega, mostrar um estado de carregando. Se algum arquivo da API falhar, mostrar "Não foi possível carregar a programação" com o botão Tentar novamente, que carrega de novo sem F5.')
D.i(0, '1.8. Avisos (toasts) no canto inferior direito, empilhados, somem sozinhos e podem ter uma ação (ex.: Desfazer). Usar aria-live.')

D.s('2. Início (#/inicio)')
D.i(0, '2.1. Carrossel com os programas que têm destaque = true (estreia mais recente primeiro), usando imagem_destaque, título, gênero, classificação, sinopse e o botão "Ver sessões", que abre a Programação já buscando aquele título.')
D.i(0, '2.2. Troca sozinho a cada 6 s, com uma barra de progresso dentro da bolinha atual. Anterior e próximo em loop. Uma bolinha por slide, com aria-current na atual.')
D.i(0, '2.3. Pausa enquanto o mouse está em cima ou o foco está dentro. Botão Pausar/Continuar com rótulo correto. Setas ← → do teclado com o foco no carrossel. Arrastar com mouse ou dedo (mais de 50 px). Slides escondidos ficam inert. Com prefers-reduced-motion não troca sozinho.')
D.i(0, '2.4. Faixa de números calculados da API: programas em cartaz, sessões nos próximos 7 dias, lugares livres hoje e a ocupação da semana em um gráfico de rosca feito com CSS. Os números contam de 0 até o valor quando aparecem na tela.')
D.i(0, '2.5. "Próximas sessões": as 3 próximas sessões a partir de agora, com o link "Ver programação completa".')

D.s('3. Programação (#/programacao)')
D.i(0, '3.1. Painel de filtros à esquerda e grade de cards (3 por linha em 1440 px).')
D.i(0, '3.2. Dia: chips Todos + os 7 dias a partir de agora (Sáb 05/12 a Sex 11/12). Segunda-feira o planetário fecha: o chip aparece desabilitado com "Fechado".')
D.i(0, '3.3. Busca pelo título enquanto digita, sem diferenciar maiúsculas, minúsculas e acentos. Gênero (select gerado da API). Classificação com caixas de seleção (pode marcar várias; ordem L, 10, 12, 14, com o selo colorido). Período: manhã (antes das 12h), tarde (até 17h59) e noite. Caixa "Só com lugares livres".')
D.i(0, '3.4. Ordenar por: Horário (padrão), Título (A–Z), Preço: menor primeiro, Preço: maior primeiro, Mais lugares livres. A ordenação vale sobre o resultado filtrado.')
D.i(0, '3.5. Todos os filtros funcionam juntos. Contador "N sessões encontradas · mostrando a–b". Sem resultado, mostrar "Nenhuma sessão encontrada" com o botão Limpar filtros.')
D.i(0, '3.6. Paginação com 6 cards por página: anterior e próximo desabilitados nas pontas, um botão por página, aria-current na atual. Mudar busca, filtro ou ordem volta para a página 1.')
D.i(0, '3.7. O estado da tela fica na URL com os parâmetros data, genero, classif (separado por vírgula), periodo, busca, livres, ordem e pagina. Só aparecem os diferentes do padrão. Use history.replaceState (mudar filtro não cria item no histórico). F5 ou abrir o link mostra a tela igual, com os controles marcados.')
D.i(0, '3.8. Card: pôster, selo de classificação, dia e hora, título, gênero · sala · duração, barra de ocupação (verde até 60%, amarela até 85%, vermelha acima), "N de M lugares livres", preços inteira e meia, botões Detalhes e Escolher lugares. Sessão sem lugar mostra o selo Esgotada no lugar do botão.')
D.i(0, '3.9. Efeitos: o card inclina em 3D na direção do cursor com um brilho que segue o mouse; os botões principais têm luz que acompanha o cursor; os cards entram em sequência (um depois do outro). O JavaScript só calcula números e grava em variáveis CSS; o desenho é do CSS.')
D.i(0, '3.10. Abaixo de 1024 px os filtros ficam recolhidos em um botão "Filtros" que mostra quantos filtros estão ativos.')

D.s('4. Modal de detalhes')
D.i(0, '4.1. O botão Detalhes abre um modal com transição e fundo escuro: pôster, selos, título, estrelas da avaliação (nota com uma casa decimal), sinopse, sessão (dia, hora, sala, duração, áudio), preços, lugares livres e chips das outras sessões do mesmo programa (cada chip abre aquela sessão no modal). Botão Escolher lugares.')
D.i(0, '4.2. Foco vai para o modal e fica preso nele (Tab e Shift+Tab circulam dentro). Fecha com Esc, com o X e clicando fora; ao fechar, o foco volta para o botão que abriu. A página não rola atrás do modal.')
D.i(0, '4.3. Setas ← → do teclado e os botões Anterior/Próxima passam para a sessão anterior/seguinte do resultado filtrado e ordenado (de todas as páginas, não só da atual), com o indicador "n de N".')

D.s('5. Mapa de lugares (#/sessao/:id)')
D.i(0, '5.1. Cabeçalho com título, data, hora, sala e áudio. Legenda (livre, selecionado, ocupado, acessível) e a chave "Preciso de lugar acessível (cadeirante)".')
D.i(0, '5.2. O mapa é desenhado a partir de salas.layout: cada letra vira um botão, _ vira corredor e . vira espaço vazio. Fileiras com a letra nas duas pontas e os lugares numerados da esquerda para a direita (o número conta só os lugares). A curva da cúpula aparece no topo.')
D.i(0, '5.3. Regras, todas com aviso na tela quando o visitante tenta quebrar: (a) lugar ocupado não pode ser marcado; (b) no máximo limite_lugares lugares (6); (c) lugar C só com a chave de acessível ligada; (d) meia-entrada em no máximo meia_maximo_percentual dos lugares, arredondando para cima (3 lugares = 2 meias); se o visitante tira lugares e sobram meias demais, as últimas viram inteiras; (e) não pode sobrar um lugar livre sozinho entre dois lugares tomados (ocupados ou selecionados) no mesmo bloco da fileira. A regra (e) é conferida ao clicar em Continuar: os lugares isolados ficam destacados e aparece a mensagem.')
D.i(0, '5.4. Painel "Seu pedido": lista dos lugares em ordem (A1, A2... A10), select inteira/meia em cada um, botão para remover, subtotal, taxa de serviço (taxa_servico_percentual sobre o subtotal) e total. Botões Continuar para o pagamento e Limpar seleção.')
D.i(0, '5.5. Cronômetro: ao marcar o primeiro lugar começa uma contagem de tempo_reserva_segundos (5:00) que aparece no cabeçalho em todas as telas. O F5 não reinicia a contagem. Faltando 1 minuto aparece um aviso; no zero os lugares são liberados, o carrinho é apagado e aparece um aviso.')
D.i(0, '5.6. Teclado: só um lugar do mapa entra no Tab; as setas andam pelo mapa; Enter ou Espaço marca. Cada lugar tem aria-label com fileira, número e situação (ex.: "Fileira C, lugar 8: livre").')
D.i(0, '5.7. Se já existe carrinho de outra sessão, perguntar (em modal) se quer descartar antes de marcar o primeiro lugar desta. Só abrir outra sessão para olhar não apaga o carrinho.')
D.i(0, '5.8. Sessão que já começou ou esgotada mostra o mapa sem permitir marcar, com a mensagem correspondente.')

D.s('6. Pagamento (#/pagamento)')
D.i(0, '6.1. Sem carrinho, a rota volta para a Programação com um aviso. Indicador dos 3 passos (Seus dados, Pagamento, Revisão) com os concluídos marcados, e resumo do pedido com o cronômetro ao lado.')
D.i(0, '6.2. Passo 1: nome completo (nome e sobrenome), CPF, celular e e-mail. Passo 2: Pix ou Cartão de crédito. Cartão: número, nome impresso, validade, CVV e parcelas (1x a 3x, sem juros, mostrando o valor de cada parcela).')
D.i(0, '6.3. Máscaras enquanto digita: CPF 000.000.000-00, celular (00) 00000-0000, cartão 0000 0000 0000 0000, validade MM/AA.')
D.i(0, '6.4. Validações: CPF com os dois dígitos verificadores; e-mail; cartão pelo algoritmo de Luhn; validade não vencida em relação a agora; CVV com 3 dígitos. A mensagem aparece abaixo do campo (aria-describedby, aria-invalid), o foco vai para o primeiro campo com erro e, depois do primeiro erro, o campo revalida enquanto o visitante digita.')
D.i(0, '6.5. Voltar um passo mantém o que foi digitado; o F5 mantém o passo e os dados (sessionStorage). Se o carrinho mudar, recomeça do passo 1 mantendo os dados.')
D.i(0, '6.6. Pix: mostrar um código de pagamento e o botão Copiar código, que precisa funcionar também em http (sem HTTPS) e confirma com um aviso.')
D.i(0, '6.7. Passo 3: revisão com botão Editar em cada bloco e a caixa de aceite das regras de cancelamento (obrigatória). Confirmar: gera o código ORB-AAAAMMDD-XXXX (data de agora e 4 caracteres), grava a reserva no localStorage, marca os lugares como ocupados para as próximas visitas, zera carrinho e cronômetro e abre Minhas reservas com um aviso.')

D.s('7. Minhas reservas (#/reservas)')
D.i(0, '7.1. Abas Próximas, Encerradas e Canceladas com a quantidade em cada uma, no padrão de abas acessíveis: role tablist/tab/tabpanel, aria-selected, setas ← →, Home e End, e só a aba ativa entra no Tab. A aba fica na URL (?aba=canceladas).')
D.i(0, '7.2. Na primeira visita, as reservas de api/reservas-exemplo.json entram na lista. Próximas: a mais perto primeiro; as outras: a mais recente primeiro.')
D.i(0, '7.3. Cancelar: só até cancelamento_minimo_horas (2 h) antes do início; depois disso o botão some e aparece o motivo. Confirmação em modal. A reserva não é apagada: vai para Canceladas com a data do cancelamento, e os lugares voltam a ficar livres. O aviso traz Desfazer por 6 s.')
D.i(0, '7.4. Botão "Baixar reservas (.json)" que baixa todas as reservas em um arquivo .json.')

D.s('8. Guia do céu (#/ceu)')
D.i(0, '8.1. Abas Planetas, Constelações, Fases da Lua e Perguntas (mesmo padrão acessível do item 7.1, aba na URL).')
D.i(0, '8.2. Planetas: botões para escolher o planeta, ficha com melhor horário e brilho e um gráfico de barras de jan a dez feito só com CSS (o JS só grava --v e --i). As barras sobem uma depois da outra; o valor aparece no hover e no foco; o mês atual (dezembro) fica destacado. Trocar de planeta refaz a animação.')
D.i(0, '8.3. Constelações e Perguntas: acordeão com um item aberto por vez (clicar no aberto fecha), aria-expanded e animação de altura. Painéis fechados não entram no Tab.')
D.i(0, '8.4. Fases da Lua: as quatro fases de dezembro desenhadas com CSS, com a próxima fase destacada.')

D.s('9. Responsividade e acessibilidade')
D.i(0, '9.1. 1440, 768 e 375 px como nos prints. Em 375 px o menu fica fixo na parte de baixo da tela, o modal vira uma folha que sobe de baixo, o mapa de lugares rola na horizontal dentro da própria caixa e a página não pode ter rolagem horizontal.')
D.i(0, '9.2. Link "Pular para o conteúdo", foco visível em tudo, textos alternativos e contraste. Lighthouse Acessibilidade de pelo menos 90 nas telas Programação e Sessão. Console sem erros.')
D.i(0, '9.3. prefers-reduced-motion: sem splash, sem troca automática do carrossel e com animações reduzidas.')

D.h('Paleta e tipografia')
D.p('Tema escuro: fundo #070B1F e #0D1330, superfície #131A3D e #1B2350, borda #2A3470, primária (violeta) #8B5CF6, secundária (ciano) #22D3EE, destaque (âmbar) #FBBF24, sucesso #34D399, perigo #F87171, texto #EEF1FF e texto secundário #A9B1D6.')
D.p('Tema claro: fundo #F5F6FD e #ECEEFB, superfície #FFFFFF e #F1F2FB, borda #D5D9F0, primária #6D28D9, secundária #0E7490, texto #141A3A e texto secundário #4B5379.')
D.p('Fonte Inter (pasta fonts/): InterDisplay Bold e SemiBold para títulos e números, Inter Regular e SemiBold para o texto. Carregue com @font-face.')

D.h('Materiais fornecidos')
D.tabela([
 ('Pasta/Arquivos', 'Descrição'),
 ('api/', 'config.json, programas.json, salas.json, sessoes.json, ceu.json, reservas-exemplo.json'),
 ('img/', '12 pôsteres, 4 imagens de destaque, logo-orbita.svg e favicon.svg'),
 ('fonts/', 'Inter (OTF)'),
 ('design/', 'Seis telas em 1440 px e 375 px, três telas em 768 px e a pasta estados/ com 17 interações'),
 ('design/videos/', 'Um vídeo MP4 por animação (12 vídeos) e design/Design.mp4 com todos em sequência'),
 ('DICAS.md', 'Pistas para a prova (sem código pronto)'),
], [0.3, 0.7])

D.h('Instruções de entrega')
D.i(0, '1. Coloque o projeto na pasta XX_modulo_e/ (XX = seu número de competidor), com index.html na raiz e as pastas css/, js/, api/, img/ e fonts/.')
D.i(0, '2. Publique no servidor em http://servidor/XX_modulo_e/ e teste lá antes do fim da prova. Só o que estiver no servidor será avaliado.')
D.i(0, '3. Os avaliadores testam no Google Chrome, com o fuso horário de Brasília, nas larguras 1440, 768 e 375 px.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Descrição', 'Pontuação')]
for s in SUB: linhas.append((s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')))
linhas.append(('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)

D.pb()
D.h('Anexo A: telas em 1440 px')
D.p('Os arquivos em tamanho real (página inteira) estão em design/. Abaixo, a parte de cima de cada tela, reduzida.')
for r, nome in (('inicio', 'Início'), ('programacao', 'Programação'), ('sessao', 'Mapa de lugares (sessão 9)'), ('pagamento', 'Pagamento – passo 1'), ('reservas', 'Minhas reservas'), ('ceu', 'Guia do céu')):
    D.img(f'{IMG}/layout-1440-{r}.jpg', 15.5, f'{nome} – 1440 px')
    D.pb()
D.h('Anexo B: telas em 768 px e 375 px')
D.imgs_lado([f'{IMG}/layout-768-{r}.jpg' for r in ('inicio', 'programacao', 'sessao')], 5.0, 'Início, Programação e Sessão em 768 px')
D.pb()
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('inicio', 'programacao', 'sessao')], 4.8, 'Início, Programação e Sessão em 375 px (primeira tela)')
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('pagamento', 'reservas', 'ceu')], 4.8, 'Pagamento, Reservas e Guia do céu em 375 px')
D.pb()
D.h('Anexo C: vídeos das animações')
D.tabela([('Arquivo (design/videos/)', 'O que mostra'),
 ('01-splash.mp4', 'Splash: barra e porcentagem juntas em 2,5 s e fade-out'),
 ('02-carrossel.mp4', 'Troca automática, barra de progresso, pausa, setas, bolinhas e arrastar'),
 ('03-menu-e-transicao.mp4', 'Link ativo, transição entre telas e cronômetro no cabeçalho'),
 ('04-cartao-3d-e-brilho.mp4', 'Card inclinando em 3D, brilho que segue o cursor e entrada em sequência'),
 ('05-filtros-ordenacao-paginacao.mp4', 'Filtros combinados, URL mudando, ordenação, paginação e lista vazia'),
 ('06-modal-detalhes.mp4', 'Abrir, foco preso, setas ← →, chips de outras sessões e as três formas de fechar'),
 ('07-mapa-de-lugares.mp4', 'Marcar, lugar isolado, meias, acessível, teclado e ocupado'),
 ('08-pagamento-3-passos.mp4', 'Máscaras, erros, voltar mantendo dados, Pix, cartão, revisão e confirmação'),
 ('09-reservas-abas-cancelar.mp4', 'Abas com teclado, cancelar com confirmação, Desfazer e baixar .json'),
 ('10-guia-do-ceu.mp4', 'Barras em sequência, valor no hover e acordeão'),
 ('11-tema-e-avisos.mp4', 'Troca de tema e pilha de avisos'),
 ('12-celular-375.mp4', 'Menu inferior, filtros recolhidos, modal em folha e mapa rolando'),
], [0.4, 0.6])
D.pb()
D.h('Anexo D: estados de interação')
EST = [('estado-01-filtros-combinados', 'Ter 08/12 + classificação L, preço maior primeiro (5 sessões)'),
       ('estado-02-sem-resultados', 'Busca sem resultado'),
       ('estado-03-modal-detalhes', 'Gênero Ciência: modal da 2ª sessão (2 de 12)'),
       ('estado-04-modal-seta-direita', 'Mesmo modal depois da seta → (3 de 12)'),
       ('estado-05-lugar-isolado', 'Sessão 2: C8, C9 e C11 marcados, C10 ficaria isolado'),
       ('estado-06-limite-de-meias', 'Limite de meias e lugar acessível'),
       ('estado-07-pagamento-erros', 'Passo 1 enviado em branco'),
       ('estado-08-cartao-invalido', 'Cartão que não passa no Luhn e validade vencida'),
       ('estado-09-revisao', 'Passo 3 – revisão'),
       ('estado-10-reserva-confirmada', 'Reserva confirmada em Minhas reservas'),
       ('estado-11-confirmar-cancelamento', 'Modal de confirmação do cancelamento'),
       ('estado-12-cancelada-desfazer', 'Reserva cancelada com o aviso Desfazer'),
       ('estado-13-acordeao', 'Constelações com um item aberto'),
       ('estado-14-grafico-hover', 'Júpiter: valor de dezembro no hover'),
       ('estado-15-pagina-nao-encontrada', 'Rota inexistente'),
       ('estado-16-erro-api', 'Erro ao carregar a API'),
       ('estado-17-tema-claro', 'Programação no tema claro')]
for k, (f, cap) in enumerate(EST, 1):
    D.img(f'{IMG}/{f}.jpg', 14.5, f'Estado {k}. {cap}.')
D.save(OUT)
print('ok')
