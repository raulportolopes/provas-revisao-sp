# Gera Projeto_Teste (descritivo), Guia_Avaliador (roteiro) e Resolucao_Comentada dos 2 projetos de revisão do Módulo F.
import os, sys, subprocess
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from docbase import Doc
import conteudo_f as C, resol_f as RS
R = '/home/user/rev'
br = lambda v: f'{v:.2f}'.replace('.', ',')
TMP = f'{R}/docs/tmp'; os.makedirs(TMP, exist_ok=True)
CFG = {'observatorio': ('obs', C.P1, RS.R1, ['index', 'agenda', 'galeria'], {'index': 'Página Início', 'agenda': 'Página Agenda', 'galeria': 'Página Galeria'}),
       'torra-serrana': ('cafe', C.P2, RS.R2, ['index', 'cafes', 'preparo'], {'index': 'Página Início', 'cafes': 'Página Cafés', 'preparo': 'Página Preparo'})}

def fatias(png, alto=1500, larg=1440):
    """Corta o print de página inteira em pedaços que cabem numa página do Word."""
    im = Image.open(png).convert('RGB'); w, h = im.size; out = []
    alto = int(alto * w / larg)
    for k, y in enumerate(range(0, h, alto)):
        f = f'{TMP}/{os.path.basename(png)[:-4]}-{k}.jpg'
        im.crop((0, y, w, min(h, y + alto))).save(f, quality=82); out.append(f)
    return out

def cab(P, sub, cod):
    return Doc(sub, f"Módulo F – {P['nome']}", f"SPSKILLS_MF_{P['slug'].upper().replace('-', '_')}_{cod}_2026")

def resumo(D, P):
    linhas = [('Subcritério', 'Descrição', 'Pontos')] + [(s, n, br(sum(a[5] for a in asp))) for s, n, asp in P['cis']] + [('TOTAL', '', br(P['total']))]
    D.tabela(linhas, [0.16, 0.66, 0.18], prot=1)

def videos(q): return sorted(f for f in os.listdir(f'{R}/vid/{q}') if f.endswith('.mp4') and f != 'Design.mp4')

def prova(slug, out):
    q, P, _, pags, nomes = CFG[slug]
    D = cab(P, 'Projeto de revisão – Implementação de Design', 'REVISAO')
    D.h('Introdução'); D.p(P['intro'])
    D.p('Este documento descreve as regras e os comportamentos que não podem ser deduzidos apenas pelas referências. Tudo o que não estiver descrito em texto deve seguir os designs e os vídeos. Se o texto e uma referência divergirem, vale o texto.')
    D.h('Descrição do projeto')
    D.p('Tempo de referência: 4 horas. Este projeto de revisão é de 3 a 5 vezes mais trabalhoso que o simulado de Jacareí: marque até onde chegou em 4 horas e depois termine com calma, comparando com a resolução comentada.')
    D.p(f"Salve tudo em /{P['cfp']}/ (XX é o seu código CFP) e publique em http://000.000.00.00/{P['cfp']}/. Use só HTML, CSS e JavaScript puros, sem frameworks e sem bibliotecas.")
    D.code(f"/{P['cfp']}/\n  index.html  {pags[1]}.html  {pags[2]}.html\n  css/  js/  img/  fonts/  dados/")
    D.h('Referências fornecidas (pasta assets)')
    for t in ['design/: uma pasta por página com os designs em PNG (1440, 768 e 375 px) e textos.txt com todos os textos da página; design/estados/ mostra estados que só aparecem com interação (hover, modal, gaveta, menu aberto).',
              'videos/: um MP4 para cada animação ou interação, e Design.mp4 com todos em sequência. As legendas amarelas e o círculo amarelo do cursor só explicam o efeito e não fazem parte da página.',
              'imagens/: fotos e ilustrações originais em tamanho grande. Otimize você mesmo (tamanho e formato) para o Lighthouse.',
              'icones/: ícones SVG de 24 × 24 px, só com traço. Pinte com currentColor.',
              'fonts/: fontes .woff2. dados/: arquivos JSON (veja abaixo).',
              'DICAS.md: dicas de caminho para os efeitos mais difíceis (não é a resposta).']:
        D.i(0, '• ' + t)
    D.p('Vídeos disponíveis:', None).runs[0].bold = True
    for v in videos(q): D.i(1, '• ' + v)
    D.h('Identidade visual')
    D.s('Paleta de cores')
    if slug == 'observatorio':
        D.tabela([('Uso', 'Tema escuro (padrão)', 'Tema claro')] + list(P['paleta']), [0.46, 0.27, 0.27])
    else:
        D.tabela([('Uso', 'Cor')] + [(a, b) for a, b, _ in P['paleta']], [0.7, 0.3])
    D.s('Tipografia'); D.p(P['fontes'])
    D.s('Dados')
    for f, d in P['dados']: D.i(0, f'• {f}: {d}')
    D.p('Os dados podem ser lidos com fetch (recomendado) ou escritos no HTML, mas os itens que a CIS marca como “gerados a partir do JSON” só pontuam com fetch.')
    for titulo, reqs in P['paginas']:
        D.pb(); D.h(titulo)
        for k, r in enumerate(reqs, 1): D.i(0, f'{k}. {r}')
        pg = next((p for p, n in nomes.items() if n == titulo), None)
        if pg:
            fs = fatias(f'{R}/design/{q}/{pg}/{pg}-1440.png')
            D.p(f'Design em 1440 px ({pg}-1440.png):', None).runs[0].bold = True
            for f in fs: D.img(f, 15.5)
            D.imgs_lado([f'{R}/design/{q}/{pg}/{pg}-375.png'], 4.2, f'{pg}-375.png (o design completo de 768 e 375 px está na pasta design)')
    D.pb(); D.h('Estados de interação')
    for f in sorted(os.listdir(f'{R}/design/{q}/estados')):
        im = Image.open(f'{R}/design/{q}/estados/{f}')
        if im.size[1] > im.size[0] * 2:
            j = fatias(f'{R}/design/{q}/estados/{f}')[0]; D.img(j, 12, f)
        else: D.img(f'{R}/design/{q}/estados/{f}', 15 if im.size[0] > 800 else 6, f)
    D.h('Instruções ao competidor')
    for k, t in enumerate(['Teste pelo servidor (fetch não funciona abrindo o arquivo direto do disco).',
                           'Avaliação no Google Chrome, em 1440 × 900, 768 × 1024 e 375 × 812 (modo dispositivo do DevTools).',
                           'Não altere os arquivos JSON. Os textos devem ser exatamente os de textos.txt.',
                           'Mantenha o Console sem erros e confira o Lighthouse antes de entregar.'], 1):
        D.i(0, f'{k}. {t}')
    D.h('Resumo da avaliação'); resumo(D, P)
    D.save(out)

def guia(slug, out):
    q, P, _, pags, nomes = CFG[slug]
    D = cab(P, 'Guia do avaliador e roteiro de teste', 'GUIA_AVALIADOR')
    D.h('Uso deste guia')
    D.p(f"O módulo vale {br(P['total'])} pontos. Os pontos são os mesmos da CIS (CIS_Modulo_F_{P['slug']}.xlsx): digite na coluna O a nota obtida e, na coluna Q, a evidência. Avalie os aspectos J antes dos M de cada subcritério (Regra 9.4.1).")
    D.p(f"A solução de referência está em solucao-comentada/{P['cfp']}/. O script gabarito-avaliador/checar-*.js (Node + Playwright) roda as mesmas verificações automaticamente e ajuda a conferir a solução depois de alterações.")
    D.h('Preparação')
    for k, t in enumerate([
        f"Abrir http://000.000.00.00/{P['cfp']}/ no Chrome com o DevTools aberto (Console).",
        'Larguras: F12 > Ctrl+Shift+M e definir 1440 × 900, 768 × 1024 e 375 × 812. Para testar toque, escolha um dispositivo da lista.',
        'Deixar os PNG de assets/design abertos ao lado e assistir aos vídeos da página antes de avaliar.',
        'Animações: Ctrl+Shift+P > “Show Animations”. Movimento reduzido: Ctrl+Shift+P > “Emulate CSS prefers-reduced-motion: reduce”. Tema do sistema: “Emulate CSS prefers-color-scheme”.',
        'Antes de começar, limpar o localStorage (Application > Storage > Clear site data).',
        'Lighthouse: aba Lighthouse, modo Navegação, dispositivo Celular, as 4 categorias, em janela anônima.'], 1):
        D.i(0, f'{k}. {t}')
    D.h('Pontos fracos do Eduardo cobertos')
    foco = {'observatorio': ['Efeito que segue o cursor (lanterna e tilt com brilho)', 'Cartão 3D com teclado', 'Gráficos em CSS com hover', 'Interação JS de estado: abas, filtros, acordeão, modal com validação', 'Tema claro/escuro sem piscar', 'Layout em 375 px e Lighthouse'],
            'torra-serrana': ['Gráficos no hover (anel da nota e barras do perfil) e contador em CSS', 'Botão magnético (segue o cursor)', 'Animações ligadas à rolagem sem JS', 'Interação JS de estado: carrossel com pausa, sacola, filtros na URL, abas, cronômetro', 'Barra de navegação inferior no celular (375 px)', 'Lighthouse e formato de moeda']}[slug]
    for f in foco: D.i(0, '• ' + f)
    n = 1
    for sid, nome, asp in P['cis']:
        D.h(f"{sid} – {nome} ({br(sum(a[5] for a in asp))})")
        linhas = [('#', 'Tipo', 'Aspecto', 'Como verificar', 'Dedução', 'Máx.')]
        for a in asp:
            linhas.append((str(n), a[0], a[1], a[3], a[2] or ('Escala 0 a 3' if a[0] == 'J' else '—'), br(a[5]))); n += 1
        D.tabela(linhas, [0.05, 0.06, 0.33, 0.28, 0.18, 0.1])
        for a in asp:
            if a[6]:
                D.p(f'Escala J – {a[1]}:', None).runs[0].bold = True
                for k, t in enumerate(a[6]): D.i(1, f'{k}: {t}')
    D.h('Resumo'); resumo(D, P)
    D.save(out)

def trecho(base, arq, marca, n):
    L = open(base + arq).read().split('\n')
    i = next(j for j, l in enumerate(L) if marca in l) if marca else 0
    return '\n'.join(l.rstrip()[:118] for l in L[i:i + n])

def resolucao(slug, out):
    q, P, RES, pags, nomes = CFG[slug]
    base = f'{R}/{q}/sol/{P["cfp"]}/'
    D = cab(P, 'Resolução comentada', 'RESOLUCAO')
    D.h('Como estudar este projeto')
    for k, t in enumerate([
        'Publique a solução e use o site inteiro antes de ler o código. Assista aos vídeos e compare.',
        'Leia na ordem: HTML da página, css/estilo.css (organizado por seção, com comentários) e o JS da página. Os comentários explicam o porquê de cada decisão.',
        'Para cada recurso abaixo, leia as ideias-chave e tente refazer do zero numa página em branco, sem olhar. Só depois compare com o trecho.',
        'Repare nos padrões que se repetem: variável CSS + @property para animar qualquer número; JS que só escreve variáveis e classes (o CSS faz a animação); um estado + uma função que redesenha.'], 1):
        D.i(0, f'{k}. {t}')
    D.s('Arquivos da solução')
    arqs = []
    for d in ('', 'css/', 'js/', 'dados/'):
        arqs += [d + f for f in sorted(os.listdir(base + d)) if os.path.isfile(base + d + f)]
    D.p(', '.join(arqs) + ' (+ img/, icones/, fonts/)')
    for titulo, arqs, ideias, trechos in RES:
        D.h(titulo)
        D.p(', '.join(arqs), 'Onde está: ')
        D.p('Ideias-chave:', None).runs[0].bold = True
        for t in ideias: D.i(1, '• ' + t)
        for arq, marca, nl in trechos:
            D.p(f'Trecho de {arq}:', None).runs[0].italic = True
            D.code(trecho(base, arq, marca, nl))
    D.h('Erros comuns que esta revisão evita')
    for t in ['Animar uma variável CSS sem @property (o valor pula em vez de deslizar).',
              'Usar evento scroll para barras de progresso e linhas que enchem: animation-timeline faz isso sem JS e sem travar.',
              'Esquecer o teclado: cartões, abas, carrossel e comparador precisam funcionar com Tab, Enter, Espaço e setas.',
              'Não devolver o foco ao fechar modal ou gaveta.',
              'translate para esconder menus e gavetas fora da tela gera rolagem horizontal em 375 px; use clip-path/visibility ou position: fixed.',
              'Imagens grandes em JPG/PNG sem width/height derrubam o Lighthouse (LCP e CLS).',
              'Datas com new Date("2026-12-04") mostram o dia anterior no fuso de Brasília; monte a data a partir do texto.']:
        D.i(0, '• ' + t)
    D.save(out)

if __name__ == '__main__':
    NOME = {'observatorio': 'Observatorio', 'torra-serrana': 'Torra_Serrana'}
    for slug in CFG:
        o = f'{R}/out/{slug}'; os.makedirs(o, exist_ok=True); N = NOME[slug]
        prova(slug, f'{o}/Projeto_Teste_Modulo_F_{N}.docx')
        guia(slug, f'{o}/Guia_Avaliador_Modulo_F_{N}.docx')
        resolucao(slug, f'{o}/Resolucao_Comentada_Modulo_F_{N}.docx')
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', o] + [f'{o}/{t}_Modulo_F_{N}.docx' for t in ('Projeto_Teste', 'Guia_Avaliador', 'Resolucao_Comentada')], capture_output=True, timeout=400)
    print('ok')
