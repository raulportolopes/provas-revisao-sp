# CIS – Módulo D Pulso Academias (front-end consumindo API REST com token, 30,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, como verificar, wsos, max, julgamento)
SUB = [
 ("D1", "Login, sessão e guarda de rota", [
  ("M", "Login com POST /login: guarda o token e envia Authorization: Bearer em todas as requisições protegidas", "Zero se o token não for enviado", "DevTools > Rede: cabeçalho Authorization em GET /reservas", 4, 0.50, None),
  ("M", "Erros 422 aparecem embaixo de cada campo (e-mail e senha) com aria-invalid; erro 401 aparece como aviso geral", "Deduzir 0,20 por tipo de erro não tratado", "Enviar vazio; depois senha errada", 4, 0.50, None),
  ("M", "Botão Entrar fica desabilitado com o texto \"Entrando…\" durante a requisição (sem duplo envio)", "Tudo ou nada", "Rede em Slow 3G e clicar duas vezes", 4, 0.25, None),
  ("M", "Rotas internas sem token levam para #/entrar; depois do login o aluno volta para a rota que tentou abrir", "Deduzir 0,25 se não voltar ao destino", "Janela anônima: abrir #/progresso direto", 4, 0.50, None),
  ("M", "Qualquer resposta 401 (token vencido) limpa a sessão, leva ao login com o aviso \"Sua sessão expirou\" e, depois de entrar, volta à mesma tela", "Deduzir 0,25 sem o aviso; 0,25 se não voltar à tela", "Console: POST /sessao/expirar (ver guia) e clicar em qualquer aba", 4, 1.00, None),
  ("M", "Sair chama POST /logout, apaga o token do navegador e volta ao login; F5 depois não entra de novo", "Deduzir 0,15 se não chamar a API", "Perfil > Sair da conta; Application > Local Storage", 4, 0.25, None),
  ("M", "Rotas por hash sem recarregar; link da rota atual com classe ativo e aria-current=\"page\" (só ele), certo depois de F5 e do Voltar; título da aba por rota", "Deduzir 0,10 por item que falha", "Navegar pelo menu, F5, Voltar", 4, 0.50, None),
 ]),
 ("D2", "Consumo da API e cruzamento dos dados", [
  ("M", "Catálogos (unidades, modalidades, instrutores, regras) baixados uma vez e em paralelo (Promise.all ou equivalente)", "Deduzir 0,15 se baixar de novo a cada troca de filtro", "Rede: trocar filtros 3 vezes e contar GET /modalidades", 4, 0.50, None),
  ("M", "Cards, modal e reservas mostram nomes (modalidade, instrutor com foto, unidade) cruzados pelos ids da API, nunca os ids", "Deduzir 0,15 por tela que mostra id ou campo vazio", "Comparar com os prints", 4, 1.00, None),
  ("M", "Selects e chips de unidade e modalidade gerados a partir da API, com a cor da modalidade vinda do JSON", "Deduzir 0,15 por controle escrito à mão no HTML", "Ver o HTML original (Ctrl+U)", 4, 0.25, None),
  ("M", "Estado de carregamento (esqueleto ou equivalente) em agenda, reservas e progresso", "Deduzir 0,10 por tela sem carregando", "Rede em Slow 3G", 4, 0.50, None),
  ("M", "Erro da API (500 ou rede) mostra mensagem com botão Tentar novamente que refaz o pedido sem F5", "Deduzir 0,25 sem o botão ou se o botão der F5", "DevTools > Rede > bloquear URL de api/index.php/aulas", 4, 0.50, None),
  ("M", "Lista vazia com mensagem própria (\"Nenhuma aula com esses filtros\") em vez de grade em branco", "Tudo ou nada", "Buscar \"natação\"", 4, 0.25, None),
  ("M", "Nenhum dado da API copiado para dentro do JS ou do HTML (tudo vem por fetch)", "Zero se houver dados fixos", "Procurar \"Marina Duarte\" nos arquivos JS", 4, 0.25, None),
 ]),
 ("D3", "Agenda: abas de dias, filtros e estado na URL", [
  ("M", "14 abas de dia a partir de hoje (\"Hoje\", \"Amanhã\", depois \"seg\" + 24 + nov), padrão ARIA tablist/tab/tabpanel com aria-selected e tabindex móvel", "Deduzir 0,15 por atributo ausente; 0,25 se o dia estiver errado por fuso", "Inspecionar; conferir o dia de hoje", 4, 0.75, None),
  ("M", "Teclado nas abas de dia: ← → (circular), Home e End trocam o dia e recarregam a lista", "Deduzir 0,10 por tecla que falha", "Tab até as abas e usar as teclas", 4, 0.50, None),
  ("M", "Filtros enviados como parâmetros da API: unidade_id, modalidade_id (lista com vírgula), periodo, somente_vagas, busca e ordem, todos combinados", "Deduzir 0,15 por filtro feito só no array ou ausente", "Rede: conferir a query string de GET /aulas", 4, 1.00, None),
  ("M", "Chips de modalidade com seleção múltipla e aria-pressed; período como grupo de rádios; \"Só aulas com vaga\" como interruptor acessível", "Deduzir 0,10 por controle sem o estado acessível", "Inspecionar", 4, 0.50, None),
  ("M", "Busca com espera (debounce ~300 ms): digitar \"marina\" não dispara uma requisição por letra", "Deduzir 0,25 se disparar uma por tecla", "Rede: contar pedidos ao digitar", 4, 0.75, None),
  ("M", "Estado inteiro na URL (data, unidade, modalidades, periodo, vagas, busca, ordem, pagina): F5 e link colado restauram controles e lista; Limpar filtros volta ao padrão", "Deduzir 0,25 se só parte do estado volta", "Abrir #/agenda?data=<amanhã>&modalidades=1,7&periodo=noite&vagas=1", 4, 0.75, None),
  ("M", "Contador \"N aulas encontradas · página x de y\" anunciado em região aria-live", "Deduzir 0,10 sem aria-live", "Inspecionar", 4, 0.25, None),
 ]),
 ("D4", "Paginação do servidor e corrida de requisições", [
  ("M", "Paginação usa o meta da API (pagina, total_paginas): 6 por página, botões numerados, anterior/próxima desabilitados nas pontas, página atual com aria-current", "Deduzir 0,15 por item ausente; zero se paginar no cliente", "Rede: ?pagina=2&por_pagina=6", 4, 0.75, None),
  ("M", "Mudar dia, filtro, busca ou ordem volta para a página 1; com uma página só a paginação some", "Deduzir 0,15 por item que falha", "Ir à página 3 e marcar um chip", 4, 0.50, None),
  ("M", "Respostas fora de ordem não sobrescrevem a lista: pedido anterior é cancelado (AbortController) ou ignorado", "Zero se a lista final não corresponder ao último filtro", "Rede em Fast 3G: clicar rápido em 3 abas de dia; a lista final tem de ser do último dia", 4, 1.00, None),
  ("M", "Página inexistente na URL (?pagina=99) não quebra: mostra a última página válida", "Tudo ou nada", "Abrir #/agenda?pagina=99", 4, 0.25, None),
 ]),
 ("D5", "Modal da aula e regras da API", [
  ("M", "Detalhes abrem modal com GET /aulas/{id}: imagem, data por extenso, horário início–fim, descrição, instrutor, unidade com endereço, nível, intensidade, kcal e ocupação", "Deduzir 0,10 por campo ausente", "Comparar com estado-09-modal-reservar.png", 4, 0.50, None),
  ("M", "Modal acessível: role=dialog, aria-modal, aria-labelledby; foco entra, Tab preso, Esc/X/fundo fecham (clique dentro não), foco volta ao botão de origem, fundo não rola", "Deduzir 0,15 por item que falha", "Só teclado", 4, 1.00, None),
  ("M", "Botão de ação conforme o estado: Reservar, Cancelar reserva, Entrar na lista de espera, Sair da lista de espera, desabilitado se encerrada/em andamento", "Deduzir 0,15 por estado errado", "Testar uma aula livre, uma lotada e uma de hoje já encerrada", 4, 0.75, None),
  ("M", "Reservar (POST /reservas) atualiza modal e card (\"Reservada\") sem recarregar a página, com toast de sucesso", "Deduzir 0,25 se precisar de F5", "Reservar e fechar", 4, 0.50, None),
  ("M", "Erros 409 mostram a mensagem da API dentro do modal (CONFLITO_HORARIO, LIMITE_DIARIO, JA_RESERVADA); AULA_LOTADA troca o botão para lista de espera", "Deduzir 0,20 por código não tratado", "Reservar 3 aulas do mesmo dia / mesmo horário", 4, 0.75, None),
  ("M", "Cancelar pede confirmação num modal próprio (não window.confirm) antes do DELETE /reservas/{id}", "Deduzir 0,25 se usar confirm() ou cancelar direto", "Cancelar e depois clicar em Manter", 4, 0.50, None),
  ("M", "Toasts em região aria-live, somem sozinhos e não cobrem a barra inferior no celular", "Deduzir 0,10 por item", "Reservar em 375 px", 4, 0.25, None),
  ("M", "Card com etiqueta de situação (Reservada, Na fila · 2º, Lotada · n na fila, Últimas vagas, Encerrada) e \"começa em N min\" na última hora", "Deduzir 0,10 por situação ausente", "Comparar com estado-08 e com o vídeo 06", 4, 0.25, None),
 ]),
 ("D6", "Minhas reservas", [
  ("M", "Abas Próximas, Histórico e Canceladas (padrão ARIA, com teclado) com a quantidade de cada uma vinda do meta.total", "Deduzir 0,15 por item ausente", "Comparar números com GET /reservas?tipo=...", 4, 0.75, None),
  ("M", "Cada aba com paginação do servidor (5 por página) e estado na URL (?aba=historico&pagina=2)", "Deduzir 0,15 por item que falha", "Histórico página 2 e F5", 4, 0.50, None),
  ("M", "Cancelar atualiza a lista e as contagens sem F5; botão desabilitado com aviso quando falta menos de 2 h; erro 422 da API mostrado ao aluno", "Deduzir 0,15 por item que falha", "Cancelar uma reserva; ver aula de hoje", 4, 0.75, None),
  ("M", "criada_em e cancelada_em (UTC, terminam com Z) exibidas no horário de Brasília: \"Reservada em 18/11/2026 às 14:59\"", "Zero se mostrar o horário UTC ou a string crua", "Comparar com o JSON: 17:59Z = 14:59", 4, 0.50, None),
  ("M", "Data das aulas em DD/MM/AAAA, bloco de data com dia da semana, dia e mês, e \"amanhã\" / \"em 3 dias\"", "Deduzir 0,10 por formato errado", "Aba Próximas", 4, 0.50, None),
 ]),
 ("D7", "Progresso: gráficos só com HTML e CSS", [
  ("M", "Barras dos 6 meses com altura proporcional, rótulo do mês em português e linha tracejada da meta mensal na altura certa", "Deduzir 0,15 por item errado; zero se usar biblioteca de gráfico ou canvas", "Comparar com GET /me/progresso", 4, 0.50, None),
  ("M", "Barras crescem com animação ao abrir a tela; barra que bateu a meta tem outra cor", "Deduzir 0,10 por item ausente", "Vídeo 09", 3, 0.50, None),
  ("M", "Balão \"agosto de 2026 / 11 aulas\" aparece no hover E no foco do teclado (barras focáveis com aria-label)", "Deduzir 0,15 se só funcionar no mouse", "Tab pelas barras", 3, 0.50, None),
  ("M", "Rosca por modalidade com conic-gradient montado a partir da API, legenda com cor, total e porcentagem; anel da meta do mês", "Deduzir 0,15 por item ausente", "Comparar com layout-1440-progresso.png", 3, 0.50, None),
  ("M", "Alternativa acessível do gráfico (tabela escondida visualmente ou equivalente)", "Tudo ou nada", "Inspecionar", 3, 0.25, None),
 ]),
 ("D8", "Perfil, tema e acordeão", [
  ("M", "PATCH /me salva nome, celular, unidade e meta; erros 422 embaixo de cada campo; botão Salvar só habilita com alteração; nome do cabeçalho muda na hora", "Deduzir 0,15 por item que falha", "Salvar \"Edu\" e \"(11) 1234\"", 4, 0.75, None),
  ("M", "Máscara de celular enquanto digita: 11987654321 vira (11) 98765-4321", "Tudo ou nada", "Digitar só números", 4, 0.25, None),
  ("M", "Foto: escolher ou arrastar e soltar, validação de tipo e 2 MB no navegador, prévia imediata, envio com FormData no campo \"foto\"; se a API recusar, a foto antiga volta", "Deduzir 0,15 por item ausente", "Arrastar um .txt e um .jpg", 4, 1.00, None),
  ("M", "Tema claro, escuro e automático (segue prefers-color-scheme), salvo no localStorage e aplicado sem piscar no F5; botão do cabeçalho e opções do perfil sincronizados", "Deduzir 0,15 por item que falha", "Escolher escuro e dar F5", 3, 0.50, None),
  ("M", "Acordeão das regras (GET /regras): um item aberto por vez, botão com aria-expanded e aria-controls, abertura animada", "Deduzir 0,10 por item ausente", "Vídeo 12", 4, 0.50, None),
 ]),
 ("D9", "Responsividade, fidelidade e efeitos", [
  ("M", "1440: filtros à esquerda (fixos ao rolar) e 3 cards por linha; 768: filtros em duas colunas acima e 2 cards por linha", "Deduzir 0,10 por item diferente", "Modo dispositivo", 3, 0.25, None),
  ("M", "375: menu vira barra fixa inferior com ícone e texto e link ativo; nenhum conteúdo escondido atrás dela; nenhuma rolagem horizontal em nenhuma rota", "Deduzir 0,25 se a barra não for fixa embaixo; 0,10 por rota com rolagem horizontal", "scrollWidth = 375 em cada rota", 3, 0.50, None),
  ("M", "375: modal vira folha encostada embaixo, rola por dentro e tem os botões em largura total", "Deduzir 0,10 por item", "estado-22-modal-375.png", 3, 0.25, None),
  ("M", "Card com inclinação 3D e brilho que seguem o cursor (variáveis CSS atualizadas pelo JS), desligados em toque e com prefers-reduced-motion", "Deduzir 0,15 por item ausente", "Vídeo 05", 3, 0.50, None),
  ("J", "Fidelidade aos prints e qualidade das microinterações (hover, transições, toasts, tema escuro)", None, None, 3, 0.75, [
     "Muito diferente dos prints ou sem animações", "Parecido, mas com espaçamentos, cores ou estados fora do print",
     "Fiel aos prints com pequenas diferenças", "Praticamente idêntico, inclusive no tema escuro e nas animações"]),
 ]),
 ("D10", "Acessibilidade e código", [
  ("M", "Lighthouse > Acessibilidade (celular) com 90 ou mais em #/agenda", "Deduzir 0,25 entre 80 e 89; zero abaixo de 80", "Anotar a nota na evidência", 3, 0.50, None),
  ("M", "Link \"Pular para o conteúdo\", labels ligados, foco visível, foco vai para o conteúdo ao trocar de rota; console sem erros de JavaScript", "Deduzir 0,10 por item ausente", "Usar só o teclado por 2 minutos", 3, 0.25, None),
  ("J", "Organização do JavaScript (camada única de API, estado separado do desenho, módulos por tela, nomes claros)", None, None, 4, 0.50, [
     "Fetch espalhado e lógica repetida", "Funciona, mas com muita repetição e estado espalhado",
     "Organizado com falhas pontuais", "Camada de API única, estado por tela, funções pequenas e fáceis de ler"]),
 ]),
]

def total_sub(s): return round(sum(a[5] for a in s[2]), 2)
TOTAL = round(sum(total_sub(s) for s in SUB), 2)
if __name__ == "__main__":
    for s in SUB: print(s[0], s[1], total_sub(s))
    w = {}
    for s in SUB:
        for a in s[2]: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
    print("TOTAL", TOTAL, "WSOS", w, "aspectos", sum(len(s[2]) for s in SUB))
