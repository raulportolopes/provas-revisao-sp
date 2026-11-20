# CIS – Módulo G Zela Bairro (Team Challenge, 5,00 pontos)
# aspecto: (tipo, descrição, dedução/extra, requisito/como verificar, wsos, max, julgamento)
TITULO = '17 Tecnologias Web – Módulo G: Zela Bairro, central de zeladoria (Team Challenge)'
CRITERIO = 'Team Challenge – Módulo G (Zela Bairro)'
SUB = [
 ("G1", "Organização da equipe e entrega", [
  ("M", "PLANO.md na raiz com o nome de cada integrante, o pacote dele (P1 a P5) e o horário de integração combinado", "Deduzir 0,10 se faltar a divisão por pacote", "Abrir TEAM_X_modulo_g/PLANO.md", 1, 0.20, None),
  ("M", "A aplicação abre em http://IP/TEAM_X_modulo_g/ sem erro e sem caminho absoluto de máquina (C:\\, localhost)", "Zero se não abrir; deduzir 0,10 por recurso quebrado (CSS, JS, imagem)", "Abrir no navegador de outra máquina e olhar a aba Rede", 1, 0.20, None),
  ("M", "Pasta dados/ protegida: o navegador não baixa dados/usuarios.json nem dados/chamados.json", "Tudo ou nada", "Abrir http://IP/TEAM_X_modulo_g/dados/usuarios.json: deve dar 403", 1, 0.20, None),
 ]),
 ("G2", "API e regras de estado (P1)", [
  ("M", "GET api/chamados devolve a lista com os campos calculados categoria, prazo_em, atrasado e apoios (sem a lista de apoiadores)", "Deduzir 0,05 por campo ausente ou errado", "Postman: GET api/chamados; ZB-2026-0006 (Calçada, aberta em 03/11) tem prazo_em 2026-11-18 e atrasado true", 5, 0.20, None),
  ("M", "POST api/chamados cria com 201 e protocolo ZB-AAAA-NNNN; dados inválidos dão 422 com TODOS os erros no formato campo => mensagem", "Deduzir 0,10 se o 422 trouxer só o primeiro erro; 0,10 se o protocolo não tiver 4 dígitos", "POST vazio deve listar titulo, descricao, categoria_id, rua e local", 5, 0.30, None),
  ("M", "Máquina de estados: transição fora da tabela dá 409; cancelar e devolver sem observação de 10+ caracteres dão 422; concluir grava concluido_em e o histórico ganha uma linha", "Deduzir 0,10 por regra que falha", "PATCH aberto→concluido = 409; triagem→aberto sem nota = 422; ver historico", 5, 0.30, None),
  ("M", "PATCH de status sem token ou com token inválido dá 401; login com senha errada dá 401; login certo devolve token", "Deduzir 0,10 por caso que falha", "PATCH sem Authorization; POST api/login marta / Zela@2026", 5, 0.20, None),
  ("M", "Apoio: 1 por dispositivo (segundo pedido = 409) e chamado concluído ou cancelado = 409. Foto: aceita só JPG/PNG/WEBP de verdade até 2 MB e salva com nome aleatório", "Deduzir 0,10 por regra que falha", "Mandar um .txt renomeado para .jpg: 422", 5, 0.30, None),
 ]),
 ("G3", "Painel kanban (P2)", [
  ("M", "Quatro colunas com contador; busca sem acento, chip de categoria e 'Só atrasados' combinados; filtros na URL voltam com F5", "Deduzir 0,05 por item que falha", "#/painel?categoria=1&atrasados=1 abre só com os buracos atrasados (em 19/11/2026: só a Cratera)", 4, 0.20, None),
  ("M", "Equipe logada: menu Mover mostra só as transições permitidas; arrastar e soltar só aceita coluna permitida (a proibida fica apagada) e o card chega com destaque", "Deduzir 0,10 se mostrar transição proibida; 0,10 sem arrastar", "Card em Aberto não pode ir direto para Em execução", 4, 0.25, None),
  ("M", "Apoiar soma 1 na hora, trava o botão e continua travado depois do F5 (localStorage)", "Deduzir 0,10 por item que falha", "Apoiar ZB-2026-0004 e dar F5", 4, 0.20, None),
  ("M", "Detalhe em modal com histórico em linha do tempo; fecha com Esc, X e fundo; o foco volta para o card", "Deduzir 0,05 por item que falha", "Abrir ZB-2026-0001 e testar as 3 formas", 4, 0.25, None),
  ("M", "Todas as datas em DD/MM/AAAA (com hora onde pedido) e 'há N dias', sem erro de fuso", "Zero se aparecer AAAA-MM-DD", "ZB-2026-0007: aberto em 28/10/2026 14:00", 4, 0.20, None),
 ]),
 ("G4", "Abrir chamado, mapa e indicadores (P3 e P4)", [
  ("M", "Formulário com as mesmas regras da API, erro embaixo de cada campo ao sair do campo e ao enviar; 422 do servidor aparece no campo certo", "Deduzir 0,05 por campo sem validação", "Enviar vazio e corrigir um por um", 4, 0.20, None),
  ("M", "Local marcado por clique no mini-mapa e ajustável pelas setas; foto com prévia, Trocar e Remover; sucesso mostra o protocolo", "Deduzir 0,05 por item que falha", "Usar só o teclado no mini-mapa", 4, 0.20, None),
  ("M", "Mapa: pinos na posição x/y com a cor do status; hover ou foco no pino destaca o item da lista e vice-versa; legenda liga e desliga situações", "Deduzir 0,05 por item que falha", "Passar o mouse no pino da Cratera", 4, 0.20, None),
  ("M", "Indicadores vindos de api/indicadores: 4 números, barras com --v crescendo em sequência e rosca com conic-gradient", "Deduzir 0,05 por item que falha", "Comparar com design/videos/08", 3, 0.20, None),
 ]),
 ("G5", "Design, tema e responsividade (P5)", [
  ("M", "Tema claro/escuro feito com variáveis CSS, salvo no localStorage e aplicado antes de pintar (sem piscar)", "Deduzir 0,10 se não persistir", "Trocar o tema e dar F5", 3, 0.20, None),
  ("M", "375 px: menu em barra inferior fixa, botão redondo de abrir chamado, colunas com rolagem lateral e nenhuma rolagem horizontal da página", "Deduzir 0,05 por item que falha", "Modo dispositivo 375 × 812", 3, 0.20, None),
  ("J", "Acabamento visual e animações iguais aos vídeos de referência", None, None, 3, 0.20, [
     "Sem identidade visual; animações ausentes", "Visual consistente, poucas animações",
     "Fiel aos prints, com a maioria das animações", "Praticamente igual aos prints e vídeos"]),
 ]),
 ("G6", "Apresentação e trabalho em equipe", [
  ("J", "Pitch de 3 a 5 minutos com demonstração do fluxo completo ao vivo (morador abre → equipe move → indicadores mudam)", None, None, 2, 0.30, [
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
