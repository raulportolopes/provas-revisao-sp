# CIS – Módulo E Órbita (Front-end Funcionalidades, 20,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, como verificar, wsos, max, julgamento)
SUB = [
 ("E1", "Estrutura, rotas, splash e tema", [
  ("M", "Rotas por hash (#/inicio, #/programacao, #/sessao/:id, #/pagamento, #/reservas, #/ceu) trocam o conteúdo sem recarregar; sem hash abre o Início", "Deduzir 0,10 por rota que falha", "Aba Rede do DevTools: nenhum novo index.html ao navegar", 4, 0.40, None),
  ("M", "Rota inexistente mostra a tela 404 com link para o Início; #/sessao/999 mostra \"Sessão não encontrada\"", "Deduzir 0,10 por caso", "Digitar #/xyz e #/sessao/999", 4, 0.20, None),
  ("M", "Link do menu da tela atual com classe ativo e aria-current=\"page\" (Sessão e Pagamento ativam Programação); certo também após F5 e Voltar", "Deduzir 0,10 por caso que falha", "Inspecionar o nav em cada rota, F5 em #/ceu, Voltar", 4, 0.30, None),
  ("M", "Título da aba muda por rota no formato \"Programação – Órbita\"", "Tudo ou nada", "Olhar a aba do navegador", 4, 0.10, None),
  ("M", "Splash: barra e porcentagem andam juntas de 0 a 100% em 2,5 s, some com fade e só aparece na primeira visita da sessão; botão Pular", "Deduzir 0,10 por regra que falha", "Aba anônima nova; comparar com 01-splash.mp4; F5 não mostra de novo", 4, 0.40, None),
  ("M", "Tema claro/escuro: botão troca, segue o sistema na primeira visita e a escolha fica no localStorage (F5 mantém)", "Deduzir 0,10 por regra que falha", "Trocar o tema, F5; apagar a chave e emular prefers-color-scheme", 4, 0.30, None),
 ]),
 ("E2", "Consumo da API, datas e valores", [
  ("M", "Os seis arquivos de api/ carregados com fetch (Promise.all ou equivalente); nada copiado para dentro do JS", "Zero se dados estiverem escritos no JS/HTML", "Aba Rede: 6 pedidos .json", 4, 0.30, None),
  ("M", "\"Agora\" vem de config.agora (05/12/2026 10:00): dias da programação, sessão que já começou e regras de cancelamento usam essa data, sem erro de fuso", "Deduzir 0,15 se usar a data real; 0,15 se o fuso trocar o dia", "Primeiro chip de dia = Sáb 05/12; sessão 1 (10:30) ainda aberta", 4, 0.40, None),
  ("M", "Datas no formato dd/mm/aaaa e valores em R$ 1.234,56 em todas as telas", "Deduzir 0,05 por ocorrência errada (máx. 0,25)", "Cards, modal, resumo do pedido e reservas", 4, 0.25, None),
  ("M", "Carregando e erro: estado de erro com botão Tentar novamente que recarrega a API sem F5", "Deduzir 0,15 sem o botão ou se o botão der F5", "Renomear api/sessoes.json, abrir, desfazer e clicar", 4, 0.30, None),
 ]),
 ("E3", "Início: carrossel, números e gráfico", [
  ("M", "Carrossel com os 4 programas destaque (estreia mais recente primeiro) usando imagem_destaque", "Deduzir 0,10 por slide errado", "Ordem: Céu de Verão, Jornada, Sinfonia, Pequenos Astronautas", 4, 0.20, None),
  ("M", "Troca sozinho a cada 6 s com barra de progresso no ponto atual; anterior/próximo em loop", "Deduzir 0,10 por item", "Cronometrar; no 4º slide clicar próximo", 4, 0.30, None),
  ("M", "Pausa com mouse em cima e com foco dentro; botão Pausar/Continuar com rótulo correto", "Deduzir 0,10 por item", "Passar o mouse, dar Tab, clicar no botão", 4, 0.30, None),
  ("M", "Setas ← → com foco no carrossel, arrastar com mouse/dedo, slides escondidos inert e bolinhas com aria-current", "Deduzir 0,10 por item", "Teclado, arrastar 80 px, Tab não entra em slide escondido", 4, 0.40, None),
  ("M", "Números calculados da API (12 programas, 40 sessões, 255 lugares livres hoje) com contagem animada ao aparecer na tela", "Deduzir 0,10 por número errado; 0,10 sem animação", "Comparar com o gabarito do guia", 4, 0.30, None),
  ("M", "Gráfico de rosca de ocupação da semana (45%) feito com CSS (conic-gradient) e texto alternativo", "Deduzir 0,10 se for imagem pronta", "Inspecionar o elemento", 3, 0.20, None),
 ]),
 ("E4", "Programação: filtros, ordenação, paginação e URL", [
  ("M", "Chips dos 7 dias a partir de agora; segunda (07/12) desabilitada com \"Fechado\"", "Deduzir 0,10 por erro", "Ver chips", 4, 0.20, None),
  ("M", "Busca em tempo real pelo título, sem diferenciar maiúsculas e acentos", "Deduzir 0,10 por regra que falha", "\"MARTE\" = 4 sessões; \"indigenas\" encontra Os Indígenas e o Céu", 4, 0.30, None),
  ("M", "Filtros gênero, classificação (várias marcadas, ordem L, 10, 12, 14), período (manhã < 12h, tarde < 18h, noite) e \"só com lugares livres\" funcionam juntos", "Deduzir 0,10 por filtro que falha ou briga com outro", "Manhã 9, tarde 15, noite 16; Ter 08/12 + L = 5", 4, 0.60, None),
  ("M", "Ordenação em 5 opções sobre o resultado filtrado, sem estragar a ordem original", "Deduzir 0,10 por opção errada", "Preço menor: Pequenos Astronautas R$ 22,00; maior: Céu de Verão R$ 56,00", 4, 0.30, None),
  ("M", "Contador \"N sessões encontradas · mostrando a–b\" e estado vazio com botão Limpar filtros", "Deduzir 0,10 por item", "Buscar xyz", 4, 0.20, None),
  ("M", "Paginação de 6 por página com anterior/próximo desabilitados nas pontas, aria-current na atual; filtro novo volta para a página 1", "Deduzir 0,10 por regra", "40 sessões = 7 páginas", 4, 0.40, None),
  ("M", "Estado completo na URL (data, genero, classif, periodo, busca, livres, ordem, pagina) com replaceState; F5 restaura controles e resultado", "Deduzir 0,15 se F5 perder filtros; 0,10 se cada filtro criar item no histórico", "Abrir #/programacao?data=2026-12-08&classif=L&ordem=preco-desc", 4, 0.50, None),
  ("M", "Cards com barra de ocupação colorida por nível, selo Esgotada e botão Escolher lugares só com vaga", "Deduzir 0,10 por item", "Sessão 4 (Jornada 05/12 20:30) esgotada", 3, 0.25, None),
  ("J", "Organização do estado da tela (um estado, uma função aplicar, sem filtros que brigam)", None, None, 4, 0.25, [
     "Cada controle filtra a lista sozinho", "Funciona com muita repetição", "Estado único com falhas pontuais", "Estado único, aplicar() claro e fácil de ler"]),
 ]),
 ("E5", "Modal de detalhes", [
  ("M", "Abre com transição, fundo escuro, foco no modal e foco preso (Tab e Shift+Tab circulam dentro)", "Deduzir 0,10 por item", "Abrir Detalhes e dar Tab 10 vezes", 4, 0.40, None),
  ("M", "Fecha com Esc, X e clique no fundo; foco volta ao botão que abriu; rolagem da página travada enquanto aberto", "Deduzir 0,10 por item", "Testar as três formas", 4, 0.40, None),
  ("M", "Setas ← → e botões Anterior/Próxima navegam pelas sessões do resultado filtrado (todas as páginas), com \"n de N\"", "Deduzir 0,15 se navegar só na página atual", "Gênero Ciência: \"2 de 12\" → \"3 de 12\"", 4, 0.40, None),
  ("M", "Modal mostra estrelas da avaliação (uma casa decimal), dados da sessão e chips das outras sessões do mesmo programa", "Deduzir 0,10 por item", "Comparar com estado-03", 4, 0.30, None),
 ]),
 ("E6", "Mapa de lugares e regras de negócio", [
  ("M", "Mapa desenhado a partir de salas.layout (A lugar, C cadeirante, _ corredor, . vazio) com fileiras e números corretos e ocupados da sessão", "Deduzir 0,15 se o mapa estiver escrito à mão", "Cúpula Galileu: 8 fileiras A–H, 136 lugares", 4, 0.40, None),
  ("M", "Marcar/desmarcar; ocupado não marca; limite de 6 lugares com aviso", "Deduzir 0,10 por regra", "Tentar o 7º lugar", 4, 0.30, None),
  ("M", "Lugar de cadeirante só com \"Preciso de lugar acessível\" ligado", "Tudo ou nada", "Clicar em H1 com a chave desligada", 4, 0.20, None),
  ("M", "Meia-entrada no máximo na metade dos lugares, arredondando para cima; ao remover lugar, meias a mais viram inteiras", "Deduzir 0,10 por regra", "3 lugares = 2 meias; 5 lugares = 3 meias", 4, 0.30, None),
  ("M", "Lugar isolado: não continua se sobrar um lugar livre sozinho entre dois tomados no mesmo bloco, com mensagem e destaque", "Deduzir 0,20 se não bloquear", "Sessão 2: C8, C9, C11 → erro; marcar C10 libera", 4, 0.40, None),
  ("M", "Resumo: subtotal, taxa de serviço de 8% e total; valores certos", "Deduzir 0,10 por valor errado", "C8 meia, C9 meia, C10 e C11 inteira = R$ 120,00 + 9,60 = R$ 129,60", 4, 0.30, None),
  ("M", "Cronômetro de 5:00 começa no primeiro lugar, aparece no cabeçalho, sobrevive ao F5, avisa com 1 min e libera os lugares no zero", "Deduzir 0,10 por regra", "Marcar, F5, alterar expiraEm no sessionStorage", 4, 0.40, None),
  ("M", "Teclado no mapa: setas andam (roving tabindex, um lugar no Tab), Enter/Espaço marca, aria-label com fileira, número e situação", "Deduzir 0,10 por item", "Tab até o mapa e usar as setas", 4, 0.30, None),
  ("M", "Carrinho de outra sessão: pergunta antes de trocar; só olhar outra sessão não apaga o carrinho", "Deduzir 0,10 por regra", "Marcar na sessão 2 e abrir a sessão 9", 4, 0.20, None),
 ]),
 ("E7", "Pagamento em 3 passos", [
  ("M", "Indicador de passos; sem carrinho a rota volta para a Programação com aviso", "Deduzir 0,10 por item", "Abrir #/pagamento sem lugares", 4, 0.20, None),
  ("M", "Máscaras enquanto digita: CPF, celular, cartão e validade", "Deduzir 0,05 por máscara", "Digitar só números", 4, 0.20, None),
  ("M", "Validações reais: CPF com dígitos verificadores, e-mail, Luhn no cartão, validade não vencida, CVV; erro abaixo do campo e foco no primeiro inválido", "Deduzir 0,10 por regra", "4242 4242 4242 4241 inválido; validade 11/26 vencida (agora é 05/12/2026); 529.982.247-25 é CPF válido", 4, 0.50, None),
  ("M", "Voltar mantém os dados; F5 mantém passo e dados (sessionStorage)", "Deduzir 0,10 por item", "Ir ao passo 2, voltar, F5", 4, 0.20, None),
  ("M", "Pix com botão Copiar código (funciona em http, com aviso de copiado)", "Deduzir 0,10 se falhar em http", "Clicar Copiar e colar num campo", 4, 0.15, None),
  ("M", "Revisão com Editar por bloco e aceite obrigatório; confirmar gera código ORB-AAAAMMDD-XXXX, grava a reserva, ocupa os lugares e zera o carrinho", "Deduzir 0,10 por item", "Confirmar e reabrir a sessão: lugares ocupados", 4, 0.50, None),
 ]),
 ("E8", "Reservas: abas, cancelar e exportar", [
  ("M", "Abas acessíveis (tablist/tab/tabpanel, aria-selected, setas, Home/End, só a aba ativa no Tab) com contador e aba na URL", "Deduzir 0,10 por item", "Teclado nas abas; F5 em ?aba=canceladas", 4, 0.40, None),
  ("M", "Cancelar só até 2 h antes, com confirmação em modal; a reserva vai para Canceladas com a data (não é apagada) e libera os lugares", "Deduzir 0,10 por regra", "Reserva da sessão 1 (10:30) não cancela", 4, 0.40, None),
  ("M", "Aviso com Desfazer por 6 s restaura a reserva", "Tudo ou nada", "Cancelar e clicar Desfazer", 4, 0.20, None),
  ("M", "Baixar reservas em .json (Blob)", "Tudo ou nada", "Clicar em Baixar e abrir o arquivo", 4, 0.15, None),
 ]),
 ("E9", "Guia do céu", [
  ("M", "Gráfico de barras só com CSS (--v e --i), barras sobem em sequência e mostram o valor no hover/foco; troca de planeta refaz a animação", "Deduzir 0,10 por item", "Comparar com 10-guia-do-ceu.mp4", 3, 0.30, None),
  ("M", "Acordeão com um item aberto por vez, aria-expanded, animação de altura (grid-template-rows) e painéis fechados fora do Tab", "Deduzir 0,10 por item", "Abrir 2 itens seguidos", 4, 0.30, None),
 ]),
 ("E10", "Efeitos, responsividade e acessibilidade", [
  ("M", "Cartão 3D que inclina na direção do cursor e brilho que segue o mouse nos botões (variáveis CSS); entrada escalonada dos cards", "Deduzir 0,10 por efeito ausente", "Comparar com 04-cartao-3d-e-brilho.mp4", 3, 0.40, None),
  ("M", "375 px: menu fixo embaixo, filtros recolhidos em botão com contador, modal em folha, mapa rola na horizontal dentro da caixa, sem rolagem horizontal da página", "Deduzir 0,10 por item", "DevTools 375 × 812 em todas as telas", 3, 0.40, None),
  ("M", "prefers-reduced-motion desliga splash, autoplay e animações", "Tudo ou nada", "Emular no DevTools > Rendering", 4, 0.10, None),
  ("M", "Lighthouse Acessibilidade ≥ 90 em Programação e Sessão; console sem erros", "Deduzir 0,10 por tela abaixo; 0,05 por erro", "Lighthouse modo navegação", 4, 0.25, None),
 ]),
]

# Os pesos acima são relativos: a escala abaixo leva o total para exatamente 20,00
# (passos de 0,05), mantendo a proporção entre os aspectos.
def _escalar(alvo=20.0):
    bruto = sum(a[5] for s in SUB for a in s[2]); fator = alvo / bruto
    for s in SUB:
        s[2][:] = [a[:5] + (round(round(a[5] * fator / 0.05) * 0.05, 2),) + a[6:] for a in s[2]]
    dif = round(alvo - sum(a[5] for s in SUB for a in s[2]), 2)
    if dif:
        s, i = max(((s, i) for s in SUB for i in range(len(s[2]))), key=lambda t: t[0][2][t[1]][5])
        a = s[2][i]; s[2][i] = a[:5] + (round(a[5] + dif, 2),) + a[6:]
_escalar()

def total_sub(s): return round(sum(a[5] for a in s[2]), 2)
TOTAL = round(sum(total_sub(s) for s in SUB), 2)
if __name__ == "__main__":
    for s in SUB: print(s[0], s[1], total_sub(s))
    print("TOTAL", TOTAL, "aspectos", sum(len(s[2]) for s in SUB))
