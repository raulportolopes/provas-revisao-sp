# Gera mapa SVG do bairro fictício e a carga inicial (seed) do Zela Bairro.
import json, os, sys, subprocess
OUT = sys.argv[1]  # pasta TEAM_X_modulo_g
W, H = 1000, 640
# ruas: (nome, orientação, posição, espessura)
H_RUAS = [("Rua Ipê Amarelo", 110), ("Av. das Palmeiras", 300), ("Rua Jacarandá", 470), ("Rua Quaresmeira", 590)]
V_RUAS = [("Rua Aroeira", 140), ("Rua Paineira", 380), ("Rua Sibipiruna", 620), ("Rua Manacá", 860)]
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t d">',
 '<title id="t">Mapa do Jardim Esperança</title><desc id="d">Mapa ilustrativo do bairro fictício Jardim Esperança com ruas, praça, escola, UBS e parque linear.</desc>',
 f'<rect width="{W}" height="{H}" fill="#E9EEE6"/>',
 # quadras
 ]
xs = [0] + [x for _, x in V_RUAS] + [W]; ys = [0] + [y for _, y in H_RUAS] + [H]
for i in range(len(xs) - 1):
    for j in range(len(ys) - 1):
        x0, x1, y0, y1 = xs[i] + 16, xs[i + 1] - 16, ys[j] + 16, ys[j + 1] - 16
        if x1 - x0 > 20 and y1 - y0 > 20:
            svg.append(f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="10" fill="#F7F4EC" stroke="#DCD6C8"/>')
# parque linear + córrego
svg.append('<path d="M0 520 C 200 500, 300 560, 520 540 S 820 500, 1000 530 L1000 555 C 820 525, 640 575, 520 565 S 200 525, 0 545 Z" fill="#B9D7EA"/>')
svg.append('<rect x="396" y="316" width="208" height="138" rx="12" fill="#CFE5C4" stroke="#A7C99A"/>')
svg.append('<text x="500" y="392" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#3F6B33">Praça da Matriz</text>')
svg.append('<rect x="636" y="126" width="208" height="158" rx="12" fill="#F3DFC1" stroke="#D9BD92"/>')
svg.append('<text x="740" y="210" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#7A5420">E.E. Jardim Esperança</text>')
svg.append('<rect x="156" y="316" width="208" height="138" rx="12" fill="#F6D3D3" stroke="#D9A3A3"/>')
svg.append('<text x="260" y="392" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#8A2E2E">UBS Esperança</text>')
svg.append('<text x="760" y="548" text-anchor="middle" font-family="Arial" font-size="13" font-style="italic" fill="#2C6A8F">Córrego do Lajeado</text>')
for nome, y in H_RUAS:
    w = 30 if 'Av.' in nome else 22
    svg.append(f'<rect x="0" y="{y-w//2}" width="{W}" height="{w}" fill="#FFFFFF"/>')
for nome, x in V_RUAS:
    svg.append(f'<rect x="{x-11}" y="0" width="22" height="{H}" fill="#FFFFFF"/>')
for nome, y in H_RUAS:
    svg.append(f'<text x="24" y="{y+5}" font-family="Arial" font-size="13" fill="#5B6470">{nome}</text>')
for nome, x in V_RUAS:
    svg.append(f'<text x="{x+5}" y="40" font-family="Arial" font-size="13" fill="#5B6470" transform="rotate(90 {x+5} 40)">{nome}</text>')
svg.append('</svg>')
os.makedirs(f'{OUT}/img', exist_ok=True)
open(f'{OUT}/img/mapa-bairro.svg', 'w').write('\n'.join(svg))

def px(x, y): return round(x / W * 100, 1), round(y / H * 100, 1)

cats = [
 {"id": 1, "nome": "Buraco na via", "prazo_dias": 5, "icone": "buraco"},
 {"id": 2, "nome": "Iluminação pública", "prazo_dias": 3, "icone": "luz"},
 {"id": 3, "nome": "Poda de árvore", "prazo_dias": 10, "icone": "arvore"},
 {"id": 4, "nome": "Lixo e entulho", "prazo_dias": 4, "icone": "lixo"},
 {"id": 5, "nome": "Calçada danificada", "prazo_dias": 15, "icone": "calcada"},
 {"id": 6, "nome": "Vazamento de água", "prazo_dias": 2, "icone": "agua"},
]
# (titulo, descricao, cat, rua, xpx, ypx, status, aberto, concluido, apoios, historico extra)
CH = [
 ("Cratera em frente à padaria", "Buraco grande perto da faixa de pedestres, carros desviam pela contramão.", 1, "Av. das Palmeiras, 410", 300, 300, "execucao", "2026-11-09 08:12:00", None, 14),
 ("Poste apagado há uma semana", "O poste da esquina com a Rua Paineira está apagado e a rua fica muito escura.", 2, "Rua Ipê Amarelo x Rua Paineira", 380, 110, "aberto", "2026-11-16 19:40:00", None, 9),
 ("Galho caído sobre a fiação", "Depois da chuva um galho grande ficou apoiado nos fios da rede elétrica.", 3, "Rua Jacarandá, 77", 210, 470, "triagem", "2026-11-12 07:30:00", None, 6),
 ("Entulho na calçada da escola", "Restos de obra bloqueiam a calçada na saída dos alunos, crianças andam pela rua.", 4, "Rua Sibipiruna, 25", 620, 205, "aberto", "2026-11-17 12:05:00", None, 21),
 ("Vazamento na Rua Manacá", "Água limpa escorrendo do asfalto há dois dias, já formou lodo na sarjeta.", 6, "Rua Manacá, 300", 860, 380, "execucao", "2026-11-14 09:00:00", None, 11),
 ("Calçada quebrada perto da UBS", "Placas de concreto soltas na frente da UBS, idosos tropeçam na entrada.", 5, "Av. das Palmeiras, 150", 220, 300, "triagem", "2026-11-03 10:20:00", None, 17),
 ("Buraco na Rua Aroeira", "Buraco médio que acumula água quando chove.", 1, "Rua Aroeira, 512", 140, 540, "concluido", "2026-10-28 14:00:00", "2026-10-31 16:30:00", 4),
 ("Lâmpada piscando na praça", "Uma das luminárias da praça fica piscando a noite toda.", 2, "Praça da Matriz", 470, 330, "concluido", "2026-11-02 20:10:00", "2026-11-07 11:00:00", 3),
 ("Árvore com cupim inclinada", "A árvore está inclinada sobre a casa e tem cupim no tronco.", 3, "Rua Quaresmeira, 88", 520, 590, "aberto", "2026-11-18 08:45:00", None, 5),
 ("Sofá abandonado no córrego", "Alguém jogou um sofá na margem do córrego, perto da ponte.", 4, "Margem do Córrego do Lajeado", 700, 545, "cancelado", "2026-11-05 17:00:00", None, 2),
 ("Bueiro sem tampa", "Bueiro aberto na esquina, risco para quem passa de bicicleta.", 1, "Rua Paineira x Rua Jacarandá", 380, 470, "aberto", "2026-11-18 18:20:00", None, 12),
 ("Rampa de acessibilidade quebrada", "A rampa da esquina está quebrada e cadeirantes não conseguem subir.", 5, "Rua Sibipiruna x Av. das Palmeiras", 620, 300, "aberto", "2026-11-11 11:10:00", None, 8),
 ("Cano estourado na calçada", "Cano da rede de água estourado, desperdício grande.", 6, "Rua Ipê Amarelo, 930", 930, 110, "concluido", "2026-11-10 06:50:00", "2026-11-13 09:15:00", 10),
 ("Rua inteira sem iluminação", "Toda a Rua Manacá ficou sem luz depois da tempestade.", 2, "Rua Manacá, 120", 860, 160, "triagem", "2026-11-17 21:00:00", None, 19),
 ("Mato alto no canteiro central", "O canteiro da avenida está com mato alto escondendo a placa de pare.", 3, "Av. das Palmeiras, 780", 780, 300, "execucao", "2026-11-06 13:30:00", None, 7),
 ("Pneus acumulando água", "Pilha de pneus velhos acumulando água parada, risco de dengue.", 4, "Rua Quaresmeira, 410", 300, 590, "concluido", "2026-11-08 09:40:00", "2026-11-10 15:00:00", 15),
]
seq = {"aberto": ["aberto"], "triagem": ["aberto", "triagem"], "execucao": ["aberto", "triagem", "execucao"],
       "concluido": ["aberto", "triagem", "execucao", "concluido"], "cancelado": ["aberto", "cancelado"]}
quem = {"aberto": "Morador", "triagem": "Marta Lins", "execucao": "Marta Lins", "concluido": "Paulo Reis", "cancelado": "Marta Lins"}
notas = {"aberto": "Chamado aberto pelo site.", "triagem": "Vistoria agendada.", "execucao": "Equipe enviada ao local.",
         "concluido": "Serviço finalizado e conferido.", "cancelado": "Responsabilidade da Defesa Civil, encaminhado por ofício."}
from datetime import datetime, timedelta
lista = []
for i, (t, d, c, rua, X, Y, st, ab, con, ap) in enumerate(CH, 1):
    x, y = px(X, Y)
    t0 = datetime.fromisoformat(ab); fim = datetime.fromisoformat(con) if con else None
    hist = []; prev = None
    passos = seq[st]
    for k, s in enumerate(passos):
        if s == "aberto": em = t0
        elif s == "concluido": em = fim
        else: em = t0 + timedelta(hours=6 * k + 2)
        hist.append({"de": prev, "para": s, "em": em.strftime("%Y-%m-%d %H:%M:%S"), "por": quem[s], "nota": notas[s]})
        prev = s
    lista.append({"id": i, "protocolo": f"ZB-2026-{i:04d}", "titulo": t, "descricao": d, "categoria_id": c, "rua": rua,
                  "x": x, "y": y, "foto": None, "status": st, "aberto_em": ab, "concluido_em": con,
                  "apoiadores": [f"seed{i:02d}{n:04d}" for n in range(ap)], "historico": hist})
hashes = subprocess.check_output(['php', '-r', 'echo password_hash("Zela@2026", PASSWORD_BCRYPT), "\n", password_hash("Zela@2026", PASSWORD_BCRYPT);']).decode().split()
users = [{"usuario": "marta", "nome": "Marta Lins", "senha_hash": hashes[0]}, {"usuario": "paulo", "nome": "Paulo Reis", "senha_hash": hashes[1]}]
os.makedirs(f'{OUT}/dados/seed', exist_ok=True)
for nome, dados in (("categorias", cats), ("chamados", lista), ("usuarios", users), ("tokens", [])):
    json.dump(dados, open(f'{OUT}/dados/seed/{nome}.json', 'w'), ensure_ascii=False, indent=2)
print(len(lista), 'chamados')
