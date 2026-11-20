import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
from cis_pulso import SUB, TOTAL
OUT = sys.argv[1]
f = lambda v: f'{v:.2f}'.replace('.', ',')
D = Doc('Guia do avaliador – roteiro de teste e gabarito', 'Módulo E – Estúdio Pulso: academia e aulas coletivas', 'SPSKILLS_ME_PULSO_GUIA_AVALIADOR')
D.h('Uso deste guia')
D.p('Documento só para o avaliador e para a revisão depois da prova. A solução de referência comentada está em solucao/ (abra solucao/LEIA-ME-SOLUCAO.md: ele liga cada requisito ao arquivo e à função que o resolve).')
D.p('A prova é a versão Vue do Módulo E, bem mais pesada que o simulado Estadual/Jacareí, montada em cima dos pontos fracos do Eduardo: interação de estado (modal com teclado e foco, abas, acordeão, carrossel, paginação, filtros, tema), regras de estado no cliente (limite por dia, conflito de horário, prazo de cancelamento), formato de data e fuso, gráficos e efeitos só com CSS e layout em 375 px. Ela também cobre o que o Vue cobra na prova: rotas com guarda, rota filha, estado global, computed/watch, Transition/TransitionGroup e Teleport.')

D.h('Distribuição dos pontos')
linhas = [('Subcritério', 'Nome', 'Pontos')]
for s in SUB: linhas.append((s[0], s[1], f(sum(a[5] for a in s[2]))))
linhas.append(('TOTAL', '', f(TOTAL)))
D.tabela(linhas, [0.16, 0.64, 0.2], prot=1)
n = sum(len(s[2]) for s in SUB); j = sum(1 for s in SUB for a in s[2] if a[0] == 'J')
D.p(f'São {n} aspectos, {n - j} de medição e {j} de julgamento. WSOS 3 (maquetação) = {f(sum(a[5] for s in SUB for a in s[2] if a[4] == 3))} e WSOS 4 (front-end) = {f(sum(a[5] for s in SUB for a in s[2] if a[4] == 4))}.')

D.h('Preparação')
D.i(0, '1. Use a URL publicada pelo competidor no Chrome, com o DevTools aberto (Console e Rede) e o Windows no fuso de Brasília. Instale a extensão Vue DevTools se quiser ver o estado.')
D.i(0, '2. Comece com o armazenamento limpo (Application > Storage > Clear site data). Conta de teste: bia@pulso.com / Pulso2026!.')
D.i(0, '3. Os arquivos para a foto do perfil e para o importar do treino estão em assets/arquivos-teste/.')
D.i(0, '4. O "agora" da prova é terça 08/12/2026 08:00. Se a solução usar a data real, as regras de reserva ficam erradas: anote em E2 e continue avaliando.')
D.i(0, '5. Para animações, compare com design/videos/; para estados, com design/estados/.')

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
 ('Números do Início', '34 aulas por semana, 6 modalidades, 6 professores, 30 vagas livres hoje'),
 ('Ainda hoje (terça 08/12, 08:00)', '08:30 Yoga (12 vagas), 09:00 Funcional (Lista de espera), 12:00 Boxe (6 vagas), 18:00 Spinning (1 vaga) e as seguintes'),
 ('Grade sem filtro', '34 aulas nesta semana (07/12 a 12/12); terça marcada como hoje'),
 ('Spinning / Forte / Só com vaga', '10 / 19 / 22 aulas'),
 ('#/aulas?modalidade=2,4&intensidade=1', '6 aulas (só as de Yoga, que é Leve)'),
 ('Sobreposição', 'Terça 18:00 Spinning e 18:30 Dança ficam lado a lado'),
 ('Aulas lotadas', 'Seg 07:00 e 19:00, Ter 06:30, 09:00 e 19:30, Qua 18:00, Qui 18:00'),
 ('Reservar Yoga terça 08:30', 'Confirmada; logo depois "Não é mais possível cancelar: faltam menos de 60 minutos para o início."'),
 ('Funcional terça 09:00 (com Yoga)', '"Conflito de horário com Yoga (08:30–09:30)."'),
 ('Boxe terça 19:30', 'Lista de espera, "Você é o 4º da fila"'),
 ('Spinning terça 18:00 (com Yoga e Boxe)', '"Você já tem 2 aulas neste dia (limite diário)."'),
 ('Aula terça 06:30', '"Esta aula já terminou."'),
 ('Planos mensal → anual', 'Essencial R$ 119,90 → 99,90 (economia R$ 240,00); Pulso+ R$ 179,90 → 149,90 (R$ 360,00); Ilimitado R$ 239,90 → 199,90 (R$ 480,00)'),
 ('Minha área da Bia', 'Plano Pulso+; 24 aulas no histórico; meta 12; rosca com Spinning 50%'),
 ('Foto', '.txt = "Formato não aceito. Use JPG, PNG ou WEBP."; 120 × 120 = "A foto tem 120 × 120 px; o mínimo é 200 × 200."'),
 ('Meta 50', '"A meta deve ser um número inteiro de 4 a 30."'),
 ('Treino', 'Máximo 10 exercícios; séries 1–6, repetições 1–30; tempo = Σ séries × (segundos_por_serie + 60) / 60'),
 ('Importar {"formato":"errado"}', '"O arquivo não tem a lista \"exercicios\"." e o treino não muda'),
 ('Login errado', '"E-mail ou senha incorretos." com a senha apagada'),
], [0.32, 0.68])

D.h('Pontos de atenção (onde o competidor costuma perder)')
D.i(0, '• Data "2026-12-08" lida com new Date() vira 07/12 às 21h no fuso de Brasília: semana e dia de hoje errados.')
D.i(0, '• Regras de reserva espalhadas pelo template, sem uma função que diga o que o botão faz; conflito testado só pelo horário de início.')
D.i(0, '• Modal como v-if na página em vez de rota filha: F5 e Voltar não funcionam; fechar perde os filtros.')
D.i(0, '• Filtros em ref() locais e na URL ao mesmo tempo (dois estados que se desencontram); router.push em vez de replace enchendo o histórico.')
D.i(0, '• Transition de página com mais de um elemento raiz (o Vue avisa no console e a transição não roda).')
D.i(0, '• Guarda de rota sem ?volta=, ou que aceita volta=//site.com (open redirect).')
D.i(0, '• Sair apagando o usuário antes de sair da Minha área: o template tenta ler usuario.nome e quebra.')
D.i(0, '• Drag and drop sem alternativa de teclado; ref de TransitionGroup usado como elemento (precisa de .$el).')
D.i(0, '• Logo em <img> com fill="currentColor": no <img> o SVG não herda a cor do texto (fica preto no tema escuro).')
D.i(0, '• Menu de baixo preso no cabeçalho em 375 px por causa de backdrop-filter no pai.')

D.h('Plano de tempo sugerido para o competidor (4 h)')
D.tabela([
 ('Bloco', 'Tempo', 'Entregável'),
 ('App Vue, rotas, guarda, store, carregar a API, tema', '0:00–0:35', 'E1 e E2'),
 ('Grade com CSS Grid, filtros na URL, semanas', '0:35–1:30', 'E4'),
 ('Modal por rota e regras de reserva', '1:30–2:15', 'E5'),
 ('Login e Minha área', '2:15–2:55', 'E6'),
 ('Treino (arrastar e teclado)', '2:55–3:30', 'E8'),
 ('Planos, Início, 375 px e publicar', '3:30–4:00', 'E7, E3, E9 e entrega'),
], [0.5, 0.2, 0.3])
D.p('Observação: Início e Planos ficaram no fim de propósito; valem pouco perto da grade, das regras de reserva e da Minha área.')
D.p('Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok')
