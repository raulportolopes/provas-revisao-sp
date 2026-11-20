# Converte os .webm gravados em MP4 com legenda e junta todos em Design.mp4.
# Uso: python3 mp4.py <pasta_webm> <pasta_saida_videos> <arquivo_Design.mp4> <legendas.json>
import json, subprocess, sys, os
src, out, design, leg = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
legendas = json.load(open(leg))
FONTE = '/mnt/skills/examples/canvas-design/canvas-fonts/WorkSans-Bold.ttf'
lista = []
for nome, texto in legendas.items():
    w = f'{src}/{nome}.webm'; m = f'{out}/{nome}.mp4'
    t = texto.replace(':', '\\:').replace("'", "’")
    vf = (f"scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=iw:ih+70:0:0:#15121F,"
          f"drawtext=fontfile={FONTE}:text='{t}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=h-48")
    if 'celular' in nome or '375' in nome:
        vf = vf.replace('fontsize=26', 'fontsize=15').replace('ih+70', 'ih+60').replace('y=h-48', 'y=h-38')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '25', '-crf', '26', '-an', m], check=True)
    lista.append(m)
# Design.mp4: todos no mesmo tamanho (1440x970), o do celular centralizado sobre fundo escuro
tmp = []
for m in lista:
    t = m.replace('.mp4', '.norm.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', m, '-vf', 'scale=1440:970:force_original_aspect_ratio=decrease,pad=1440:970:(ow-iw)/2:(oh-ih)/2:#0E0C16', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '25', '-crf', '28', '-an', t], check=True)
    tmp.append(os.path.abspath(t))
open('/tmp/claude-0/w/concat.txt', 'w').write(''.join(f"file '{t}'\n" for t in tmp))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', '/tmp/claude-0/w/concat.txt', '-c', 'copy', design], check=True)
for t in tmp: os.remove(t)
print('ok', len(lista))
