# Gera a "API" (arquivos JSON) da prova Órbita – Planetário Paulista.
import json, random, sys, os
random.seed(17)
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

config = {
    "agora": "2026-12-05T10:00:00-03:00",
    "limite_lugares": 6,
    "tempo_reserva_segundos": 300,
    "taxa_servico_percentual": 8,
    "cancelamento_minimo_horas": 2,
    "meia_maximo_percentual": 50
}

programas = [
 (1, "Jornada ao Centro da Via Láctea", "Astronomia", "L", 38, True, "2026-11-20", 4.8, "Uma viagem de 26 mil anos-luz até o buraco negro Sagittarius A*, passando por nebulosas, aglomerados e braços espirais da nossa galáxia."),
 (2, "Pequenos Astronautas", "Infantil", "L", 25, True, "2026-10-02", 4.6, "Lua, Sol e estrelas explicados para crianças de 3 a 8 anos, com a robô Lumi como guia e muitas músicas para cantar junto."),
 (3, "Céu de Verão em São Paulo", "Ao vivo", "L", 50, True, "2026-12-01", 4.9, "Um astrônomo apresenta ao vivo o céu desta noite: Órion, o Cruzeiro do Sul, os planetas visíveis e as chuvas de meteoros do mês."),
 (4, "Buracos Negros: o Lado Escuro", "Astronomia", "12", 42, False, "2026-09-15", 4.7, "O que acontece quando uma estrela gigante morre? Siga a luz até o horizonte de eventos e descubra como o primeiro buraco negro foi fotografado."),
 (5, "Sinfonia das Esferas", "Música imersiva", "L", 35, True, "2026-11-08", 4.5, "Concerto imersivo em 360 graus com obras de Holst e Villa-Lobos sincronizadas com imagens reais dos planetas do Sistema Solar."),
 (6, "Marte: Próxima Parada", "Ciência", "10", 40, False, "2026-08-20", 4.4, "Como seria a vida em Marte? Do lançamento ao pouso, acompanhe a primeira missão tripulada imaginada por cientistas brasileiros."),
 (7, "Auroras", "Música imersiva", "L", 30, False, "2026-07-11", 4.3, "As luzes do céu polar em uma experiência relaxante de música eletrônica ambiente e projeções em toda a cúpula."),
 (8, "Eclipses: Quando o Sol Some", "Ciência", "L", 32, False, "2026-06-30", 4.2, "Por que os eclipses acontecem e onde ver os próximos no Brasil. Inclui simulação do eclipse solar total de 2045."),
 (9, "Exoplanetas: Outros Mundos", "Astronomia", "10", 45, False, "2026-10-21", 4.6, "Mais de 6 mil planetas já foram encontrados fora do Sistema Solar. Visite os mais estranhos: chuva de vidro, oceanos de lava e dois sóis."),
 (10, "Noite de Terror Cósmico", "Ao vivo", "14", 55, False, "2026-10-31", 4.1, "Supernovas, asteroides e raios gama: um bate-papo ao vivo e bem-humorado sobre as maiores ameaças do Universo. Não recomendado para menores de 14 anos."),
 (11, "Os Indígenas e o Céu", "Ciência", "L", 36, False, "2026-09-05", 4.8, "As constelações da Ema, da Anta e do Homem Velho, contadas pelos povos originários do Brasil e usadas até hoje para marcar as estações."),
 (12, "Rock na Cúpula", "Música imersiva", "12", 48, False, "2026-11-28", 4.0, "Clássicos do rock nacional e internacional com efeitos de laser e animações psicodélicas projetadas na cúpula inteira."),
]
programas_json = [dict(id=i, titulo=t, genero=g, classificacao=c, duracao_min=d, destaque=dst,
                       estreia=e, avaliacao=n, imagem=f"img/programa-{i:02d}.jpg",
                       imagem_destaque=({3: "img/hero-1.jpg", 1: "img/hero-2.jpg", 5: "img/hero-3.jpg", 2: "img/hero-4.jpg"}.get(i)), sinopse=s)
                  for (i, t, g, c, d, dst, e, n, s) in programas]

# Layout das salas: A = assento, C = cadeirante, _ = corredor, . = sem assento
salas = [
 {"id": 1, "nome": "Cúpula Galileu", "capacidade": 0, "layout": [
   "..AAAA_AAAAAA_AAAA..",
   ".AAAAA_AAAAAA_AAAAA.",
   "AAAAAA_AAAAAA_AAAAAA",
   "AAAAAA_AAAAAA_AAAAAA",
   "AAAAAA_AAAAAA_AAAAAA",
   "AAAAAA_AAAAAA_AAAAAA",
   "AAAAAA_AAAAAA_AAAAAA",
   "CC.AAA_AAAAAA_AAA.CC"]},
 {"id": 2, "nome": "Cúpula Hipátia", "capacidade": 0, "layout": [
   "..AAAAAAAA..",
   ".AAAAAAAAAA.",
   "AAAAA__AAAAA",
   "AAAAA__AAAAA",
   "AAAAA__AAAAA",
   "CC.AA__AA.CC"]},
]
def lugares(sala):
    out = []
    for r, linha in enumerate(sala["layout"]):
        letra = "ABCDEFGHIJ"[r]; n = 0
        for ch in linha:
            if ch in "AC":
                n += 1; out.append(f"{letra}{n}")
    return out
for s in salas: s["capacidade"] = len(lugares(s))

horarios = ["10:30", "13:00", "15:30", "18:00", "20:30"]
sessoes = []; sid = 0
idiomas = ["Narração em português", "Narração em português", "Legendado", "Audiodescrição"]
dias = ["2026-12-05", "2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11"]
for di, dia in enumerate(dias):
    if dia == "2026-12-07":  # segunda: planetário fechado (dia sem sessões = estado vazio)
        continue
    for sala in salas:
        for hi, h in enumerate(horarios):
            if (di + hi + sala["id"]) % 3 == 0 and not (dia == "2026-12-05" and h == "10:30"):
                continue
            prog = programas[(di * 3 + hi * 2 + sala["id"] * 5) % len(programas)]
            if prog[2] == "Infantil" and h in ("20:30",):
                prog = programas[0]
            sid += 1
            todos = lugares(sala)
            taxa = random.choice([0.05, 0.2, 0.35, 0.5, 0.7, 0.85])
            if sid == 4: taxa = 1.0  # sessão esgotada
            ocup = sorted(random.sample(todos, int(len(todos) * taxa)), key=lambda x: (x[0], int(x[1:])))
            preco = 40.0 if sala["id"] == 1 else 32.0
            if prog[2] == "Ao vivo": preco += 16
            if prog[2] == "Infantil": preco -= 10
            sessoes.append({"id": sid, "programa_id": prog[0], "sala_id": sala["id"], "data": dia, "hora": h,
                            "preco_inteira": preco, "idioma": idiomas[(sid) % 4], "ocupados": ocup})

# garante a sessão 10:30 do dia 05/12 (já começou às 10:00? não: começa 10:30, faltam 30 min -> não pode cancelar)
ceu = {
 "planetas": [
  {"nome": "Mercúrio", "cor": "#B8A99A", "magnitude": -0.4, "melhor_horario": "Logo após o pôr do sol", "visibilidade": [10, 35, 60, 20, 5, 30, 55, 25, 10, 40, 65, 30], "descricao": "Difícil de ver: nunca se afasta muito do Sol."},
  {"nome": "Vênus", "cor": "#F2D49B", "magnitude": -4.3, "melhor_horario": "Antes do nascer do sol", "visibilidade": [90, 85, 80, 70, 60, 50, 40, 30, 45, 60, 75, 88], "descricao": "O ponto mais brilhante do céu depois da Lua."},
  {"nome": "Marte", "cor": "#E2704B", "magnitude": 0.6, "melhor_horario": "Meia-noite", "visibilidade": [70, 65, 55, 40, 25, 15, 10, 20, 35, 50, 62, 72], "descricao": "Avermelhado e fácil de reconhecer."},
  {"nome": "Júpiter", "cor": "#E8B98A", "magnitude": -2.7, "melhor_horario": "Começo da noite", "visibilidade": [95, 90, 80, 60, 35, 15, 10, 25, 50, 70, 85, 98], "descricao": "Com binóculos dá para ver quatro luas."},
  {"nome": "Saturno", "cor": "#D9C27C", "magnitude": 0.7, "melhor_horario": "Começo da noite", "visibilidade": [40, 25, 10, 15, 35, 55, 75, 90, 95, 85, 70, 55], "descricao": "Os anéis aparecem em qualquer telescópio pequeno."},
 ],
 "constelacoes": [
  {"nome": "Cruzeiro do Sul", "estacao": "O ano todo", "estrelas": 5, "historia": "A menor das 88 constelações e a mais famosa do Hemisfério Sul. Aparece na bandeira do Brasil e aponta para o polo sul celeste."},
  {"nome": "Órion", "estacao": "Verão", "estrelas": 7, "historia": "O caçador com as Três Marias no cinturão. No verão paulista ela aparece de cabeça para baixo no começo da noite."},
  {"nome": "Escorpião", "estacao": "Inverno", "estrelas": 18, "historia": "Antares, a estrela vermelha do coração do escorpião, é 700 vezes maior que o Sol."},
  {"nome": "Ema (tupi-guarani)", "estacao": "Junho e julho", "estrelas": 0, "historia": "Formada pelas manchas escuras da Via Láctea perto do Cruzeiro do Sul. Quando aparece inteira ao anoitecer, começa o inverno no Sul do Brasil."},
  {"nome": "Homem Velho (tupi-guarani)", "estacao": "Dezembro", "estrelas": 0, "historia": "Reúne Órion e Touro. Sua chegada ao anoitecer marca o início do verão e a época das chuvas."},
 ],
 "lua": [
  {"data": "2026-12-08", "fase": "Quarto crescente", "iluminacao": 50},
  {"data": "2026-12-15", "fase": "Lua cheia", "iluminacao": 100},
  {"data": "2026-12-23", "fase": "Quarto minguante", "iluminacao": 50},
  {"data": "2026-12-30", "fase": "Lua nova", "iluminacao": 0},
 ],
 "faq": [
  {"pergunta": "Posso entrar depois que a sessão começou?", "resposta": "Não. A cúpula fica escura e a porta é fechada no horário de início para não atrapalhar a projeção."},
  {"pergunta": "Quem tem direito a meia-entrada?", "resposta": "Estudantes, professores, pessoas com 60 anos ou mais e pessoas com deficiência, com documento na entrada. Em cada compra, no máximo metade dos lugares pode ser meia-entrada, arredondando para cima (1 lugar: 1 meia; 3 lugares: 2 meias; 4 lugares: 2 meias)."},
  {"pergunta": "Até quando posso cancelar?", "resposta": "Até 2 horas antes do início da sessão. O valor volta para o mesmo meio de pagamento."},
  {"pergunta": "Os lugares para cadeirantes podem ser escolhidos por qualquer pessoa?", "resposta": "Não. Eles só podem ser marcados quando a opção \"Preciso de lugar acessível\" estiver ligada."},
  {"pergunta": "Abre às segundas-feiras?", "resposta": "Não. Às segundas o planetário fica fechado para manutenção dos projetores."},
 ]
}

def w(nome, obj):
    with open(f"{OUT}/{nome}", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
w("config.json", config)
w("programas.json", programas_json)
w("salas.json", salas)
w("sessoes.json", sessoes)
w("ceu.json", ceu)
exemplo = [
 {"codigo": "ORB-20261128-K7Q2", "sessao": {"programa": "Auroras", "sala": "Cúpula Hipátia", "data": "2026-11-28", "hora": "18:00"}, "sessao_id": None,
  "lugares": [{"id": "C4", "tipo": "inteira", "valor": 32.0}, {"id": "C5", "tipo": "meia", "valor": 16.0}],
  "subtotal": 48.0, "taxa": 3.84, "total": 51.84, "status": "ativa", "criada_em": "2026-11-20T19:12:00-03:00", "cancelada_em": None,
  "cliente": {"nome": "Marina Duarte", "email": "marina@exemplo.com"}, "pagamento": "Pix"},
 {"codigo": "ORB-20261203-M4X9", "sessao": {"programa": "Marte: Próxima Parada", "sala": "Cúpula Galileu", "data": "2026-12-06", "hora": "15:30"}, "sessao_id": None,
  "lugares": [{"id": "E10", "tipo": "inteira", "valor": 40.0}],
  "subtotal": 40.0, "taxa": 3.2, "total": 43.2, "status": "cancelada", "criada_em": "2026-12-01T09:40:00-03:00", "cancelada_em": "2026-12-02T08:05:00-03:00",
  "cliente": {"nome": "Marina Duarte", "email": "marina@exemplo.com"}, "pagamento": "Cartão final 4242"}
]
w("reservas-exemplo.json", exemplo)
print(len(sessoes), "sessões;", [s["capacidade"] for s in salas])
esg = [s for s in sessoes if len(s["ocupados"]) == salas[s["sala_id"]-1]["capacidade"]]
print("esgotadas", [s["id"] for s in esgotadas] if (esgotadas:=esg) else None)
print([ (s["id"], s["data"], s["hora"], s["programa_id"]) for s in sessoes[:6]])
