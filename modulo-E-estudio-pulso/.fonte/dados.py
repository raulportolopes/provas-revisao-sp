# Gera a "API" (JSON) da prova Estúdio Pulso.
import json, sys, os, random
random.seed(23)
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
def w(n, o):
    json.dump(o, open(f'{OUT}/{n}', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

config = {"agora": "2026-12-08T08:00:00-03:00", "max_aulas_por_dia": 2, "cancelamento_minimo_minutos": 60,
          "semanas_a_frente": 2, "max_exercicios_treino": 10, "avatar_max_mb": 2, "avatar_min_px": 200}

modalidades = [
 {"id": 1, "nome": "Spinning", "cor": "#F43F5E", "intensidade": 3, "descricao": "Pedalada indoor com música alta e intervalos de alta intensidade."},
 {"id": 2, "nome": "Yoga", "cor": "#14B8A6", "intensidade": 1, "descricao": "Posturas, respiração e alongamento para corpo e mente."},
 {"id": 3, "nome": "Funcional", "cor": "#F59E0B", "intensidade": 3, "descricao": "Circuitos com peso do corpo, kettlebell e corda naval."},
 {"id": 4, "nome": "Pilates", "cor": "#8B5CF6", "intensidade": 2, "descricao": "Fortalecimento do core e postura no solo e com acessórios."},
 {"id": 5, "nome": "Dança", "cor": "#EC4899", "intensidade": 2, "descricao": "Coreografias de ritmos brasileiros para suar se divertindo."},
 {"id": 6, "nome": "Boxe", "cor": "#3B82F6", "intensidade": 3, "descricao": "Técnica de socos, esquivas e condicionamento no saco de pancada."},
]
professores = [
 {"id": 1, "nome": "Carla Menezes", "especialidade": "Spinning e Funcional", "foto": "img/prof-1.jpg", "bio": "Educadora física há 12 anos, ex-atleta de ciclismo de estrada."},
 {"id": 2, "nome": "Rafael Ito", "especialidade": "Yoga", "foto": "img/prof-2.jpg", "bio": "Formado em Hatha e Vinyasa, dá aulas desde 2015."},
 {"id": 3, "nome": "Juliana Prado", "especialidade": "Pilates", "foto": "img/prof-3.jpg", "bio": "Fisioterapeuta especializada em reabilitação da coluna."},
 {"id": 4, "nome": "Diego Santos", "especialidade": "Boxe e Funcional", "foto": "img/prof-4.jpg", "bio": "Campeão paulista de boxe amador em 2019."},
 {"id": 5, "nome": "Marina Lopes", "especialidade": "Dança", "foto": "img/prof-5.jpg", "bio": "Bailarina e coreógrafa, mistura forró, axé e funk nas aulas."},
 {"id": 6, "nome": "Thiago Ramos", "especialidade": "Spinning", "foto": "img/prof-6.jpg", "bio": "Instrutor certificado e DJ nas horas vagas."},
]
# (dia 1=seg ... 6=sáb, início, duração, modalidade, professor, sala, capacidade, inscritos, espera)
grade = [
 (1, "07:00", 45, 1, 1, "Sala Bike", 20, 12, 0), (1, "07:00", 60, 2, 2, "Sala Zen", 15, 15, 2),
 (1, "12:00", 50, 3, 4, "Sala Livre", 18, 9, 0), (1, "18:00", 50, 4, 3, "Sala Zen", 12, 11, 0),
 (1, "19:00", 60, 5, 5, "Sala Livre", 25, 25, 4), (1, "20:00", 45, 1, 6, "Sala Bike", 20, 6, 0),
 (2, "06:30", 45, 1, 6, "Sala Bike", 20, 20, 1), (2, "07:00", 50, 4, 3, "Sala Zen", 12, 5, 0),
 (2, "08:30", 60, 2, 2, "Sala Zen", 15, 3, 0), (2, "09:00", 50, 3, 1, "Sala Livre", 18, 18, 0),
 (2, "12:00", 50, 6, 4, "Sala Livre", 16, 10, 0), (2, "18:00", 45, 1, 1, "Sala Bike", 20, 19, 0),
 (2, "18:30", 60, 5, 5, "Sala Livre", 25, 14, 0), (2, "19:30", 50, 6, 4, "Sala Livre", 16, 16, 3),
 (3, "07:00", 45, 1, 1, "Sala Bike", 20, 8, 0), (3, "08:00", 60, 2, 2, "Sala Zen", 15, 12, 0),
 (3, "12:00", 50, 3, 4, "Sala Livre", 18, 15, 0), (3, "18:00", 50, 4, 3, "Sala Zen", 12, 12, 1),
 (3, "19:00", 60, 5, 5, "Sala Livre", 25, 20, 0), (3, "20:00", 45, 1, 6, "Sala Bike", 20, 11, 0),
 (4, "06:30", 45, 1, 6, "Sala Bike", 20, 7, 0), (4, "07:00", 50, 4, 3, "Sala Zen", 12, 6, 0),
 (4, "12:00", 50, 6, 4, "Sala Livre", 16, 9, 0), (4, "18:00", 45, 1, 1, "Sala Bike", 20, 20, 2),
 (4, "18:30", 60, 2, 2, "Sala Zen", 15, 7, 0), (4, "19:30", 50, 3, 4, "Sala Livre", 18, 13, 0),
 (5, "07:00", 45, 1, 1, "Sala Bike", 20, 10, 0), (5, "12:00", 60, 2, 2, "Sala Zen", 15, 9, 0),
 (5, "18:00", 60, 5, 5, "Sala Livre", 25, 18, 0), (5, "19:00", 50, 6, 4, "Sala Livre", 16, 4, 0),
 (6, "09:00", 60, 3, 1, "Sala Livre", 18, 17, 0), (6, "09:00", 60, 2, 2, "Sala Zen", 15, 10, 0),
 (6, "10:30", 60, 5, 5, "Sala Livre", 25, 21, 0), (6, "11:00", 45, 1, 6, "Sala Bike", 20, 14, 0),
]
aulas = [dict(id=i + 1, dia_semana=d, inicio=h, duracao_min=dur, modalidade_id=m, professor_id=p, sala=s,
              capacidade=c, inscritos=ins, lista_espera=esp) for i, (d, h, dur, m, p, s, c, ins, esp) in enumerate(grade)]

ex = [("Supino reto", "Peito", "Barra", 40), ("Crucifixo com halteres", "Peito", "Halteres", 35), ("Flexão de braço", "Peito", "Peso do corpo", 30),
      ("Puxada frontal", "Costas", "Polia", 40), ("Remada curvada", "Costas", "Barra", 40), ("Remada baixa", "Costas", "Polia", 35),
      ("Agachamento livre", "Pernas", "Barra", 50), ("Leg press 45°", "Pernas", "Máquina", 45), ("Cadeira extensora", "Pernas", "Máquina", 35),
      ("Afundo", "Pernas", "Halteres", 45), ("Stiff", "Pernas", "Barra", 40), ("Panturrilha em pé", "Pernas", "Máquina", 30),
      ("Desenvolvimento", "Ombros", "Halteres", 40), ("Elevação lateral", "Ombros", "Halteres", 30), ("Face pull", "Ombros", "Polia", 30),
      ("Rosca direta", "Braços", "Barra", 30), ("Rosca martelo", "Braços", "Halteres", 30), ("Tríceps na polia", "Braços", "Polia", 30),
      ("Tríceps francês", "Braços", "Halteres", 30), ("Prancha", "Core", "Peso do corpo", 45), ("Abdominal infra", "Core", "Peso do corpo", 30),
      ("Russian twist", "Core", "Anilha", 30), ("Burpee", "Core", "Peso do corpo", 40), ("Kettlebell swing", "Pernas", "Kettlebell", 40)]
exercicios = [dict(id=i + 1, nome=n, grupo=g, equipamento=e, segundos_por_serie=s) for i, (n, g, e, s) in enumerate(ex)]

planos = [
 {"id": 1, "nome": "Essencial", "mensal": 119.9, "anual_por_mes": 99.9, "destaque": False,
  "beneficios": {"musculacao": True, "aulas_por_semana": 2, "avaliacao_fisica": False, "app_treino": True, "convidado": False, "toalha": False}},
 {"id": 2, "nome": "Pulso+", "mensal": 179.9, "anual_por_mes": 149.9, "destaque": True,
  "beneficios": {"musculacao": True, "aulas_por_semana": 5, "avaliacao_fisica": True, "app_treino": True, "convidado": False, "toalha": True}},
 {"id": 3, "nome": "Ilimitado", "mensal": 239.9, "anual_por_mes": 199.9, "destaque": False,
  "beneficios": {"musculacao": True, "aulas_por_semana": None, "avaliacao_fisica": True, "app_treino": True, "convidado": True, "toalha": True}},
]
faq = [
 {"pergunta": "Posso trocar de plano depois?", "resposta": "Sim. A troca vale a partir do mês seguinte, sem multa."},
 {"pergunta": "Como funciona a lista de espera?", "resposta": "Quando a aula está cheia você entra na fila. Se alguém cancelar, o primeiro da fila recebe a vaga e um aviso."},
 {"pergunta": "Até quando posso cancelar uma aula?", "resposta": "Até 60 minutos antes do início. Depois disso a vaga fica reservada e conta como presença."},
 {"pergunta": "Quantas aulas posso fazer por dia?", "resposta": "No máximo duas, em horários que não se sobreponham."},
 {"pergunta": "O plano anual tem fidelidade?", "resposta": "Sim, de 12 meses. O valor mensal é menor e pode ser pago em até 12 vezes."},
]
# aluna de demonstração e histórico das últimas 8 semanas (para os gráficos)
historico = []
semanas = ["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]
qtds = [2, 3, 1, 4, 3, 5, 2, 4]
import datetime
for s, q in zip(semanas, qtds):
    base = datetime.date.fromisoformat(s)
    dias = sorted(random.sample(range(0, 6), q))
    for d in dias:
        a = random.choice(aulas)
        historico.append({"data": (base + datetime.timedelta(days=d)).isoformat(), "modalidade_id": a["modalidade_id"], "aula_id": a["id"]})
aluna = {"email": "bia@pulso.com", "senha": "Pulso2026!", "nome": "Bia Costa", "plano_id": 2, "meta_mensal": 12, "historico": historico}

w("config.json", config); w("modalidades.json", modalidades); w("professores.json", professores)
w("aulas.json", aulas); w("exercicios.json", exercicios); w("planos.json", planos); w("faq.json", faq); w("aluna-demo.json", aluna)
dez = [h for h in historico if h["data"] >= "2026-12-01"]
print(len(aulas), "aulas;", len(historico), "check-ins;", len(dez), "em dezembro")
