# Monta a pasta final de cada projeto: enunciado, CIS, guia, assets (com zip), solução comentada (com zip) e gabarito.
import os, shutil, subprocess, glob
R = '/home/user/rev'; E = f'{R}/entrega'
CFG = [('observatorio', 'obs', 'modulo-F-observatorio', 'Observatorio', {'index': 'Pagina Inicio', 'agenda': 'Pagina Agenda', 'galeria': 'Pagina Galeria'}, 'checar-observatorio.js'),
       ('torra-serrana', 'cafe', 'modulo-F-torra-serrana', 'Torra_Serrana', {'index': 'Pagina Inicio', 'cafes': 'Pagina Cafes', 'preparo': 'Pagina Preparo'}, 'checar-torra-serrana.js')]
def cp(a, b):
    os.makedirs(os.path.dirname(b), exist_ok=True)
    (shutil.copytree(a, b, dirs_exist_ok=True) if os.path.isdir(a) else shutil.copy2(a, b))
def zipar(pasta):
    if os.path.exists(pasta + '.zip'): os.remove(pasta + '.zip')
    subprocess.run(['zip', '-qr', os.path.basename(pasta) + '.zip', os.path.basename(pasta)], cwd=os.path.dirname(pasta), check=True)
for slug, q, pasta, N, pags, checar in CFG:
    D = f'{E}/{pasta}'; shutil.rmtree(D, ignore_errors=True); os.makedirs(D)
    for f in glob.glob(f'{R}/out/{slug}/*'):
        if 'Resolucao' not in f: cp(f, f'{D}/{os.path.basename(f)}')
    A = f'{D}/assets_{slug}'
    for pg, nome in pags.items(): cp(f'{R}/design/{q}/{pg}', f'{A}/design/{nome}')
    cp(f'{R}/design/{q}/estados', f'{A}/design/Estados')
    for f in glob.glob(f'{R}/vid/{q}/*.mp4'): cp(f, f'{A}/videos/{os.path.basename(f)}')
    cp(f'{R}/{q}/img', f'{A}/imagens'); cp(f'{R}/{q}/icones', f'{A}/icones')
    sol = f'{R}/{q}/sol/XX_modulo_f'
    cp(f'{sol}/fonts', f'{A}/fonts'); cp(f'{sol}/dados', f'{A}/dados')
    cp(f'{R}/docs/dicas/{slug}.md', f'{A}/DICAS.md')
    with open(f'{A}/LEIA-ME.txt', 'w') as f:
        f.write('\n'.join(['Assets do Módulo F – projeto de revisão (Raul Porto Lopes, Avaliador).', '',
            'design/      uma pasta por página: PNG em 1440, 768 e 375 px + textos.txt. Estados/ mostra hover, modal, gaveta e menu aberto.',
            'videos/      um MP4 por animação. Design.mp4 junta todos. Legenda amarela e círculo do cursor não fazem parte da página.',
            'imagens/     originais em tamanho grande (otimize para o Lighthouse).',
            'icones/      SVG 24 x 24, só traço (use currentColor).',
            'fonts/       .woff2.   dados/  JSON da página (não altere).',
            'DICAS.md     caminhos para os efeitos mais difíceis (não é a resposta).', '']))
    zipar(A)
    S = f'{D}/solucao-comentada'
    cp(sol, f'{S}/XX_modulo_f'); zipar(f'{S}/XX_modulo_f')
    for f in glob.glob(f'{R}/out/{slug}/Resolucao*'): cp(f, f'{S}/{os.path.basename(f)}')
    cp(f'{R}/{q}/gabarito/{checar}', f'{D}/gabarito-avaliador/{checar}')
    F = f'{D}/.fonte'
    for f in glob.glob(f'{R}/{q}/gen/*'): cp(f, f'{F}/{os.path.basename(f)}')
    for f in ['tools/gravador.js', 'tools/mp4.py', 'tools/layouts.js', 'tools/textos.js', 'tools/shots.js', 'docs/conteudo_f.py', 'docs/resol_f.py', 'docs/make_docs_f.py', 'docs/make_cis_f.py', 'docs/docbase.py', 'docs/build_entrega.py']:
        cp(f'{R}/{f}', f'{F}/{os.path.basename(f)}')
    cp(f'{R}/vid/leg-{q}.json', f'{F}/legendas-videos.json')
    print(pasta, subprocess.run(['du', '-sh', D], capture_output=True, text=True).stdout.split()[0])

# LEIA-ME de cada projeto
INFO = {'observatorio': ('Observatório Estrela da Serra', 'Observatorio', 'Início, Agenda e Galeria; tema escuro/claro', '15', '43', '96 a 100'),
        'torra-serrana': ('Torrefação Torra Serrana', 'Torra_Serrana', 'Início, Cafés e Preparo; sacola em gaveta', '16', '54', '91 a 100')}
for slug, q, pasta, N, pags, checar in CFG:
    nome, N, pg, nv, nt, lh = INFO[slug]
    txt = f"""# Módulo F · Implementação de Design · {nome} (revisão)

Projeto pronto de revisão para o Estadual SP Skills 2026 (#17 Tecnologias Web). 3 páginas ({pg}), 4 h de referência, 30,00 pontos, de 3 a 5 vezes mais trabalhoso que o Módulo F do simulado de Jacareí.
Elaborado por Raul Porto Lopes (Avaliador).

| Arquivo | Para quem | O que é |
|---|---|---|
| Projeto_Teste_Modulo_F_{N}.pdf/.docx | competidor | enunciado (descritivo) com capa SP Skills |
| assets_{slug}/ (e .zip) | competidor | designs PNG 1440/768/375 + estados, textos.txt, {nv} vídeos MP4 + Design.mp4, imagens originais, ícones, fontes, dados JSON e DICAS.md |
| solucao-comentada/XX_modulo_f/ (e .zip) | estudo | solução completa e comentada |
| solucao-comentada/Resolucao_Comentada_Modulo_F_{N}.pdf | estudo | ideias-chave de cada efeito com trechos da solução e erros comuns |
| Guia_Avaliador_Modulo_F_{N}.pdf/.docx | avaliador | roteiro de teste de cada aspecto (mesma numeração da CIS) |
| CIS_Modulo_F_{N}.xlsx | avaliador | ficha de avaliação (coluna O = nota obtida, Q = evidência) |
| gabarito-avaliador/{checar} | avaliador | {nt} verificações automáticas (Node + Playwright) |
| .fonte/ | manutenção | geradores de imagens, vídeos, layouts e documentos |

Solução conferida em 20/11/2026: {nt} de {nt} verificações automáticas OK, HTML válido, Console sem erros, Lighthouse {lh} (celular).

Para publicar: copie solucao-comentada/XX_modulo_f/ para o Apache (ou rode `python3 -m http.server` na pasta de cima) e abra /XX_modulo_f/. Para rodar o gabarito: `node {checar}` com Playwright instalado, ajustando a constante BASE no início do arquivo.
"""
    open(f'{E}/{pasta}/LEIA-ME.md', 'w').write(txt)
