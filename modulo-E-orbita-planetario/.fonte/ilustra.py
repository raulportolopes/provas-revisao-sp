# Ilustrações originais (SVG) para a prova Órbita. Gera HTML + jobs para render.js (Playwright -> JPG/PNG).
import json, random, sys, os
OUT = sys.argv[1]; TMP = sys.argv[2]
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

PAL = [
 ("#0B1030", "#7C3AED", "#F472B6", "#FDE68A"),  # 1 via láctea
 ("#0E1A3A", "#38BDF8", "#FDE047", "#F97316"),  # 2 infantil
 ("#07122B", "#2563EB", "#93C5FD", "#FFFFFF"),  # 3 céu de verão
 ("#05030D", "#F97316", "#FACC15", "#7C2D12"),  # 4 buraco negro
 ("#120A2A", "#A855F7", "#22D3EE", "#F0ABFC"),  # 5 sinfonia
 ("#1A0A07", "#EA580C", "#FDBA74", "#7F1D1D"),  # 6 marte
 ("#03141A", "#10B981", "#67E8F9", "#A78BFA"),  # 7 auroras
 ("#0A0A0A", "#FBBF24", "#FEF3C7", "#1F2937"),  # 8 eclipse
 ("#0B132B", "#14B8A6", "#F59E0B", "#E11D48"),  # 9 exoplanetas
 ("#140507", "#DC2626", "#FB923C", "#FDE68A"),  # 10 terror cósmico
 ("#0B1B12", "#84CC16", "#FDE68A", "#F97316"),  # 11 indígenas
 ("#12051F", "#EC4899", "#22D3EE", "#FDE047"),  # 12 rock
]

def estrelas(rnd, w, h, n):
    s = []
    for _ in range(n):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h); r = rnd.choice([0.6, 0.8, 1, 1.2, 1.6, 2.2])
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#fff" opacity="{rnd.uniform(.35, 1):.2f}"/>')
    return ''.join(s)

def cena(i, w, h, seed):
    rnd = random.Random(seed)
    bg, c1, c2, c3 = PAL[(i - 1) % len(PAL)]
    defs = f'''<defs>
<radialGradient id="neb1" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{c1}" stop-opacity=".85"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>
<radialGradient id="neb2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{c2}" stop-opacity=".7"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></radialGradient>
<radialGradient id="pl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="{c3}"/><stop offset=".55" stop-color="{c1}"/><stop offset="1" stop-color="{bg}"/></radialGradient>
<linearGradient id="chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{bg}" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="{w/30:.0f}"/></filter></defs>'''
    g = [f'<rect width="{w}" height="{h}" fill="{bg}"/>']
    for _ in range(4):
        cx, cy, r = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(w * .2, w * .45)
        g.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{r:.0f}" ry="{r*rnd.uniform(.4,.8):.0f}" fill="url(#neb{rnd.choice([1,2])})" filter="url(#blur)" transform="rotate({rnd.uniform(-40,40):.0f} {cx:.0f} {cy:.0f})"/>')
    g.append(estrelas(rnd, w, h, int(w * h / 2200)))
    tipo = i % 4
    px, py, pr = w * rnd.uniform(.55, .75), h * rnd.uniform(.35, .6), min(w, h) * rnd.uniform(.18, .3)
    if i == 4:  # buraco negro com disco
        g.append(f'<ellipse cx="{w/2}" cy="{h/2}" rx="{pr*2.2:.0f}" ry="{pr*.55:.0f}" fill="none" stroke="{c2}" stroke-width="{pr*.28:.0f}" opacity=".9" filter="url(#blur)"/>')
        g.append(f'<ellipse cx="{w/2}" cy="{h/2}" rx="{pr*1.9:.0f}" ry="{pr*.42:.0f}" fill="none" stroke="{c3}" stroke-width="{pr*.08:.0f}"/>')
        g.append(f'<circle cx="{w/2}" cy="{h/2}" r="{pr*.85:.0f}" fill="#000" stroke="{c1}" stroke-width="3"/>')
    elif i == 8:  # eclipse
        g.append(f'<circle cx="{w/2}" cy="{h/2}" r="{pr*1.25:.0f}" fill="{c2}" opacity=".35" filter="url(#blur)"/>')
        g.append(f'<circle cx="{w/2}" cy="{h/2}" r="{pr*1.02:.0f}" fill="none" stroke="{c1}" stroke-width="6"/>')
        g.append(f'<circle cx="{w/2}" cy="{h/2}" r="{pr:.0f}" fill="#020202"/>')
    elif i == 7:  # aurora
        for k in range(5):
            y0 = h * (.25 + k * .07)
            g.append(f'<path d="M0 {y0:.0f} C {w*.25:.0f} {y0-h*.25:.0f}, {w*.6:.0f} {y0+h*.2:.0f}, {w} {y0-h*.1:.0f}" stroke="{[c1,c2,c3][k%3]}" stroke-width="{h*.06:.0f}" fill="none" opacity=".45" filter="url(#blur)"/>')
        g.append(f'<path d="M0 {h*.82:.0f} L {w*.2:.0f} {h*.7:.0f} L {w*.35:.0f} {h*.78:.0f} L {w*.55:.0f} {h*.62:.0f} L {w*.75:.0f} {h*.76:.0f} L {w} {h*.68:.0f} L {w} {h} L 0 {h} Z" fill="#020617"/>')
    else:
        g.append(f'<circle cx="{px:.0f}" cy="{py:.0f}" r="{pr:.0f}" fill="url(#pl)"/>')
        if tipo in (1, 3):
            g.append(f'<ellipse cx="{px:.0f}" cy="{py:.0f}" rx="{pr*1.8:.0f}" ry="{pr*.35:.0f}" fill="none" stroke="{c3}" stroke-width="{pr*.09:.0f}" opacity=".75" transform="rotate(-18 {px:.0f} {py:.0f})"/>')
        lx, ly = w * rnd.uniform(.12, .3), h * rnd.uniform(.15, .35)
        g.append(f'<circle cx="{lx:.0f}" cy="{ly:.0f}" r="{pr*.22:.0f}" fill="{c2}" opacity=".9"/>')
    g.append(f'<rect width="{w}" height="{h}" fill="url(#chao)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{defs}{"".join(g)}</svg>'

jobs = []
def job(nome, svg, w, h, fmt='jpg'):
    p = f'{TMP}/{nome}.html'
    open(p, 'w').write(f'<!doctype html><html><body style="margin:0">{svg}</body></html>')
    jobs.append({"src": p, "out": f'{OUT}/{nome}.{fmt}', "w": w, "h": h, "q": 80, "transparent": fmt == 'png'})

for i in range(1, 13):
    job(f'programa-{i:02d}', cena(i, 800, 1000, i * 7), 800, 1000)
for k, i in enumerate([3, 1, 5, 2], 1):
    job(f'hero-{k}', cena(i, 1600, 720, i * 31), 1600, 720)

logo = '''<svg xmlns="http://www.w3.org/2000/svg" width="220" height="56" viewBox="0 0 220 56">
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs>
<circle cx="28" cy="28" r="13" fill="url(#g)"/>
<ellipse cx="28" cy="28" rx="25" ry="8" fill="none" stroke="#FBBF24" stroke-width="2.5" transform="rotate(-25 28 28)"/>
<text x="62" y="36" font-family="Inter Display, Inter, sans-serif" font-weight="700" font-size="26" fill="#F8FAFC" letter-spacing="1">ÓRBITA</text>
<text x="63" y="50" font-family="Inter, sans-serif" font-size="9.5" fill="#A5B4FC" letter-spacing="2.6">PLANETÁRIO PAULISTA</text></svg>'''
open(f'{OUT}/logo-orbita.svg', 'w').write(logo)
fav = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="#8B5CF6"/><ellipse cx="16" cy="16" rx="14" ry="4.5" fill="none" stroke="#FBBF24" stroke-width="2" transform="rotate(-25 16 16)"/></svg>'''
open(f'{OUT}/favicon.svg', 'w').write(fav)
json.dump(jobs, open(f'{TMP}/jobs.json', 'w'))
print(len(jobs), 'imagens')
