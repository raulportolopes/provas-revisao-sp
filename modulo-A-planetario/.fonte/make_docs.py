# Gera Projeto_Teste, Guia_Avaliador e Resolucao_Comentada (docx) dos 2 projetos de revisão do Módulo A.
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from docbase import Doc
import conteudo as C, roteiros as RT
R = '/home/user/rev'
br = lambda v: f'{v:.2f}'.replace('.', ',')
AREA = {'design': ('Tarefas de implementação de design', 3), 'front': ('Tarefas de desenvolvimento front-end', 4), 'back': ('Tarefas de desenvolvimento back-end', 5)}
FOCO = {
 'planetario': {'A1-E': '@property e borda em degradê animada', 'A2-M': 'transformações 3D e estado com :has() nos rádios', 'A3-H': 'gráficos que aparecem no hover (barras, rosca, medidor) e contador em CSS',
                'B1-E': 'validação de formulário e máscara de data', 'B2-M': 'estado único + render(): filtros, ordenação, paginação, URL e modal', 'B3-H': 'canvas, desfazer/refazer, teclado, localStorage e arquivos',
                'C1-E': 'leitura de CSV real e conversão de datas', 'C2-M': 'token, 401 e paginação com data e dia da semana', 'C3-H': 'regras de estado em ordem e cancelamento sem apagar'},
 'torrefacao': {'A1-E': 'estado só com CSS (checkbox) e animação de onda', 'A2-M': 'efeito 3D que segue o cursor sem JavaScript', 'A3-H': 'layout responsivo em 375 px, animações por rolagem, tabela em cartões e acordeão',
                'B1-E': 'tema claro/escuro sem piscar, radiogroup acessível e localStorage', 'B2-M': 'abas ARIA, carrinho em centavos, cupons e modal de confirmação', 'B3-H': 'upload com validação real, arrastar e soltar e lightbox',
                'C1-E': 'agrupar por dia, datas e dinheiro em centavos', 'C2-M': 'máquina de estados e preço calculado no servidor', 'C3-H': 'papéis (401 → 403 → 400), saldo por extrato e regras de resgate'},
}

def cab(P, sub1, codigo):
    return Doc(sub1, f"Módulo A – {P['nome']}", f"SPSKILLS_MA_{P['slug'].upper()}_{codigo}_2026")

def resumo(D, P):
    linhas = [('Item', 'Descrição', 'Pontos'), ('Geral', 'Estrutura de pastas, página índice, README e console', br(sum(g[4] for g in C.GERAL)))]
    for t in P['tarefas']: linhas.append((t['id'], t['titulo'], br(t['pts'])))
    linhas.append(('TOTAL', '', br(sum(g[4] for g in C.GERAL) + sum(t['pts'] for t in P['tarefas']))))
    D.tabela(linhas, [0.14, 0.68, 0.18], prot=1)

# ---------------------------------------------------------------- enunciado
def prova(P, out):
    D = cab(P, 'Projeto de revisão – Mini Projetos (Speed Test)', 'REVISAO')
    D.h('Introdução'); D.p(P['intro'])
    D.p('Neste módulo você deve implementar 9 mini projetos independentes: três de implementação de design (A), três de front-end (B) e três de back-end (C), cada área com uma tarefa fácil (E), uma média (M) e uma difícil (H).')
    D.h('Descrição do projeto')
    D.p('Tempo de referência: 3 horas, o mesmo de uma prova do Estadual. Como esta é uma prova de revisão mais difícil que a real, marque até onde chegou em 3 horas e depois termine o restante com calma, comparando com a resolução.')
    D.p('As 9 tarefas devem ser salvas dentro do diretório principal /XXX_modulo_a/ (onde XXX é o código CFP da escola). Crie uma subpasta para cada tarefa com o ID exato como nome:')
    D.code('/XXX_modulo_a/\n  index.html\n  A1-E/  A2-M/  A3-H/\n  B1-E/  B2-M/  B3-H/\n  C1-E/  C2-M/  C3-H/')
    D.s('Página índice')
    D.p('Crie /XXX_modulo_a/index.html com um link para cada mini projeto. Cada link mostra uma miniatura (captura de tela) e o título da tarefa. Para as tarefas C, o link aponta para um README com as instruções de execução e exemplos de requisição.')
    D.p('Os arquivos de cada tarefa estão na pasta assets, numa subpasta com o mesmo ID. Os vídeos mostram o resultado esperado: as legendas amarelas e o círculo do cursor só explicam o efeito e não fazem parte da página. Design.mp4 junta todos os vídeos.')
    for area in ('design', 'front', 'back'):
        D.h(AREA[area][0])
        for t in [x for x in P['tarefas'] if x['area'] == area]:
            D.s(f"{t['id']}: {t['titulo']}")
            D.p(t['desc'])
            D.p(t['tec'] + '.', 'Tecnologia: ')
            D.p('Requisitos:', None).runs[0].bold = True
            for k, r in enumerate(t['reqs'], 1): D.i(1, f'{k}. {r}')
            D.p('Arquivos fornecidos:', None).runs[0].bold = True
            for nome, desc in t['arquivos']: D.i(1, f'• {nome}: {desc}')
    D.h('Instruções ao competidor')
    for k, t in enumerate([
        'Publique tudo em http://000.000.00.00/XXX_modulo_a/ e teste pelo servidor (fetch e PHP não funcionam abrindo o arquivo direto do disco).',
        'Não use frameworks nem bibliotecas: HTML, CSS, JavaScript e PHP puros. As tarefas A não podem ter JavaScript.',
        'Onde o HTML vem pronto (estrutura travada), não altere o index.html: escreva só o style.css que ele já referencia.',
        'Cada pasta é independente: não reaproveite arquivos de outra tarefa por caminho relativo.',
        'Nas tarefas C, os arquivos JSON fornecidos são o “banco”. Dê permissão de escrita a eles no servidor Linux (chmod 666) e mantenha as mensagens de erro exatamente como no enunciado.',
        'As tarefas C são testadas com Postman, sem olhar o código. Status e corpo de resposta valem nota.',
        'Mantenha o Console do navegador sem erros nas tarefas A e B.'], 1):
        D.i(0, f'{k}. {t}')
    D.h('Resumo da avaliação'); resumo(D, P)
    D.save(out)

# ---------------------------------------------------------------- guia do avaliador
def guia(P, roteiro, out):
    D = cab(P, 'Guia do avaliador e roteiro', 'GUIA_AVALIADOR')
    D.h('Uso deste guia')
    D.p('Documento do avaliador. A solução de referência completa está em solucao-comentada/XXX_modulo_a/ e as coleções do Postman em gabarito-avaliador/postman/. Avalie os aspectos J antes dos aspectos M de cada tarefa (Regra 9.4.1).')
    D.p('Os pontos são os mesmos da CIS (CIS_Modulo_A_' + P['slug'].capitalize() + '.xlsx). Na coluna O da CIS, digite a nota obtida; na coluna Q, a evidência.')
    D.h('Pontos fracos do Eduardo cobertos')
    D.tabela([('Tarefa', 'O que treina', 'Pontos')] + [(t['id'], FOCO[P['slug']][t['id']], br(t['pts'])) for t in P['tarefas']], [0.14, 0.68, 0.18])
    D.h('Preparação')
    for k, t in enumerate([
        'Abra http://000.000.00.00/XXX_modulo_a/ no Chrome com o DevTools aberto (Console). Deixe o Console aberto em todas as tarefas A e B.',
        'Tenha os vídeos de referência abertos (pasta assets de cada tarefa). Para comparar, assista antes de testar.',
        'Tarefas A: confira no DevTools que não há <script>. Para reduced motion: DevTools > Ctrl+Shift+P > “Emulate CSS prefers-reduced-motion: reduce”. Para 375 px: modo dispositivo (Ctrl+Shift+M), largura 375.',
        'Tarefas C: no Postman, File > Import e escolha collection_c1e.json, collection_c2m.json e collection_c3h.json. Em cada coleção, aba Variables, ajuste baseUrl para http://000.000.00.00/XXX_modulo_a/<ID> e salve (Ctrl+S). Rode as requisições na ordem: as que fazem login guardam o token sozinhas.',
        'Antes de rodar cada coleção C, restaure os JSON originais copiando os arquivos da pasta assets (as requisições criam reservas, pedidos e resgates). tokens.json volta a ser [].',
        'O Windows do avaliador deve estar no fuso de Brasília: datas “dd/mm/aaaa HH:MM” e “resgates de hoje” dependem disso.'], 1):
        D.i(0, f'{k}. {t}')
    D.h('Geral (1,50)')
    D.tabela([('Aspecto', 'Como verificar', 'Dedução', 'Máx.')] + [(g[1], g[3], g[2] or '', br(g[4])) for g in C.GERAL], [0.36, 0.3, 0.24, 0.1])
    for area in ('design', 'front', 'back'):
        D.h(AREA[area][0])
        for t in [x for x in P['tarefas'] if x['area'] == area]:
            D.s(f"{t['id']}: {t['titulo']} ({br(t['pts'])})")
            D.tabela([('Tipo', 'Aspecto', 'Como verificar', 'Dedução', 'Máx.')] +
                     [(a[0], a[1], a[3], a[2] or 'Escala 0 a 3', br(a[4])) for a in t['cis']], [0.07, 0.33, 0.3, 0.2, 0.1])
            for a in t['cis']:
                if a[5]:
                    D.p('Escala do aspecto J:', None).runs[0].bold = True
                    for k, txt in enumerate(a[5]): D.i(1, f'{k}: {txt}')
            if t['id'] in roteiro:
                D.p(f"Roteiro de requisições (coleção collection_{t['id'].replace('-', '').lower()}.json):", None).runs[0].bold = True
                linhas = [('#', 'Requisição', 'Status', 'Conferir')]
                for n, r in enumerate(roteiro[t['id']], 1):
                    nome, m, rota, auth, corpo, espera, confere = r[:7]
                    extra = f' · token {auth}' if auth and auth != 'abc' else (' · Bearer abc' if auth else '')
                    linhas.append((str(n), f'{nome}\n{m} {rota}{extra}', str(espera), confere))
                D.tabela(linhas, [0.06, 0.4, 0.1, 0.44])
    D.h('Resumo'); resumo(D, P)
    D.p('WSOS: 1 (organização) = 1,50; 3 (design) = 4,50; 4 (front-end) = 4,50; 5 (back-end) = 4,50. Total 15,00.')
    D.save(out)

# ---------------------------------------------------------------- resolução comentada
def resolucao(P, out):
    D = cab(P, 'Resolução comentada', 'RESOLUCAO')
    D.h('Como estudar este projeto')
    for k, t in enumerate([
        'Abra a solução no servidor (pasta XXX_modulo_a/) e use cada tarefa antes de ler o código. Compare com o vídeo de referência.',
        'Leia o código na ordem: index.html, style.css, script.js (ou index.php). Os comentários explicam cada decisão e o motivo.',
        'Para cada tarefa, leia as ideias-chave abaixo e tente refazer do zero, sem olhar, em no máximo o tempo indicado. Só depois compare.',
        'Nas tarefas C, rode a coleção do Postman (ou os exemplos do README) e veja como cada if do código corresponde a uma linha do roteiro.',
        'Repare nos padrões que se repetem entre as tarefas: um único estado + render() no JavaScript; uma função responder() e validações na ordem do enunciado no PHP; @property e variáveis CSS para animar qualquer número.'], 1):
        D.i(0, f'{k}. {t}')
    TEMPO = {'E': '15 min', 'M': '25 min', 'H': '40 min'}
    for area in ('design', 'front', 'back'):
        D.h(AREA[area][0])
        for t in [x for x in P['tarefas'] if x['area'] == area]:
            sol = f"{R}/{'p1' if P is C.P1 else 'p2'}/sol/XXX_modulo_a/{t['id']}"
            D.s(f"{t['id']}: {t['titulo']}")
            thumb = f"{os.path.dirname(sol)}/thumbs/{t['id']}.jpg"
            if os.path.exists(thumb): D.img(thumb, 9.5)
            D.p(FOCO[P['slug']][t['id']] + '.', 'O que treina: ')
            arqs = sorted(f for f in os.listdir(sol) if not f.startswith('.') and f != 'images') + (['.htaccess'] if os.path.exists(f'{sol}/.htaccess') else [])
            D.p(', '.join(arqs) + ('  (+ images/)' if os.path.isdir(f'{sol}/images') else ''), 'Arquivos da solução: ')
            D.p(f"Meta para refazer sozinho: {TEMPO[t['id'][-1]]}.", None)
            D.p('Ideias-chave:', None).runs[0].bold = True
            for r in t['resol']: D.i(1, '• ' + r)
    D.h('Erros comuns que esta revisão evita')
    for t in ['Tarefas A: animar uma variável sem registrar com @property (o valor pula); usar :focus em vez de :focus-visible; esquecer prefers-reduced-motion; scroll horizontal em 375 px por um elemento fora da tela (use clip-path ou visibility em vez de translate).',
              'Tarefas B: espalhar o estado em várias variáveis e atualizar a tela em vários lugares (use um estado e um render); não devolver o foco ao fechar modal; guardar dinheiro em reais com vírgula (use centavos inteiros e Intl.NumberFormat); confiar na extensão do arquivo.',
              'Tarefas C: validar fora da ordem do enunciado; responder 400 antes do 401/403; redirecionar (302) em vez de 401; apagar a linha ao cancelar; guardar saldo em vez de calcular; esquecer o fuso America/Sao_Paulo; montar data com strtotime em texto dd/mm/aaaa (use DateTime::createFromFormat + checkdate).']:
        D.i(0, '• ' + t)
    D.save(out)

if __name__ == '__main__':
    for P, rot, k in ((C.P1, RT.P1, 'p1'), (C.P2, RT.P2, 'p2')):
        nome = P['slug'].capitalize()
        o = f'{R}/out/{k}'
        prova(P, f'{o}/Projeto_Teste_Modulo_A_{nome}.docx')
        guia(P, rot, f'{o}/Guia_Avaliador_Modulo_A_{nome}.docx')
        resolucao(P, f'{o}/Resolucao_Comentada_Modulo_A_{nome}.docx')
    print('ok')
