# Gera os JSON de semente da API Pulso (determinístico).
import json, random, os, sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
random.seed(17)
def w(n, d): json.dump(d, open(f'{OUT}/{n}.json', 'w'), ensure_ascii=False, indent=1)

unidades = [
 dict(id=1, nome='Pulso Centro', bairro='República', endereco='Rua Barão de Itapetininga, 210', horario='Seg a sex 6h–23h · Sáb 8h–18h · Dom 8h–13h', imagem='img/unidades/centro.jpg'),
 dict(id=2, nome='Pulso Jardins', bairro='Jardim Paulista', endereco='Alameda Santos, 1480', horario='Seg a sex 6h–23h · Sáb 8h–18h · Dom 8h–13h', imagem='img/unidades/jardins.jpg'),
 dict(id=3, nome='Pulso Lapa', bairro='Lapa', endereco='Rua Doze de Outubro, 385', horario='Seg a sex 6h–22h · Sáb 8h–16h · Dom fechado', imagem='img/unidades/lapa.jpg'),
 dict(id=4, nome='Pulso Mooca', bairro='Mooca', endereco='Rua da Mooca, 2750', horario='Seg a sex 6h–22h · Sáb 8h–16h · Dom 8h–12h', imagem='img/unidades/mooca.jpg'),
]
mods = [
 (1,'Bike Indoor','bike','#E63946',3,520,'Pedalada em grupo com música alta e variação de carga. Leve garrafa de água.'),
 (2,'Funcional','funcional','#F4A261',2,430,'Circuito com peso do corpo, elásticos e kettlebell para força e resistência.'),
 (3,'Yoga','yoga','#2A9D8F',1,180,'Posturas, respiração e relaxamento. Tapete fornecido pela unidade.'),
 (4,'Pilates Solo','pilates','#8E7DBE',1,220,'Fortalecimento do centro do corpo com bola e anel, sem aparelhos.'),
 (5,'Boxe','boxe','#264653',3,600,'Técnica de socos, esquivas e saco de pancada. Luvas emprestadas na recepção.'),
 (6,'Ritmos','ritmos','#E76F51',2,450,'Coreografias fáceis de axé, funk e pop. Ninguém precisa saber dançar.'),
 (7,'HIIT','hiit','#D62828',3,560,'Treino intervalado de alta intensidade: 40 s de esforço, 20 s de pausa.'),
 (8,'Alongamento','alongamento','#3A86FF',1,120,'Mobilidade e alongamento para o dia seguinte não doer.'),
]
modalidades = [dict(id=a, nome=b, slug=c, cor=d, intensidade=e, calorias_media=f, descricao=g, imagem=f'img/modalidades/{c}.jpg') for a,b,c,d,e,f,g in mods]
instr = [(1,'Marina Duarte',[1,7]),(2,'Caio Ferraz',[2,7]),(3,'Lívia Okamoto',[3,8]),(4,'Renato Vasques',[5,2]),
         (5,'Bianca Lopes',[6,1]),(6,'Tiago Nunes',[4,8]),(7,'Júlia Arantes',[3,4]),(8,'Otávio Sena',[5,7])]
instrutores = [dict(id=a, nome=b, foto=f'img/instrutores/{a}.jpg', modalidade_ids=c) for a,b,c in instr]
salas = ['Sala 1', 'Sala 2', 'Estúdio', 'Ringue']
grade = []
horas_semana = ['06:30','07:00','08:00','09:00','12:00','12:30','17:30','18:30','19:00','20:00','21:00']
for dia in range(1, 8):
    n = 4 if dia <= 5 else (2 if dia == 6 else 1)
    for u in unidades:
        if dia == 7 and u['id'] == 3: continue
        hs = sorted(random.sample(horas_semana if dia <= 5 else ['08:00','09:00','10:00','11:00'], n))
        for h in hs:
            m = random.choice(mods); mid = m[0]
            ins = [i for i in instr if mid in i[2]]; iid = random.choice(ins)[0]
            cap = random.choice([12, 16, 20, 24]) if mid not in (5,) else 10
            dur = 50 if mid in (1, 7) else (60 if mid in (3, 4, 6) else 45)
            sala = 'Ringue' if mid == 5 else ('Estúdio' if mid in (3, 4, 8) else random.choice(['Sala 1', 'Sala 2']))
            base = random.choice([cap, cap, cap - 1, cap // 2, cap - 3, 3, cap - 2])
            grade.append(dict(dia_semana=dia, hora=h, duracao_min=dur, modalidade_id=mid, instrutor_id=iid, unidade_id=u['id'],
                              sala=sala, capacidade=cap, ocupacao_base=max(0, base), nivel=random.choice(['Iniciante','Todos os níveis','Todos os níveis','Intermediário','Avançado'])))
grade.sort(key=lambda g: (g['dia_semana'], g['hora'], g['unidade_id']))
for i, g in enumerate(grade, 1): g['modelo'] = i
usuarios = [
 dict(id=1, nome='Eduardo Zanetti', email='aluno@pulso.com.br', senha='Pulso2026!', telefone='(11) 98765-4321', plano='Pulso Total', unidade_id=2, foto=None, meta_mensal=12, membro_desde='2025-03-10'),
 dict(id=2, nome='Ana Ribeiro', email='ana@pulso.com.br', senha='Pulso2026!', telefone='(11) 91234-5678', plano='Pulso Básico', unidade_id=1, foto=None, meta_mensal=8, membro_desde='2026-01-15'),
]
regras = [
 dict(id=1, titulo='Até quando posso cancelar uma reserva?', texto='Até 2 horas antes do início da aula. Depois disso a vaga fica presa e conta como falta.'),
 dict(id=2, titulo='Quantas aulas posso reservar por dia?', texto='No máximo 2 aulas por dia, e nunca duas no mesmo horário.'),
 dict(id=3, titulo='Como funciona a lista de espera?', texto='Quando a aula está lotada você pode entrar na lista. Se alguém cancelar, a vaga vai para o primeiro da fila automaticamente.'),
 dict(id=4, titulo='Preciso chegar com antecedência?', texto='Chegue 10 minutos antes. Com 10 minutos de atraso a entrada na sala não é mais permitida.'),
 dict(id=5, titulo='O que levar para a aula?', texto='Toalha, garrafa de água e roupa confortável. Luvas de boxe e tapetes de yoga são emprestados na recepção.'),
]
for n, d in (('unidades', unidades), ('modalidades', modalidades), ('instrutores', instrutores), ('grade', grade), ('usuarios', usuarios), ('regras', regras)): w(n, d)
print(len(grade), 'aulas na grade semanal')
