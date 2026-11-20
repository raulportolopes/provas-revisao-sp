# Converte os .webm de referência em MP4 (h264) com legenda amarela no topo e monta Design.mp4.
# Uso: python3 mp4.py <pasta_webm> <pasta_saida> <legendas.json>
import json, os, subprocess, sys
src, out, leg = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
os.makedirs(out, exist_ok=True)
FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def esc(t): return t.replace('\\', '\\\\').replace(':', '\\:').replace("'", "’").replace('%', '\\%').replace(',', '\\,')
partes = []
for nome in sorted(f[:-5] for f in os.listdir(src) if f.endswith('.webm')):
    txt = leg.get(nome, nome)
    dst = f'{out}/{nome}.mp4'
    larg = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', f'{src}/{nome}.webm'], capture_output=True, text=True).stdout.strip())
    tam = max(11, min(30, int(larg * 0.94 / (0.62 * len(txt)))))  # a legenda sempre cabe na largura
    vf = (f"drawbox=x=0:y=0:w=iw:h={tam*2}:color=black@0.72:t=fill,"
          f"drawtext=fontfile={FONTE}:text='{esc(txt)}':fontcolor=#FFD600:fontsize={tam}:x=(w-tw)/2:y={tam//2},"
          "pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p")
    if not os.path.exists(dst):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{src}/{nome}.webm', '-vf', vf, '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-an', '-movflags', '+faststart', dst], check=True)
    # versão para o Design.mp4: tudo em 1440x900 (tablet e celular ficam centralizados num fundo escuro)
    tmp = f'{out}/.d-{nome}.mp4'
    if not os.path.exists(tmp):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', dst, '-vf', 'scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=#1b1b1b,setsar=1,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-an', tmp], check=True)
    partes.append(tmp)
    print('ok', nome)
with open(f'{out}/.lista.txt', 'w') as f:
    for p in partes: f.write(f"file '{os.path.abspath(p)}'\n")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{out}/.lista.txt', '-c', 'copy', '-movflags', '+faststart', f'{out}/Design.mp4'], check=True)
for p in partes: os.remove(p)
os.remove(f'{out}/.lista.txt')
print('Design.mp4 ok')
