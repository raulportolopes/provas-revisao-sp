# CIS – Módulo E Estúdio Pulso (Front-end Funcionalidades com Vue 3, 20,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, como verificar, wsos, max, julgamento)
SUB = [
 ("E1", "Rotas, guarda de navegação e preferências", [
  ("M", "Rotas #/inicio, #/aulas, #/aulas/:aulaId/:data, #/planos, #/treino, #/entrar e #/minha-area sem recarregar; sem hash abre o Início; rota inexistente mostra a 404", "Deduzir 0,10 por rota que falha", "Navegar com a aba Rede aberta; abrir #/xyz", 4, 0.40, None),
  ("M", "Link ativo com classe ativo e aria-current=\"page\", certo também em #/aulas/9/2026-12-08, após F5 e Voltar", "Deduzir 0,10 por caso", "Inspecionar o nav", 4, 0.30, None),
  ("M", "Título da aba \"Grade de aulas – Estúdio Pulso\" e foco no h1 ao trocar de tela (não ao abrir o modal ou mudar filtro)", "Deduzir 0,10 por item", "Trocar de rota e ver document.activeElement", 4, 0.20, None),
  ("M", "Guarda: #/minha-area sem login vai para #/entrar?volta=/minha-area; depois do login volta para a tela pedida; logado, #/entrar leva à Minha área; volta só aceita caminho interno", "Deduzir 0,10 por regra", "Abrir #/entrar?volta=//google.com e entrar", 4, 0.40, None),
  ("M", "Transição entre telas (saída antes da entrada) e transição dos cards ao filtrar", "Deduzir 0,10 por item", "Comparar com 03-menu-e-transicao.mp4", 3, 0.20, None),
  ("M", "Tema claro/escuro e tamanho do texto A−/A/A+ (aria-pressed) guardados no localStorage e aplicados antes de desenhar (sem piscar)", "Deduzir 0,10 por item", "Trocar, F5", 4, 0.30, None),
 ]),
 ("E2", "API, estado global e datas", [
  ("M", "Os 8 arquivos da API carregados antes de montar a aplicação; carregando e erro com Tentar novamente sem F5", "Deduzir 0,15 sem estado de erro", "Renomear api/aulas.json", 4, 0.30, None),
  ("M", "Estado global único (store reativo ou equivalente) gravado no localStorage: usuário (sem a senha), reservas, treino e preferências", "Deduzir 0,10 por item; 0,20 se gravar a senha", "Application > Local Storage", 4, 0.30, None),
  ("M", "\"Agora\" vem de config.agora (terça 08/12/2026 08:00): semana de 07/12 a 12/12, dia de hoje destacado, aulas passadas sem reserva", "Deduzir 0,15 se usar a data real; 0,10 se o fuso trocar o dia", "Grade: coluna Ter 08/12 com \"Hoje\"; aula de 06:30 = Esta aula já terminou", 4, 0.40, None),
  ("M", "Datas dd/mm/aaaa, horário 24 h e valores R$ 1.234,56", "Deduzir 0,05 por ocorrência (máx. 0,20)", "Modal, planos e Minha área", 4, 0.20, None),
 ]),
 ("E3", "Início", [
  ("M", "Contadores calculados da API (34 aulas por semana, 6 modalidades, 6 professores, vagas livres hoje) que sobem de 0 quando aparecem na tela (IntersectionObserver)", "Deduzir 0,10 por número errado; 0,10 sem animação", "Rolar até a faixa", 4, 0.30, None),
  ("M", "\"Ainda hoje\": aulas restantes do dia com vagas ou \"Lista de espera\"", "Deduzir 0,10 se mostrar aula passada", "Primeira: 08:30 Yoga", 4, 0.20, None),
  ("M", "Carrossel de professores com scroll-snap: ‹ › rolam um card e ficam desabilitados nas pontas; bolinhas acompanham a rolagem; setas ← → Home End na trilha", "Deduzir 0,10 por item", "Comparar com 02-carrossel-professores.mp4", 4, 0.50, None),
  ("M", "Cards de modalidade com cor da API, intensidade em 3 barrinhas e hover", "Deduzir 0,10 por item", "Ver Início", 3, 0.20, None),
 ]),
 ("E4", "Grade semanal de aulas", [
  ("M", "Grade feita com CSS Grid: linhas de 15 min (06:00–22:00), uma coluna por dia, cada aula posicionada pelo horário e duração", "Deduzir 0,20 se a posição não respeitar horário/duração", "Yoga terça 08:30–09:30 ocupa 4 linhas", 3, 0.50, None),
  ("M", "Aulas que se sobrepõem no mesmo dia ficam lado a lado (2 pistas); as demais ocupam a largura toda", "Tudo ou nada", "Terça 18:00 Spinning e 18:30 Dança", 3, 0.40, None),
  ("M", "Filtros: modalidades (várias, chips com aria-pressed), professor (ordem alfabética), intensidade (radio) e só com vaga funcionam juntos; contador e Limpar filtros", "Deduzir 0,10 por filtro", "Spinning = 10; Forte = 19; Yoga + Pilates + Leve = 6 (só as de Yoga)", 4, 0.60, None),
  ("M", "Filtros na URL (modalidade, professor, intensidade, vagas, semana, dia) com router.replace; F5 e link restauram; valores inválidos ignorados", "Deduzir 0,15 se F5 perder; 0,10 por histórico extra", "Abrir #/aulas?modalidade=2,4&intensidade=1", 4, 0.50, None),
  ("M", "Navegar entre 3 semanas (esta, próxima, daqui a 2) com botões desabilitados nas pontas", "Deduzir 0,10 por item", "Clicar › duas vezes", 4, 0.20, None),
  ("M", "Estado de cada aula no card (vagas, lotada/lista de espera, minha reserva, já terminou) com cor e texto", "Deduzir 0,05 por estado", "Comparar com o print", 4, 0.30, None),
  ("J", "Organização do código da grade (cálculos em computed, sem duplicar estado)", None, None, 4, 0.30, [
     "Lógica espalhada no template", "Funciona com estado duplicado", "Organizado com falhas pontuais", "Computeds claros e URL como fonte da verdade"]),
 ]),
 ("E5", "Modal da aula e regras de reserva", [
  ("M", "Modal é rota filha (#/aulas/:aulaId/:data): F5 reabre, Voltar fecha, fechar mantém os filtros; id inexistente mostra \"Aula não encontrada\"", "Deduzir 0,10 por item", "Abrir, F5, Voltar", 4, 0.40, None),
  ("M", "Modal acessível: Teleport/fundo escuro, foco preso, Esc, X e clique fora fecham, foco volta, rolagem travada", "Deduzir 0,10 por item", "Tab 10 vezes", 4, 0.40, None),
  ("M", "Detalhes: professor com foto, sala, intensidade, vagas, lista de espera e barra de ocupação", "Deduzir 0,05 por item", "Comparar com estado-02", 4, 0.20, None),
  ("M", "Visitante vê \"Entrar para reservar\"; logado: Reservar (com vaga) ou Entrar na lista de espera (lotada, mostra a posição)", "Deduzir 0,10 por regra", "Funcional terça 09:00 lotada; Boxe 19:30 = 4º na espera", 4, 0.40, None),
  ("M", "Regras: máximo 2 aulas por dia, sem conflito de horário (mostra com qual aula), aula que já começou/terminou não reserva", "Deduzir 0,15 por regra", "Yoga 08:30 + Funcional 09:00 = conflito; Yoga + Boxe 19:30 = limite no Spinning 18:00", 4, 0.60, None),
  ("M", "Cancelar só até 60 min antes (depois mostra o motivo); aviso com Desfazer devolve a reserva", "Deduzir 0,10 por item", "Yoga 08:30 reservada às 08:00 não cancela", 4, 0.30, None),
 ]),
 ("E6", "Login e Minha área", [
  ("M", "Login com validação (e-mail, senha ≥ 6), mostrar/ocultar senha com aria-pressed, erro \"E-mail ou senha incorretos.\" limpando a senha e focando nela", "Deduzir 0,10 por item", "bia@pulso.com / Pulso2026!", 4, 0.30, None),
  ("M", "Foto do perfil: valida tipo, tamanho (2 MB) e dimensões (200 × 200) com mensagens, prévia antes de salvar, Trocar, Remover; cabeçalho mostra a foto ou as iniciais", "Deduzir 0,10 por regra", "Arquivo .txt, PNG 120 × 120 e PNG 400 × 400", 4, 0.50, None),
  ("M", "Meta do mês editável (4 a 30) com anel de progresso em conic-gradient", "Deduzir 0,10 por item", "Meta 50 = erro; 10 = anel muda", 4, 0.20, None),
  ("M", "Gráficos só com CSS: barras das últimas 8 semanas animadas em sequência com valor no hover/foco e rosca por modalidade com legenda", "Deduzir 0,15 por gráfico ausente", "Comparar com 09-minha-area-graficos.mp4", 3, 0.40, None),
  ("M", "Minhas aulas: filtro por situação, ordem por data, paginação de 5 com aria-current e cancelar na lista", "Deduzir 0,10 por item", "Reservar 6 aulas", 4, 0.30, None),
  ("M", "Sair: sai da tela protegida antes de apagar o usuário, sem erro no console", "Tudo ou nada", "Sair na Minha área", 4, 0.10, None),
 ]),
 ("E7", "Planos", [
  ("M", "Interruptor Mensal/Anual (role=switch, aria-checked) com preço que anima do valor antigo ao novo e a economia anual", "Deduzir 0,10 por item", "Pulso+: R$ 179,90 → R$ 149,90; economia R$ 360,00", 4, 0.40, None),
  ("M", "Tabela comparativa gerada dos benefícios da API, rolando na horizontal no celular, com o plano atual marcado para quem está logado", "Deduzir 0,10 por item", "Logado: Pulso+ = Seu plano atual", 4, 0.30, None),
  ("M", "FAQ em acordeão (componente reutilizável): um aberto por vez, aria-expanded, animação de altura, painel fechado fora do Tab", "Deduzir 0,10 por item", "Abrir dois itens", 4, 0.30, None),
 ]),
 ("E8", "Montar treino", [
  ("M", "Catálogo com busca sem acento/maiúscula e chips de grupo muscular; adicionar até 10 sem repetir (botão vira ✓)", "Deduzir 0,10 por regra", "\"agachamento\" e chip Costas", 4, 0.30, None),
  ("M", "Reordenar arrastando (HTML5 Drag and Drop) com indicação visual de onde vai cair", "Deduzir 0,20 se não arrastar", "Comparar com 08-montar-treino.mp4", 4, 0.40, None),
  ("M", "Reordenar pelo teclado (Alt + ↑/↓ na alça e botões ↑ ↓) com o foco acompanhando o item e anúncio em aria-live", "Deduzir 0,10 por item", "Alt + ↓ duas vezes", 4, 0.40, None),
  ("M", "Séries (1–6) e repetições (1–30) com erro na linha; resumo com total de séries, tempo estimado e barra por grupo muscular", "Deduzir 0,10 por item", "Séries 9 = erro; 3 exercícios × 3 séries", 4, 0.30, None),
  ("M", "Exportar .json e importar com validação (formato, máximo, exercício inexistente, repetido, faixas) e mensagem clara", "Deduzir 0,10 por item", "Importar {\"formato\":\"errado\"}", 4, 0.30, None),
 ]),
 ("E9", "Responsividade e acessibilidade", [
  ("M", "375 px: menu fixo embaixo, grade vira abas por dia (tablist com setas) com lista da aula do dia, modal em folha e sem rolagem horizontal", "Deduzir 0,10 por item", "DevTools 375 × 812", 3, 0.50, None),
  ("M", "Link Pular para o conteúdo, foco visível, Lighthouse Acessibilidade ≥ 90 em Aulas e Minha área, console sem erros (inclusive avisos do Vue)", "Deduzir 0,10 por item", "Lighthouse e console", 4, 0.30, None),
 ]),
]

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
