import sys, os, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
_m = __import__(os.environ['CIS_MOD']); SUB, TOTAL = _m.SUB, _m.TOTAL

SRC, OUT = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(SRC)
ws = wb["CIS"]
def grab(r): return [copy.copy(ws.cell(r, c)._style) for c in range(1, 15)]
# linhas-modelo de estilo: subcritério, medição, julgamento e escala (padrão do ModeloCis.xlsx);
# para regerar a partir da própria CIS já gerada, passe "26,27,32,33" como 3º argumento
LIN = [int(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else [26, 27, 36, 37]
ST_SUB, ST_M, ST_J, ST_SC = (grab(x) for x in LIN)
ws.delete_rows(26, ws.max_row - 25)

r = 26
def put(vals, st):
    global r
    for c in range(1, 15):
        cell = ws.cell(r, c); cell._style = copy.copy(st[c-1])
        cell.value = vals[c-1] if c-1 < len(vals) else None
    r += 1
for sid, nome, asps in SUB:
    put([sid, nome, 1], ST_SUB)
    for tipo, desc, extra, req, wsos, mx, esc in asps:
        if tipo == "M":
            linha = 2 if extra and ("Descontar" in extra or "0,50 se" in extra or "0,25 se" in extra) else 1
            put([None, None, None, "M", desc, None, extra, req, wsos, linha, mx], ST_M)
        else:
            put([None, None, None, "J", desc, None, None, None, wsos, None, mx], ST_J)
            for i, t in enumerate(esc):
                put([None, None, None, None, None, i, t], ST_SC)
last = r - 1
rng = lambda col: f"${col}$26:${col}${last}"
for row in range(5, 11):
    ws.cell(row, 10).value = f"=SUMIF({rng('I')},A{row},{rng('K')})"
ws["A1"] = os.environ["CIS_TITULO"]
ws["K16"] = None
ws["K17"] = f"=SUM(K26:K{last})"
ws["L25"] = "Módulo C"
ws["N25"] = f"=SUM(K26:K{last})"
# coluna de nota obtida para o Raul
hdr = ws.cell(25, 15); hdr._style = copy.copy(ws.cell(25, 11)._style); hdr.value = "Nota obtida"
ws.column_dimensions["O"].width = 13
for row in range(26, last + 1):
    if ws.cell(row, 11).value is not None:
        c = ws.cell(row, 15); c._style = copy.copy(ws.cell(row, 11)._style)
ws.cell(24, 15).value = "Total obtido"; ws.cell(24, 15).font = Font(bold=True)
ws.cell(24, 16).value = f"=SUM(O26:O{last})"; ws.cell(24, 16).font = Font(bold=True)
w = {}
for _, _, asps in SUB:
    for a in asps: w[a[4]] = round(w.get(a[4], 0) + a[5], 2)
for row, sec in ((5, 1), (6, 2), (7, 3), (8, 4), (9, 5)): ws.cell(row, 9).value = w.get(sec, 0)
nr = last + 2
for k, t in enumerate(["Como pontuar",
    "Aspectos M: digite na coluna O a nota do aspecto (máximo da coluna K menos as deduções da coluna G, nunca abaixo de zero).",
    "Aspectos J: escolha a nota de 0 a 3 nas linhas abaixo do aspecto e digite na coluna O o valor proporcional (nota ÷ 3 × máximo).",
    os.environ["CIS_NOTA"],
    "Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web."]):
    c = ws.cell(nr + k, 2); c.value = t; c.font = Font(name="Arial", size=10, bold=(k == 0))
wb.save(OUT)
print("linhas até", last, "total", TOTAL)
