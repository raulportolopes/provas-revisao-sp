# Conteúdo dos 2 projetos de revisão do Módulo F (Implementação de Design).
# Aspecto da CIS: (tipo, descrição, dedução, como verificar, WSOS, máximo, escala J)
# WSOS: 1 organização, 3 design/CSS, 4 front-end JS, 2 acessibilidade/responsivo

J_LAYOUT = ['Muito diferente do design: blocos fora de lugar, cores ou fontes erradas.',
            'Parecido em estrutura, mas com espaçamentos, tamanhos ou cores visivelmente diferentes.',
            'Quase idêntico: só pequenas diferenças de espaçamento ou peso de fonte.',
            'Idêntico ao design em posição, proporção, cores, tipografia e espaçamento.']
J_ANIM = ['Sem animação ou animação quebrada.',
          'Existe, mas com tempo, curva ou movimento bem diferentes do vídeo.',
          'Parecida com o vídeo, com pequenas diferenças de tempo ou suavidade.',
          'Igual ao vídeo: mesmo movimento, tempo e suavidade, sem travar.']

P1 = {
 'slug': 'observatorio', 'pasta': 'modulo-F-observatorio', 'nome': 'Observatório Estrela da Serra',
 'cfp': 'XX_modulo_f', 'porta': 8801, 'tema_css': 'escuro (padrão) e claro',
 'intro': 'O Observatório Estrela da Serra é um observatório público a 1.600 metros de altitude, na Serra Alta (SP). Ele abre a cúpula às sextas e sábados para o público ver planetas, nebulosas e chuvas de meteoros. A associação que mantém o observatório quer um site novo com três páginas: Início, Agenda e Galeria. O site deve ser idêntico às referências, com todos os efeitos dos vídeos, funcionar em 1440, 768 e 375 px e ter tema escuro (padrão) e claro.',
 'paleta': [('Fundo da página', '#070B1F', '#F4F1EA'), ('Painel (cartões)', '#111735', '#FFFFFF'), ('Painel 2 (campos, destaques)', '#182046', '#ECE7DC'),
            ('Texto', '#E8EAF6', '#1A1F3A'), ('Texto suave', '#A7ADCF', '#4A5070'), ('Lilás (gráficos, degradês)', '#8B7CF6', '#5B45D6'),
            ('Ciano (destaques, ícones)', '#5EEAD4', '#0B6158'), ('Âmbar (botão principal, ativo)', '#F6B54A', '#A14A06'), ('Rosa (detalhes)', '#F472B6', '#BE185D')],
 'fontes': 'Títulos: Oswald (Medium e Bold), em caixa alta. Textos: Inter (Regular, SemiBold e Bold). Os arquivos .woff2 estão em assets/fonts.',
 'paginas': [
  ('Estruturas fixas (todas as páginas)', [
    'Link “Pular para o conteúdo” escondido, que aparece ao receber foco pelo teclado.',
    'Cabeçalho fixo no topo, com efeito de vidro (fundo semitransparente com desfoque). Uma linha em degradê animado fica na borda superior.',
    'Barra de progresso de leitura na base do cabeçalho: ela enche da esquerda para a direita conforme a página rola, sem JavaScript.',
    'Links do menu com sublinhado âmbar que cresce do centro no hover e fica fixo no link da página atual (aria-current="page").',
    'Botão “Reservar visita” leva à Agenda. Botão de tema (sol/lua) troca entre escuro e claro com o ícone girando. O tema escolhido fica salvo e a página não pode piscar no tema errado ao carregar.',
    'Se a pessoa nunca escolheu, o tema segue a preferência do sistema (prefers-color-scheme).',
    'Abaixo de 1024 px o menu vira um botão “hambúrguer”. O menu abre como painel que desce (com animação), fecha com Esc, com o botão X e ao clicar num link. O botão informa aria-expanded.',
    'Rodapé com logo, endereço, horários e links.']),
  ('Página Início', [
    'Hero: o fundo é o céu (hero-ceu.jpg). A camada com as constelações (hero-constelacoes.png) só aparece dentro de um círculo (raio de 260 px com o mouse no hero) que segue o cursor como uma lanterna, com movimento suave (o círculo “persegue” o cursor). Ao sair do hero o círculo diminui para 220 px. Em telas de toque o círculo fica parado no canto superior direito e “respira”.',
    'Título com a palavra “APAGOU” em degradê que se move devagar.',
    'Cartão “Próximo grande evento” com contagem regressiva até 13/12/2026 às 23h (horário de Brasília): dias, horas, minutos e segundos com dois dígitos. Cada número que muda sobe com uma pequena animação.',
    'Planetas: 6 cartões. No hover (ou Enter/Espaço com foco, ou toque) o cartão gira 180° em 3D e mostra o verso com distância do Sol, diâmetro, duração do dia, luas e uma barra de gravidade comparada à Terra. O cartão é um botão com aria-pressed. Os planetas flutuam devagar, cada um com um atraso.',
    'Gráfico de barras “Horas de céu limpo por mês” feito só com HTML e CSS (12 barras). As barras sobem uma depois da outra quando o gráfico entra na tela. No hover a barra fica âmbar e mostra o valor.',
    'Gráfico de rosca “Como os visitantes usam as noites” (45%, 25%, 18%, 12%) feito com conic-gradient. A rosca gira e cresce ao entrar na tela. No hover de um item da legenda, as outras fatias e itens ficam apagados e o centro mostra o percentual do item.',
    'Comparador “cidade x serra”: as duas imagens sobrepostas e uma linha com alça. Arrastar (mouse ou toque) e as setas do teclado mudam o ponto de corte. O controle é um input range acessível.',
    'Chamada final com borda em degradê que gira sem parar (a borda é um conic-gradient animado).',
    'Seções entram de baixo com fade ao aparecer na tela.']),
  ('Página Agenda', [
    'Abas de mês (Dezembro 2026, Janeiro 2027, Fevereiro 2027) no padrão ARIA de abas: setas esquerda/direita, Home e End trocam de aba. Um indicador âmbar desliza para a aba ativa.',
    'Filtros por tipo (Todas, Observação, Palestra, Oficina) em chips com aria-pressed. A contagem “N atividades” acompanha.',
    'Cada evento é um acordeão: o cabeçalho mostra data, título, tipo e horário; ao abrir, a altura anima e mostra descrição, barra de ocupação e preço. A seta gira. Eventos sem vagas restantes mostram “Esgotado” e o botão fica desativado.',
    'Botão “Reservar” abre um modal (dialog) com o formulário: nome (mínimo 3 letras), e-mail, quantidade (de 1 até o menor valor entre 6 e as vagas que restam) e aceite das regras. Mensagens de erro em português abaixo de cada campo, só depois de tentar enviar ou sair do campo.',
    'O total é atualizado na hora (preço × quantidade, em reais). Ao confirmar, as vagas do evento diminuem e o modal mostra o protocolo OES-AAMMDD-IIVVV: data do evento (AAMMDD), id do evento com 2 dígitos e vagas que sobraram depois da reserva com 3 dígitos.',
    'O modal fecha com Esc, com o X e clicando fora. O foco volta para o botão que abriu.']),
  ('Página Galeria', [
    'Filtros por categoria (Todas, Nebulosas, Galáxias e aglomerados, Sistema Solar, Paisagens) com contagem.',
    'Cartões de foto que inclinam em 3D seguindo o cursor, com um brilho que acompanha o mouse. Ao sair voltam suavemente.',
    'Clique abre o lightbox (dialog) com a foto grande, título, descrição e a posição (ex.: “3 de 9”). Setas na tela e no teclado navegam de forma circular só entre as fotos visíveis no filtro. Esc fecha e o foco volta para a foto.']),
  ('Requisitos gerais', [
    'Layout em 1440, 768 e 375 px sem barra de rolagem horizontal. Os layouts de 768 e 375 px estão na pasta design.',
    'Sem frameworks nem bibliotecas: HTML, CSS e JavaScript puros.',
    'prefers-reduced-motion: com movimento reduzido, nada se move de forma contínua, mas tudo continua visível e funcional.',
    'Lighthouse (modo navegação, celular) com 90 ou mais em Desempenho, Acessibilidade, Boas práticas e SEO nas três páginas.',
    'Console sem erros. HTML válido.'])],
 'dados': [('dados/eventos.json', '12 eventos (5 em dezembro, 4 em janeiro, 3 em fevereiro) com id, título, tipo, data, horário, vagas, vagasRestantes, preço e descrição.'),
           ('dados/fotos.json', '9 fotos com id, título, categoria, descrição, autor e arquivo.')],
}

P1['cis'] = [
 ('F1', 'Entrega, organização e qualidade', [
   ('M', 'Site abre em /XX_modulo_f/ com as 3 páginas e links funcionando', 'Deduzir 0,10 por página que não abre', 'Abrir index.html e navegar pelo menu', 1, 0.30, None),
   ('M', 'Console sem erros nas 3 páginas', 'Deduzir 0,10 por página com erro', 'F12 > Console em cada página', 1, 0.30, None),
   ('M', 'Fontes Oswald e Inter carregadas de arquivos locais', 'Deduzir 0,10 por fonte errada', 'Inspecionar título e parágrafo > Computed > Rendered fonts', 3, 0.20, None),
   ('M', 'Sem framework ou biblioteca', '', 'Conferir as tags <script> e <link>', 1, 0.20, None),
 ]),
 ('F2', 'Estruturas fixas e tema', [
   ('M', 'Cabeçalho fixo com efeito de vidro (backdrop-filter) ao rolar', '', 'Rolar a página e conferir o desfoque', 3, 0.40, None),
   ('M', 'Barra de progresso enche conforme a rolagem, sem JavaScript', 'Zero se usar evento scroll', 'Rolar até o fim; inspecionar (animation-timeline)', 3, 0.50, None),
   ('M', 'Sublinhado do menu cresce no hover e fica no link da página atual', '', 'Passar o mouse nos links; trocar de página', 3, 0.40, None),
   ('M', 'Botão de tema troca escuro/claro, ícone gira e a escolha fica salva', 'Deduzir 0,20 se não salvar', 'Clicar, recarregar a página', 4, 0.60, None),
   ('M', 'Sem piscar no tema errado ao recarregar com tema claro salvo', '', 'Tema claro, F5 várias vezes', 4, 0.30, None),
   ('M', 'Tema claro com as cores da tabela (fundo #F4F1EA, texto #1A1F3A, âmbar #A14A06)', 'Deduzir 0,10 por cor errada', 'Computed no body, título e botão', 3, 0.40, None),
   ('M', 'Menu do celular abre animado, fecha com Esc, X e link; aria-expanded atualiza', 'Deduzir 0,15 por item faltando', 'Largura 375; usar mouse e teclado', 4, 0.60, None),
   ('M', 'Link “Pular para o conteúdo” aparece com Tab', '', 'Recarregar e apertar Tab', 2, 0.20, None),
   ('J', 'Fidelidade do cabeçalho e rodapé ao design', '', 'Comparar com index-1440.png', 3, 0.60, J_LAYOUT),
 ]),
 ('F3', 'Início: hero, contagem e planetas', [
   ('M', 'Constelações aparecem só num círculo que segue o cursor (máscara)', 'Zero se a imagem aparecer inteira', 'Mover o mouse pelo hero', 3, 1.00, None),
   ('M', 'O círculo persegue o cursor com suavidade e diminui ao sair do hero', '', 'Comparar com 02-hero-lanterna.mp4', 3, 0.50, None),
   ('M', 'Em tela de toque o círculo fica no canto e “respira”', '', 'DevTools > dispositivo com toque', 3, 0.30, None),
   ('M', 'Palavra em degradê animado no título', '', 'Observar o título', 3, 0.20, None),
   ('M', 'Contagem regressiva correta para 13/12/2026 23h (Brasília), 2 dígitos', 'Zero se o valor estiver errado', 'Calcular a diferença com o relógio', 4, 0.60, None),
   ('M', 'Número que muda sobe com animação', '', 'Observar os segundos', 3, 0.20, None),
   ('M', 'Cartão do planeta gira 180° em 3D no hover e mostra o verso (sem espelhar)', 'Zero se não for 3D', 'Passar o mouse nos 6 cartões', 3, 1.00, None),
   ('M', 'Cartão gira também com Enter/Espaço e aria-pressed muda', '', 'Tab até o cartão e Enter', 4, 0.40, None),
   ('M', 'Verso com 4 dados e barra de gravidade proporcional', 'Deduzir 0,10 por dado faltando', 'Conferir Terra (barra 1,00) e Júpiter', 3, 0.40, None),
   ('M', 'Planetas flutuam com atrasos diferentes', '', 'Observar os 6 cartões', 3, 0.20, None),
   ('J', 'Fidelidade do hero e dos planetas ao design', '', 'Comparar com index-1440.png e estado-planeta-virado.png', 3, 0.80, J_LAYOUT),
   ('J', 'Suavidade do giro 3D comparada ao vídeo', '', 'Comparar com 04-planetas-cartao-3d.mp4', 3, 0.40, J_ANIM),
 ]),
 ('F4', 'Início: gráficos, comparador e chamada', [
   ('M', 'Gráfico de barras em HTML/CSS com 12 meses e alturas proporcionais', 'Zero se for imagem ou canvas', 'Inspecionar as barras', 3, 0.60, None),
   ('M', 'Barras sobem em sequência ao entrar na tela', '', 'Rolar até o gráfico', 3, 0.50, None),
   ('M', 'Hover na barra: fica âmbar e mostra o valor', '', 'Passar o mouse em 3 barras', 3, 0.50, None),
   ('M', 'Rosca com conic-gradient e 4 fatias corretas (45/25/18/12)', 'Zero se for imagem', 'Inspecionar a rosca', 3, 0.60, None),
   ('M', 'Rosca gira e cresce ao entrar na tela', '', 'Rolar até o gráfico', 3, 0.30, None),
   ('M', 'Hover na legenda apaga as outras fatias e mostra o percentual no centro', 'Deduzir 0,25 se só destacar a legenda', 'Passar o mouse nos 4 itens', 3, 0.70, None),
   ('M', 'Comparador funciona arrastando e pelo teclado', 'Deduzir 0,30 se só um funcionar', 'Arrastar; Tab e setas', 4, 0.80, None),
   ('M', 'Borda da chamada em degradê girando continuamente', '', 'Observar a chamada final', 3, 0.50, None),
   ('M', 'Seções entram com fade ao aparecer na tela', '', 'Rolar a página', 3, 0.30, None),
   ('J', 'Fidelidade da seção de números ao design', '', 'Comparar com estado-grafico-hover.png', 3, 0.60, J_LAYOUT),
 ]),
 ('F5', 'Agenda: abas, filtros, acordeão e modal', [
   ('M', 'Abas de mês trocam a lista e o indicador desliza', '', 'Clicar nas 3 abas', 4, 0.50, None),
   ('M', 'Setas, Home e End trocam de aba (role tab, aria-selected)', 'Deduzir 0,15 por tecla que falha', 'Foco na aba e usar as teclas', 4, 0.50, None),
   ('M', 'Filtros de tipo com aria-pressed e contagem correta', 'Deduzir 0,15 por contagem errada', 'Combinar mês e tipo e contar', 4, 0.50, None),
   ('M', 'Acordeão com altura animada e seta girando', 'Deduzir 0,20 se abrir sem animação', 'Abrir e fechar 2 eventos', 3, 0.50, None),
   ('M', 'Eventos sem vagas com “Esgotado” e botão desativado', '', 'Procurar os esgotados na lista', 4, 0.30, None),
   ('M', 'Modal abre com animação e foco no primeiro campo; fecha com Esc, X e fora; foco volta', 'Deduzir 0,15 por item faltando', 'Abrir pelo botão Reservar', 4, 0.80, None),
   ('M', 'Validação em português: nome mínimo 3, e-mail, quantidade no limite, aceite', 'Deduzir 0,15 por regra que falha', 'Enviar vazio; quantidade 7', 4, 0.80, None),
   ('M', 'Total em reais atualiza com a quantidade', '', 'Mudar a quantidade', 4, 0.30, None),
   ('M', 'Protocolo OES-AAMMDD-IDVVV correto e vagas diminuem', 'Zero se o formato estiver errado', 'Evento 1 (8 vagas), reservar 2: OES-261204-01006', 4, 0.60, None),
   ('J', 'Fidelidade da Agenda e do modal ao design', '', 'Comparar com agenda-1440.png e estado-modal-reserva.png', 3, 0.50, J_LAYOUT),
 ]),
 ('F6', 'Galeria, responsivo e qualidade', [
   ('M', 'Filtro de categoria com contagem', '', 'Clicar nas 5 opções', 4, 0.30, None),
   ('M', 'Cartão inclina seguindo o cursor, com brilho, e volta suave ao sair', 'Deduzir 0,30 se não tiver brilho', 'Mover o mouse sobre 2 fotos', 3, 0.80, None),
   ('M', 'Lightbox com “N de M”, setas circulares só nas fotos filtradas, Esc e foco de volta', 'Deduzir 0,15 por item faltando', 'Filtrar Sistema Solar, abrir e navegar', 4, 0.80, None),
   ('M', 'Sem rolagem horizontal em 768 e 375 px nas 3 páginas', 'Deduzir 0,15 por página', 'Modo dispositivo; conferir scrollWidth', 2, 0.60, None),
   ('J', 'Fidelidade dos layouts de 768 e 375 px', '', 'Comparar com *-768.png e *-375.png', 2, 0.60, J_LAYOUT),
   ('M', 'prefers-reduced-motion: nada se move continuamente e tudo fica visível', '', 'Emular reduce no DevTools', 2, 0.40, None),
   ('M', 'Lighthouse 90+ nas 4 categorias da página Início', 'Deduzir 0,10 por categoria abaixo de 90', 'Lighthouse, celular, modo navegação', 2, 0.50, None),
   ('M', 'Imagens com alt adequado e campos com label', '', 'Inspecionar', 2, 0.30, None),
 ]),
]

P2 = {
 'slug': 'torra-serrana', 'pasta': 'modulo-F-torra-serrana', 'nome': 'Torrefação Torra Serrana',
 'cfp': 'XX_modulo_f', 'porta': 8802, 'tema_css': 'claro',
 'intro': 'A Torra Serrana é uma pequena torrefação da Serra da Mantiqueira que compra café direto de 8 fazendas e torra em lotes de 15 kg. A empresa quer uma loja online com três páginas: Início, Cafés (catálogo) e Preparo (receitas com cronômetro e calculadora). O site deve ser idêntico às referências, com todos os efeitos dos vídeos, e funcionar em 1440, 768 e 375 px. No celular a navegação vira uma barra fixa na parte de baixo da tela.',
 'paleta': [('Creme (fundo)', '#F7F1E8', ''), ('Creme 2 (seções e trilhos)', '#EFE4D3', ''), ('Papel (cartões)', '#FFFDF9', ''), ('Café (texto e fundos escuros)', '#2B1A12', ''),
            ('Café 2', '#4A3226', ''), ('Texto suave', '#6B5446', ''), ('Terracota (botões, destaques)', '#B54A22', ''), ('Terracota clara', '#E9A27E', ''), ('Verde (sucesso, frete)', '#3F6B4A', ''), ('Mel (detalhes)', '#E9C46A', '')],
 'fontes': 'Títulos e preços: Caladea (Regular, Bold e Italic). Textos: Inter (Regular, SemiBold e Bold). Os arquivos .woff2 estão em assets/fonts.',
 'paginas': [
  ('Estruturas fixas (todas as páginas)', [
    'Cabeçalho fixo de 88 px que encolhe para 64 px, com sombra, depois que a página rola 40 px. O conteúdo não pode “pular” quando ele encolhe.',
    'Menu com Início, Cafés e Preparo. O link da página atual fica em pílula escura (aria-current="page").',
    'Botão “Sacola” com selo do número de itens. Quando um café é adicionado, o selo dá um pulo.',
    'Sacola: gaveta lateral (440 px; largura total no celular) que entra pela direita com fundo escurecido. Mostra os itens com miniatura, preço, botões − e + e lixeira; barra de frete grátis (R$ 150) que enche; subtotal, frete (R$ 18,90 ou Grátis) e total. É um diálogo modal: prende o foco, fecha com Esc, com o X e clicando fora, e o foco volta ao botão. A sacola fica salva entre páginas e ao recarregar.',
    'Aviso (toast) “<café> foi para a sacola.” aparece embaixo por cerca de 2,5 segundos.',
    'Até 767 px o menu vira uma barra fixa na base da tela (72 px) com ícone e texto: Início, Cafés, Preparo e Sacola. O conteúdo não pode ficar escondido atrás dela.',
    'Rodapé escuro com logo, contato e links.']),
  ('Página Início', [
    'Hero com foto de fundo e degradê escuro da esquerda. As palavras do título sobem uma depois da outra ao carregar. A xícara solta vapor (3 linhas SVG que sobem e somem em loop).',
    'Botão “Conheça os cafés” magnético: ele se desloca um pouco na direção do cursor enquanto o mouse está em cima, e volta ao centro ao sair.',
    'Faixa terracota com as regiões de origem rolando sem fim (marquee em CSS). Pausa com o mouse em cima.',
    'Cafés da semana: 3 cartões carregados de dados/cafes.json (ids mantiqueira-amarelo, vale-do-garcia, sitio-aurora). No hover (ou foco) o cartão sobe, o anel da nota SCA enche e o número conta de 0 até a nota, e as 4 barras do perfil (acidez, corpo, doçura, amargor) crescem uma depois da outra. No celular o efeito acontece quando o cartão aparece na tela.',
    'Do pé à xícara: 4 etapas com uma linha vertical que enche conforme a rolagem (sem JavaScript).',
    'Depoimentos: carrossel com 4 depoimentos, setas, pontos e botão pausar. O ponto atual vira uma barra que enche em 6 s; quando enche, passa para o próximo (volta ao primeiro depois do último). Pausa com o mouse em cima, com foco dentro e pelo botão. Os depoimentos escondidos não recebem foco.',
    'Clube: interruptor Mensal/Anual (radiogroup com setas) que desliza e troca o preço com o número “rolando” (R$ 109,90 e R$ 94,90). Formulário com nome, e-mail e CEP com máscara 00000-000; erros em português abaixo dos campos; ao enviar, mensagem de sucesso com o primeiro nome e o plano escolhido.']),
  ('Página Cafés', [
    'Catálogo dos 8 cafés com o mesmo cartão da página Início.',
    'Filtros: busca por texto (procura em nome, origem e notas, sem diferenciar acentos e maiúsculas), torra (Todas, Clara, Média, Escura) e ordenação (maior nota SCA, menor preço, maior preço, nome A–Z).',
    'Contador “N cafés encontrados”, estado vazio com mensagem e botão para limpar os filtros.',
    'Os filtros ficam no endereço (?busca=&torra=&ordem=) e voltam ao recarregar.']),
  ('Página Preparo', [
    'Abas verticais com os 4 métodos (V60, Prensa francesa, Moka, AeroPress) no padrão ARIA (setas cima/baixo, Home, End). Os dados vêm de dados/metodos.json.',
    'Ficha do método: imagem, nome, resumo, café (g), água (ml), moagem e temperatura.',
    'Cronômetro: anel que enche (conic-gradient) com o tempo do método, botões Iniciar/Pausar/Continuar e Zerar. A lista de passos marca o passo atual e os passos feitos conforme o tempo.',
    'Calculadora: controle de água de 100 a 1000 ml; o café em gramas é água ÷ proporção do método, com 1 casa decimal.',
    'Perguntas frequentes em acordeão exclusivo (abrir uma fecha a outra) com altura animada.']),
  ('Requisitos gerais', [
    'Layout em 1440, 768 e 375 px sem barra de rolagem horizontal.',
    'Sem frameworks nem bibliotecas: HTML, CSS e JavaScript puros.',
    'Preços sempre no formato R$ 1.234,56.',
    'prefers-reduced-motion respeitado.',
    'Lighthouse (celular) com 90 ou mais em Desempenho, Acessibilidade, Boas práticas e SEO nas três páginas.',
    'Console sem erros. HTML válido.'])],
 'dados': [('dados/cafes.json', '8 cafés com id, nome, origem, altitude, torra, notas, perfil (acidez, corpo, doçura, amargor de 1 a 5), notaSCA, preço e imagem.'),
           ('dados/metodos.json', '4 métodos com tempo total, proporção, café, água, moagem, temperatura e passos (de/até em segundos).')],
}

P2['cis'] = [
 ('F1', 'Entrega, organização e qualidade', [
   ('M', 'Site abre em /XX_modulo_f/ com as 3 páginas e links funcionando', 'Deduzir 0,10 por página que não abre', 'Abrir index.html e navegar', 1, 0.30, None),
   ('M', 'Console sem erros nas 3 páginas', 'Deduzir 0,10 por página com erro', 'F12 > Console', 1, 0.30, None),
   ('M', 'Fontes Caladea e Inter carregadas de arquivos locais', 'Deduzir 0,10 por fonte errada', 'Computed > Rendered fonts', 3, 0.20, None),
   ('M', 'Sem framework ou biblioteca', '', 'Conferir <script> e <link>', 1, 0.20, None),
 ]),
 ('F2', 'Estruturas fixas e sacola', [
   ('M', 'Cabeçalho fixo encolhe depois de 40 px, com sombra, sem o conteúdo pular', 'Deduzir 0,20 se o conteúdo pular', 'Rolar devagar no topo', 3, 0.50, None),
   ('M', 'Link da página atual em pílula escura', '', 'Trocar de página', 3, 0.20, None),
   ('M', 'Selo da sacola mostra a quantidade e pula ao adicionar', '', 'Adicionar 2 cafés', 4, 0.40, None),
   ('M', 'Gaveta entra pela direita com fundo escurecido', '', 'Abrir a sacola', 3, 0.40, None),
   ('M', 'Gaveta: foco preso, Esc, X e clique fora fecham; foco volta ao botão', 'Deduzir 0,15 por item', 'Teclado e mouse', 4, 0.60, None),
   ('M', '+, − e lixeira atualizam linha, subtotal e total', 'Deduzir 0,20 por conta errada', '2× Mantiqueira + 1 Sítio Aurora = R$ 180,00', 4, 0.60, None),
   ('M', 'Frete R$ 18,90 abaixo de R$ 150 e Grátis a partir de R$ 150; barra enche', 'Zero se o limite estiver errado', 'Total R$ 62,00 e depois R$ 180,00', 4, 0.50, None),
   ('M', 'Sacola salva entre páginas e ao recarregar', '', 'Adicionar, ir a Preparo, F5', 4, 0.40, None),
   ('M', 'Aviso “… foi para a sacola.” por cerca de 2,5 s', '', 'Adicionar um café', 4, 0.20, None),
   ('M', 'Barra inferior fixa no celular, com ícone e texto, sem cobrir conteúdo', 'Deduzir 0,20 se cobrir o rodapé', 'Largura 375; rolar até o fim', 2, 0.60, None),
   ('J', 'Fidelidade do cabeçalho, gaveta e rodapé ao design', '', 'Comparar com estado-sacola-aberta.png', 3, 0.50, J_LAYOUT),
 ]),
 ('F3', 'Início: hero, faixa e cartões', [
   ('M', 'Palavras do título sobem em sequência ao carregar', 'Deduzir 0,20 se subirem juntas', 'Recarregar a página', 3, 0.50, None),
   ('M', 'Vapor da xícara sobe e some em loop', '', 'Observar a xícara', 3, 0.30, None),
   ('M', 'Botão magnético segue o cursor e volta ao centro', 'Zero se só mudar de cor', 'Mover o mouse sobre o botão', 4, 0.70, None),
   ('M', 'Faixa de regiões rola sem fim, sem salto, e pausa no hover', 'Deduzir 0,20 se der salto', 'Observar 20 s', 3, 0.50, None),
   ('M', 'Cartões gerados a partir de cafes.json (3 da semana, 8 no catálogo)', 'Zero se escritos no HTML', 'Alterar o preço no JSON e recarregar', 4, 0.50, None),
   ('M', 'Hover: anel da nota enche e o número conta até a nota', 'Deduzir 0,30 se o número não contar', 'Passar o mouse nos cartões', 3, 0.80, None),
   ('M', 'Hover: 4 barras do perfil crescem uma depois da outra até o valor certo', 'Deduzir 0,20 se crescerem juntas', 'Vale do Garcia: acidez 5/5, corpo 2/5', 3, 0.70, None),
   ('M', 'No celular o efeito do cartão acontece ao aparecer na tela', '', 'Largura 375 com toque', 3, 0.30, None),
   ('J', 'Fidelidade do hero e dos cartões ao design', '', 'Comparar com index-1440.png e estado-cartao-hover.png', 3, 0.80, J_LAYOUT),
   ('J', 'Suavidade das animações do hero e do cartão', '', 'Comparar com 01 e 05 .mp4', 3, 0.40, J_ANIM),
 ]),
 ('F4', 'Início: etapas, carrossel e clube', [
   ('M', 'Linha das etapas enche conforme a rolagem, sem JavaScript', 'Zero se usar evento scroll', 'Rolar e inspecionar', 3, 0.60, None),
   ('M', 'Carrossel troca sozinho a cada 6 s com o ponto virando barra que enche', 'Deduzir 0,30 se não tiver a barra', 'Observar 15 s', 4, 0.70, None),
   ('M', 'Setas e pontos funcionam e o carrossel é circular', '', 'Clicar além do último', 4, 0.40, None),
   ('M', 'Pausa no hover, com foco dentro e pelo botão (texto do botão muda)', 'Deduzir 0,15 por item', 'Testar os 3', 4, 0.50, None),
   ('M', 'Depoimentos escondidos não recebem foco (inert ou equivalente)', '', 'Tab dentro do carrossel', 2, 0.30, None),
   ('M', 'Interruptor desliza e o preço “rola” para 94,90 / 109,90', 'Deduzir 0,20 se só trocar o texto', 'Clicar e usar setas', 3, 0.60, None),
   ('M', 'Interruptor é radiogroup com setas do teclado', '', 'Foco e setas', 4, 0.30, None),
   ('M', 'CEP com máscara 00000-000 enquanto digita', '', 'Digitar 12345678', 4, 0.40, None),
   ('M', 'Erros em português e sucesso com o nome', 'Deduzir 0,15 por campo', 'Enviar vazio e depois correto', 4, 0.50, None),
   ('J', 'Fidelidade das seções etapas, depoimentos e clube', '', 'Comparar com index-1440.png e estado-clube-erros.png', 3, 0.50, J_LAYOUT),
 ]),
 ('F5', 'Cafés: catálogo e filtros', [
   ('M', 'Busca em nome, origem e notas, sem acento e sem diferenciar maiúsculas', 'Deduzir 0,20 por caso que falha', '“GARCA” acha 1; “mel” acha 6', 4, 0.80, None),
   ('M', 'Filtro de torra com estado ativo (aria-pressed)', '', 'Clara, Média e Escura', 4, 0.40, None),
   ('M', 'Ordenações corretas (nota, menor preço, maior preço, nome)', 'Deduzir 0,15 por ordenação errada', 'Conferir os 4 modos', 4, 0.60, None),
   ('M', 'Filtros combinados', '', 'Média + menor preço', 4, 0.30, None),
   ('M', 'Contador e estado vazio com botão limpar', '', 'Buscar “xyz” e limpar', 4, 0.40, None),
   ('M', 'Filtros no endereço e restaurados ao recarregar', '', 'Filtrar e F5', 4, 0.40, None),
   ('J', 'Fidelidade da página Cafés ao design', '', 'Comparar com cafes-1440.png e estado-busca-vazia.png', 3, 0.50, J_LAYOUT),
 ]),
 ('F6', 'Preparo, responsivo e qualidade', [
   ('M', 'Abas verticais trocam a ficha (dados do JSON) com setas, Home e End', 'Deduzir 0,15 por tecla', 'Clicar e usar o teclado', 4, 0.60, None),
   ('M', 'Cronômetro: anel enche, Iniciar/Pausar/Continuar e Zerar', 'Deduzir 0,20 se o anel não encher', 'AeroPress, 10 s', 4, 0.70, None),
   ('M', 'Passo atual e passos feitos acompanham o tempo', '', 'Observar a lista de passos', 4, 0.40, None),
   ('M', 'Calculadora: gramas = água ÷ proporção, 1 casa decimal', 'Zero se a conta estiver errada', 'V60 500 ml = 29,9 g; Moka 300 ml = 30,0 g', 4, 0.40, None),
   ('M', 'FAQ exclusivo (abrir uma fecha a outra) com altura animada', 'Deduzir 0,15 se não animar', 'Abrir 3 perguntas', 3, 0.40, None),
   ('M', 'Sem rolagem horizontal em 768 e 375 px nas 3 páginas', 'Deduzir 0,15 por página', 'Modo dispositivo', 2, 0.50, None),
   ('J', 'Fidelidade dos layouts de 768 e 375 px', '', 'Comparar com *-768.png e *-375.png', 2, 0.50, J_LAYOUT),
   ('M', 'Lighthouse 90+ nas 4 categorias da página Início', 'Deduzir 0,10 por categoria abaixo de 90', 'Lighthouse, celular', 2, 0.40, None),
   ('M', 'prefers-reduced-motion: faixa parada, vapor escondido, tudo visível', '', 'Emular reduce', 2, 0.30, None),
 ]),
]

# os pesos acima são relativos: aqui eles viram 30,00 pontos (múltiplos de 0,05)
def _normaliza(P, alvo=30.0):
    bruto = sum(a[5] for _, _, asp in P['cis'] for a in asp)
    novo = []
    for sid, nome, asp in P['cis']:
        novo.append((sid, nome, [a[:5] + (round(round(a[5] * alvo / bruto / 0.05) * 0.05, 2),) + a[6:] for a in asp]))
    dif = round(alvo - sum(a[5] for _, _, asp in novo for a in asp), 2)
    sid, nome, asp = novo[2]; k = max(range(len(asp)), key=lambda i: asp[i][5])
    asp[k] = asp[k][:5] + (round(asp[k][5] + dif, 2),) + asp[k][6:]
    P['cis'] = novo
    P['total'] = round(sum(a[5] for _, _, asp in novo for a in asp), 2)
for P in (P1, P2): _normaliza(P)
