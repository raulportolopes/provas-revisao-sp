# Guia do avaliador gerado da CIS. Uso: python3 make_guia_b.py <pasta_fonte> <modulo_cis_py> <config_guia_py> <saida.docx>
import sys, os, importlib
sys.path.insert(0, sys.argv[1]); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
C = importlib.import_module(sys.argv[2]); G = importlib.import_module(sys.argv[3]); OUT = sys.argv[4]
from docbase import Doc
D = Doc('Guia do avaliador – roteiro de teste', G.SUBTITULO, G.RODAPE)
D.h('Uso deste guia')
for p in G.USO: D.p(p)
D.h('Distribuição dos pontos')
D.tabela([('Subcritério', 'Nome', 'Pontos')] +
 [(s, n, f'{sum(a[5] for a in asp):.2f}'.replace('.', ',')) for s, n, asp in C.SUB] + [('TOTAL', '', f'{C.TOTAL:.2f}'.replace('.', ','))],
 [0.18, 0.62, 0.2], prot=0)
nM = sum(1 for _, _, a in C.SUB for x in a if x[0] == 'M'); nJ = sum(1 for _, _, a in C.SUB for x in a if x[0] == 'J')
D.p(f'São {nM + nJ} aspectos ({nM} de medição e {nJ} de julgamento).')
D.h('Pontos fracos do Eduardo que a prova cobre')
D.tabela([('Ponto fraco', 'Onde aparece', 'Pontos')] + G.DEFEITOS, [0.35, 0.5, 0.15])
D.h('Preparação')
for k, p in enumerate(G.PREPARACAO, 1): D.i(0, f'{k}. {p}')
D.h('Roteiro de teste por aspecto')
for sid, nome, asp in C.SUB:
    D.s(f'{sid} – {nome} ({sum(a[5] for a in asp):.2f} pt)'.replace('.', ','))
    for k, (t, desc, extra, req, wsos, mx, esc) in enumerate(asp, 1):
        D.i(0, f'{sid}.{k} [{t} {mx:.2f}] {desc}.'.replace('.', ',', 1) if False else f'{sid}.{k} [{t} ' + f'{mx:.2f}'.replace('.', ',') + f'] {desc}.')
        if t == 'M':
            D.i(1, 'Verificação e dedução: ' + (extra or 'tudo ou nada').rstrip('.') + '.')
        else:
            D.i(1, 'Escala: ' + ' / '.join(f'{n} = {j.rstrip(".")}' for n, j in enumerate(esc)) + '.')
D.h('Dados esperados (banco fornecido)')
D.tabela(G.DADOS, [0.4, 0.6])
D.save(OUT)
print('ok')
