# CIS – Módulo D Sabor de Bairro (front-end Vue 3 consumindo API REST com token, 30,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, como verificar, wsos, max, julgamento)
SUB = [
 ("D1", "Vue 3 sem build, rotas e guarda de login", [
  ("M", "App em Vue 3 (global build da pasta js/lib, sem npm/Vite), montado em #app, com Vue Router em hash: F5 em qualquer tela volta para a mesma tela", "Zero se usar outro framework ou se F5 quebrar", "Ctrl+U e F5 em #/restaurante/smash-do-bairro", 4, 0.50, None),
  ("M", "Componentes separados (cabeçalho, modal base, modal do prato, gaveta, telas) em arquivos próprios, com props/emits, sem copiar o mesmo HTML em várias telas", "Deduzir 0,15 por bloco copiado", "Abrir js/", 4, 0.50, None),
  ("M", "Rotas /checkout, /pedidos e /pedidos/:id exigem login: sem token vão para #/entrar?voltar=..., e depois do login voltam para o destino (sem aceitar URL externa)", "Deduzir 0,25 se não voltar ao destino; 0,15 se aceitar ?voltar=https://...", "Janela anônima: abrir #/checkout", 4, 0.75, None),
  ("M", "Login: 422 embaixo de cada campo com aria-invalid; 401 como aviso geral; botão desabilitado com \"Entrando…\"; botão Mostrar/Ocultar senha com aria-pressed", "Deduzir 0,10 por item ausente", "Enviar vazio; senha errada; Slow 3G", 4, 0.50, None),
  ("M", "Sair chama POST /logout, apaga token e usuário do navegador e leva ao início com aviso", "Deduzir 0,15 se não chamar a API", "Application > Local Storage", 4, 0.25, None),
  ("M", "Rota inexistente mostra página \"não encontrada\"; slug inexistente mostra \"Restaurante não encontrado\" (404 da API); título da aba muda por tela", "Deduzir 0,10 por item que falha", "Abrir #/xyz e #/restaurante/xyz", 4, 0.50, None),
 ]),
 ("D2", "Início: busca, filtros na URL e corrida de requisições", [
  ("M", "Lista vinda de GET /restaurantes com paginação do servidor: 6 por vez e \"Carregar mais (N)\" que ACRESCENTA a próxima página (sem repetir) e some na última", "Deduzir 0,25 se substituir a lista ou repetir cartões; zero se paginar no cliente", "Clicar 2 vezes em Carregar mais", 4, 0.50, None),
  ("M", "Chips de categoria gerados de GET /categorias (cor do JSON) com aria-pressed; interruptores Abertos agora e Entrega grátis; select de ordem com os 5 valores; tudo enviado como parâmetro da API", "Deduzir 0,15 por filtro feito só no navegador", "Rede: query string de GET /restaurantes", 4, 0.50, None),
  ("M", "Busca com debounce (~350 ms) que também acha restaurante pelo nome do prato (\"temaki\")", "Deduzir 0,25 se disparar uma requisição por tecla", "Rede: digitar \"temaki\"", 4, 0.50, None),
  ("M", "A URL é a fonte da verdade: busca, categoria, aberto, gratis e ordem na query; F5, Voltar do navegador e link colado restauram campo, chips, interruptores e select", "Deduzir 0,25 se só parte voltar", "Abrir #/?categoria=3&aberto=1&ordem=avaliacao e dar F5", 4, 0.75, None),
  ("M", "Resposta atrasada de um filtro antigo não sobrescreve a lista do filtro novo (AbortController ou descarte)", "Zero se a lista final não corresponder ao último filtro", "Fast 3G: clicar Pizza e logo Hambúrguer", 4, 0.50, None),
  ("M", "Estados: esqueleto com brilho ao carregar, erro com \"Tentar de novo\" (sem F5), vazio com o termo buscado e botão \"Limpar filtros\"; contador \"N restaurantes\" em aria-live", "Deduzir 0,10 por estado ausente", "Slow 3G; bloquear URL; buscar \"lasanha\"", 4, 0.50, None),
  ("M", "Cartão de restaurante fechado: foto em tons de cinza e selo \"Abre hoje às 18:00\" (ou amanhã / dia da semana) calculado a partir de abre_em", "Deduzir 0,15 se mostrar a data crua", "Comparar com o print", 4, 0.25, None),
 ]),
 ("D3", "Cardápio: abas de seção, scrollspy e prato na URL", [
  ("M", "Capa com nota, nº de avaliações, tempo, taxa, pedido mínimo, aberto/fechado e endereço vindos de GET /restaurantes/{slug}", "Deduzir 0,10 por dado ausente", "Comparar com layout-1440-cardapio.png", 4, 0.25, None),
  ("M", "Barra de abas de seção fixa (sticky) abaixo do topo; clicar rola suave até a seção e leva o foco ao título dela", "Deduzir 0,15 se a barra rolar junto ou o foco não mudar", "Clicar em Bebidas", 4, 0.50, None),
  ("M", "Scrollspy: ao rolar com a roda, a aba da seção visível acende (aria-current) e a última acende no fim da página; no celular a aba ativa entra na tela", "Deduzir 0,25 se só acender no clique", "Rolar devagar", 4, 0.75, None),
  ("M", "Busca dentro do cardápio, local e sem acento, escondendo seções vazias e as abas delas", "Deduzir 0,10 se a aba da seção vazia ficar", "Digitar \"calabresa\"", 4, 0.25, None),
  ("M", "Prato aberto vai para a URL (?item=36): F5 reabre o modal e o botão Voltar do navegador fecha", "Deduzir 0,25 se F5 não reabrir", "Abrir um prato, F5, Voltar", 4, 0.50, None),
  ("M", "Prato esgotado (disponivel=false) fica desabilitado com selo \"Esgotado\"; restaurante fechado deixa olhar o cardápio, mas não adicionar", "Deduzir 0,15 por regra ausente", "Pastelaria Madrugada > Bauru", 4, 0.25, None),
  ("M", "Seção \"Mais pedidos\" com os pratos destaque disponíveis (no celular, carrossel com scroll-snap)", "Tudo ou nada", "375 px", 3, 0.25, None),
 ]),
 ("D4", "Modal do prato: grupos de opções e preço", [
  ("M", "Modal base acessível reaproveitado: role=dialog, aria-modal, aria-labelledby; foco entra, Tab preso, Esc/X/fundo fecham, fundo não rola", "Deduzir 0,15 por item que falha", "Só teclado", 4, 0.75, None),
  ("M", "Ao fechar, o foco volta ao prato que abriu o modal, inclusive quando o modal foi aberto pelo F5", "Deduzir 0,25 se o foco cair no topo da página", "Abrir com Enter, Esc", 4, 0.50, None),
  ("M", "Grupo com max=1 vira radio; max>1 vira checkbox; selo Obrigatório/Opcional e contador \"x de max\"", "Deduzir 0,10 por item ausente", "Clássico", 4, 0.50, None),
  ("M", "Ao atingir o máximo, as outras opções do grupo ficam desabilitadas; desmarcar libera", "Zero se deixar passar do máximo", "Adicionais: marcar 3", 4, 0.50, None),
  ("M", "Grupo obrigatório sem escolha: o botão diz \"Escolha: Ponto da carne\", o grupo fica vermelho (tremida) e o foco vai até ele", "Deduzir 0,15 por item ausente", "Clicar Adicionar sem escolher", 4, 0.50, None),
  ("M", "Preço calculado (computed) = (base + opções) × quantidade, em centavos; quantidade 1 a 20 com botões −/+ e aria-label", "Zero se o preço errar em qualquer combinação", "Bacon + Queijo, quantidade 2 = R$ 91,80", 4, 0.50, None),
  ("M", "Observação até 140 caracteres com contador", "Tudo ou nada", "Digitar texto longo", 4, 0.25, None),
 ]),
 ("D5", "Carrinho (store reativa)", [
  ("M", "Estado do carrinho compartilhado entre componentes (reactive/computed exportado ou store), salvo no localStorage e restaurado no F5", "Zero se perder no F5", "Adicionar e dar F5", 4, 0.50, None),
  ("M", "Mesmo prato com as mesmas opções (em qualquer ordem de clique) soma a quantidade; opções ou observação diferentes viram outra linha", "Deduzir 0,25 se juntar opções diferentes", "Adicionar Clássico ao ponto 2 vezes e 1 mal passado", 4, 0.50, None),
  ("M", "Item de outro restaurante abre confirmação (\"Começar um novo carrinho?\"); Voltar mantém, confirmar esvazia e adiciona", "Deduzir 0,25 se trocar sem perguntar", "Pastelaria com carrinho do Smash", 4, 0.50, None),
  ("M", "Gaveta lateral com linhas (foto, opções, observação, preço), −/+ (lixeira no 1), subtotal e Esvaziar com confirmação; foco não se perde ao remover a linha", "Deduzir 0,10 por item ausente", "Remover a última unidade de uma linha e usar Tab", 4, 0.50, None),
  ("M", "Barra de pedido mínimo com \"Faltam R$ X\" e progressbar acessível; Finalizar desabilitado até atingir o mínimo", "Deduzir 0,15 por item ausente", "Só um refrigerante no Smash", 4, 0.50, None),
  ("M", "Contador do carrinho no topo dá um \"pulo\" a cada item; aviso (toast) role=status ao adicionar", "Deduzir 0,10 por efeito ausente", "Ver vídeo 06", 3, 0.25, None),
 ]),
 ("D6", "Checkout em passos", [
  ("M", "3 passos (Endereço, Pagamento, Revisão) com indicador aria-current=\"step\" e passos feitos com ✓; não avança com passo inválido; voltar não perde dados", "Deduzir 0,15 por regra que falha", "Tentar Continuar vazio", 4, 0.50, None),
  ("M", "Passo atual na URL (?passo=2) e rascunho no sessionStorage: F5 mantém passo, CEP, número, pagamento e troco", "Deduzir 0,25 se perder dados no F5", "F5 no passo 2", 4, 0.50, None),
  ("M", "CEP com máscara 00000-000 (só números) e busca automática em GET /ceps/{cep} ao completar 8 dígitos; mostra rua/bairro ou o 404 \"Ainda não entregamos\"; pedido antigo cancelado ao trocar o CEP", "Deduzir 0,15 por item ausente", "Digitar 01001000 e depois 03164000", 4, 0.75, None),
  ("M", "Acréscimo do bairro somado na entrega do resumo lateral (sticky no desktop)", "Tudo ou nada", "CEP 03164-000: +R$ 3,00", 4, 0.25, None),
  ("M", "Pagamento em cartões de rádio (Pix, Cartão, Dinheiro) com foco visível; Dinheiro abre \"Preciso de troco\" e o valor do troco precisa ser maior que o total", "Deduzir 0,15 por regra ausente", "Troco 50 com total 106", 4, 0.50, None),
  ("M", "Erros 422 do POST levam ao passo do primeiro campo com erro e marcam o campo (endereco.cep, endereco.numero, pagamento, troco_para, cupom, itens.N)", "Deduzir 0,25 se só mostrar mensagem genérica", "DevTools: editar requisição ou ver guia", 4, 0.50, None),
  ("M", "Foco vai para o título do passo ao trocar de passo; erros novos somem quando o campo é corrigido", "Deduzir 0,10 por item que falha", "Só teclado", 4, 0.25, None),
 ]),
 ("D7", "Cupom, total e envio do pedido", [
  ("M", "Cupom validado em POST /cupons/validar: erro 422 (vencido, mínimo, inexistente) embaixo do campo; sucesso mostra código, descrição e Remover", "Deduzir 0,15 por caso não tratado", "VERAO2025, DESCONTO15, BEMVINDO10", 4, 0.50, None),
  ("M", "Cupom de frete grátis desconta a taxa INTEIRA, inclusive o acréscimo do bairro; total = subtotal + entrega − desconto, sempre em centavos", "Zero se o total da tela divergir do servidor", "FRETEGRATIS com CEP 03164-000", 4, 0.75, None),
  ("M", "POST /pedidos envia itens com ids de opções, endereço, pagamento, troco_para em centavos, cupom e total_esperado igual ao total mostrado", "Deduzir 0,25 por campo errado", "Rede: corpo do POST", 4, 0.75, None),
  ("M", "409 (TOTAL_DIVERGENTE, PEDIDO_MINIMO, RESTAURANTE_FECHADO) vira alerta focado com a mensagem da API e caminho de saída", "Deduzir 0,15 por código não tratado", "Ver guia do avaliador", 4, 0.50, None),
  ("M", "Botão Confirmar desabilitado com \"Enviando pedido…\" (sem duplo pedido); depois do 201 esvazia carrinho e rascunho e vai para #/pedidos/{id}", "Deduzir 0,25 se der para criar dois pedidos", "Slow 3G e clique duplo", 4, 0.50, None),
 ]),
 ("D8", "Acompanhamento do pedido", [
  ("M", "Polling de GET /pedidos/{id} com setTimeout encadeado (~5 s), sem sobrepor pedidos; para em entregue/cancelado, ao sair da tela e com a aba escondida", "Deduzir 0,25 se continuar depois de sair da tela ou após entregue", "Rede: sair da tela e esperar", 4, 0.75, None),
  ("M", "Linha do tempo com 4 etapas, horários do histórico, linha verde que cresce e bolinha atual pulsando; previsão de entrega \"até HH:MM\"", "Deduzir 0,15 por item ausente", "Ver vídeo 12", 4, 0.50, None),
  ("M", "Mudança de status anunciada em região aria-live", "Tudo ou nada", "Inspecionar", 4, 0.25, None),
  ("M", "Cancelar só aparece com pode_cancelar; pede confirmação; 409 NAO_PODE_CANCELAR mostra o aviso e atualiza a tela", "Deduzir 0,15 por item ausente", "Cancelar logo depois de pedir; cancelar após 30 s", 4, 0.50, None),
  ("M", "Avaliação com 5 estrelas como radiogroup (setas, hover de prévia, rótulo Péssimo…Excelente); nota ≤ 2 exige comentário de 10+ caracteres; contador 280; avaliação salva aparece no lugar do formulário", "Deduzir 0,15 por regra ausente", "Pedido 1006", 4, 0.75, None),
 ]),
 ("D9", "Datas, dinheiro, lista de pedidos e sessão", [
  ("M", "Valores em reais com Intl.NumberFormat a partir dos centavos (R$ 1.234,50), sem erro de ponto flutuante", "Zero se aparecer 49.900000001 ou R$ 4990", "Qualquer tela", 4, 0.25, None),
  ("M", "Datas com Z (UTC) mostradas no horário de Brasília (timeZone America/Sao_Paulo), mesmo com o computador em outro fuso", "Zero se a hora mudar com o fuso do Windows", "Trocar o fuso do sistema e recarregar #/pedidos", 4, 0.50, None),
  ("M", "Meus pedidos: paginação do servidor (5 por página) com botões numerados, aria-current=\"page\", anterior/próxima desabilitados, página na URL; status com cor", "Deduzir 0,15 por item ausente", "#/pedidos?pagina=2", 4, 0.50, None),
  ("M", "Token vencido (401 em qualquer chamada) limpa a sessão, avisa \"Sua sessão expirou\" e leva ao login guardando a tela atual", "Deduzir 0,25 sem o aviso ou sem voltar", "Console: POST /sessao/expirar (ver guia)", 4, 0.50, None),
 ]),
 ("D10", "Layout, efeitos, tema e acessibilidade", [
  ("M", "Layout fiel aos prints em 1440, 768 e 375 px, sem rolagem lateral em 375 px; topo fixo com vidro sem prender a barra do carrinho", "Deduzir 0,10 por tela fora do print; 0,25 se houver rolagem lateral", "DevTools > 375 px", 3, 0.75, None),
  ("M", "Celular: barra \"Ver carrinho\" fixa no rodapé (área segura), modal como folha que sobe de baixo e gaveta em tela cheia", "Deduzir 0,15 por item ausente", "375 px", 3, 0.50, None),
  ("M", "Efeitos: brilho da vitrine que segue o cursor (variáveis CSS), hover dos cartões (sobe + zoom), tremida do grupo, barra do mínimo, pulo do contador; prefers-reduced-motion desliga", "Deduzir 0,10 por efeito ausente", "Ver vídeos e ligar \"reduzir movimento\"", 3, 0.50, None),
  ("M", "Tema escuro: botão com aria-pressed, salvo no localStorage, respeita o sistema e é aplicado ANTES da primeira pintura (sem piscar no F5)", "Deduzir 0,15 se piscar", "F5 no tema escuro", 3, 0.50, None),
  ("M", "Fontes locais (woff2 com font-display: swap), imagens com width/height e loading=lazy fora da primeira dobra", "Deduzir 0,10 por item ausente", "Lighthouse", 3, 0.25, None),
  ("M", "\"Pular para o conteúdo\", labels ligados, foco visível, foco no <main> ao trocar de rota; console sem erros", "Deduzir 0,10 por item ausente", "Só teclado por 2 minutos", 4, 0.50, None),
  ("J", "Organização do código Vue (componentes pequenos, computed em vez de contas repetidas, store única do carrinho, camada única de API)", None, None, 4, 0.50, [
     "Tudo num componente, contas repetidas e fetch espalhado", "Funciona, mas com estado duplicado entre telas",
     "Bem dividido, com falhas pontuais", "Componentes claros, computed para tudo que é derivado, store e API em um lugar só"]),
  ("J", "Fidelidade visual e acabamento (espaçamentos, tipografia, estados de hover/foco, consistência entre telas)", None, None, 3, 0.25, [
     "Muito distante dos prints", "Parecido no geral, com várias diferenças",
     "Fiel, com detalhes faltando", "Igual aos prints, inclusive estados e tema escuro"]),
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
