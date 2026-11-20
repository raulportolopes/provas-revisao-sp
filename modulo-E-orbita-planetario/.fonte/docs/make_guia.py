import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_orbita import SUB, TOTAL
OUT = sys.argv[1]
f = lambda v: f'{v:.2f}'.replace('.', ',')
D = Doc('Guia do avaliador – roteiro de teste e gabarito', 'Módulo E – Órbita: Planetário Paulista', 'SPSKILLS_ME_ORBITA_GUIA_AVALIADOR')
D.h('Uso deste guia')
D.p('Documento só para o avaliador e para a revisão depois da prova. A solução de referência comentada está em solucao/ (abra solucao/LEIA-ME-SOLUCAO.md: ele liga cada requisito ao arquivo e à função que o resolve).')
D.p('A prova é uma versão bem mais pesada do Módulo E do simulado Estadual/Jacareí e foi montada em cima dos pontos fracos registrados do Eduardo: interação JS de estado (modal com teclado e foco, abas, acordeão, carrossel, paginação, filtros, tema), regras de estado no cliente, formato de data e fuso, efeitos CSS (cartão 3D, gráfico de barras no hover, efeito que segue o cursor) e layout em 375 px.')

D.h('Distribuição dos pontos')
linhas = [('Subcritério', 'Nome', 'Pontos')]
for s in SUB: linhas.append((s[0], s[1], f(sum(a[5] for a in s[2]))))
linhas.append(('TOTAL', '', f(TOTAL)))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)
n = sum(len(s[2]) for s in SUB); j = sum(1 for s in SUB for a in s[2] if a[0] == 'J')
D.p(f'São {n} aspectos, {n - j} de medição e {j} de julgamento. WSOS 3 (maquetação) = {f(sum(a[5] for s in SUB for a in s[2] if a[4] == 3))} e WSOS 4 (front-end) = {f(sum(a[5] for s in SUB for a in s[2] if a[4] == 4))}.')

D.h('Preparação')
D.i(0, '1. Use a URL publicada pelo competidor no Chrome, com o DevTools aberto (Console e Rede) e o Windows no fuso de Brasília.')
D.i(0, '2. Antes de cada bloco de testes, limpe o armazenamento (DevTools > Application > Storage > Clear site data). O splash só aparece com o sessionStorage limpo.')
D.i(0, '3. Para os aspectos de animação, compare com os vídeos de design/videos/ (os mesmos do competidor). Para os estados, com design/estados/.')
D.i(0, '4. O "agora" da prova é sábado 05/12/2026 10:00. Se a solução usar a data real do computador, a programação inteira fica errada: anote em E2 e continue avaliando o resto normalmente.')

D.h('Roteiro de teste por aspecto')
for sid, nome, asp in SUB:
    D.s(f'{sid} – {nome} ({f(sum(a[5] for a in asp))} pt)')
    for k, (t, desc, extra, req, wsos, mx, jud) in enumerate(asp, 1):
        if t == 'M':
            D.i(0, f'{sid}.{k} [M {f(mx)}] {desc}.')
            D.i(1, f'Como testar: {req}. Dedução: {extra}.')
        else:
            D.i(0, f'{sid}.{k} [J {f(mx)}] {desc}.')
            D.i(1, 'Escala: ' + ' / '.join(f'{n} = {j}' for n, j in enumerate(jud)) + '.')

D.h('Dados esperados (gabarito)')
D.tabela([
 ('Teste', 'Resultado esperado'),
 ('Números do Início', '12 programas em cartaz, 40 sessões nos próximos 7 dias, 255 lugares livres hoje, 45% da semana vendida'),
 ('Carrossel (ordem)', 'Céu de Verão em São Paulo, Jornada ao Centro da Via Láctea, Sinfonia das Esferas, Pequenos Astronautas'),
 ('Chips de dia', 'Sáb 05/12, Dom 06/12, Seg 07/12 (Fechado, desabilitado), Ter 08/12 a Sex 11/12'),
 ('Programação sem filtro', '40 sessões, 7 páginas; primeira: Marte: Próxima Parada, Sáb 05/12/2026 · 10:30'),
 ('Busca "MARTE" / "eclipses"', '4 sessões cada'),
 ('Gênero Ciência', '12 sessões'),
 ('Período', 'Manhã 9, tarde 15, noite 16'),
 ('Classificação 14', '3 sessões de Noite de Terror Cósmico'),
 ('Só com lugares livres', '39 (a sessão 4, Jornada 05/12 20:30, está esgotada)'),
 ('Ter 08/12 + L, preço maior', '5: Céu de Verão (R$ 56,00), Sinfonia, Os Indígenas, Eclipses, Pequenos Astronautas'),
 ('Preço menor / maior', 'Pequenos Astronautas R$ 22,00 / Céu de Verão em São Paulo R$ 56,00'),
 ('Sessão 2 (Eclipses 05/12 13:00, Galileu)', 'C8, C9 e C11 → erro de lugar isolado em C10; com C10: C8 e C9 meia, C10 e C11 inteira = subtotal R$ 120,00, taxa R$ 9,60, total R$ 129,60'),
 ('Meias', '3 lugares → até 2 meias; 5 lugares → até 3 meias; 6 lugares → até 3 meias'),
 ('Acessível', 'H1, H2, H15 e H16 da Galileu são de cadeirante (C no layout; a fileira H tem 16 lugares)'),
 ('Cartão', '4242 4242 4242 4242 válido; 4242 4242 4242 4241 inválido (Luhn); 11/26 vencido, 01/28 válido'),
 ('CPF', '529.982.247-25 válido; 111.111.111-11 inválido'),
 ('Código da reserva', 'ORB-20261205-XXXX'),
 ('Cancelamento', 'Sessão 1 (Marte, 05/12 10:30): não pode cancelar (faltam 30 min). Sessão das 13:00 ou depois: pode'),
 ('Reservas de exemplo', 'Encerradas: ORB-20261128-K7Q2 (Auroras, R$ 51,84); Canceladas: ORB-20261203-M4X9'),
 ('Guia do céu', 'Júpiter dezembro = 98 (mês destacado)'),
], [0.32, 0.68])

D.h('Pontos de atenção (onde o competidor costuma perder)')
D.i(0, '• new Date("2026-12-05") no fuso de Brasília vira 04/12 às 21h: dia errado nos chips e nas datas. Montar a data com new Date(ano, mes - 1, dia).')
D.i(0, '• "agora" lido com o offset -03:00 e comparado com datas locais em computador com outro fuso: sessão das 10:30 aparece como já começada.')
D.i(0, '• Filtros que brigam (cada um filtra a lista original) e paginação que não volta para a página 1.')
D.i(0, '• Modal que navega só pelos cards da página atual; foco que não volta para o botão; Esc que não fecha.')
D.i(0, '• Mapa de lugares escrito à mão no HTML em vez de gerado do layout; número do lugar contando corredores.')
D.i(0, '• Meia-entrada sem arredondar para cima, ou que não se ajusta quando um lugar é removido.')
D.i(0, '• Cronômetro guardando os segundos restantes (reinicia no F5) em vez do horário de expiração.')
D.i(0, '• Abas e acordeão sem teclado; painéis fechados entrando no Tab.')
D.i(0, '• Menu fixo de baixo preso dentro do cabeçalho em 375 px porque o pai tem backdrop-filter ou transform.')
D.i(0, '• navigator.clipboard falha em http: precisa de alternativa (textarea + execCommand ou seleção do texto).')

D.h('Plano de tempo sugerido para o competidor (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('Estrutura, rotas, link ativo, tema e carregar a API', '0:00–0:30', 'E1 e E2'),
 ('Programação: estado único, filtros, ordem, paginação e URL', '0:30–1:20', 'E4'),
 ('Modal de detalhes', '1:20–1:45', 'E5'),
 ('Mapa de lugares e regras', '1:45–2:40', 'E6'),
 ('Pagamento em 3 passos', '2:40–3:15', 'E7'),
 ('Reservas e Guia do céu', '3:15–3:40', 'E8 e E9'),
 ('Carrossel, splash, efeitos, 375 px e publicar', '3:40–4:00', 'E3, E10 e entrega'),
], [0.5, 0.2, 0.3])
D.p('Observação: o carrossel e o splash ficaram no fim de propósito. Valem pouco perto de filtros, mapa e pagamento, e costumam comer tempo demais no começo da prova.')
D.p('Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
