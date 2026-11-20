# Gera a CIS (formato ModeloCis, com coluna O "Nota obtida") a partir de um módulo cis_*.py.
# Uso: python3 make_cis_b.py <pasta_do_cis_py> <nome_do_modulo_py> <saida.xlsx>
import sys, os, copy, importlib
import openpyxl
from openpyxl.styles import Font
sys.path.insert(0, sys.argv[1]); C = importlib.import_module(sys.argv[2]); OUT = sys.argv[3]
SRC = '/mnt/project-files/provas-ineditas/viacerta-modulo-c/CIS_Modulo_C_ViaCerta.xlsx'
wb = openpyxl.load_workbook(SRC); ws = wb["CIS"]
def grab(r): return [copy.copy(ws.cell(r, c)._style) for c in range(1, 16)]
ST_SUB, ST_M, ST_J, ST_SC = (grab(x) for x in (26, 27, 31, 32))
ws.delete_rows(26, ws.max_row - 25)
r = 26
def put(vals, st):
    global r
    for c in range(1, 16):
        cell = ws.cell(r, c); cell._style = copy.copy(st[c-1])
        cell.value = vals[c-1] if c-1 < len(vals) else None
    r += 1
for sid, nome, asps in C.SUB:
    put([sid, nome, 1], ST_SUB)
    for tipo, desc, extra, req, wsos, mx, esc in asps:
        if tipo == "M":
            linha = 2 if extra and "Descontar" in extra else 1
            put([None, None, None, "M", desc, None, extra, req, wsos, linha, mx], ST_M)
        else:
            put([None, None, None, "J", desc, None, None, None, wsos, None, mx], ST_J)
            for i, t in enumerate(esc):
                put([None, None, None, None, None, i, t], ST_SC)
last = r - 1
rng = lambda col: f"${col}$26:${col}${last}"
for row in range(5, 11):
    ws.cell(row, 10).value = f"=SUMIF({rng('I')},A{row},{rng('K')})"
ws["A1"] = C.TITULO
crit_row = {'A': 15, 'B': 16, 'C': 17, 'D': 18, 'E': 19, 'F': 20, 'G': 21}
for k in crit_row.values(): ws.cell(k, 11).value = None
ws.cell(crit_row[C.MODULO], 11).value = f"=SUM(K26:K{last})"
ws["L25"] = f"Módulo {C.MODULO}"
ws["N25"] = f"=SUM(K26:K{last})"
ws.cell(25, 15).value = "Nota obtida"
ws.cell(24, 16).value = f"=SUM(O26:O{last})"
w = {}
for _, _, asps in C.SUB:
    for a in asps: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
for row, sec in ((5, 1), (6, 2), (7, 3), (8, 4), (9, 5)): ws.cell(row, 9).value = w.get(sec, 0)
nr = last + 2
for k, t in enumerate(["Como pontuar",
    "Aspectos M: digite na coluna O a nota do aspecto (máximo da coluna K menos as deduções escritas na coluna G, nunca abaixo de zero).",
    "Aspectos J: escolha a nota de 0 a 3 nas linhas abaixo do aspecto e digite na coluna O o valor proporcional (nota ÷ 3 × máximo).",
    f"Os códigos entre colchetes [{C.MODULO}4.1] são as linhas do script de checagem (gabarito-avaliador). O passo a passo está no Guia do avaliador.",
    "Elaborado por Raul Porto Lopes (Avaliador) – revisão SP Skills 2026, ocupação 17 Tecnologias Web."]):
    c = ws.cell(nr + k, 2); c.value = t; c.font = Font(name="Arial", size=10, bold=(k == 0))
wb.save(OUT)
print("linhas até", last, "total", C.TOTAL, "WSOS", w)
