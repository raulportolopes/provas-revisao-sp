# Ilustrações originais (SVG -> JPG) da prova Estúdio Pulso: retratos estilizados dos professores e hero.
import json, sys, os
OUT = sys.argv[1]; TMP = sys.argv[2]
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
jobs = []
def job(nome, svg, w, h):
    p = f'{TMP}/{nome}.html'
    open(p, 'w').write(f'<!doctype html><html><body style="margin:0">{svg}</body></html>')
    jobs.append({"src": p, "out": f'{OUT}/{nome}.jpg', "w": w, "h": h, "q": 82})

PROFS = [  # cor de fundo 1, cor 2, pele, cabelo, roupa, tipo de cabelo
 ("#F43F5E", "#7F1D1D", "#C68863", "#2B1A12", "#111827", "rabo"),
 ("#14B8A6", "#134E4A", "#E0B48C", "#111111", "#F8FAFC", "curto"),
 ("#8B5CF6", "#3B0764", "#F1C7A5", "#7C4A21", "#1E1B4B", "longo"),
 ("#3B82F6", "#1E3A8A", "#8D5A3B", "#0B0B0B", "#DC2626", "raspado"),
 ("#EC4899", "#831843", "#A86B4A", "#1A0F0A", "#FDE047", "cacheado"),
 ("#F59E0B", "#7C2D12", "#F3CFB0", "#3F2A1C", "#0F172A", "curto"),
]
def retrato(c1, c2, pele, cabelo, roupa, tipo):
    W, H = 600, 720
    cab = {
     "rabo": f'<path d="M210 250 Q300 150 390 250 L395 300 Q300 230 205 300Z" fill="{cabelo}"/><path d="M380 230 Q470 260 440 380 Q420 300 380 280Z" fill="{cabelo}"/>',
     "curto": f'<path d="M205 280 Q210 170 300 165 Q395 170 395 280 Q370 215 300 215 Q230 215 205 280Z" fill="{cabelo}"/>',
     "longo": f'<path d="M195 290 Q200 160 300 160 Q400 160 405 290 L420 470 Q380 440 385 300 Q300 220 215 300 Q220 440 180 470Z" fill="{cabelo}"/>',
     "raspado": f'<path d="M212 265 Q220 185 300 182 Q380 185 388 265 Q350 220 300 220 Q250 220 212 265Z" fill="{cabelo}" opacity=".85"/>',
     "cacheado": ''.join(f'<circle cx="{x}" cy="{y}" r="42" fill="{cabelo}"/>' for x, y in [(220,230),(260,185),(310,170),(355,190),(390,235),(205,290),(400,295),(300,200)]),
    }[tipo]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>
<radialGradient id="luz" cx="70%" cy="20%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" fill="url(#luz)"/>
<path d="M0 520 L120 470 L180 540 L260 430 L330 560 L400 380 L470 520 L600 480" stroke="#fff" stroke-opacity=".25" stroke-width="10" fill="none" stroke-linejoin="round"/>
<path d="M110 720 Q120 520 300 505 Q480 520 490 720Z" fill="{roupa}"/>
<rect x="265" y="400" width="70" height="120" rx="30" fill="{pele}"/>
<ellipse cx="300" cy="300" rx="98" ry="118" fill="{pele}"/>
{cab}
<ellipse cx="265" cy="305" rx="9" ry="11" fill="#1f1310"/><ellipse cx="335" cy="305" rx="9" ry="11" fill="#1f1310"/>
<path d="M270 360 Q300 382 330 360" stroke="#7a3b2e" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>'''
for i, p in enumerate(PROFS, 1):
    job(f'prof-{i}', retrato(*p), 600, 720)

hero = '''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1020"/><stop offset=".6" stop-color="#1E1236"/><stop offset="1" stop-color="#4C0519"/></linearGradient>
<linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#F43F5E"/><stop offset=".5" stop-color="#F59E0B"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="40"/></filter><filter id="s"><feGaussianBlur stdDeviation="6"/></filter></defs>
<rect width="1600" height="900" fill="url(#g)"/>
<circle cx="1250" cy="250" r="260" fill="#F43F5E" opacity=".35" filter="url(#b)"/>
<circle cx="1050" cy="700" r="220" fill="#F59E0B" opacity=".25" filter="url(#b)"/>
<g opacity=".12" stroke="#fff">''' + ''.join(f'<line x1="{x}" y1="0" x2="{x-400}" y2="900" stroke-width="2"/>' for x in range(600, 2200, 80)) + '''</g>
<path d="M0 560 H520 L580 470 L640 660 L720 300 L800 760 L870 520 L930 560 H1600" stroke="url(#l)" stroke-width="22" fill="none" stroke-linejoin="round" filter="url(#s)" opacity=".8"/>
<path d="M0 560 H520 L580 470 L640 660 L720 300 L800 760 L870 520 L930 560 H1600" stroke="url(#l)" stroke-width="9" fill="none" stroke-linejoin="round"/>
<circle cx="720" cy="300" r="14" fill="#fff"/>
</svg>'''
job('hero', hero, 1600, 900)
logo = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48" viewBox="0 0 200 48">
<rect x="2" y="6" width="36" height="36" rx="10" fill="#F43F5E"/>
<path d="M7 25 H14 L18 16 L23 34 L27 22 L30 25 H34" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<text x="48" y="31" font-family="Oswald, Arial Narrow, sans-serif" font-weight="700" font-size="25" fill="currentColor" letter-spacing="1.5">PULSO</text>
<text x="128" y="31" font-family="Oswald, Arial Narrow, sans-serif" font-weight="500" font-size="14" fill="#F43F5E" letter-spacing="2">ESTÚDIO</text></svg>'''
open(f'{OUT}/logo-pulso.svg', 'w').write(logo)
open(f'{OUT}/favicon.svg', 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" rx="9" fill="#F43F5E"/><path d="M5 19 H12 L16 10 L21 28 L25 16 L28 19 H32" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>')
json.dump(jobs, open(f'{TMP}/jobs.json', 'w'))
print(len(jobs))
