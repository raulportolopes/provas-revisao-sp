# Converte os prints PNG de design/ em JPG menores para os documentos. Uso: python3 prep_imgs.py <design> <saida>
import sys, os, glob
from PIL import Image
src, out = sys.argv[1:3]; os.makedirs(out, exist_ok=True)
def salvar(im, nome, larg=1300):
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    im.convert('RGB').save(f'{out}/{nome}.jpg', quality=80)
for f in glob.glob(f'{src}/*.png') + glob.glob(f'{src}/estados/*.png'):
    n = os.path.basename(f)[:-4]; im = Image.open(f)
    if n.startswith('layout-1440'): im = im.crop((0, 0, im.width, min(im.height, 2700)))
    salvar(im, n)
    if n.startswith('layout-768') or n.startswith('layout-375'):
        alt = 1500 if '768' in n else 1250
        salvar(im.crop((0, 0, im.width, min(im.height, alt))), n + '-topo', 800)
print('ok')
