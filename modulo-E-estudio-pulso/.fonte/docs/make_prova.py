import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_pulso import SUB, TOTAL
IMG = sys.argv[1]; OUT = sys.argv[2]
D = Doc('Projeto de prova – Front-end Funcionalidades', 'Módulo E – Estúdio Pulso: academia e aulas coletivas', 'SPSKILLS_ME_PULSO_REVISAO_2026')

D.h('Introdução')
D.p('O Estúdio Pulso é uma academia de Campinas com seis modalidades de aulas coletivas: spinning, yoga, funcional, pilates, dança e boxe. As vagas de cada aula são limitadas e hoje são reservadas por mensagem no celular da recepção, o que gera aula lotada, aluno sem vaga e muita confusão com a lista de espera.')
D.p('O estúdio quer um site onde o aluno veja a grade semanal, reserve a vaga (ou entre na lista de espera), acompanhe as aulas que fez, monte o próprio treino de musculação e compare os planos. O site é um front-end que consome uma API em JSON; o login é simulado com uma conta de demonstração.')
D.p('Sua tarefa é construir a aplicação de página única (SPA) com Vue 3 e Vue Router 4, com todas as regras descritas neste documento.')
D.p('Observação: o Estúdio Pulso é um projeto fictício de treino. Todas as imagens fornecidas são ilustrações originais.')

D.h('Descrição do projeto')
D.p('Tempo de prova: 4 horas (mais 30 minutos de leitura antes do início, fora do tempo de prova).')
D.p('A aplicação tem seis telas: Início, Grade de aulas (com o modal da aula), Planos, Montar treino, Entrar e Minha área. Os prints de design/ mostram o resultado esperado em 1440 px, 768 px e 375 px; design/estados/ mostra 20 interações. Cada animação tem vídeo de referência em design/videos/ e todas juntas estão em design/Design.mp4 (cursor = círculo amarelo, teclas na tela, legenda amarela no canto).')
D.p('Use Vue 3 e Vue Router 4 pelas versões globais fornecidas em js/vendor/ (sem etapa de build e sem outras bibliotecas). Os componentes podem ser objetos com a opção template em módulos ES. JavaScript puro também é aceito, desde que cumpra os mesmos requisitos. Não é permitido usar bibliotecas de componentes ou de CSS.')
D.p('Data e hora "atuais": a aplicação deve usar o campo agora de api/config.json (terça-feira, 08/12/2026, 08:00, horário de Brasília) como o momento atual em todas as regras.')

D.h('A API')
D.tabela([
 ('Recurso', 'Campos', 'Observações'),
 ('api/config.json', 'agora, max_aulas_por_dia, cancelamento_minimo_minutos, semanas_a_frente, max_exercicios_treino, avatar_max_mb, avatar_min_px', 'Regras do negócio. Não escreva esses números no código.'),
 ('api/modalidades.json (6)', 'id, nome, cor, intensidade, descricao', 'intensidade: 1 Leve, 2 Média, 3 Forte'),
 ('api/professores.json (6)', 'id, nome, especialidade, foto, bio', ''),
 ('api/aulas.json (34)', 'id, modalidade_id, professor_id, dia_semana, inicio, duracao_min, sala, capacidade, inscritos, lista_espera', 'Grade que se repete toda semana. dia_semana: 1 = segunda ... 6 = sábado'),
 ('api/planos.json (3)', 'id, nome, mensal, anual_por_mes, destaque, beneficios', 'beneficios: chave → true/false ou número/texto'),
 ('api/exercicios.json (24)', 'id, nome, grupo, equipamento, segundos_por_serie', ''),
 ('api/faq.json (5)', 'pergunta, resposta', ''),
 ('api/aluna-demo.json', 'email, senha, nome, plano_id, meta_mensal, historico', 'Conta para o login simulado. historico: aulas já feitas (data e modalidade)'),
], [0.24, 0.44, 0.32])
D.p('Importante: o fetch não funciona com o index.html aberto direto do disco (file://). Desenvolva e teste pelo servidor web.')

D.h('Telas e requisitos')
D.s('1. Estrutura, rotas e preferências')
D.i(0, '1.1. Cabeçalho: logotipo (link para o Início), menu Início, Aulas, Planos, Treino e Minha área (ícone + texto), botões de tamanho do texto A−, A e A+ (90%, 100% e 115%, com aria-pressed), botão de tema e, à direita, Entrar (visitante) ou a foto/iniciais da aluna com o botão Sair.')
D.i(0, '1.2. Rotas por hash (createWebHashHistory): #/inicio, #/aulas, #/aulas/:aulaId/:data (modal da aula, rota filha da grade), #/planos, #/treino, #/entrar e #/minha-area. Sem hash abre o Início; rota inexistente mostra "Página não encontrada".')
D.i(0, '1.3. O item do menu da tela atual tem a classe ativo e aria-current="page", também em #/aulas/9/2026-12-08, depois de F5 e do Voltar.')
D.i(0, '1.4. Título da aba no formato "Grade de aulas – Estúdio Pulso". Ao trocar de tela o foco vai para o h1 (abrir o modal ou mudar filtro não move o foco).')
D.i(0, '1.5. Guarda de navegação: #/minha-area sem login leva a #/entrar?volta=/minha-area com a mensagem "Entre na sua conta para continuar."; depois do login a aluna volta para o endereço de volta (só caminhos internos que começam com "/"). Logada, #/entrar leva à Minha área.')
D.i(0, '1.6. Transição entre telas (a tela antiga sai antes da nova entrar) e transição dos cards quando a lista muda.')
D.i(0, '1.7. Tema claro/escuro (na primeira visita segue o sistema) e tamanho do texto ficam no localStorage e já valem antes de a página aparecer (sem piscar).')
D.i(0, '1.8. Carregando e erro: se algum arquivo falhar, "Ops! Algo deu errado" com o botão Tentar novamente, que recarrega sem F5.')
D.i(0, '1.9. Avisos (toasts) empilhados no canto, com aria-live, que somem sozinhos e podem ter uma ação (Desfazer).')

D.s('2. Início (#/inicio)')
D.i(0, '2.1. Hero com img/hero.jpg, título "Seu ritmo. Nossa energia.", texto e os botões Ver grade de aulas e Conhecer os planos.')
D.i(0, '2.2. Faixa com 4 números calculados da API: aulas por semana, modalidades, professores e vagas livres hoje. Os números sobem de 0 até o valor quando a faixa aparece na tela (IntersectionObserver + requestAnimationFrame); o leitor de tela recebe o valor final.')
D.i(0, '2.3. "Ainda hoje": as aulas de hoje que ainda não começaram, com horário, modalidade, professor, sala e vagas (ou "Lista de espera"). Clicar abre o modal da aula.')
D.i(0, '2.4. Modalidades: um card por modalidade com a cor da API, a descrição e a intensidade em 3 barrinhas.')
D.i(0, '2.5. Carrossel de professores com scroll-snap: a trilha rola de verdade (dedo, trackpad) e encaixa em cada card. Botões ‹ › rolam um card e ficam desabilitados no começo e no fim. Bolinhas acompanham a rolagem e levam ao card. Com o foco na trilha, setas ← →, Home e End.')

D.s('3. Grade de aulas (#/aulas)')
D.i(0, '3.1. Navegação entre semanas: Esta semana, Próxima semana e Daqui a 2 semanas (config.semanas_a_frente), com o período (07/12 a 12/12) e botões desabilitados nas pontas.')
D.i(0, '3.2. Filtros: chips das modalidades (pode marcar várias; aria-pressed; cor da modalidade), select de professor (ordem alfabética, opção Todos), intensidade (Todas, Leve, Média, Forte) e o interruptor "Só com vaga". Todos funcionam juntos. Contador "N aulas nesta semana" e Limpar filtros.')
D.i(0, '3.3. Os filtros, a semana e o dia (celular) ficam na URL: modalidade=1,3, professor, intensidade, vagas=1, semana e dia. Use router.replace (não cria histórico). F5 e link restauram tudo; valores inválidos são ignorados.')
D.i(0, '3.4. Grade com CSS Grid de verdade: uma linha a cada 15 minutos das 06:00 às 22:00 (hora marcada a cada hora) e uma coluna por dia (segunda a sábado), com o dia de hoje destacado. Cada aula é posicionada pela hora de início e pela duração.')
D.i(0, '3.5. Aulas que se sobrepõem no mesmo dia ficam lado a lado (cada dia tem 2 pistas); as outras ocupam a largura toda do dia.')
D.i(0, '3.6. Cada card de aula mostra horário de início e fim, modalidade, primeiro nome do professor e a situação: "N vagas" (até 3 vagas em destaque de "poucas"), "Lista de espera" (lotada), "Você vai ✓", "Você é o Nº da fila", "Em andamento" ou "Encerrada". Cor da modalidade na borda e aria-label completo (modalidade, dia, horário, professor e situação).')
D.i(0, '3.7. Abaixo de 768 px a grade vira abas por dia (padrão de abas acessível com setas ← →, Home e End) e uma lista das aulas do dia escolhido.')

D.s('4. Modal da aula (#/aulas/:aulaId/:data)')
D.i(0, '4.1. O modal é uma rota filha da grade: o endereço pode ser copiado, o F5 reabre o modal e o Voltar fecha. Fechar volta para a grade mantendo os filtros. Aula ou data inexistente mostra "Aula não encontrada".')
D.i(0, '4.2. Modal acessível reutilizável: fundo escuro, transição, foco preso, fecha com Esc, X e clique fora, foco volta para quem abriu e a página não rola atrás.')
D.i(0, '4.3. Conteúdo: modalidade, dia e horário, descrição, professor com foto e especialidade, sala, intensidade, vagas, lista de espera e barra de ocupação.')
D.i(0, '4.4. Botão principal conforme a situação (as regras ficam no estado global, não no template):')
D.i(1, 'a) visitante: "Entrar para reservar" (leva ao login e depois volta para o modal);')
D.i(1, 'b) aula que já começou ou terminou: sem botão, com o motivo;')
D.i(1, 'c) com vaga: Reservar; lotada: Entrar na lista de espera (posição = lista_espera + 1);')
D.i(1, 'd) no máximo max_aulas_por_dia (2) reservas no mesmo dia, contando lista de espera;')
D.i(1, 'e) não pode ter conflito de horário com outra reserva do dia (mostrar com qual: "Conflito de horário com Yoga (08:30–09:30).");')
D.i(1, 'f) já reservada: Cancelar reserva, só até cancelamento_minimo_minutos (60) antes do início; depois disso, o motivo. Cancelar mostra aviso com Desfazer.')
D.i(0, '4.5. Reservar com vaga diminui as vagas mostradas na grade e no modal na mesma hora.')

D.s('5. Entrar (#/entrar)')
D.i(0, '5.1. E-mail e senha com validação (e-mail válido, senha com pelo menos 6 caracteres), mensagens abaixo dos campos, aria-invalid e foco no primeiro erro. Botão Mostrar/Ocultar senha com aria-pressed.')
D.i(0, '5.2. Login simulado com api/aluna-demo.json (bia@pulso.com / Pulso2026!). Errado: "E-mail ou senha incorretos.", a senha é apagada e recebe o foco. Certo: aviso "Olá, Bia!". A senha nunca é gravada no navegador.')

D.s('6. Minha área (#/minha-area, protegida)')
D.i(0, '6.1. Foto do perfil: escolher arquivo, validar tipo (JPG, PNG, WEBP), tamanho (até avatar_max_mb) e dimensões (pelo menos avatar_min_px × avatar_min_px), com mensagem para cada caso. Prévia antes de salvar (Salvar / Descartar), Trocar e Remover. A foto vai para o cabeçalho; sem foto, as iniciais. Se o localStorage estiver cheio, mostrar erro em vez de quebrar.')
D.i(0, '6.2. Meta do mês: anel de progresso (aulas feitas no mês / meta) com conic-gradient e campo para mudar a meta (inteiro de 4 a 30).')
D.i(0, '6.3. Gráfico de barras das últimas 8 semanas (a partir do histórico) só com CSS: barras sobem uma depois da outra e o valor aparece no hover e no foco. Gráfico de rosca por modalidade (conic-gradient com um pedaço por modalidade, na cor dela) com legenda em %.')
D.i(0, '6.4. Minhas aulas: reservas feitas no site, ordenadas por data, com filtro Todas / Confirmadas / Lista de espera, paginação de 5 com aria-current, selo da situação e Cancelar (quando permitido).')
D.i(0, '6.5. Sair: sai da tela protegida e só depois apaga a sessão (sem erro no console), com o aviso "Você saiu da sua conta."')

D.s('7. Planos (#/planos)')
D.i(0, '7.1. Interruptor Mensal/Anual (role="switch", aria-checked). Ao trocar, o preço de cada plano anima do valor antigo até o novo e aparece "cobrado anualmente · economia de R$ X por ano".')
D.i(0, '7.2. Cards dos 3 planos com o destaque "Mais escolhido" e lista de benefícios (✓ / ✕). Para quem está logado, o plano atual mostra "Seu plano atual".')
D.i(0, '7.3. Tabela comparativa gerada a partir dos benefícios da API; no celular ela rola na horizontal dentro da própria caixa.')
D.i(0, '7.4. Perguntas frequentes em acordeão (componente reutilizável): um item aberto por vez, aria-expanded, animação de altura e painel fechado fora do Tab.')

D.s('8. Montar treino (#/treino)')
D.i(0, '8.1. Catálogo de exercícios com busca (sem diferenciar maiúsculas e acentos) e chips de grupo muscular. Botão + adiciona; exercício já adicionado mostra ✓ e fica desabilitado. Máximo max_exercicios_treino (10).')
D.i(0, '8.2. "Meu treino": lista numerada com séries (1–6) e repetições (1–30) editáveis e validadas (erro na linha), botões ↑ ↓ e remover.')
D.i(0, '8.3. Reordenar arrastando pela alça (HTML5 Drag and Drop), com o item arrastado esmaecido e a posição de destino marcada.')
D.i(0, '8.4. Reordenar pelo teclado: com o foco na alça, Alt + ↑ / Alt + ↓ move o item, o foco acompanha e um aria-live anuncia a nova posição.')
D.i(0, '8.5. Resumo: total de séries, tempo estimado (soma de séries × (segundos_por_serie + 60 s de descanso), em minutos) e barra empilhada com a porcentagem de séries por grupo muscular.')
D.i(0, '8.6. Exportar o treino em .json e Importar um .json com validação: formato, quantidade máxima, exercício inexistente, exercício repetido e faixas de séries/repetições. Arquivo inválido mostra o motivo e não altera o treino.')
D.i(0, '8.7. O treino fica salvo no navegador (F5 mantém).')

D.s('9. Responsividade e acessibilidade')
D.i(0, '9.1. 1440, 768 e 375 px como nos prints. Em 375 px o menu fica fixo embaixo, a grade vira abas por dia, o modal sobe de baixo e a página não tem rolagem horizontal.')
D.i(0, '9.2. Link "Pular para o conteúdo", foco visível, textos alternativos, contraste. Lighthouse Acessibilidade de pelo menos 90 em Aulas e Minha área. Console sem erros e sem avisos do Vue.')

D.h('Paleta e tipografia')
D.p('Tema escuro: fundo #0B0F1A e #111727, superfície #151C2E e #1E2740, borda #2A3552, primária (rosa) #F43F5E, secundária (âmbar) #F59E0B, sucesso #34D399, perigo #F87171, informação #38BDF8, texto #F1F5F9 e texto secundário #A3AEC6.')
D.p('Tema claro: fundo #F6F7FB e #EEF1F7, superfície #FFFFFF e #F1F4F9, borda #D8DEEA, primária #E11D48, secundária #B45309, texto #0F172A e texto secundário #475569.')
D.p('Fontes em fonts/: Oswald (500 e 700) para títulos, números, menu e botões em maiúsculas; Roboto (400, 500 e 700) para o texto.')

D.h('Materiais fornecidos')
D.tabela([
 ('Pasta/Arquivos', 'Descrição'),
 ('api/', '8 arquivos JSON (veja a tabela da API)'),
 ('js/vendor/', 'vue.global.prod.js (Vue 3.5) e vue-router.global.prod.js (Vue Router 4.6)'),
 ('img/', 'hero.jpg, 6 fotos de professores, logo-pulso.svg e favicon.svg'),
 ('fonts/', 'Oswald e Roboto (TTF) com a licença OFL'),
 ('design/', 'Seis telas em 1440 e 375 px, três em 768 px e a pasta estados/ com 20 interações'),
 ('design/videos/', 'Um MP4 por animação (12 vídeos) e design/Design.mp4'),
 ('arquivos-teste/', 'Imagens e .json para testar a foto do perfil e o importar do treino'),
 ('DICAS.md', 'Pistas para a prova (sem código pronto)'),
], [0.3, 0.7])

D.h('Instruções de entrega')
D.i(0, '1. Coloque o projeto na pasta XX_modulo_e/ (XX = seu número de competidor), com index.html na raiz e as pastas css/, js/, api/, img/ e fonts/.')
D.i(0, '2. Publique no servidor em http://servidor/XX_modulo_e/ e teste lá antes do fim da prova. Só o que estiver no servidor será avaliado.')
D.i(0, '3. Os avaliadores testam no Google Chrome, com o fuso horário de Brasília, nas larguras 1440, 768 e 375 px, começando com o armazenamento do site limpo.')

D.h('Resumo da avaliação')
linhas = [('Subcritério', 'Descrição', 'Pontuação')]
for s in SUB: linhas.append((s[0], s[1], f'{sum(a[5] for a in s[2]):.2f}'.replace('.', ',')))
linhas.append(('TOTAL', '', f'{TOTAL:.2f}'.replace('.', ',')))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)

D.pb()
D.h('Anexo A: telas em 1440 px')
D.p('Os arquivos em tamanho real (página inteira) estão em design/. Abaixo, a parte de cima de cada tela, reduzida.')
for r, nome in (('inicio', 'Início'), ('aulas', 'Grade de aulas'), ('planos', 'Planos'), ('treino', 'Montar treino'), ('entrar', 'Entrar'), ('minha-area', 'Minha área (logada, com reservas)')):
    D.img(f'{IMG}/layout-1440-{r}.jpg', 15.5, f'{nome} – 1440 px')
    D.pb()
D.h('Anexo B: telas em 768 px e 375 px')
D.imgs_lado([f'{IMG}/layout-768-{r}.jpg' for r in ('inicio', 'aulas', 'minha-area')], 5.0, 'Início, Aulas e Minha área em 768 px')
D.pb()
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('inicio', 'aulas', 'planos')], 4.8, 'Início, Aulas e Planos em 375 px (primeira tela)')
D.imgs_lado([f'{IMG}/layout-375-{r}-topo.jpg' for r in ('treino', 'entrar', 'minha-area')], 4.8, 'Treino, Entrar e Minha área em 375 px')
D.pb()
D.h('Anexo C: vídeos das animações')
D.tabela([('Arquivo (design/videos/)', 'O que mostra'),
 ('01-inicio-hero-e-numeros.mp4', 'Hero, números que contam ao aparecer e hover dos cards de modalidade'),
 ('02-carrossel-professores.mp4', 'Setas, bolinhas, teclado e encaixe do scroll-snap'),
 ('03-menu-e-transicao.mp4', 'Link ativo e transição entre telas'),
 ('04-grade-filtros-semanas.mp4', 'Filtros combinados, URL, só com vaga, troca de semana e cards entrando/saindo'),
 ('05-modal-aula-e-reserva.mp4', 'Modal por rota, foco preso, reservar, conflito, lista de espera, limite por dia, cancelar e Voltar'),
 ('06-login-e-guarda.mp4', 'Guarda, validação, mostrar senha, volta para a tela pedida e Sair'),
 ('07-planos-e-faq.mp4', 'Mensal/Anual com preço animado, tabela e acordeão'),
 ('08-montar-treino.mp4', 'Busca, adicionar, arrastar, Alt + setas, validação, remover e exportar'),
 ('09-minha-area-graficos.mp4', 'Barras em sequência, rosca, meta, filtro e paginação'),
 ('10-foto-do-perfil.mp4', 'Arquivo errado, imagem pequena, prévia, salvar e remover'),
 ('11-tema-e-tamanho-do-texto.mp4', 'Tema e A− A A+ guardados no navegador'),
 ('12-celular-375.mp4', 'Menu inferior, abas por dia com setas e modal em folha'),
], [0.4, 0.6])
D.pb()
D.h('Anexo D: estados de interação')
EST = [('estado-01-filtros-na-url', 'Spinning + Forte'),
       ('estado-02-modal-aula-visitante', 'Funcional terça 09:00 (lotada) para visitante'),
       ('estado-03-guarda-redireciona-login', 'Minha área sem login'),
       ('estado-04-login-erros', 'Entrar com campos vazios'),
       ('estado-05-login-senha-errada', 'Senha errada'),
       ('estado-06-reserva-confirmada', 'Yoga terça 08:30 reservada às 08:00'),
       ('estado-07-cancelamento-bloqueado-60min', 'Cancelamento bloqueado (faltam menos de 60 min)'),
       ('estado-08-conflito-de-horario', 'Funcional 09:00 em conflito com Yoga 08:30–09:30'),
       ('estado-08b-lista-de-espera', 'Boxe 19:30 lotado: 4º na lista de espera'),
       ('estado-09-limite-2-aulas-por-dia', 'Spinning 18:00: limite de 2 aulas no dia'),
       ('estado-10-planos-anual', 'Planos no anual'),
       ('estado-11-faq-acordeao', 'FAQ com um item aberto'),
       ('estado-12-treino-erro-series', 'Séries fora da faixa'),
       ('estado-13-importar-invalido', 'Importar .json inválido'),
       ('estado-14-foto-pequena', 'Foto de 120 × 120 px'),
       ('estado-15-meta-invalida', 'Meta 50'),
       ('estado-16-grafico-hover', 'Valor da barra no hover'),
       ('estado-17-pagina-nao-encontrada', 'Rota inexistente'),
       ('estado-18-erro-api', 'Erro ao carregar a API'),
       ('estado-19-tema-claro-texto-maior', 'Tema claro com texto A+')]
for k, (f, cap) in enumerate(EST, 1):
    D.img(f'{IMG}/{f}.jpg', 14.5, f'Estado {k}. {cap}.')
D.save(OUT)
print('ok')
