# Monta documentos no formato da prova Olimpíadas (capa SP Skills, títulos azuis), reaproveitando o .docx como modelo.
import copy, docx
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

MODELO = '/mnt/project-files/provas-ineditas/partilha-modulo-c/Projeto_Teste_Modulo_C_PartilhaSP.docx'

class Doc:
    def __init__(self, sub1, sub2, rodape):
        d = self.d = docx.Document(MODELO)
        self.tprot = [copy.deepcopy(t._tbl) for t in d.tables]
        P = d.paragraphs
        P[2].runs[0].text = sub1; [setattr(r, 'text', '') for r in P[2].runs[1:]]
        P[3].runs[0].text = sub2; [setattr(r, 'text', '') for r in P[3].runs[1:]]
        P[21].runs[0].text = 'Raul Porto Lopes (Avaliador)'; [setattr(r, 'text', '') for r in P[21].runs[1:]]
        for sec in d.sections:
            for part in (sec.footer, sec.first_page_footer):
                for t in part.tables:
                    for c in t.rows[0].cells[:1]:
                        for p in c.paragraphs:
                            if p.runs:
                                p.runs[0].text = rodape
                                for r in p.runs[1:]: r.text = ''
        body = d.element.body
        ini = P[22]._p
        kids = list(body)
        for k in kids[kids.index(ini):]:
            if k.tag != qn('w:sectPr'): body.remove(k)

    def h(self, t): self.d.add_paragraph(t, style='Heading 2')
    def s(self, t):
        p = self.d.add_paragraph(); r = p.add_run(t); r.bold = True; r.font.size = Pt(12)
        p.paragraph_format.space_before = Pt(10)
    def p(self, t, bold_prefix=None):
        p = self.d.add_paragraph()
        if bold_prefix: p.add_run(bold_prefix).bold = True
        p.add_run(t); return p
    def i(self, nivel, t):
        p = self.p(t); p.paragraph_format.left_indent = Cm(0.7 * nivel); p.paragraph_format.space_after = Pt(3); return p
    def code(self, t):
        for line in t.split('\n'):
            p = self.d.add_paragraph(); r = p.add_run(line); r.font.name = 'Consolas'; r.font.size = Pt(8.5)
            p.paragraph_format.space_after = Pt(0); p.paragraph_format.left_indent = Cm(0.5)
            shd = docx.oxml.OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:fill'), 'F2F4F7')
            p._p.get_or_add_pPr().append(shd)
        self.d.add_paragraph()
    def img(self, path, w_cm, legenda=None):
        p = self.d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(path, width=Cm(w_cm)); p.paragraph_format.keep_with_next = True
        if legenda:
            l = self.d.add_paragraph(); l.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = l.add_run(legenda); r.italic = True; r.font.size = Pt(9)
    def imgs_lado(self, paths, w_cm, legenda=None):
        p = self.d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for k, path in enumerate(paths):
            p.add_run().add_picture(path, width=Cm(w_cm))
            if k < len(paths) - 1: p.add_run('   ')
        if legenda:
            l = self.d.add_paragraph(); l.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = l.add_run(legenda); r.italic = True; r.font.size = Pt(9)
    def pb(self): self.d.add_page_break()
    def tabela(self, linhas, larguras=None, prot=0):
        t = copy.deepcopy(self.tprot[prot])
        trs = t.findall(qn('w:tr')); head, body_row = trs[0], trs[1]
        for tr in trs: t.remove(tr)
        ncol = len(linhas[0])
        grid = t.find(qn('w:tblGrid')); gcs = grid.findall(qn('w:gridCol'))
        total = sum(int(g.get(qn('w:w'))) for g in gcs)
        fr = larguras or [1 / ncol] * ncol
        for g in gcs: grid.remove(g)
        ws = [int(total * f) for f in fr]
        for wv in ws:
            g = docx.oxml.OxmlElement('w:gridCol'); g.set(qn('w:w'), str(wv)); grid.append(g)
        def ajusta(tr):
            tcs = tr.findall(qn('w:tc'))
            while len(tcs) < ncol:
                tcs[-1].addnext(copy.deepcopy(tcs[-1])); tcs = tr.findall(qn('w:tc'))
            while len(tcs) > ncol:
                tr.remove(tcs[-1]); tcs = tr.findall(qn('w:tc'))
            for tc, wv in zip(tcs, ws):
                tcw = tc.find(qn('w:tcPr')).find(qn('w:tcW'))
                if tcw is not None: tcw.set(qn('w:w'), str(wv)); tcw.set(qn('w:type'), 'dxa')
            return tr
        def fill(src, vals):
            tr = ajusta(copy.deepcopy(src))
            for tc, txt in zip(tr.findall(qn('w:tc')), vals):
                ps = tc.findall(qn('w:p'))
                for extra in ps[1:]: tc.remove(extra)
                ts = ps[0].findall('.//' + qn('w:t'))
                if ts:
                    ts[0].text = str(txt); ts[0].set(qn('xml:space'), 'preserve')
                    for x in ts[1:]: x.text = ''
                else:
                    r = docx.oxml.OxmlElement('w:r'); te = docx.oxml.OxmlElement('w:t'); te.text = str(txt); r.append(te); ps[0].append(r)
            return tr
        t.append(fill(head, linhas[0]))
        ultimo_total = str(linhas[-1][0]).upper() == 'TOTAL'
        for k, row in enumerate(linhas[1:]):
            t.append(fill(head if (ultimo_total and k == len(linhas) - 2) else body_row, row))
        self.d.add_paragraph()._p.addprevious(t)
    def save(self, path): self.d.save(path)
