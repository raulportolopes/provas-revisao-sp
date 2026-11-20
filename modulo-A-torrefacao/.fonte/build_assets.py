# Monta assets_<slug>/ (material do competidor, sem resposta) e o index.html da solução.
import os, shutil, json, sys, html
sys.path.insert(0, os.path.dirname(__file__))
import conteudo as C
R = '/home/user/rev'
VMAP = {'A1-E':'a1e','A2-M':'a2m','A3-H':'a3h','B1-E':'b1e','B2-M':'b2m','B3-H':'b3h'}

def cp(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, dst)

def index_solucao(P, k):
    sol = f'{R}/{k}/sol/XXX_modulo_a'
    cards = []
    for t in P['tarefas']:
        href = f"{t['id']}/README.md" if t['area'] == 'back' else f"{t['id']}/"
        cards.append(f'''    <li><a href="{href}"><img src="thumbs/{t['id']}.jpg" alt="Captura da tarefa {t['id']}" width="320" height="200" loading="lazy">
      <span class="id">{t['id']}</span><span class="titulo">{html.escape(t['titulo'])}</span></a></li>''')
    doc = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Módulo A · {html.escape(P['nome'])}</title>
  <style>
    *{{box-sizing:border-box}} body{{margin:0;font-family:system-ui,sans-serif;background:#f4f4f6;color:#1d1d24}}
    header{{background:{P['cor']};color:#fff;padding:28px 24px}} h1{{margin:0;font-size:1.6rem}} header p{{margin:.4rem 0 0;opacity:.9}}
    ul{{list-style:none;margin:0 auto;padding:24px;max-width:1100px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}}
    a{{display:flex;flex-direction:column;background:#fff;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 2px 8px #0001;transition:transform .2s,box-shadow .2s}}
    a:hover,a:focus-visible{{transform:translateY(-3px);box-shadow:0 8px 20px #0002}} a:focus-visible{{outline:3px solid {P['cor']};outline-offset:3px}}
    img{{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;display:block}}
    .id{{font-weight:700;color:{P['cor']};padding:12px 14px 0}} .titulo{{padding:2px 14px 14px}}
  </style>
</head>
<body>
  <header><h1>Módulo A · Mini Projetos</h1><p>{html.escape(P['nome'])} · solução de referência</p></header>
  <main>
  <ul>
{chr(10).join(cards)}
  </ul>
  </main>
</body>
</html>
'''
    open(f'{sol}/index.html', 'w').write(doc)

def assets(P, k):
    sol = f'{R}/{k}/sol/XXX_modulo_a'
    dst = f'{R}/out/{k}/assets_{P["slug"]}'
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst)
    for t in P['tarefas']:
        d = f"{dst}/{t['id']}"; os.makedirs(d, exist_ok=True)
        for nome, _ in t['arquivos']:
            n = nome.rstrip('/')
            if nome.startswith('referencia_'):
                cp(f'{R}/vid/{k}/{n}', f'{d}/{n}')
            elif n == 'layout':
                for f in os.listdir(f'{R}/out/layout_p2'): cp(f'{R}/out/layout_p2/{f}', f'{d}/layout/{f}')
            elif n == 'testes' and k == 'p2':
                for f in os.listdir(f'{R}/fonte/p2assets/B3-H'): cp(f'{R}/fonte/p2assets/B3-H/{f}', f'{d}/testes/{f}')
            elif n.startswith('testes/') and k == 'p1':
                f = n.split('/')[1]
                src = {'orion.json': f'{R}/fonte/p1_orion.json'}.get(f)
                os.makedirs(f'{d}/testes', exist_ok=True)
                if src: cp(src, f'{d}/{n}')
                elif f == 'invalido.json': open(f'{d}/{n}', 'w').write('isto não é json {\n')
                elif f == 'estrela-inexistente.json': open(f'{d}/{n}', 'w').write(json.dumps({"versao": 1, "ligacoes": [[1, 4], [4, 99]]}, indent=2) + '\n')
                elif f == 'notas.txt': open(f'{d}/{n}', 'w').write('{"versao": 1, "ligacoes": [[1, 4]]}\n')
            elif t['id'] == 'C1-E' and k == 'p1':
                cp(f'{R}/fonte/p1assets/C1-E/{n}', f'{d}/{n}')
            elif n == 'tokens.json':
                open(f'{d}/{n}', 'w').write('[]\n')
            elif n == 'reservations.json' and k == 'p1':
                cp(f'{R}/fonte/p1_reservations_original.json', f'{d}/{n}')
            elif n == 'orders.json' and k == 'p2':
                cp(f'{R}/fonte/p2_orders_original.json', f'{d}/{n}')
            elif n == 'transactions.json' and k == 'p2':
                cp(f'{R}/fonte/p2_transactions_original.json', f'{d}/{n}')
            else:
                cp(f'{sol}/{t["id"]}/{n}', f'{d}/{n}')
    cp(f'{R}/vid/{k}/Design.mp4', f'{dst}/Design.mp4')
    linhas = [f"{P['titulo']}", "Material do competidor. Cada pasta tem os arquivos da tarefa com o mesmo ID.",
              "Os vídeos mostram o resultado esperado; as legendas amarelas e o círculo do cursor só explicam o efeito.",
              "Design.mp4 junta todos os vídeos em sequência.", ""]
    for t in P['tarefas']:
        linhas.append(f"{t['id']}  {t['titulo']}")
        for nome, desc in t['arquivos']: linhas.append(f"   - {nome}: {desc}")
    open(f'{dst}/LEIA-ME.txt', 'w').write('\n'.join(linhas) + '\n')
    return dst

for P, k in ((C.P1, 'p1'), (C.P2, 'p2')):
    index_solucao(P, k)
    print(assets(P, k))
