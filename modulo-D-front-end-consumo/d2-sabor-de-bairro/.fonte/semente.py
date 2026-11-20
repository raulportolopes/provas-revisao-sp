# Gera os JSON de semente da API Sabor de Bairro (determinístico). Uso: python3 semente.py <pasta>
import json, os, sys, random
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
random.seed(42)
def w(n, d): json.dump(d, open(f'{OUT}/{n}.json', 'w'), ensure_ascii=False, indent=1)

categorias = [
 dict(id=1, nome='Pizza', slug='pizza', cor='#E4572E'),
 dict(id=2, nome='Japonesa', slug='japonesa', cor='#D7263D'),
 dict(id=3, nome='Hambúrguer', slug='hamburguer', cor='#F29E4C'),
 dict(id=4, nome='Brasileira', slug='brasileira', cor='#3E8E41'),
 dict(id=5, nome='Saudável', slug='saudavel', cor='#2BA84A'),
 dict(id=6, nome='Doces', slug='doces', cor='#C2549D'),
 dict(id=7, nome='Árabe', slug='arabe', cor='#B5651D'),
 dict(id=8, nome='Lanches 24h', slug='lanches', cor='#3A6EA5'),
]
H_NORMAL = [dict(dia_semana=d, abre='11:00', fecha='23:30') for d in range(1, 8)]
H_NOITE = [dict(dia_semana=d, abre='18:00', fecha='23:59') for d in range(1, 8)]
H_ALMOCO = [dict(dia_semana=d, abre='10:30', fecha='15:30') for d in range(1, 7)]
H_24 = [dict(dia_semana=d, abre='00:00', fecha='23:59') for d in range(1, 8)]
H_DOCE = [dict(dia_semana=d, abre='13:00', fecha='22:00') for d in range(2, 8)]
rest = [
 ('Forno da Vila', 1, H_NOITE, 4.8, 1520, 35, 50, 690, 3000), ('Pizzaria Bella Mooca', 1, H_NORMAL, 4.5, 860, 40, 60, 0, 4000),
 ('Sushi Kaigan', 2, H_NOITE, 4.9, 2310, 45, 60, 990, 6000), ('Temaki Express', 2, H_NORMAL, 4.2, 410, 25, 40, 490, 2500),
 ('Brasa Burger', 3, H_NORMAL, 4.7, 3120, 30, 45, 599, 2500), ('Smash do Bairro', 3, H_24, 4.4, 980, 20, 35, 390, 2000),
 ('Cozinha da Dona Cida', 4, H_ALMOCO, 4.9, 1870, 30, 40, 0, 2000), ('Feijoada do Largo', 4, H_ALMOCO, 4.6, 640, 40, 55, 790, 3500),
 ('Verde Vivo', 5, H_NORMAL, 4.6, 720, 25, 35, 490, 2500), ('Bowl & Cia', 5, H_24, 4.3, 300, 20, 30, 0, 2000),
 ('Doce Ateliê', 6, H_DOCE, 4.8, 1110, 30, 45, 590, 1500), ('Açaí da Esquina', 6, H_24, 4.1, 520, 15, 25, 299, 1500),
 ('Esfiha Cedro', 7, H_NORMAL, 4.7, 1340, 30, 45, 490, 2500), ('Pastelaria Madrugada', 8, H_24, 4.5, 2200, 15, 30, 390, 1500),
]
def slug(s):
    t = s.lower()
    for a, b in (('á','a'),('ã','a'),('â','a'),('é','e'),('ê','e'),('í','i'),('ó','o'),('ô','o'),('ú','u'),('ç','c'),('&','e'),(' ','-')): t = t.replace(a, b)
    return '-'.join(x for x in t.split('-') if x)
restaurantes = []
for i, (n, c, h, av, tot, t1, t2, taxa, minimo) in enumerate(rest, 1):
    restaurantes.append(dict(id=i, slug=slug(n), nome=n, categoria_id=c, avaliacao=av, avaliacoes_total=tot, tempo_min=t1, tempo_max=t2,
        taxa_entrega=taxa, pedido_minimo=minimo, horarios=h, imagem=f'img/restaurantes/{slug(n)}.jpg', endereco=f'Rua {random.choice(["Javari","Taquari","Bresser","Juventus","Orville Derby","dos Trilhos"])}, {random.randint(40, 1900)} – Mooca'))

TAM = lambda base: dict(nome='Tamanho', min=1, max=1, opcoes=[dict(nome='Média', preco=0), dict(nome='Grande', preco=base), dict(nome='Gigante', preco=base * 2)])
BORDA = dict(nome='Borda recheada', min=0, max=1, opcoes=[dict(nome='Catupiry', preco=900), dict(nome='Cheddar', preco=900), dict(nome='Chocolate', preco=1100)])
ADIC = lambda itens: dict(nome='Adicionais', min=0, max=3, opcoes=[dict(nome=n, preco=p) for n, p in itens])
PONTO = dict(nome='Ponto da carne', min=1, max=1, opcoes=[dict(nome='Ao ponto', preco=0), dict(nome='Mal passado', preco=0), dict(nome='Bem passado', preco=0)])
BEBIDA = dict(nome='Bebida', min=0, max=1, opcoes=[dict(nome='Refrigerante lata', preco=600), dict(nome='Suco natural 300 ml', preco=900), dict(nome='Água sem gás', preco=400)])
CARD = {
 1: [('Pizzas salgadas', [('Margherita', 'Molho de tomate, muçarela de búfala e manjericão.', 5490, [TAM(1500), BORDA]), ('Calabresa', 'Calabresa fatiada, cebola roxa e azeitonas.', 4990, [TAM(1500), BORDA]), ('Portuguesa', 'Presunto, ovos, cebola, ervilha e muçarela.', 5790, [TAM(1500), BORDA]), ('Quatro queijos', 'Muçarela, provolone, gorgonzola e parmesão.', 5990, [TAM(1500), BORDA])]),
     ('Pizzas doces', [('Chocolate com morango', 'Chocolate ao leite e morangos frescos.', 4890, [TAM(1200)]), ('Banana com canela', 'Banana, açúcar e canela.', 4290, [TAM(1200)])]),
     ('Bebidas', [('Refrigerante 2 L', 'Escolha o sabor na observação.', 1490, []), ('Suco de uva 1 L', 'Integral, sem açúcar.', 1690, [])])],
 2: [('Combinados', [('Combinado 20 peças', '8 sashimis, 6 uramakis e 6 niguiris do dia.', 7990, [ADIC([('Shoyu extra', 200), ('Gengibre extra', 300), ('Cream cheese', 500)])]), ('Combinado 40 peças', 'Para dividir: sashimi, hot roll, uramaki e niguiri.', 13990, [ADIC([('Shoyu extra', 200), ('Gengibre extra', 300), ('Cream cheese', 500)])])]),
     ('Temakis', [('Temaki salmão', 'Salmão picado, cebolinha e gergelim.', 3290, [ADIC([('Cream cheese', 500), ('Cebolinha', 0), ('Tarê', 200)])]), ('Temaki skin', 'Pele de salmão crocante.', 2690, [])]),
     ('Quentes', [('Hot roll 10 peças', 'Empanado e frito, com tarê.', 3490, []), ('Guioza 6 unidades', 'Recheio de carne suína e legumes.', 2890, [])])],
 3: [('Burgers', [('Clássico', 'Pão brioche, blend 160 g, queijo prato, alface e tomate.', 3490, [PONTO, ADIC([('Bacon', 600), ('Queijo extra', 500), ('Ovo', 400), ('Cebola caramelizada', 500)]), BEBIDA]), ('Duplo cheddar', 'Dois blends de 120 g, muito cheddar e cebola crispy.', 4290, [PONTO, ADIC([('Bacon', 600), ('Queijo extra', 500), ('Ovo', 400)]), BEBIDA]), ('Veggie', 'Hambúrguer de grão-de-bico, rúcula e maionese verde.', 3690, [ADIC([('Queijo extra', 500), ('Cebola caramelizada', 500)]), BEBIDA])]),
     ('Acompanhamentos', [('Batata rústica', 'Com alecrim e páprica.', 1890, [dict(nome='Molho', min=1, max=2, opcoes=[dict(nome='Maionese da casa', preco=0), dict(nome='Barbecue', preco=0), dict(nome='Cheddar', preco=300)])]), ('Onion rings', '10 anéis empanados.', 2190, [])]),
     ('Bebidas', [('Milk-shake 400 ml', 'Baunilha, chocolate ou morango (diga na observação).', 1990, []), ('Refrigerante lata', 'Gelado.', 600, [])])],
 4: [('Pratos do dia', [('Feijoada completa', 'Feijão preto, carnes, arroz, couve, farofa e laranja.', 4290, [dict(nome='Tamanho', min=1, max=1, opcoes=[dict(nome='Individual', preco=0), dict(nome='Para dois', preco=3200)])]), ('Frango com quiabo', 'Com arroz branco e angu.', 3290, []), ('Picadinho', 'Carne em cubos, arroz, farofa, ovo e banana.', 3590, [])]),
     ('Marmitas', [('Marmita executiva', 'Arroz, feijão, salada e uma carne do dia.', 2590, [dict(nome='Carne', min=1, max=1, opcoes=[dict(nome='Bife acebolado', preco=0), dict(nome='Frango grelhado', preco=0), dict(nome='Linguiça', preco=0)])])]),
     ('Sobremesas', [('Pudim de leite', 'Fatia generosa.', 1290, []), ('Doce de abóbora', 'Com coco.', 990, [])])],
 5: [('Bowls', [('Bowl de salmão', 'Arroz integral, salmão grelhado, abacate e legumes.', 4690, [ADIC([('Ovo cozido', 300), ('Castanhas', 500), ('Quinoa', 400)])]), ('Bowl vegano', 'Grão-de-bico, quinoa, legumes assados e tahine.', 3590, [ADIC([('Castanhas', 500), ('Tofu', 600)])])]),
     ('Saladas', [('Caesar com frango', 'Alface romana, frango, croutons e parmesão.', 3290, [dict(nome='Molho', min=1, max=1, opcoes=[dict(nome='Caesar', preco=0), dict(nome='Mostarda e mel', preco=0), dict(nome='Sem molho', preco=0)])])]),
     ('Sucos', [('Verde detox', 'Couve, limão, gengibre e maçã.', 1490, []), ('Laranja com acerola', '500 ml.', 1290, [])])],
 6: [('Doces', [('Bolo de cenoura', 'Fatia com cobertura de brigadeiro.', 1490, []), ('Brownie', 'Com nozes.', 1290, [ADIC([('Sorvete de creme', 700), ('Calda de chocolate', 300)])]), ('Caixa com 6 brigadeiros', 'Sabores tradicionais.', 2490, [])]),
     ('Açaí e sorvetes', [('Açaí 500 ml', 'Batido na hora.', 2290, [ADIC([('Granola', 300), ('Leite em pó', 300), ('Banana', 200), ('Morango', 400)])]), ('Sorvete 2 bolas', 'Escolha os sabores na observação.', 1690, [])])],
 7: [('Esfihas', [('Esfiha de carne', 'Aberta, com limão.', 690, []), ('Esfiha de queijo', 'Aberta.', 690, []), ('Esfiha de zaatar', 'Com azeite.', 590, [])]),
     ('Pratos', [('Kibe assado', 'Recheado com coalhada.', 2890, []), ('Kafta no prato', 'Com arroz sírio e homus.', 3990, [])]),
     ('Combos', [('Combo 10 esfihas', 'Escolha até 3 sabores.', 6290, [dict(nome='Sabores', min=1, max=3, opcoes=[dict(nome='Carne', preco=0), dict(nome='Queijo', preco=0), dict(nome='Zaatar', preco=0), dict(nome='Frango com catupiry', preco=500)])])])],
 8: [('Pastéis', [('Pastel de carne', 'Massa crocante.', 1290, [ADIC([('Queijo', 300), ('Ovo', 300), ('Azeitona', 200)])]), ('Pastel de queijo', 'Muçarela.', 1190, []), ('Pastel de pizza', 'Muçarela, tomate e orégano.', 1290, [])]),
     ('Lanches', [('Misto quente', 'Pão de forma na chapa.', 1190, []), ('Bauru', 'Rosbife, tomate e queijo.', 1990, [])]),
     ('Bebidas', [('Caldo de cana 500 ml', 'Com limão.', 990, []), ('Café coado', '200 ml.', 500, [])])],
}
secoes, itens, grupos = [], [], []
sid = iid = gid = oid = 0
for r in restaurantes:
    for k, (nome_s, lista) in enumerate(CARD[r['categoria_id']]):
        sid += 1; secoes.append(dict(id=sid, restaurante_id=r['id'], nome=nome_s, ordem=k + 1))
        for j, (nome, desc, preco, gs) in enumerate(lista):
            iid += 1
            fator = 1 + (r['id'] % 3) * 0.05
            p = int(round(preco * fator / 10) * 10 - 10 * (r['id'] % 2))
            item = dict(id=iid, secao_id=sid, nome=nome, descricao=desc, preco=p, imagem=f'img/pratos/{r["categoria_id"]}-{(j % 3) + 1}.jpg', destaque=(j == 0 and k == 0), disponivel=not (iid % 17 == 0), grupos=[])
            for g in gs:
                gid += 1; grupo = dict(id=gid, nome=g['nome'], min=g['min'], max=g['max'], opcoes=[])
                for o in g['opcoes']:
                    oid += 1; grupo['opcoes'].append(dict(id=oid, nome=o['nome'], preco=o['preco']))
                item['grupos'].append(grupo)
            itens.append(item)
usuarios = [dict(id=1, nome='Eduardo Zanetti', email='cliente@sabor.com.br', senha='Sabor2026!', telefone='(11) 98765-4321'),
            dict(id=2, nome='Ana Ribeiro', email='ana@sabor.com.br', senha='Sabor2026!', telefone='(11) 91234-5678')]
ceps = [('03101-001', 'Mooca', 0), ('03102-002', 'Mooca', 0), ('03164-000', 'Água Rasa', 300), ('03301-000', 'Tatuapé', 500),
        ('03047-000', 'Brás', 400), ('04101-000', 'Vila Mariana', 900), ('03181-100', 'Belenzinho', 300)]
cep = [dict(cep=c, logradouro=f'Rua {l}', bairro=b, cidade='São Paulo', uf='SP', acrescimo_taxa=t) for (c, b, t), l in zip(ceps, ['Javari', 'Taquari', 'Itapiti', 'Tuiuti', 'Bresser', 'Domingos de Morais', 'Herval'])]
cupons = [dict(codigo='BEMVINDO10', tipo='percentual', valor=10, minimo=3000, validade='2027-12-31', descricao='10% de desconto acima de R$ 30,00'),
          dict(codigo='FRETEGRATIS', tipo='frete', valor=0, minimo=0, validade='2027-12-31', descricao='Entrega grátis'),
          dict(codigo='DESCONTO15', tipo='valor', valor=1500, minimo=6000, validade='2027-12-31', descricao='R$ 15,00 de desconto acima de R$ 60,00'),
          dict(codigo='VERAO2025', tipo='percentual', valor=20, minimo=0, validade='2025-03-20', descricao='Cupom de verão')]
for n, d in (('categorias', categorias), ('restaurantes', restaurantes), ('secoes', secoes), ('itens', itens), ('usuarios', usuarios), ('ceps', cep), ('cupons', cupons)): w(n, d)
print(len(restaurantes), 'restaurantes', len(itens), 'itens')
