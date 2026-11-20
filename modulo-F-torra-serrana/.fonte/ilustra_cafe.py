# Ilustrações originais da Torra Serrana (SVG -> JPG/PNG via Playwright). Uso: python3 ilustra_cafe.py <svg> <img>
import json, math, os, random, sys
SVG, OUT = sys.argv[1], sys.argv[2]
os.makedirs(SVG, exist_ok=True); os.makedirs(OUT, exist_ok=True)
jobs = []
FONTES = ('@font-face{font-family:Caladea;font-weight:700;src:url(file:///home/user/rev/fonts/Caladea-Bold.woff2)}'
          '@font-face{font-family:Caladea;font-style:italic;src:url(file:///home/user/rev/fonts/Caladea-Italic.woff2)}'
          '@font-face{font-family:Inter;font-weight:600;src:url(file:///usr/share/fonts/opentype/inter/Inter-SemiBold.otf)}')

def page(name, w, h, body, ext='jpg', q=84, transparent=False):
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{FONTES}html,body{{margin:0;background:{"transparent" if transparent else "#fff"}}}svg{{display:block}}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg></body></html>'
    p = os.path.join(SVG, name + '.html'); open(p, 'w').write(html)
    jobs.append({'src': os.path.abspath(p), 'out': os.path.abspath(os.path.join(OUT, f'{name}.{ext}')), 'w': w, 'h': h, 'q': q, 'transparent': transparent})

DEFS = '''<defs><filter id="b30"><feGaussianBlur stdDeviation="30"/></filter><filter id="b8"><feGaussianBlur stdDeviation="8"/></filter><filter id="b3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="papel"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .28  0 0 0 0 .18  0 0 0 .18 0"/></filter>
<filter id="madeira"><feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .32  0 0 0 0 .19  0 0 0 0 .11  0 0 0 .55 0"/></filter>
<radialGradient id="cafe" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#8a4f2a"/><stop offset=".55" stop-color="#4a2614"/><stop offset="1" stop-color="#2a140a"/></radialGradient>
<radialGradient id="crema" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#e2b07a"/><stop offset=".7" stop-color="#b9763f"/><stop offset="1" stop-color="#7a4422"/></radialGradient>
<linearGradient id="xic" x1="0" x2="1"><stop offset="0" stop-color="#f2ece4"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d0c4"/></linearGradient></defs>'''

def grao(x, y, s, rot, cor='#5a2f17'):
    return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot:.0f}) scale({s:.2f})"><ellipse rx="22" ry="15" fill="{cor}"/>'
            f'<ellipse rx="20" ry="13" cx="-2" cy="-2" fill="#7b4424" opacity=".55"/><path d="M-18 0 C -6 -6, 6 6, 18 0" stroke="#2a140a" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>')

def graos(r, n, w, h, area=None):
    s = ''
    for _ in range(n):
        x, y = (r.uniform(*area[0]), r.uniform(*area[1])) if area else (r.uniform(0, w), r.uniform(0, h))
        s += grao(x, y, r.uniform(.9, 1.5), r.uniform(0, 360), r.choice(('#4a2614', '#5a2f17', '#3b1d0e', '#6b3a1d')))
    return s

def xicara_lado(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="190" rx="250" ry="40" fill="#000" opacity=".25" filter="url(#b8)"/>'
            f'<ellipse cx="0" cy="175" rx="230" ry="38" fill="url(#xic)"/>'
            f'<path d="M-170 0 L170 0 C 165 110, 120 170, 0 170 C -120 170, -165 110, -170 0Z" fill="url(#xic)"/>'
            f'<path d="M165 30 C 245 25, 250 120, 150 125" stroke="#e9e1d6" stroke-width="26" fill="none"/>'
            f'<ellipse cx="0" cy="0" rx="170" ry="36" fill="#f6f1ea"/><ellipse cx="0" cy="4" rx="152" ry="28" fill="url(#crema)"/>'
            f'<path d="M-60 6 C -20 -10, 30 18, 60 2" stroke="#f1d1a6" stroke-width="5" fill="none" opacity=".7"/>'
            f'<path d="M-150 30 C -140 90, -100 140, -40 160" stroke="#fff" stroke-width="10" fill="none" opacity=".6"/></g>')

# HERO: xícara sobre mesa de madeira, grãos espalhados, fundo escuro aconchegante
W, H = 2400, 1400; r = random.Random(1)
b = DEFS + f'<rect width="{W}" height="{H}" fill="#2a1a12"/><rect width="{W}" height="{H}" filter="url(#madeira)"/>'
b += f'<ellipse cx="1700" cy="500" rx="900" ry="600" fill="#c2562b" opacity=".25" filter="url(#b30)"/>'
b += graos(r, 70, W, H, ((1200, 2380), (900, 1380))) + graos(r, 25, W, H, ((1900, 2380), (80, 700)))
b += f'<rect width="{W}" height="{H}" filter="url(#papel)" opacity=".5"/>'
page('hero-fundo', W, H, b, q=80)
page('xicara', 760, 520, DEFS + xicara_lado(370, 250, 1.25), 'png', transparent=True)

# PACOTES DE CAFÉ (PNG transparente 600x760)
CAFES = [('mantiqueira-amarelo', 'Mantiqueira', 'Amarelo', '#E3A72F'), ('pedra-bela', 'Pedra Bela', 'Natural', '#C2562B'),
         ('sitio-aurora', 'Sítio Aurora', 'Cereja descascado', '#3F6B4A'), ('vale-do-garcia', 'Vale do Garcia', 'Fermentado', '#7B3F8C'),
         ('mogiana-classico', 'Mogiana Clássico', 'Natural', '#8B5A2B'), ('cerrado-noturno', 'Cerrado Noturno', 'Natural', '#22344F'),
         ('alta-paulista', 'Alta Paulista', 'Lavado', '#2F7F86'), ('descafeinado-serra', 'Descafeinado', 'Processo suíço', '#6B6B6B')]
for slug, nome, proc, cor in CAFES:
    w, h = 600, 760
    b = DEFS + (f'<ellipse cx="300" cy="730" rx="220" ry="22" fill="#000" opacity=".25" filter="url(#b8)"/>'
                f'<path d="M110 120 L490 120 L520 700 Q300 730 80 700 Z" fill="#b98a5c"/>'
                f'<clipPath id="saco"><path d="M110 120 L490 120 L520 700 Q300 730 80 700 Z"/></clipPath><rect width="600" height="760" filter="url(#papel)" opacity=".9" clip-path="url(#saco)"/>'
                f'<path d="M100 60 L500 60 L490 130 L110 130 Z" fill="#a67a4f"/><path d="M100 60 L500 60" stroke="#8a6440" stroke-width="10"/>'
                f'<g stroke="#8a6440" stroke-width="3" opacity=".6"><path d="M130 80 V115M160 80 V115M190 80 V115M220 80 V115M250 80 V115M280 80 V115M310 80 V115M340 80 V115M370 80 V115M400 80 V115M430 80 V115M460 80 V115"/></g>'
                f'<rect x="150" y="250" width="300" height="330" rx="18" fill="{cor}"/>'
                f'<rect x="166" y="266" width="268" height="298" rx="12" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>'
                f'<text x="300" y="320" text-anchor="middle" font-family="Inter" font-weight="600" font-size="17" letter-spacing="5" fill="#fff" opacity=".85">TORRA SERRANA</text>'
                f'<path d="M230 345 H370" stroke="#fff" stroke-opacity=".5"/>'
                f'<text x="300" y="{410 if len(nome) < 13 else 400}" text-anchor="middle" font-family="Caladea" font-weight="700" font-size="{44 if len(nome) < 13 else 36}" fill="#fff">{nome}</text>'
                f'<text x="300" y="460" text-anchor="middle" font-family="Caladea" font-style="italic" font-size="26" fill="#fff" opacity=".9">{proc}</text>'
                f'<g transform="translate(300 520)" fill="#fff" opacity=".9">{grao(0, 0, .9, 30, "#fff").replace("#7b4424", "#fff").replace("#2a140a", cor)}</g>'
                f'<text x="300" y="660" text-anchor="middle" font-family="Inter" font-weight="600" font-size="20" fill="#5a3b22">250 g · grãos</text>'
                f'<path d="M110 120 L130 690" stroke="#fff" stroke-width="8" opacity=".15"/>')
    page(f'cafe-{slug}', w, h, b, 'png', transparent=True)

# ETAPAS "do pé à xícara" (900x600)
def cena(fundo, corpo): return DEFS + f'<rect width="900" height="600" fill="{fundo}"/>' + corpo + '<rect width="900" height="600" filter="url(#papel)" opacity=".6"/>'
r = random.Random(5)
morros = '<path d="M0 360 C 200 250, 380 330, 520 270 S 820 240, 900 300 V600 H0Z" fill="#6f9b5f"/><path d="M0 430 C 220 360, 420 450, 620 380 S 860 380, 900 400 V600 H0Z" fill="#4f7d45"/>'
fileiras = ''.join(f'<path d="M-20 {470+i*34} C 300 {440+i*34}, 600 {500+i*34}, 920 {460+i*34}" stroke="#2f5a32" stroke-width="16" fill="none" stroke-dasharray="6 14" stroke-linecap="round"/>' for i in range(5))
pe = ''.join(f'<circle cx="{r.uniform(560,820):.0f}" cy="{r.uniform(120,330):.0f}" r="{r.uniform(8,13):.0f}" fill="{r.choice(("#c0392b","#d9482f","#e8a33d","#a52a1f"))}"/>' for _ in range(26))
galhos = '<path d="M690 40 C 640 160, 700 260, 650 380" stroke="#5b3a1e" stroke-width="16" fill="none"/>' + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="70" ry="24" fill="#3f6b4a" transform="rotate({a} {x} {y})"/>' for x, y, a in [(600, 110, -20), (780, 150, 25), (590, 260, -30), (790, 300, 20), (700, 70, 5)])
page('etapa-colheita', 900, 600, cena('#f3d9a6', '<circle cx="180" cy="140" r="70" fill="#f6b54a"/>' + morros + fileiras + galhos + pe))
terreiro = '<rect x="0" y="300" width="900" height="300" fill="#d8c6a8"/>' + ''.join(f'<circle cx="{r.uniform(20,880):.0f}" cy="{r.uniform(330,590):.0f}" r="{r.uniform(5,8):.0f}" fill="{r.choice(("#7a2d1c","#8e3b22","#a0522d","#5e2a17"))}"/>' for _ in range(700))
rodo = '<path d="M520 200 L640 470" stroke="#6b4a2a" stroke-width="12"/><rect x="590" y="460" width="120" height="22" rx="6" fill="#6b4a2a" transform="rotate(-25 650 470)"/>'
page('etapa-secagem', 900, 600, cena('#bfe0f0', '<circle cx="740" cy="110" r="60" fill="#f6c34a"/>' + '<path d="M0 300 C 200 230, 500 280, 900 220 V300 H0Z" fill="#7aa06a"/>' + terreiro + rodo))
torrador = ('<rect x="0" y="420" width="900" height="180" fill="#3a2a20"/><rect x="250" y="170" width="380" height="250" rx="30" fill="#2b2b2b"/><circle cx="440" cy="295" r="95" fill="#3d3d3d" stroke="#c9a46a" stroke-width="10"/>'
            '<circle cx="440" cy="295" r="60" fill="#1c1c1c"/><rect x="590" y="120" width="40" height="70" fill="#2b2b2b"/><rect x="420" y="80" width="60" height="100" fill="#3d3d3d"/><path d="M380 80 L520 80 L480 30 L420 30Z" fill="#c9a46a"/>'
            '<ellipse cx="440" cy="470" rx="250" ry="40" fill="#6b4a2a"/>' + ''.join(grao(r.uniform(260, 620), r.uniform(450, 490), .55, r.uniform(0, 360)) for _ in range(60)) +
            '<path d="M640 160 C 700 120, 660 80, 720 40" stroke="#bbb" stroke-width="10" fill="none" opacity=".5" filter="url(#b3)"/>')
page('etapa-torra', 900, 600, cena('#e9d8c4', torrador))
page('etapa-xicara', 900, 600, cena('#c2562b', '<ellipse cx="450" cy="560" rx="500" ry="120" fill="#8f3a1a"/>' + xicara_lado(450, 330, .9) + graos(r, 14, 900, 600, ((60, 260), (460, 580))) + graos(r, 10, 900, 600, ((640, 860), (470, 580)))))

# MÉTODOS DE PREPARO (PNG transparente 500x500, traço chapado)
CORP = '#2B1A12'
MET = {
 'v60': '<path d="M130 120 H370 L285 300 H215Z" fill="#E8DCCB" stroke="%s" stroke-width="8"/><path d="M160 140 L230 290M200 140 L245 290M300 140 L255 290M340 140 L270 290" stroke="#c9b79c" stroke-width="5"/><rect x="190" y="300" width="120" height="18" rx="6" fill="%s"/><path d="M160 318 H340 L320 440 H180Z" fill="#fff" stroke="%s" stroke-width="8"/><path d="M185 400 H315 L310 435 H190Z" fill="#6b3a1d"/>',
 'prensa': '<rect x="170" y="140" width="160" height="290" rx="12" fill="#f4eee6" stroke="%s" stroke-width="8"/><rect x="178" y="250" width="144" height="172" fill="#6b3a1d"/><rect x="178" y="236" width="144" height="16" fill="#c9a46a"/><path d="M250 60 V236" stroke="%s" stroke-width="10"/><circle cx="250" cy="56" r="16" fill="%s"/><path d="M330 190 C 400 190, 400 360, 330 360" stroke="%s" stroke-width="16" fill="none"/><rect x="160" y="128" width="180" height="20" rx="6" fill="%s"/>',
 'moka': '<path d="M175 270 L325 270 L355 440 H145Z" fill="#b8b8b8" stroke="%s" stroke-width="8"/><path d="M185 260 L210 140 H290 L315 260Z" fill="#cfcfcf" stroke="%s" stroke-width="8"/><path d="M205 140 L190 110 H310 L295 140Z" fill="#9a9a9a" stroke="%s" stroke-width="8"/><path d="M315 160 C 380 170, 390 240, 330 250" stroke="%s" stroke-width="16" fill="none"/><path d="M190 120 L150 105" stroke="%s" stroke-width="10"/><rect x="160" y="262" width="180" height="16" fill="%s"/>',
 'aeropress': '<rect x="190" y="90" width="120" height="250" rx="10" fill="#e0e6ea" stroke="%s" stroke-width="8"/><rect x="200" y="60" width="100" height="40" rx="8" fill="#9aa7b0" stroke="%s" stroke-width="8"/><rect x="198" y="230" width="104" height="104" fill="#6b3a1d"/><rect x="170" y="340" width="160" height="22" rx="8" fill="%s"/><path d="M180 362 H320 L305 450 H195Z" fill="#fff" stroke="%s" stroke-width="8"/><path d="M200 420 H300 L297 445 H203Z" fill="#6b3a1d"/>',
}
for k, v in MET.items():
    page(f'metodo-{k}', 500, 500, '<circle cx="250" cy="260" r="220" fill="#F1E3CF"/>' + v.replace('%s', CORP), 'png', transparent=True)

# fundo da chamada (grãos sobre terracota)
r = random.Random(8)
page('graos-fundo', 1920, 640, DEFS + '<rect width="1920" height="640" fill="#2B1A12"/>' + graos(r, 220, 1920, 640) + '<rect width="1920" height="640" fill="#2B1A12" opacity=".35"/>', q=78)

json.dump(jobs, open(os.path.join(SVG, 'jobs.json'), 'w'))
print(len(jobs), 'imagens')
