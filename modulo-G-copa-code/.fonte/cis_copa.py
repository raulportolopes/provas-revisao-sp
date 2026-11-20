# CIS – Módulo G Copa Code (Team Challenge, 5,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, requisito/como verificar, wsos, max, julgamento)
TITULO = '17 Tecnologias Web – Módulo G: Copa Code, torneio interescolar de e-sports (Team Challenge)'
CRITERIO = 'Team Challenge – Módulo G (Copa Code)'
SUB = [
 ("G1", "Organização da equipe e entrega", [
  ("M", "PLANO.md na raiz com o nome de cada integrante, o pacote dele (P1 a P5), os arquivos de cada um e os horários de integração", "Deduzir 0,10 se faltar a divisão por pacote", "Abrir TEAM_X_modulo_g/PLANO.md", 1, 0.20, None),
  ("M", "A aplicação abre em http://IP/TEAM_X_modulo_g/ sem erro no console, com Vue e Vue Router locais (sem CDN) e sem caminho absoluto de máquina", "Zero se não abrir; deduzir 0,10 por recurso quebrado ou carregado da internet", "Abrir de outra máquina com a aba Rede aberta", 1, 0.20, None),
  ("M", "config.php e o arquivo .sql não podem ser baixados pelo navegador; a senha do banco não aparece em nenhuma resposta da API (nem em erro 500)", "Tudo ou nada", "Abrir http://IP/TEAM_X_modulo_g/config.php e banco/copacode.sql: 403 ou vazio", 1, 0.20, None),
 ]),
 ("G2", "API e regras de negócio (P1)", [
  ("M", "GET teams devolve escola aninhada e jogadores com age calculada para 28/11/2026, confirmadas primeiro por ordem de check-in; GET matches devolve team_a/team_b aninhados e status calculado", "Deduzir 0,05 por campo ausente ou errado", "Fênix Rubra é a primeira; Mako54 tem age 16", 5, 0.20, None),
  ("M", "POST teams: 201 com equipe e jogadores gravados juntos (transação); 422 com TODOS os erros, inclusive players.N.campo e as regras de capitão/reserva", "Deduzir 0,10 se o 422 trouxer só o primeiro erro; 0,10 sem as chaves players.N", "POST com 2 jogadores inválidos: errors tem players.1.nickname e players.3.birth_date", 5, 0.30, None),
  ("M", "Regras 409: nome, tag ou nick repetidos; escola com 2 equipes; inscrição depois do chaveamento; check-in repetido ou nona confirmada; excluir depois do chaveamento", "Deduzir 0,05 por regra que falha", "Ver os casos 409 do Guia do avaliador", 5, 0.25, None),
  ("M", "POST bracket só com exatamente 8 confirmadas; seeds por ordem de check-in; confrontos 1×8, 4×5, 2×7, 3×6 com os horários do contrato; semis e final vazias com next_match_id/next_slot", "Deduzir 0,10 por regra que falha", "Gerar com 7 confirmadas (409) e com 8 (201)", 5, 0.20, None),
  ("M", "PATCH score: só 2×0, 2×1, 1×2, 0×2 (422); partida sem as duas equipes (409); vencedor vai para o lado certo da próxima partida; correção bloqueada depois da próxima jogada (409)", "Deduzir 0,10 por regra que falha", "Lançar Q1 e conferir a S1 lado a", 5, 0.30, None),
  ("M", "Rotas protegidas dão 401 sem token ou com token inválido; login errado 401; ordem 401 → 404 → 422 → 409; 404 e 405 em JSON", "Deduzir 0,05 por caso que falha", "PATCH matches/999/score sem token = 401; com token = 404", 5, 0.15, None),
 ]),
 ("G3", "Inscrição (P2)", [
  ("M", "Formulário com 5 linhas de jogador; adicionar e remover o reserva (linha anima e o foco vai para o lugar certo); capitão por rádio só entre titulares; tag em maiúsculas; prévia com a cor da escola; escolas lotadas desabilitadas", "Deduzir 0,05 por item que falha", "Comparar com design/videos/04", 4, 0.25, None),
  ("M", "Validação ao vivo com as mesmas regras e mensagens do contrato (erro depois do blur e no envio, foco no primeiro inválido); idade em 28/11 ao lado do rótulo; erro 422 do servidor no campo certo; 409 em toast", "Deduzir 0,05 por regra sem validação", "Enviar vazio; data 01/01/2015 no reserva", 4, 0.25, None),
 ]),
 ("G4", "Equipes e chaveamento (P3 e P4)", [
  ("M", "Equipes: busca sem acento por nome, tag ou nick + escola + situação combinados, gravados na URL (F5 e Voltar funcionam); contador; acordeão de jogadores um por vez; barra de progresso X de 8", "Deduzir 0,05 por item que falha", "#/equipes?status=confirmed&escola=2 mostra 2 equipes", 4, 0.25, None),
  ("M", "Organização: check-in, excluir com digitação da tag e Gerar chaveamento habilitado só com 8 confirmadas; depois de gerar, as ações somem e a inscrição mostra 'encerradas'", "Deduzir 0,05 por item que falha", "Fazer o check-in da Sorocrew e gerar", 4, 0.25, None),
  ("M", "Chave em 4 colunas (quartas, semis, final, campeã) com conectores; vencedor destacado e perdedor apagado; hover/foco destaca o caminho da equipe; quem chega na fase entra animado; campeã com troféu e confete", "Deduzir 0,05 por item que falha", "Comparar com design/videos/10 e 11", 4, 0.25, None),
  ("M", "Modo telão com a Fullscreen API: botão alterna o texto e aria-pressed, Esc sai e o estado do botão acompanha (evento fullscreenchange)", "Tudo ou nada", "Entrar no telão e sair com Esc", 4, 0.10, None),
 ]),
 ("G5", "Base, Partidas e responsividade (P5)", [
  ("M", "Rotas com hash: link ativo (classe active + aria-current) também em /partidas/semis; título da aba por tela; rota desconhecida vai para Equipes; transição entre telas", "Deduzir 0,05 por item que falha", "Abrir #/xyz e #/partidas/final com F5", 3, 0.20, None),
  ("M", "Partidas: abas ligadas à rota com setas ← →; contagem regressiva que para de rodar ao sair da tela (clearInterval); modal de placar com as 4 opções; datas DD/MM/AAAA HH:MM sem erro de fuso", "Deduzir 0,05 por item que falha; zero no item de data se aparecer AAAA-MM-DD", "Q1: 28/11/2026 09:00", 3, 0.25, None),
  ("M", "Login da organização em modal (Esc, X, fundo, foco volta), sessão mantida no F5; 401 em qualquer tela desloga; carregando e erro com 'Tentar novamente'; toasts", "Deduzir 0,05 por item que falha", "Apagar o token no banco e lançar placar", 3, 0.20, None),
  ("M", "375 px: menu em barra inferior fixa, chave com rolagem lateral, formulário em uma coluna, nenhuma rolagem horizontal da página; 768 px sem quebra", "Deduzir 0,05 por item que falha", "Modo dispositivo 375 × 812 e 768 × 1024", 3, 0.20, None),
  ("J", "Acabamento visual e animações iguais aos vídeos de referência", None, None, 3, 0.20, [
     "Sem identidade visual; animações ausentes", "Visual consistente, poucas animações",
     "Fiel aos prints, com a maioria das animações", "Praticamente igual aos prints e vídeos"]),
 ]),
 ("G6", "Apresentação e trabalho em equipe", [
  ("J", "Pitch de 3 a 5 minutos com o fluxo completo ao vivo (inscrever → check-in → gerar → placares → campeã)", None, None, 2, 0.30, [
     "Sem demonstração ou fora do tempo", "Demonstra partes soltas, sem fluxo",
     "Fluxo completo com pequenas falhas", "Fluxo completo, claro, no tempo e sem falhas"]),
  ("J", "Participação de todos os integrantes, cada um explicando o próprio pacote e a integração", None, None, 2, 0.30, [
     "Um ou dois falam pela equipe", "Todos falam, mas sem ligação entre as partes",
     "Todos falam e mostram como as partes se ligam", "Equipe afinada: cada um domina sua parte e a do vizinho"]),
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
