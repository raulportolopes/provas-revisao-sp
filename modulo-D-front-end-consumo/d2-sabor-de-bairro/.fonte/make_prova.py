import sys, json
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_sabor import SUB, TOTAL
IMG = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de revisão – Front-end Vue 3 consumindo API REST', 'Módulo D – Sabor de Bairro: delivery de comida', 'SPSKILLS_MD_SABOR_REVISAO_2026')

D.h('Introdução')
D.p('O Sabor de Bairro é um aplicativo de delivery que reúne restaurantes pequenos da Mooca e dos bairros vizinhos, em São Paulo. A ideia é simples: o cliente escolhe o restaurante, monta o pedido com as opções de cada prato, paga na entrega e acompanha o pedido até chegar.')
D.p('O back-end já existe: é uma API REST em PHP, entregue pronta na pasta api/, que guarda os dados em arquivos JSON. Ela pagina e filtra no servidor, diz se cada restaurante está aberto, valida CEP e cupom, recalcula o preço do pedido e muda o status do pedido com o passar do tempo. Todo valor em dinheiro vem em CENTAVOS (inteiro) e as datas de pedido vêm em UTC.')
D.p('Sua tarefa é construir a aplicação de página única (SPA) do cliente em Vue 3, consumindo essa API: vitrine de restaurantes, cardápio com modal de opções, carrinho, finalização em três passos, lista de pedidos e acompanhamento em tempo real.')
D.p('Este é um projeto de revisão, de 3 a 5 vezes mais trabalhoso que o Módulo D do simulado estadual. A solução comentada está na pasta solucao-comentada/ e o passo a passo em ESTUDO_GUIADO.md. O Sabor de Bairro e os restaurantes são fictícios.')

D.h('Descrição do projeto')
D.p('Tempo sugerido: 4 horas (mais 30 minutos de leitura). Pontuação: 30,00.')
D.p('Use Vue 3 com o "global build" que está em js/lib/ (vue.global.prod.js e vue-router.global.prod.js), sem npm e sem etapa de build. Seu código pode ser em módulos ES (type="module") com componentes em objetos JavaScript e template em string. Não use outras bibliotecas (nada de Pinia, Axios, bibliotecas de componentes, de CSS ou de ícones).')
D.p('Os prints da pasta design/ mostram o resultado esperado em 1440, 768 e 375 px e os estados das interações; toda animação tem vídeo de referência em design/videos/ e todos estão juntos em design/Design.mp4 (o cursor aparece como um círculo laranja e as teclas pressionadas aparecem na tela). Datas e horários dos prints são os do dia em que foram gerados.')

D.h('A API')
D.p('Endereço base (relativo ao index.html): api/index.php. As rotas vêm depois do index.php, por exemplo api/index.php/restaurantes?categoria_id=3. Se o Apache não aceitar o caminho depois do .php, use api/index.php?rota=/restaurantes&categoria_id=3. O corpo das requisições POST é JSON (Content-Type: application/json).')
D.p('Rotas protegidas exigem o cabeçalho Authorization: Bearer <token>. O token vale 30 minutos. A pasta api/dados/ precisa ter permissão de escrita (ela é criada sozinha na primeira requisição).')
D.tabela([
 ('Método e rota', 'Token', 'O que faz / respostas'),
 ('POST /login', 'não', '{email, senha} → 200 {token, expira_em_minutos, usuario}; 422 {erros:{email, senha}}; 401 e-mail ou senha incorretos'),
 ('POST /logout', 'sim', 'Encerra o token → 204'),
 ('GET /me', 'sim', 'Dados do cliente → 200 {dados}'),
 ('GET /categorias', 'não', '200 {dados:[{id, nome, slug, cor}]}'),
 ('GET /restaurantes', 'não', 'Parâmetros: busca (nome do restaurante OU de um prato, sem acento), categoria_id, aberto=1, entrega_gratis=1, ordem (relevancia, avaliacao, tempo, taxa, nome), pagina, por_pagina (padrão 6, até 20) → 200 {dados, meta}; 422 ordem inválida'),
 ('GET /restaurantes/{slug}', 'não', 'Restaurante com cardapio: [{id, nome, ordem, itens:[...]}] → 200; 404'),
 ('GET /ceps/{cep}', 'não', '{cep, logradouro, bairro, cidade, uf, acrescimo_taxa} → 200; 404 "Ainda não entregamos neste CEP."'),
 ('POST /cupons/validar', 'não', '{restaurante_id, subtotal, codigo} → 200 {dados:{codigo, tipo, descricao, desconto}}; 422 {erros:{codigo}} (inexistente, vencido ou abaixo do mínimo)'),
 ('GET /pedidos', 'sim', 'pagina, por_pagina (padrão 5) → 200 {dados, meta}, mais recentes primeiro'),
 ('POST /pedidos', 'sim', 'Corpo abaixo → 201 {dados: pedido}; 422 por campo; 409 com codigo RESTAURANTE_FECHADO, PEDIDO_MINIMO ou TOTAL_DIVERGENTE'),
 ('GET /pedidos/{id}', 'sim', 'Pedido com status, historico, previsao_entrega, pode_cancelar e pode_avaliar → 200; 404'),
 ('POST /pedidos/{id}/cancelar', 'sim', '200 {dados}; 409 NAO_PODE_CANCELAR (só enquanto "recebido")'),
 ('POST /pedidos/{id}/avaliacao', 'sim', '{nota 1–5, comentario até 280} → 201 {dados}; 422 (nota 1 ou 2 exige comentário de 10+ caracteres); 409 JA_AVALIADO ou AINDA_NAO_ENTREGUE'),
 ('POST /sessao/expirar', 'sim', 'Apoio ao teste: faz o token atual vencer na hora → 204'),
 ('POST /reset', 'não', 'Apoio ao teste: volta os dados ao estado inicial'),
], [0.27, 0.1, 0.63])
D.s('Formatos da API')
D.i(0, '• Lista paginada: {"dados": [...], "meta": {"pagina": 1, "por_pagina": 6, "total": 14, "total_paginas": 3}}.')
D.i(0, '• Erro: {"mensagem": "Texto para o usuário", "erros": {"campo": ["mensagem"]}, "codigo": "PEDIDO_MINIMO"}. Os campos erros e codigo só aparecem quando fazem sentido. Em pedidos, os campos de erro usam ponto: endereco.cep, endereco.numero, itens.0.opcoes.')
D.i(0, '• Restaurante: id, slug, nome, categoria_id, avaliacao, avaliacoes_total, tempo_min, tempo_max, taxa_entrega, pedido_minimo, horarios, imagem, endereco, aberto_agora e abre_em (data com fuso, ex.: "2026-11-20T18:00:00-03:00", ou null se aberto).')
D.i(0, '• Item do cardápio: id, nome, descricao, preco, imagem, destaque, disponivel e grupos: [{id, nome, min, max, opcoes:[{id, nome, preco}]}]. min = 1 quer dizer obrigatório; max = 1 quer dizer escolha única.')
D.i(0, '• Corpo do POST /pedidos: {"restaurante_id": 6, "itens": [{"item_id": 36, "quantidade": 2, "opcoes": [106, 109], "observacao": "sem cebola"}], "endereco": {"cep": "03164-000", "numero": "45", "complemento": ""}, "pagamento": "pix" | "cartao" | "dinheiro", "troco_para": 20000 ou null, "cupom": "FRETEGRATIS" ou null, "total_esperado": 10660}.')
D.i(0, '• Status do pedido: recebido → em_preparo → a_caminho → entregue (ou cancelado). Para a prova, o relógio é acelerado: muda em 30 s, 90 s e 150 s depois do pedido. historico traz {status, em} com a hora de cada etapa. criado_em, cancelado_em, historico[].em e previsao_entrega vêm em UTC (terminam com Z).')
D.i(0, '• A API demora de propósito entre 0,25 e 0,9 s, e as respostas podem chegar fora de ordem.')
D.p('Conta de teste: cliente@sabor.com.br, senha Sabor2026!. Outra conta: ana@sabor.com.br, mesma senha. CEPs atendidos: 03101-001, 03102-002 (Mooca, sem acréscimo), 03164-000 (+R$ 3,00), 03301-000 (+R$ 5,00), 03047-000, 03181-100 e 04101-000. Cupons: BEMVINDO10, FRETEGRATIS, DESCONTO15 e VERAO2025 (vencido).')

D.h('Telas e requisitos')
D.s('1. Estrutura, rotas e sessão')
D.i(0, '1.1. Vue Router com histórico em hash: #/ (início), #/restaurante/:slug, #/entrar, #/checkout, #/pedidos e #/pedidos/:id. Rota desconhecida mostra "Página não encontrada". O título da aba muda por tela ("Smash do Bairro · Sabor de Bairro").')
D.i(0, '1.2. Cabeçalho fixo com logotipo, links Restaurantes e Meus pedidos (link ativo destacado), botão de tema, "Olá, <primeiro nome>" + Sair (ou Entrar) e o botão do carrinho com contador.')
D.i(0, '1.3. #/checkout, #/pedidos e #/pedidos/:id exigem login. Sem token, vão para #/entrar?voltar=<rota>; depois de entrar, o cliente volta para essa rota. Só aceite valores de voltar que comecem com "/".')
D.i(0, '1.4. Qualquer resposta 401 com token (token vencido) apaga a sessão, mostra o aviso "Sua sessão expirou. Entre de novo para continuar." e leva ao login guardando a tela atual.')
D.i(0, '1.5. Ao trocar de tela, o foco vai para o <main>. Link "Pular para o conteúdo" no início da página.')

D.s('2. Início (#/)')
D.i(0, '2.1. Vitrine com o título "A comida do seu bairro, quentinha na sua porta.", a foto img/vitrine.jpg e o campo de busca. Um brilho suave segue o cursor sobre a vitrine (vídeo 01).')
D.i(0, '2.2. A busca espera o cliente parar de digitar (cerca de 350 ms) antes de mudar a URL e pedir à API. Buscar "temaki" encontra o restaurante que tem esse prato.')
D.i(0, '2.3. Chips de categoria (gerados de GET /categorias, com a cor do JSON) com aria-pressed; "Todas" limpa a categoria. Interruptores "Abertos agora" e "Entrega grátis" e select "Ordenar por" (Relevância, Melhor avaliados, Entrega mais rápida, Menor taxa, Nome A–Z). Contador "14 restaurantes" em aria-live.')
D.i(0, '2.4. A URL é a fonte da verdade: busca, categoria, aberto, gratis e ordem ficam na query (ex.: #/?categoria=3&aberto=1&ordem=avaliacao). F5, o botão Voltar e um link colado restauram os controles e a lista. Parâmetros vazios não aparecem na URL.')
D.i(0, '2.5. Paginação do servidor com o botão "Carregar mais (8)", que acrescenta a próxima página ao fim da lista e some na última. Mudar qualquer filtro recomeça da página 1.')
D.i(0, '2.6. Só a resposta do último pedido pode ser desenhada (cancele ou ignore os anteriores).')
D.i(0, '2.7. Cartão: foto, nome, nota com uma casa decimal, categoria, "20–35 min" e taxa (ou "Grátis"). Restaurante fechado: foto em tons de cinza e selo "Abre hoje às 18:00" / "Abre amanhã às 10:30" / "Abre sáb., 22/11 às 13:00", calculado a partir de abre_em. Entrega grátis: selo verde. Hover: o cartão sobe e a foto aproxima.')
D.i(0, '2.8. Estados: esqueleto com brilho enquanto carrega, erro com "Tentar de novo" e vazio com o termo buscado e "Limpar filtros".')

D.s('3. Cardápio (#/restaurante/:slug)')
D.i(0, '3.1. Capa com a imagem do restaurante, voltar, nome, nota (nº de avaliações), tempo, taxa, pedido mínimo, situação ("Aberto agora" ou "Fechado · Abre hoje às 18:00") e endereço. Fechado: aviso de que o cardápio pode ser visto, mas não dá para pedir.')
D.i(0, '3.2. Barra de abas das seções, fixa logo abaixo do cabeçalho, com campo "Buscar no cardápio" (filtro local, sem acento; seção sem resultado some junto com a aba).')
D.i(0, '3.3. Clicar numa aba rola suavemente até a seção e leva o foco ao título dela. Ao rolar a página, a aba da seção visível acende sozinha (scrollspy, aria-current="true"); no fim da página acende a última. No celular, a barra rola de lado para mostrar a aba ativa.')
D.i(0, '3.4. "Mais pedidos": até 3 pratos destaque disponíveis (no celular, carrossel com scroll-snap). Depois, as seções com os pratos: nome, descrição em até 2 linhas, preço ("A partir de" quando houver opções) e foto. Prato indisponível fica desabilitado com selo "Esgotado".')
D.i(0, '3.5. Clicar num prato abre o modal e põe ?item=<id> na URL: F5 reabre o modal e o botão Voltar do navegador o fecha.')

D.s('4. Modal do prato')
D.i(0, '4.1. Modal acessível: role="dialog", aria-modal, aria-labelledby; o foco entra, Tab não sai, Esc/X/clique no fundo fecham, o fundo não rola e o foco volta ao prato que abriu (também quando o modal foi aberto pelo F5).')
D.i(0, '4.2. Foto, descrição, preço e um bloco por grupo de opções: nome, selo "Obrigatório" ou "Opcional", regra ("Escolha 1", "Até 3", "De 1 a 2") e contador "1 de 3". max = 1 usa radio; max > 1 usa checkbox, e ao atingir o máximo as outras opções do grupo ficam desabilitadas.')
D.i(0, '4.3. Observação até 140 caracteres com contador. Quantidade de 1 a 20 com botões − e +.')
D.i(0, '4.4. O botão mostra "Adicionar · R$ 91,80", com (preço + opções) × quantidade sempre atualizado. Se faltar um grupo obrigatório, ao clicar: o botão passa a dizer "Escolha: Ponto da carne", o grupo fica vermelho com uma tremida e o foco vai para ele.')
D.i(0, '4.5. Com o restaurante fechado, o botão fica desabilitado: "Restaurante fechado".')

D.s('5. Carrinho')
D.i(0, '5.1. O carrinho é um só para o app inteiro (estado reativo compartilhado), salvo no localStorage e restaurado no F5. Ele guarda um restaurante por vez.')
D.i(0, '5.2. O mesmo prato com as mesmas opções (em qualquer ordem de clique) e a mesma observação soma a quantidade; se algo for diferente, vira outra linha.')
D.i(0, '5.3. Adicionar prato de outro restaurante abre a confirmação "Começar um novo carrinho?" (Voltar / Esvaziar e adicionar). Não use window.confirm.')
D.i(0, '5.4. Ao adicionar: aviso "2× Clássico no carrinho" e o contador do cabeçalho dá um pulo.')
D.i(0, '5.5. Gaveta que entra pela direita (no celular, tela cheia): restaurante, linhas com foto, opções, observação, preço e −/+ (no 1, o − vira lixeira), "Esvaziar carrinho" com confirmação, barra do pedido mínimo ("Faltam R$ 14,00 para o pedido mínimo de R$ 20,00", role="progressbar"), subtotal e "Finalizar pedido", desabilitado até atingir o mínimo. Ao remover uma linha, o foco não pode se perder.')
D.i(0, '5.6. No celular (até 768 px), barra fixa no rodapé "Ver carrinho · R$ 103,70" com o número de itens, fora do checkout e do acompanhamento.')

D.s('6. Entrar (#/entrar)')
D.i(0, '6.1. Tela dividida: arte img/entrar.jpg e o formulário. Vindo do checkout, o texto diz "Entre para finalizar o seu pedido. O carrinho continua salvo."')
D.i(0, '6.2. Erros 422 embaixo de cada campo com aria-invalid; erro 401 em aviso acima do formulário; botão "Mostrar" (aria-pressed) para a senha; durante o envio, "Entrando…" desabilitado.')

D.s('7. Finalizar pedido (#/checkout)')
D.i(0, '7.1. Três passos: Endereço, Pagamento e Revisão, com indicador (aria-current="step" no atual e ✓ nos feitos). O passo atual fica na URL (?passo=2). Os dados digitados ficam no sessionStorage: F5 não perde nada.')
D.i(0, '7.2. Não avança com o passo inválido: o erro aparece no campo e o foco vai até ele. Ao trocar de passo, o foco vai para o título do passo. Voltar não perde dados. Clicar num passo à frente só funciona se os anteriores estiverem válidos.')
D.i(0, '7.3. Endereço: CEP com máscara 00000-000 (só números). Com 8 dígitos, busca GET /ceps/{cep} sozinho e mostra "Rua Itapiti · Água Rasa, São Paulo/SP · +R$ 3,00 na entrega" ou o 404 da API. Trocar o CEP no meio da busca cancela a anterior. Número obrigatório, complemento opcional.')
D.i(0, '7.4. Pagamento: três cartões de rádio (Pix, Cartão na entrega, Dinheiro). Dinheiro mostra o interruptor "Preciso de troco" e o campo "Troco para quanto?", que precisa ser maior que o total.')
D.i(0, '7.5. Revisão: endereço e pagamento com "Alterar" e o campo de cupom (Aplicar → POST /cupons/validar). Erro do cupom embaixo do campo; cupom aceito mostra código, descrição e "Remover cupom".')
D.i(0, '7.6. Resumo lateral (fixo ao rolar no desktop; embaixo no celular): itens, subtotal, entrega (taxa do restaurante + acréscimo do bairro), desconto e total. O cupom de frete grátis desconta a entrega inteira, com o acréscimo.')
D.i(0, '7.7. "Confirmar pedido · R$ 106,60" envia POST /pedidos com total_esperado igual ao total da tela e fica desabilitado com "Enviando pedido…". 201: esvazia carrinho e rascunho e vai para #/pedidos/{id}. 422: volta ao passo do primeiro campo com erro e marca o campo. 409: alerta com a mensagem da API, focado.')

D.s('8. Acompanhar pedido (#/pedidos/:id)')
D.i(0, '8.1. Consulta GET /pedidos/{id} a cada 5 s com setTimeout encadeado (a próxima só depois da anterior terminar). Para quando o pedido termina (entregue ou cancelado), quando o cliente sai da tela e enquanto a aba está escondida.')
D.i(0, '8.2. "Previsão de entrega: até 19:35" (ou "Entregue às 19:28. Bom apetite!"), linha do tempo com 4 etapas e o horário de cada uma; a linha verde cresce até a etapa atual e a bolinha atual pulsa. A mudança de status é anunciada em aria-live. No celular, a linha fica vertical.')
D.i(0, '8.3. "Cancelar pedido" só com pode_cancelar, com confirmação. 409 mostra o aviso e atualiza a tela.')
D.i(0, '8.4. Com pode_avaliar: 5 estrelas como grupo de rádio (setas funcionam, o mouse acende uma prévia, rótulos Péssimo, Ruim, Ok, Bom, Excelente), comentário com contador 280 e a regra da nota 1 ou 2. Avaliação feita aparece no lugar do formulário.')
D.i(0, '8.5. Abaixo: itens com opções e observação, subtotal, entrega, desconto, total, pagamento e endereço.')

D.s('9. Meus pedidos (#/pedidos)')
D.i(0, '9.1. Lista do servidor, 5 por página: "Pedido #1007", status colorido, data e hora em Brasília, itens resumidos e total. Paginação numerada com anterior/próxima, aria-current="page" e a página na URL (?pagina=2). Página além da última abre a última.')

D.s('10. Geral')
D.i(0, '10.1. Dinheiro sempre com Intl.NumberFormat pt-BR a partir dos centavos. Datas com Z sempre convertidas para America/Sao_Paulo, qualquer que seja o fuso do computador.')
D.i(0, '10.2. Tema claro e escuro com botão (aria-pressed), salvo no navegador, respeitando o sistema na primeira visita, aplicado antes da primeira pintura (sem piscar no F5).')
D.i(0, '10.3. 1440, 768 e 375 px conforme os prints, sem rolagem lateral. Em 375 px o modal sobe de baixo como uma folha.')
D.i(0, '10.4. Todas as animações respeitam prefers-reduced-motion. Fontes locais com font-display: swap. Console sem erros.')

D.h('Materiais fornecidos')
D.tabela([
 ('Pasta/Arquivos', 'Descrição'),
 ('api/', 'API pronta (index.php, nucleo.php, .htaccess, semente/ com os dados iniciais). Não altere.'),
 ('js/lib/', 'vue.global.prod.js e vue-router.global.prod.js'),
 ('img/', 'logo-sabor.svg, favicon.svg, vazio-carrinho.svg, vazio-busca.svg, vitrine.jpg, entrar.jpg, restaurantes/ (14) e pratos/ (22)'),
 ('fonts/', 'Bricolage Grotesque (títulos) e Instrument Sans (texto) em woff2, com a licença OFL'),
 ('design/', 'Prints de 5 telas em 1440, 768 e 375 px e a pasta estados/ com 27 interações'),
 ('design/videos/ e design/Design.mp4', '15 vídeos MP4, um por animação, e todos juntos'),
 ('DICAS.md', 'Pistas para a prova (sem código pronto)'),
], [0.3, 0.7])
D.s('Cores e tipografia')
D.p('Terracota #B83A1B (no escuro #F0784F), fundo #FFF8F1 (escuro #17110D), superfície #FFFFFF (escuro #221913), texto #2A1A12 (escuro #F7EDE4), texto suave #6E5A4E, borda #EAD9C8, verde #2E7D4F, amarelo #E8A33D, erro #B42318. Títulos em Bricolage Grotesque 800; texto em Instrument Sans 400/700. Cantos de 16 px nos cartões e 999 px nos botões.')

D.h('Instruções de entrega')
D.i(0, '11. Projeto na pasta XX_modulo_d/ (XX = seu número), com index.html na raiz e as pastas css/, js/, api/, img/ e fonts/.')
D.i(0, '12. Publique em http://servidor/XX_modulo_d/, dê permissão de escrita em api/dados/ e teste no servidor antes do fim do tempo.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Descrição', 'Pontuação')]
for s in SUB: linhas.append((s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')))
linhas.append(('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)

D.pb()
D.h('Anexo A: telas em 1440 px')
for r, nome in (('inicio', 'Início'), ('cardapio', 'Cardápio'), ('checkout', 'Finalizar pedido'), ('pedido', 'Acompanhar pedido (entregue)'), ('pedidos', 'Meus pedidos')):
    D.img(f'{IMG}/layout-1440-{r}.jpg', 15.5, f'{nome} – 1440 px')
    D.pb()
D.h('Anexo B: 768 px e 375 px')
D.imgs_lado([f'{IMG}/layout-768-inicio-topo.jpg', f'{IMG}/layout-768-checkout-topo.jpg'], 7.4, 'Início e Finalizar pedido em 768 px (página inteira em design/)')
D.pb()
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('inicio', 'cardapio', 'checkout')], 4.9, 'Início, Cardápio e Finalizar pedido em 375 px')
D.imgs_lado([f'{IMG}/layout-375-pedido-topo.jpg', f'{IMG}/estado-26-celular-barra-carrinho.jpg', f'{IMG}/estado-27-celular-modal.jpg'], 4.9, 'Pedido, barra do carrinho e modal em 375 px')
D.pb()
D.h('Anexo C: vídeos das animações')
leg = json.load(open(sys.path[0] + '/legendas.json'))
D.tabela([('Arquivo (design/videos/)', 'O que mostra')] + [(k + '.mp4', v.split('· ', 1)[1]) for k, v in leg.items()], [0.45, 0.55])
D.pb()
D.h('Anexo D: estados de interação')
EST = [('estado-01-carregando-esqueleto', 'Carregando (esqueleto)'), ('estado-02-filtros-na-url', 'Hambúrguer + abertos + melhor avaliados'),
       ('estado-03-busca-sem-resultado', 'Busca sem resultado'), ('estado-04-cartao-hover', 'Cursor sobre um cartão'), ('estado-05-erro-api', 'Erro da API'),
       ('estado-06-abas-scrollspy', 'Aba Bebidas depois do clique'), ('estado-07-modal-prato', 'Modal do prato'),
       ('estado-08-grupo-obrigatorio', 'Adicionar sem escolher o grupo obrigatório'), ('estado-09-maximo-atingido', 'Máximo do grupo atingido'),
       ('estado-10-adicionado-toast', 'Depois de adicionar'), ('estado-11-gaveta-abaixo-do-minimo', 'Gaveta abaixo do pedido mínimo'),
       ('estado-12-confirmar-outro-restaurante', 'Prato de outro restaurante'), ('estado-14-login-422', 'Login vazio (422) vindo do checkout'),
       ('estado-15-cep-fora-da-area', 'CEP fora da área (404)'), ('estado-16-cep-encontrado', 'CEP encontrado com acréscimo'),
       ('estado-17-troco-invalido', 'Troco menor que o total'), ('estado-18-cupom-vencido', 'Cupom vencido (422)'),
       ('estado-19-cupom-frete-gratis', 'Frete grátis aplicado'), ('estado-20-pedido-recebido', 'Pedido recém-criado'),
       ('estado-21-confirmar-cancelamento', 'Confirmação de cancelamento'), ('estado-22-avaliacao-nota-baixa', 'Nota 2 sem comentário'),
       ('estado-23-pedidos-pagina-2', 'Meus pedidos, página 2'), ('estado-24-tema-escuro', 'Tema escuro'), ('estado-25-tema-escuro-modal', 'Modal no tema escuro (restaurante fechado)')]
for f, cap in EST:
    D.img(f'{IMG}/{f}.jpg', 14.0, f'{cap}.')
D.save(OUT)
print('ok')
