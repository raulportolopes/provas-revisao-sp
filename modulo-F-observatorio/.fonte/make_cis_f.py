# CIS dos projetos de revisão do Módulo A, no formato da CIS Olimpíadas (coluna O = nota obtida, Q = evidência).
import sys, os, copy, openpyxl
from openpyxl.styles import Font
sys.path.insert(0, os.path.dirname(__file__))
import conteudo_f as C
SRC = '/mnt/project-files/provas-ineditas/olimpiadas-modulo-b/CIS_Modulo_B_Olimpiadas.xlsx'
WS = {'design': 3, 'front': 4, 'back': 5}

def gerar(P, out):
    SUB = [(sid, nome, [(t, d, ded, ver, ws, mx, jud) for (t, d, ded, ver, ws, mx, jud) in asp]) for sid, nome, asp in P['cis']]
    wb = openpyxl.load_workbook(SRC); ws = wb.active
    proto = {}
    for kind, r in (('sub', 25), ('M', 26), ('J', 44), ('Js', 45)):
        proto[kind] = ([copy.copy(ws.cell(r, c)._style) for c in range(1, 18)], ws.row_dimensions[r].height)
    for r in range(25, ws.max_row + 1):
        for c in range(1, 18): ws.cell(r, c).value = None
    ws['A1'] = f"17 Tecnologias Web – Módulo F: Implementação de Design · {P['nome']} (revisão)"
    ws['A16'] = 'F'; ws['B16'] = f"Implementação de Design – Módulo F ({P['nome']})"
    ws.cell(24, 12).value = 'Critério F'
    ws.cell(24, 15).value = 'Nota obtida'
    ws.cell(24, 17).value = 'Evidência / observação'
    ws.cell(24, 17)._style = copy.copy(ws.cell(24, 7)._style)
    ws.column_dimensions['Q'].width = 40
    rows = []
    for sid, nome, asp in SUB:
        rows.append(('sub', {1: sid, 2: nome, 3: 1}))
        for (t, desc, ded, ver, wsos, mx, jud) in asp:
            if t == 'M': rows.append(('M', {4: 'M', 5: desc, 7: ded, 8: ver, 9: wsos, 11: mx}))
            else:
                rows.append(('J', {4: 'J', 5: desc, 8: ver, 9: wsos, 11: mx}))
                for i, txt in enumerate(jud): rows.append(('Js', {6: i, 7: txt}))
    first = 25; last = first + len(rows) - 1
    for i, (kind, vals) in enumerate(rows):
        r = first + i; st, h = proto[kind]
        for c in range(1, 18): ws.cell(r, c)._style = copy.copy(st[c - 1])
        for c, v in vals.items(): ws.cell(r, c).value = v
        n = max(len(str(vals.get(5, ''))), len(str(vals.get(7, '') or '')), len(str(vals.get(8, '') or '')))
        ws.row_dimensions[r].height = 26.45 if n < 60 else (39.6 if n < 110 else 52.9)
    for r in range(5, 10):
        ws.cell(r, 10).value = f'=SUMIF(I{first}:I{last}, A{r}, K{first}:K{last})'
    w = {}
    for s in SUB:
        for a in s[2]: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
    for r, sec in ((5, 1), (6, 2), (7, 3), (8, 4), (9, 5)): ws.cell(r, 9).value = w.get(sec, 0)
    ws.cell(24, 14).value = f'=SUM(K{first}:K{last})'
    ws.cell(24, 16).value = f'=SUM(O{first}:O{last})'
    nr = last + 2
    txts = ['Como pontuar',
     'Aspectos M: digite na coluna O a nota do aspecto (máximo da coluna K menos as deduções da coluna G, nunca abaixo de zero).',
     'Aspectos J: avalie antes dos M da mesma tarefa; escolha a nota de 0 a 3 e digite na coluna O o valor proporcional (nota ÷ 3 × máximo).',
     'A soma da coluna O aparece em P24. O passo a passo de cada aspecto está no Guia do avaliador; anote a evidência na coluna Q.',
     'Elaborado por Raul Porto Lopes (Avaliador) – revisão para o Estadual SP Skills 2026, ocupação 17 Tecnologias Web.']
    for k, t in enumerate(txts):
        c = ws.cell(nr + k, 2); c.value = t; c.font = Font(name='Arial', size=10, bold=(k == 0))
    ws.print_area = f'A1:Q{nr+len(txts)}'
    wb.save(out)
    print(out, 'linhas', first, last, 'WSOS', w, 'total', round(sum(w.values()), 2))


gerar(C.P1, '/home/user/rev/out/observatorio/CIS_Modulo_F_Observatorio.xlsx')
gerar(C.P2, '/home/user/rev/out/torra-serrana/CIS_Modulo_F_Torra_Serrana.xlsx')
