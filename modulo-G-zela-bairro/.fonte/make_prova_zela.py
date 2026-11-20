import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_zela import SUB, TOTAL
DES = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de prova – Team Challenge (desafio em equipe)', 'Módulo G – Zela Bairro: central de zeladoria do Jardim Esperança', 'SPSKILLS_MG_ZELABAIRRO_REVISAO_2026')

D.h('Introdução')
D.p('A Associação de Moradores do Jardim Esperança, bairro fictício de Sorocaba, recebe todo dia reclamações de buraco, poste apagado, entulho e vazamento por mensagem de celular. Ninguém sabe o que já foi pedido, o que está atrasado nem quanto tempo a prefeitura leva para resolver.')
D.p('A associação quer o Zela Bairro: um site em que o morador abre um chamado com foto e local no mapa, acompanha a situação e apoia os chamados dos vizinhos, e em que a equipe de zeladoria move cada chamado pelas etapas até concluir, com indicadores para cobrar prazos.')
D.p('Neste Team Challenge, a equipe constrói o produto inteiro (API em PHP e front-end em JavaScript) dividindo o trabalho em cinco pacotes que avançam ao mesmo tempo, ligados por um contrato de API já combinado. No fim, a equipe apresenta o produto funcionando ao vivo.')
D.p('Esta é uma prova de revisão, mais difícil que o Team Challenge do simulado de Jacareí: o escopo é fechado, todas as funções são obrigatórias e a nota mede a integração entre as partes.')

D.h('Formato e tempo')
D.tabela([
 ('Item', 'Como funciona'),
 ('Equipe', '3 a 5 competidores. Com 4, o pacote P5 é dividido entre P2 e P4. Com 3, um integrante faz P1, outro P2 + P3 e outro P4 + P5.'),
 ('Planejamento', '20 minutos, todos juntos, sem computador ligado: ler o contrato, dividir os pacotes e escrever o PLANO.md.'),
 ('Desenvolvimento', '2 horas e 10 minutos. Integração 1 obrigatória na metade; integração 2 trinta minutos antes do fim.'),
 ('Apresentação', '3 a 5 minutos por equipe, com demonstração ao vivo no servidor, logo após o fim do tempo.'),
 ('Internet', 'Não. Documentação offline (Zeal) permitida.'),
 ('Tecnologias', 'PHP 8 sem framework e sem banco (dados em arquivos JSON); HTML, CSS e JavaScript puro. Nenhuma biblioteca externa.'),
], [0.22, 0.78])

D.h('Materiais fornecidos (pasta XX-zela-bairro)')
D.tabela([
 ('Arquivo ou pasta', 'Conteúdo'),
 ('contrato-api.md', 'Contrato completo da API: rotas, corpos, respostas, códigos HTTP, regras de validação e de transição de status. É a lei da prova.'),
 ('dados/seed/', 'Carga inicial: categorias.json (6), chamados.json (16), usuarios.json (2, senha com hash), tokens.json (vazio). Use como resposta de exemplo enquanto a API não fica pronta.'),
 ('img/', 'mapa-bairro.svg (1000 × 640, onde x e y dos chamados são porcentagens), logo-zela.svg, favicon.svg.'),
 ('fonts/', 'Inter Regular, SemiBold e Bold (woff2) e a licença.'),
 ('design/', 'Prints de layout de cada tela em 1440, 768 e 375 px e a pasta estados/ com 14 prints de interações.'),
 ('design/videos/', 'Um vídeo MP4 por animação ou interação (11 vídeos), com o cursor visível, as teclas na tela e uma legenda amarela explicando o efeito. design/Design.mp4 junta todos.'),
 ('DICAS.md', 'Dicas de caminho para o planejamento e para cada pacote (sem código).'),
], [0.26, 0.74])
D.p('Se o texto deste enunciado e uma imagem divergirem, vale o texto. Os vídeos mostram tempo e tipo das animações; não é preciso acertar o milissegundo.')

D.h('Os cinco pacotes')
D.p('Cada pacote tem seus próprios arquivos. Ninguém edita o arquivo de outro pacote sem combinar. O pacote P5 também é o responsável por juntar tudo e publicar.')
D.tabela([
 ('Pacote', 'Responsabilidade', 'Depende de'),
 ('P1 – API', 'Todas as rotas do contrato em api/, leitura e gravação dos JSON em dados/, login com token, upload de foto, proteção das pastas dados/ e uploads/.', 'Nada (começa já)'),
 ('P2 – Painel', 'Quadro kanban, filtros na URL, apoio, detalhe do chamado e mudança de status (menu Mover e arrastar e soltar).', 'Contrato (usa o seed até a API ficar pronta)'),
 ('P3 – Abrir chamado', 'Modal com formulário, validação ao vivo, local no mini-mapa, foto com prévia, envio e tela de sucesso.', 'Contrato; modal base do P5'),
 ('P4 – Mapa e indicadores', 'Tela do mapa com pinos e lista ligados; tela de indicadores com números e gráficos só com CSS.', 'Contrato'),
 ('P5 – Design e integração', 'Tokens de cor e fonte, tema claro/escuro, cabeçalho, rotas, link ativo, componentes (botão, chip, campo, modal, toast), carregando/erro, responsividade, merge e publicação.', 'Nada (começa já)'),
], [0.2, 0.55, 0.25])

D.h('Requisitos')
D.s('1. Entrega e organização')
D.i(0, '1.1. Pasta TEAM_X_modulo_g (X = letra da equipe) no servidor, abrindo em http://IP/TEAM_X_modulo_g/ sem erro. Nenhum caminho absoluto de máquina.')
D.i(0, '1.2. PLANO.md na raiz: nome de cada integrante, pacote, arquivos de cada um, horários das integrações e o roteiro do pitch.')
D.i(0, '1.3. As pastas dados/ e uploads/ não podem ser baixadas nem executar PHP pelo navegador.')

D.s('2. API (P1) – conforme contrato-api.md')
D.i(0, '2.1. Todas as rotas do contrato, sempre em JSON, com 404 para rota inexistente e 405 para método errado.')
D.i(0, '2.2. Campos calculados na resposta: categoria, prazo_em, atrasado, concluido_no_prazo e apoios. A lista de apoiadores nunca sai na resposta.')
D.i(0, '2.3. Criação com 201 e protocolo ZB-AAAA-NNNN; 422 com todos os erros de uma vez.')
D.i(0, '2.4. Máquina de estados da tabela do contrato: 409 para transição proibida; 422 para status desconhecido e para cancelar ou devolver sem observação de 10 caracteres; histórico com uma linha por mudança; concluido_em gravado ao concluir.')
D.i(0, '2.5. Mudança de status só com token da equipe (401 sem token ou com token inválido). Login devolve token; senha errada dá 401.')
D.i(0, '2.6. Apoio: um por dispositivo (409 na repetição) e nunca em chamado encerrado (409).')
D.i(0, '2.7. Foto: só JPG, PNG ou WEBP verdadeiros (conferir o conteúdo, não a extensão), até 2 MB, salva com nome aleatório.')

D.s('3. Estrutura, rotas e tema (P5)')
D.i(0, '3.1. Três telas sem recarregar a página: #/painel, #/mapa e #/indicadores. Rota desconhecida abre o Painel.')
D.i(0, '3.2. Link da tela atual com a classe active e aria-current="page" (também depois de F5 e do Voltar). Título da aba no formato "Mapa – Zela Bairro".')
D.i(0, '3.3. Cabeçalho fixo no topo com logotipo, menu (ícone + texto), botão de tema, botão "Entrar como equipe" (vira "Sair" depois do login) e botão "Abrir chamado".')
D.i(0, '3.4. Tema claro e escuro com variáveis CSS; a escolha fica salva e é aplicada antes de a página aparecer (sem piscar). Sem escolha salva, segue o tema do sistema.')
D.i(0, '3.5. Estado de carregamento e estado de erro da API com o botão "Tentar novamente", que refaz os pedidos sem F5.')
D.i(0, '3.6. Mensagens curtas (toast) na parte de baixo da tela para sucesso e erro, sumindo sozinhas.')

D.s('4. Painel (P2)')
D.i(0, '4.1. Quatro colunas (Aberto, Em triagem, Em execução, Concluído) com contador. Cancelados não aparecem no quadro, mas entram no resumo acima dele ("16 chamados · 4 atrasados · 1 cancelado").')
D.i(0, '4.2. Card: categoria (selo colorido), etiqueta "Atrasado" quando for o caso, título (abre o detalhe), rua, protocolo, data de abertura DD/MM/AAAA e "há N dias", botão de apoio com a contagem e, para a equipe, o botão Mover.')
D.i(0, '4.3. Filtros combinados: busca por título, rua ou protocolo sem diferenciar maiúsculas e acentos; chips de categoria (Todas + 6, um ativo, com aria-pressed); interruptor "Só atrasados". Os filtros ficam na URL (busca, categoria, atrasados=1) e voltam com F5. Sem resultado: aviso com "Limpar filtros".')
D.i(0, '4.4. Apoiar soma 1 na hora, marca o botão e o desabilita. O aparelho que já apoiou continua vendo o botão marcado depois do F5.')
D.i(0, '4.5. Detalhe em modal: protocolo, título, situação, categoria, descrição, local, aberto em (DD/MM/AAAA HH:MM), prazo, concluído em, apoios, foto (se houver), mini-mapa com o pino e o histórico em linha do tempo. Fecha com Esc, X e clique no fundo; o foco volta para o card.')
D.i(0, '4.6. Só para a equipe: o menu Mover lista apenas as transições permitidas. Arrastar e soltar: enquanto arrasta, as colunas permitidas ficam tracejadas e as proibidas apagadas; soltar numa proibida não faz nada.')
D.i(0, '4.7. Toda mudança abre o modal "Mudar situação" com a observação (obrigatória para cancelar e devolver). Depois de confirmar, o card aparece na nova coluna com destaque. Erro 401 desloga a equipe; 409 aparece em toast.')

D.s('5. Abrir chamado (P3)')
D.i(0, '5.1. Modal com Título, Categoria (com o prazo de cada uma), Descrição com contador 0/400, Rua, Local no mapa e Foto.')
D.i(0, '5.2. Validação com as mesmas regras e mensagens do contrato: ao sair do campo e ao enviar. Ao enviar, todos os erros aparecem juntos e o foco vai para o primeiro campo inválido. Erro do servidor (422) aparece no campo certo.')
D.i(0, '5.3. Local: clique no mini-mapa coloca o pino; com o foco no mapa, as setas movem o pino 1% (com Shift, 5%).')
D.i(0, '5.4. Foto por clique ou arrastando o arquivo: prévia da imagem com nome e tamanho, botões Trocar e Remover; tipo e tamanho conferidos antes do envio.')
D.i(0, '5.5. Sucesso: o formulário dá lugar a um check animado, o protocolo em destaque e o botão "Copiar protocolo" (que precisa funcionar em http://IP). O novo card entra em Aberto com destaque.')

D.s('6. Mapa e indicadores (P4)')
D.i(0, '6.1. Mapa com um pino por chamado na posição x/y, cor da situação, pino maior no hover/foco e anel pulsando nos atrasados. Os pinos entram caindo em sequência.')
D.i(0, '6.2. Lista ao lado com os mesmos chamados. Hover ou foco no pino destaca o item (e rola a lista até ele); hover ou foco no item destaca o pino. Clique em qualquer um abre o detalhe.')
D.i(0, '6.3. Legenda com uma caixa por situação para mostrar ou esconder (Cancelado começa desmarcado).')
D.i(0, '6.4. Indicadores lidos de api/indicadores a cada vez que a tela abre: quatro números com contagem animada (total, atrasados, % no prazo, tempo médio em dias com uma casa), barras por categoria só com CSS (largura pela variável --v, entrando em sequência) e rosca por situação com conic-gradient e legenda com quantidade e porcentagem.')

D.s('7. Responsividade e acessibilidade')
D.i(0, '7.1. 768 px: menu em segunda linha do cabeçalho, quadro em 2 colunas, mapa e lista um embaixo do outro.')
D.i(0, '7.2. 375 px: menu em barra inferior fixa (ícone + texto), botão redondo de abrir chamado acima da barra, colunas do quadro lado a lado com rolagem lateral e encaixe, modais saindo de baixo, nenhuma rolagem horizontal da página e nada escondido atrás da barra.')
D.i(0, '7.3. Link "Pular para o conteúdo", foco visível, label em todos os campos, alt nas imagens e prefers-reduced-motion respeitado.')

D.s('8. Apresentação')
D.i(0, '8.1. De 3 a 5 minutos, com a aplicação publicada no servidor. Todos os integrantes falam e cada um mostra o próprio pacote.')
D.i(0, '8.2. Fluxo obrigatório da demonstração: o morador abre um chamado com foto → ele aparece no painel e no mapa → a equipe entra e move o chamado até concluir → os indicadores mudam.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Nome', 'Pontos')] + [(s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')) for s in SUB] + [('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ','))]
D.tabela(linhas, [0.18, 0.62, 0.2])
D.p('A ficha tem 5,00 pontos para dar peso de revisão. Para usar na escala do simulado de Jacareí (1,00 ponto), multiplique a nota por 0,2.')

D.h('Instruções para os competidores')
for k, t in enumerate([
 'Os 20 minutos de planejamento são em equipe e sem computador. Saiam deles com o PLANO.md escrito.',
 'Desenvolvam cada pacote nos próprios arquivos e integrem nos dois horários combinados.',
 'A pasta final se chama TEAM_X_modulo_g e fica em http://IP/TEAM_X_modulo_g/ (o IP é informado pelos avaliadores).',
 'As pastas dados/ e uploads/ precisam de permissão de escrita para o Apache.',
 'Depois da integração 2, ninguém começa função nova: testem o fluxo do pitch do começo ao fim.',
 'Ao final do tempo, a equipe apresenta com todos os integrantes.'], 1):
    D.i(0, f'{k}. {t}')

D.pb()
D.h('Anexo A – Layout de referência (1440 px)')
for n, leg in (('painel', 'Painel'), ('mapa', 'Mapa'), ('indicadores', 'Indicadores')):
    D.img(f'{DES}/layout-1440-{n}.png', 15.5, f'{leg} – 1440 px')
D.pb()
D.h('Anexo B – 768 px e 375 px')
D.imgs_lado([f'{DES}/layout-768-painel.png', f'{DES}/layout-375-painel.png'], 7.2, 'Painel em 768 px e 375 px')
D.imgs_lado([f'{DES}/layout-375-mapa.png', f'{DES}/layout-375-indicadores.png'], 6, 'Mapa e Indicadores em 375 px')
D.pb()
D.h('Anexo C – Estados das interações')
est = [('01-filtros-na-url', 'Filtros vindos da URL'), ('03-detalhe-historico', 'Detalhe com histórico'), ('04-novo-erros', 'Abrir chamado: erros'),
       ('05-novo-preenchido-foto', 'Local e prévia da foto'), ('06-novo-sucesso', 'Sucesso com protocolo'), ('08-menu-mover', 'Menu Mover da equipe'),
       ('09-cancelar-exige-nota', 'Cancelar exige observação'), ('10-arrastando-colunas-permitidas', 'Arrastando: colunas permitidas'),
       ('11-mapa-pino-destacado', 'Pino e lista destacados'), ('12-tema-escuro-indicadores', 'Tema escuro'), ('14-erro-api', 'Erro da API')]
for i in range(0, len(est), 2):
    par = est[i:i + 2]
    D.imgs_lado([f'{DES}/estados/estado-{n}.png' for n, _ in par], 7.8, ' | '.join(l for _, l in par))
D.h('Anexo D – Vídeos de referência')
D.tabela([('Vídeo (design/videos/)', 'O que mostra')] + [
 ('01-menu-link-ativo-e-transicao-de-tela', 'Link ativo, hover do menu, troca de tela com fade, F5 e Voltar'),
 ('02-card-hover-e-apoio', 'Hover do card, etiqueta Atrasado pulsando, apoio com pop, toast'),
 ('03-filtros-busca-e-url', 'Busca sem acento, chips, interruptor, URL, aviso de vazio'),
 ('04-modal-detalhe', 'Abertura e fechamento do modal (Esc, X, fundo)'),
 ('05-abrir-chamado-validacao-mapa-foto', 'Erros tremendo, validação ao vivo, pino caindo, setas, foto, check de sucesso'),
 ('06-equipe-mover-e-arrastar', 'Login, menu Mover, card chegando, arrastar e soltar, observação obrigatória'),
 ('07-mapa-pinos-e-lista-ligados', 'Pinos caindo, anel de atraso, destaque nos dois sentidos, legenda'),
 ('08-indicadores-graficos-css', 'Contagem, barras em sequência, rosca girando'),
 ('09-tema-claro-escuro', 'Troca de tema e persistência'),
 ('10-celular-375', 'Barra inferior, rolagem do quadro, modal de baixo'),
 ('11-carregando-e-erro', 'Carregando, erro e Tentar novamente'),
], [0.45, 0.55])
D.save(OUT)
print('ok', OUT)
