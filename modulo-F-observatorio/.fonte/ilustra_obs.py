# Gera as ilustrações originais do Observatório Estrela da Serra (SVG -> JPG/PNG via Playwright).
# Uso: python3 ilustra_obs.py <pasta_svg> <pasta_img>  -> grava jobs.json na pasta_svg
import json, math, os, random, sys

SVG, OUT = sys.argv[1], sys.argv[2]
os.makedirs(SVG, exist_ok=True); os.makedirs(OUT, exist_ok=True)
jobs = []

def page(name, w, h, body, ext='jpg', q=84, transparent=False):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>@font-face{{font-family:Oswald;font-weight:500;src:url(file:///home/user/rev/fonts/Oswald-Medium.woff2)}}html,body{{margin:0;background:{'transparent' if transparent else '#000'}}}svg{{display:block}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg></body></html>'''
    p = os.path.join(SVG, name + '.html'); open(p, 'w').write(html)
    jobs.append({'src': os.path.abspath(p), 'out': os.path.abspath(os.path.join(OUT, f'{name}.{ext}')), 'w': w, 'h': h, 'q': q, 'transparent': transparent})

def estrelas(r, w, h, n, rmin=.4, rmax=1.6, cor=('#ffffff', '#cfe0ff', '#ffe9c4'), op=(.35, 1)):
    s = []
    for _ in range(n):
        x, y = r.uniform(0, w), r.uniform(0, h); rr = r.uniform(rmin, rmax) ** 1.6
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.2f}" fill="{r.choice(cor)}" opacity="{r.uniform(*op):.2f}"/>')
    return ''.join(s)

def brilho(x, y, r_, cor='#fff'):
    return (f'<circle cx="{x}" cy="{y}" r="{r_*6}" fill="url(#halo)" opacity=".55"/>'
            f'<path d="M{x-r_*7} {y}H{x+r_*7}M{x} {y-r_*7}V{y+r_*7}" stroke="{cor}" stroke-width="{max(.6, r_*.35)}" opacity=".7"/>'
            f'<circle cx="{x}" cy="{y}" r="{r_}" fill="{cor}"/>')

DEFS = '''<defs>
<radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#bcd2ff" stop-opacity=".35"/><stop offset="1" stop-color="#bcd2ff" stop-opacity="0"/></radialGradient>
<filter id="b40"><feGaussianBlur stdDeviation="40"/></filter><filter id="b90"><feGaussianBlur stdDeviation="90"/></filter>
<filter id="b12"><feGaussianBlur stdDeviation="12"/></filter><filter id="b4"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="ruido"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .95  0 0 0 1.6 -.75"/><feGaussianBlur stdDeviation="2"/></filter>
<filter id="ruido2"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="5" seed="3"/><feColorMatrix values="0 0 0 0 .95  0 0 0 0 .55  0 0 0 0 .7  0 0 0 1.8 -.9"/></filter>
</defs>'''

def serra(w, h, base, cor='#05070f', seed=1, amp=120):
    r = random.Random(seed); pts = []; x = 0; y = base
    while x <= w:
        pts.append(f'{x:.0f},{y:.0f}'); x += r.uniform(40, 120); y = base + r.uniform(-amp, amp * .35)
    pts.append(f'{w},{base}')
    return f'<polygon points="0,{h} {" ".join(pts)} {w},{h}" fill="{cor}"/>'

def cupula(x, y, s=1, cor='#05070f'):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="{cor}"><rect x="-70" y="-10" width="140" height="90"/>'
            f'<path d="M-80 -8 A80 80 0 0 1 80 -8Z"/><rect x="-10" y="-88" width="20" height="80" fill="#1d2550"/>'
            f'<rect x="-120" y="40" width="240" height="60"/></g>')

def ceu(w, h, seed, via=True, poluicao=False, n=1400):
    r = random.Random(seed)
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#050817"/>'
    b += f'<rect width="{w}" height="{h}" fill="#0d1440" opacity=".55" filter="url(#b90)"/>'
    if via:
        b += (f'<g transform="rotate(-24 {w/2} {h/2})"><ellipse cx="{w/2}" cy="{h/2}" rx="{w*.8}" ry="{h*.16}" fill="#6d5fd8" opacity=".22" filter="url(#b90)"/>'
              f'<ellipse cx="{w/2}" cy="{h/2}" rx="{w*.7}" ry="{h*.08}" fill="#f2d7ff" opacity=".18" filter="url(#b40)"/>'
              f'<mask id="mv{seed}"><ellipse cx="{w/2}" cy="{h/2}" rx="{w*.75}" ry="{h*.1}" fill="#fff" filter="url(#b40)"/></mask><rect x="{-w*.2}" y="{h/2-h*.14}" width="{w*1.4}" height="{h*.28}" filter="url(#ruido)" opacity=".55" mask="url(#mv{seed})"/>'
              f'<ellipse cx="{w/2}" cy="{h/2+10}" rx="{w*.6}" ry="{h*.018}" fill="#1a0f2e" opacity=".65" filter="url(#b12)"/></g>')
        b += f'<g transform="rotate(-24 {w/2} {h/2}) translate({-w*.1:.0f} {h*.35:.0f})">' + estrelas(r, w * 1.2, h * .3, n // 2, .3, 1.1) + '</g>'
    if poluicao:
        b += f'<rect width="{w}" height="{h}" fill="#3a2a1e" opacity=".55"/><ellipse cx="{w/2}" cy="{h}" rx="{w*.9}" ry="{h*.7}" fill="#f29a4a" opacity=".55" filter="url(#b90)"/>'
        b += estrelas(r, w, h * .7, 40, .6, 1.5, op=(.5, .9))
    else:
        b += estrelas(r, w, h, n)
        for _ in range(14):
            b += brilho(r.uniform(0, w), r.uniform(0, h * .75), r.uniform(1.2, 2.4))
    return b

# ---------- hero ----------
W, H = 2400, 1350
b = ceu(W, H, 11, n=2200)
b += serra(W, H, 1150, '#0a0f24', 4, 90) + serra(W, H, 1230, '#04060d', 9, 70) + cupula(1840, 1150, 1.1, '#04060d')
page('hero-ceu', W, H, b, q=80)

# camada de constelações (PNG transparente) que a "lanterna" revela
CONST = {
    'Órion': [(560, 380), (640, 420), (720, 460), (520, 220), (780, 250), (500, 640), (800, 650)],
    'Escorpião': [(1500, 300), (1560, 360), (1600, 450), (1640, 560), (1700, 650), (1800, 700), (1880, 660), (1910, 590)],
    'Cruzeiro do Sul': [(1160, 820), (1180, 1010), (1090, 910), (1260, 900), (1210, 960)],
    'Plêiades': [(1020, 260), (1050, 240), (1065, 275), (1090, 255), (1040, 290), (1075, 300)],
}
LIG = {'Órion': [(3, 0), (0, 1), (1, 2), (2, 4), (3, 4), (0, 5), (2, 6)], 'Escorpião': [(i, i + 1) for i in range(7)],
       'Cruzeiro do Sul': [(0, 1), (2, 3)], 'Plêiades': [(0, 1), (1, 3), (1, 2), (2, 4), (2, 5)]}
b = DEFS
for nome, pts in CONST.items():
    for a, c in LIG[nome]:
        (x1, y1), (x2, y2) = pts[a], pts[c]
        b += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#7ee7d8" stroke-width="2.4" stroke-opacity=".85" stroke-dasharray="10 7"/>'
    for x, y in pts:
        b += brilho(x, y, 3.2, '#ffffff')
    lx = sum(p[0] for p in pts) / len(pts); ly = max(p[1] for p in pts) + 70
    b += f'<text x="{lx:.0f}" y="{ly:.0f}" text-anchor="middle" font-family="Oswald" font-weight="500" font-size="34" letter-spacing="6" fill="#f6b54a">{nome.upper()}</text>'
page('hero-constelacoes', W, H, b, 'png', transparent=True)

# ---------- planetas ----------
PLAN = {
    'mercurio': ('#9b9187', '#5f5852', []),
    'venus': ('#f1d29a', '#b98a4a', [('#e8c07e', .5)]),
    'terra': ('#3a7bd5', '#163a7a', []),
    'marte': ('#d36a3a', '#7a2d14', [('#b9522a', .4)]),
    'jupiter': ('#e2b98c', '#8c5a32', [('#c98c5a', .7), ('#f3dcc0', .6), ('#a0603a', .7), ('#efd2ab', .5), ('#b8764a', .6)]),
    'saturno': ('#ecd6a3', '#9b7a44', [('#d9b77a', .5), ('#f5e6c2', .5)]),
}
for k, (c1, c2, faixas) in PLAN.items():
    S = 640; cx = cy = S / 2; R = 230 if k != 'saturno' else 175
    r = random.Random(k)
    b = (f'<defs><radialGradient id="g" cx=".35" cy=".32" r=".8"><stop offset="0" stop-color="{c1}"/><stop offset=".7" stop-color="{c2}"/><stop offset="1" stop-color="#05040a"/></radialGradient>'
         f'<radialGradient id="atm" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="{c1}" stop-opacity="0"/><stop offset=".95" stop-color="{c1}" stop-opacity=".45"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>'
         f'<clipPath id="c"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath><filter id="bl"><feGaussianBlur stdDeviation="6"/></filter>'
         f'<radialGradient id="sombra" cx=".8" cy=".8" r=".9"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient></defs>')
    if k == 'saturno':
        b += f'<g transform="rotate(-18 {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="300" ry="70" fill="none" stroke="#cdb17a" stroke-width="26" opacity=".75"/><ellipse cx="{cx}" cy="{cy}" rx="262" ry="58" fill="none" stroke="#e9d6a9" stroke-width="12" opacity=".6"/></g>'
    b += f'<circle cx="{cx}" cy="{cy}" r="{R+22}" fill="url(#atm)"/><circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#g)"/>'
    g = f'<g clip-path="url(#c)" filter="url(#bl)">'
    y = cy - R
    for cor, op in faixas * 3:
        hgt = r.uniform(18, 48); g += f'<rect x="{cx-R}" y="{y:.0f}" width="{2*R}" height="{hgt:.0f}" fill="{cor}" opacity="{op*.6:.2f}"/>'; y += hgt + r.uniform(4, 30)
    if k == 'terra':
        for _ in range(9):
            g += f'<ellipse cx="{r.uniform(cx-R, cx+R):.0f}" cy="{r.uniform(cy-R, cy+R):.0f}" rx="{r.uniform(30, 90):.0f}" ry="{r.uniform(20, 60):.0f}" fill="#3f8f4a" opacity=".9"/>'
        for _ in range(10):
            g += f'<ellipse cx="{r.uniform(cx-R, cx+R):.0f}" cy="{r.uniform(cy-R, cy+R):.0f}" rx="{r.uniform(40, 110):.0f}" ry="{r.uniform(6, 16):.0f}" fill="#fff" opacity=".55"/>'
    if k in ('mercurio', 'marte'):
        for _ in range(26):
            rr = r.uniform(6, 26); g += f'<circle cx="{r.uniform(cx-R, cx+R):.0f}" cy="{r.uniform(cy-R, cy+R):.0f}" r="{rr:.0f}" fill="#000" opacity=".18"/>'
    if k == 'jupiter':
        g += f'<ellipse cx="{cx+60}" cy="{cy+60}" rx="44" ry="26" fill="#b4472a" opacity=".9"/>'
    g += '</g>'
    b += g + f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#sombra)"/>'
    if k == 'saturno':
        b += f'<g transform="rotate(-18 {cx} {cy})"><path d="M{cx-300} {cy} A300 70 0 0 0 {cx+300} {cy}" fill="none" stroke="#cdb17a" stroke-width="26" opacity=".85"/><path d="M{cx-262} {cy} A262 58 0 0 0 {cx+262} {cy}" fill="none" stroke="#e9d6a9" stroke-width="12" opacity=".7"/></g>'
    page(f'planeta-{k}', S, S, b, 'png', transparent=True)

# ---------- galeria (astrofotografias ilustradas) ----------
def nebulosa(seed, c1, c2, c3):
    r = random.Random(seed); w, h = 1600, 1067
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#04050d"/>'
    for _ in range(7):
        b += f'<ellipse cx="{r.uniform(300,1300):.0f}" cy="{r.uniform(200,860):.0f}" rx="{r.uniform(160,480):.0f}" ry="{r.uniform(120,360):.0f}" fill="{r.choice((c1,c2,c3))}" opacity="{r.uniform(.25,.55):.2f}" filter="url(#b90)" transform="rotate({r.uniform(-40,40):.0f} 800 530)"/>'
    b += f'<rect width="{w}" height="{h}" filter="url(#ruido2)" opacity=".5"/>'
    b += estrelas(r, w, h, 900, .3, 1.5)
    for _ in range(9): b += brilho(r.uniform(0, w), r.uniform(0, h), r.uniform(1.4, 3))
    return w, h, b

def galaxia(seed):
    r = random.Random(seed); w, h = 1600, 1067; cx, cy = 800, 530
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#03040a"/>' + estrelas(r, w, h, 700)
    g = ''
    for i in range(1400):
        t = r.uniform(0, 4 * math.pi); braco = r.choice((0, math.pi)); rad = 18 + t * 55 + r.gauss(0, 18)
        x = cx + rad * math.cos(t + braco); y = cy + rad * math.sin(t + braco) * .42
        g += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r.uniform(.6,2.4):.1f}" fill="{r.choice(("#cfe0ff","#ffd9f2","#fff2cf","#a9c1ff"))}" opacity="{r.uniform(.3,.9):.2f}"/>'
    b += f'<g transform="rotate(-20 {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="520" ry="200" fill="#6c63d9" opacity=".25" filter="url(#b40)"/>{g}<ellipse cx="{cx}" cy="{cy}" rx="90" ry="44" fill="#fff4d6" opacity=".9" filter="url(#b12)"/></g>'
    return w, h, b

def lua(seed):
    r = random.Random(seed); w, h = 1600, 1067
    b = DEFS + f'<defs><radialGradient id="lu" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#f4f1e6"/><stop offset=".8" stop-color="#bdb8aa"/><stop offset="1" stop-color="#6f6b62"/></radialGradient><clipPath id="lc"><circle cx="800" cy="533" r="380"/></clipPath></defs>'
    b += f'<rect width="{w}" height="{h}" fill="#020309"/>' + estrelas(r, w, h, 120, .3, 1)
    b += '<circle cx="800" cy="533" r="420" fill="#c8d4ff" opacity=".12" filter="url(#b40)"/><circle cx="800" cy="533" r="380" fill="url(#lu)"/><g clip-path="url(#lc)">'
    for _ in range(12): b += f'<ellipse cx="{r.uniform(480,1120):.0f}" cy="{r.uniform(220,850):.0f}" rx="{r.uniform(40,150):.0f}" ry="{r.uniform(30,110):.0f}" fill="#7b776d" opacity=".35" filter="url(#b12)"/>'
    for _ in range(60):
        cr = r.uniform(4, 26); x, y = r.uniform(440, 1160), r.uniform(170, 900)
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{cr:.0f}" fill="none" stroke="#fffdf4" stroke-opacity=".35" stroke-width="2"/><circle cx="{x+2:.0f}" cy="{y+2:.0f}" r="{cr*.8:.0f}" fill="#000" opacity=".12"/>'
    b += '<circle cx="1010" cy="533" r="400" fill="#000" opacity=".6" filter="url(#b40)"/></g>'
    return w, h, b

def rastros(seed):
    r = random.Random(seed); w, h = 1600, 1067; cx, cy = 820, 760
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#060a1f"/><rect width="{w}" height="{h}" fill="#1b2a6b" opacity=".4" filter="url(#b90)"/>'
    for _ in range(420):
        rad = r.uniform(10, 1100); a0 = r.uniform(0, 2 * math.pi); a1 = a0 + .55
        x0, y0 = cx + rad * math.cos(a0), cy + rad * math.sin(a0); x1, y1 = cx + rad * math.cos(a1), cy + rad * math.sin(a1)
        b += f'<path d="M{x0:.0f} {y0:.0f} A{rad:.0f} {rad:.0f} 0 0 1 {x1:.0f} {y1:.0f}" fill="none" stroke="{r.choice(("#cfe0ff","#ffe1b8","#fff","#b9a8ff"))}" stroke-width="{r.uniform(.6,2.2):.1f}" opacity="{r.uniform(.3,.9):.2f}"/>'
    b += serra(w, h, 930, '#020308', 21, 60) + cupula(420, 930, .9, '#020308')
    return w, h, b

def cometa(seed):
    r = random.Random(seed); w, h = 1600, 1067
    b = ceu(w, h, seed, via=False, n=900)
    b += '<g transform="rotate(-28 980 420)"><ellipse cx="640" cy="420" rx="420" ry="34" fill="#9ff5e6" opacity=".35" filter="url(#b40)"/><ellipse cx="700" cy="410" rx="360" ry="14" fill="#e6fffb" opacity=".45" filter="url(#b12)"/><ellipse cx="620" cy="450" rx="380" ry="40" fill="#b9a8ff" opacity=".18" filter="url(#b40)"/><circle cx="1040" cy="420" r="16" fill="#fff" filter="url(#b4)"/><circle cx="1040" cy="420" r="60" fill="#bffaf0" opacity=".4" filter="url(#b12)"/></g>'
    b += serra(w, h, 960, '#03050c', 31, 70)
    return w, h, b

def eclipse(seed):
    r = random.Random(seed); w, h = 1600, 1067
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#01020a"/>' + estrelas(r, w, h, 200, .3, 1)
    b += '<circle cx="800" cy="533" r="300" fill="#fff3d6" opacity=".35" filter="url(#b90)"/><circle cx="800" cy="533" r="240" fill="#ffe7b0" opacity=".55" filter="url(#b40)"/><circle cx="800" cy="533" r="206" fill="#fffaf0" filter="url(#b4)"/><circle cx="800" cy="533" r="200" fill="#02030a"/>'
    b += '<circle cx="985" cy="460" r="10" fill="#ff7a6b" filter="url(#b4)"/><circle cx="640" cy="640" r="7" fill="#ff7a6b" filter="url(#b4)"/>'
    return w, h, b

def aglomerado(seed):
    r = random.Random(seed); w, h = 1600, 1067
    b = DEFS + f'<rect width="{w}" height="{h}" fill="#03040b"/>' + estrelas(r, w, h, 700)
    b += '<circle cx="800" cy="520" r="360" fill="#ffe6b5" opacity=".14" filter="url(#b90)"/>'
    for _ in range(1600):
        rad = abs(r.gauss(0, 150)); a = r.uniform(0, 2 * math.pi)
        b += f'<circle cx="{800+rad*math.cos(a):.1f}" cy="{520+rad*math.sin(a):.1f}" r="{r.uniform(.5,2.2):.1f}" fill="{r.choice(("#fff2d1","#ffd9a8","#ffffff","#cfe0ff"))}" opacity="{r.uniform(.4,1):.2f}"/>'
    return w, h, b

GAL = [
    ('foto-nebulosa-carina', nebulosa(1, '#d1477a', '#f39c4a', '#5b6cff')),
    ('foto-galaxia-espiral', galaxia(2)),
    ('foto-lua-gibosa', lua(3)),
    ('foto-rastros-estelares', rastros(4)),
    ('foto-cometa', cometa(5)),
    ('foto-nebulosa-laguna', nebulosa(6, '#ff5f8f', '#9b5cff', '#46d6c8')),
    ('foto-eclipse-total', eclipse(7)),
    ('foto-aglomerado-globular', aglomerado(8)),
    ('foto-via-lactea', (1600, 1067, ceu(1600, 1067, 9, n=1600) + serra(1600, 1067, 960, '#03050c', 41, 80))),
]
for nome, (w, h, b) in GAL:
    page(nome, w, h, b, q=82)

# comparador: mesmo céu com e sem poluição luminosa
W2, H2 = 1600, 900
base = serra(W2, H2, 760, '#0b0d18', 51, 70)
cidade = ''.join(f'<rect x="{x}" y="{760-hh}" width="{ww}" height="{hh}" fill="#0b0d18"/>' + ''.join(
    f'<rect x="{x+6+j*14}" y="{760-hh+10+i*18}" width="7" height="9" fill="#ffcf7a" opacity=".85"/>' for i in range(hh // 22) for j in range(ww // 16) if (i * 7 + j * 3 + x) % 5 < 2)
    for x, ww, hh in [(80, 90, 160), (190, 70, 230), (280, 120, 120), (420, 80, 280), (520, 110, 190), (1100, 90, 210), (1210, 130, 150), (1360, 80, 250), (1450, 120, 170)])
page('ceu-cidade', W2, H2, ceu(W2, H2, 61, via=False, poluicao=True) + base + cidade, q=82)
page('ceu-serra', W2, H2, ceu(W2, H2, 61, n=1800) + base + cupula(1250, 760, .8, '#0b0d18'), q=82)

# textura do bloco de reserva / rodapé
page('nebulosa-fundo', 1920, 700, nebulosa(77, '#6c4cf1', '#2b8fd6', '#d1477a')[2].replace('width="1600" height="1067"', 'width="1920" height="700"'), q=78)

json.dump(jobs, open(os.path.join(SVG, 'jobs.json'), 'w'))
print(len(jobs), 'imagens')
