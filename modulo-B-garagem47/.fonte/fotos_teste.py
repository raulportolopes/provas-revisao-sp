# Gera as fotos de teste de upload. Uso: python3 fotos_teste.py pasta_saida
import sys, os, random
from PIL import Image, ImageDraw
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
def carro(nome, cor, fmt):
    im = Image.new('RGB', (800, 500), (225, 230, 236)); d = ImageDraw.Draw(im)
    d.rectangle([0, 380, 800, 500], fill=(70, 74, 80))
    d.rounded_rectangle([150, 220, 650, 360], 40, fill=cor); d.rounded_rectangle([250, 140, 520, 240], 30, fill=cor)
    d.rectangle([275, 160, 380, 225], fill=(190, 220, 240)); d.rectangle([395, 160, 500, 225], fill=(190, 220, 240))
    for x in (250, 550): d.ellipse([x - 55, 310, x + 55, 420], fill=(30, 30, 30)); d.ellipse([x - 25, 340, x + 25, 390], fill=(160, 160, 160))
    d.text((20, 20), 'GARAGEM 47 - foto de teste', fill=(40, 40, 40))
    im.save(os.path.join(out, nome), fmt, quality=85)
carro('valida-1-dianteira.jpg', (232, 89, 12), 'JPEG')
carro('valida-2-lateral.png', (31, 79, 168), 'PNG')
carro('valida-3-painel.webp', (26, 127, 55), 'WEBP')
# imagem grande demais (> 2 MB): ruído não comprime
r = random.Random(1); im = Image.new('RGB', (1400, 1000))
im.putdata([(r.randint(0, 255), r.randint(0, 255), r.randint(0, 255)) for _ in range(1400 * 1000)])
im.save(os.path.join(out, 'invalida-grande-3mb.png'), 'PNG')
# texto com extensão .jpg (o servidor precisa olhar o conteúdo, não só a extensão)
open(os.path.join(out, 'invalida-texto-renomeado.jpg'), 'w').write('isto não é uma imagem\n' * 50)
# PDF
open(os.path.join(out, 'invalida-documento.pdf'), 'wb').write(b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
for f in sorted(os.listdir(out)): print(f, os.path.getsize(os.path.join(out, f)))
