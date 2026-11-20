import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
OUT = sys.argv[1]
D = Doc('Projeto pronto comentado – material de revisão', 'Módulo G – Copa Code: a solução explicada', 'SPSKILLS_MG_COPACODE_SOLUCAO_2026')

D.h('Como usar este material')
D.p('Este é o Copa Code pronto, do jeito que uma equipe bem organizada entregaria: API em PHP com PDO e MySQL e front-end em Vue 3 sem build. O código completo está em solucao-comentada/TEAM_X_modulo_g, com comentários em cada parte importante. Este documento explica as decisões: como a equipe dividiu o trabalho, em que ordem atacou e como cada requisito difícil foi resolvido.')
D.p('Sugestão de estudo (cerca de 1 hora e 15 minutos):')
D.i(0, '1. Leia o enunciado (Projeto_Teste) e assista design/Design.mp4 (3 min e 13 s).')
D.i(0, '2. Rode a solução no XAMPP (ver LEIA-ME.md: importar banco/copacode.sql) e faça o fluxo do pitch: inscrever → entrar como organização → check-in da Sorocrew → gerar → placares → campeã no telão.')
D.i(0, '3. Leia este documento com o código aberto do lado. Cada seção diz o arquivo.')
D.i(0, '4. No fim, faça os seis "refaça sem olhar" da última seção.')
D.p('Diferença para o Zela Bairro (o outro projeto de revisão do Módulo G): lá tudo é JavaScript puro e os dados ficam em JSON. Aqui o banco é MySQL com chaves estrangeiras e o front-end é Vue. Os dois juntos cobrem as duas formas mais prováveis do Team Challenge.')

D.h('1. A decisão que ganha o Team Challenge: um arquivo por pacote, também em Vue')
D.p('Vue sem build não tem arquivos .vue. Cada tela vira um objeto JavaScript com setup() e template, num arquivo próprio. O index.html carrega tudo na ordem certa e o app.js, por último, junta as telas nas rotas:')
D.code('''<script src="js/vendor/vue.global.prod.js"></script>          <!-- cria a variável global Vue -->
<script src="js/vendor/vue-router.global.prod.js"></script>   <!-- cria VueRouter -->
<script src="js/api.js"></script>          <!-- P5: único lugar com fetch -->
<script src="js/store.js"></script>        <!-- P5: estado compartilhado -->
<script src="js/componentes.js"></script>  <!-- P5: <modal-base>, <selo-equipe> -->
<script src="js/inscricao.js"></script>    <!-- P2: const PaginaInscricao = {...} -->
<script src="js/equipes.js"></script>      <!-- P3 -->
<script src="js/chaveamento.js"></script>  <!-- P4 -->
<script src="js/partidas.js"></script>     <!-- P5 -->
<script src="js/app.js"></script>          <!-- P5: rotas + createApp(...).mount('#app') -->''')
D.tabela([
 ('Pacote', 'Arquivos'),
 ('P1 API', 'api/index.php, api/.htaccess, config.php, .htaccess, banco/'),
 ('P2 Inscrição', 'js/inscricao.js e o bloco "P2" de css/telas.css'),
 ('P3 Equipes', 'js/equipes.js e o bloco "P3" de css/telas.css'),
 ('P4 Chaveamento', 'js/chaveamento.js e o bloco "P4" de css/telas.css'),
 ('P5 Base e Partidas', 'index.html, js/api.js, js/store.js, js/componentes.js, js/app.js, js/partidas.js, css/base.css'),
], [0.3, 0.7])
D.p('Combinados feitos nos 20 minutos de planejamento (estão no PLANO.md):')
D.i(0, '• Um único estado: store, um reactive() global em store.js. Toda tela lê dele. Quem muda dado chama a API e grava a resposta no store (store.matches = await API.score(...)) ou chama recarregarEquipes().')
D.i(0, '• Nomes do banco e da API em inglês, iguais em todo lugar (teams, players, stage, score_a). Textos de tela em português.')
D.i(0, '• A constante FASES liga o nome do banco ao da rota e ao da tela: quarterfinal ↔ quartas ↔ "Quartas de final".')
D.i(0, '• Componentes comuns do P5 com a "assinatura" combinada antes: <modal-base :aberto titulo @fechar>, <selo-equipe :equipe grande>, toast(texto, tipo).')

D.h('2. Linha do tempo de uma equipe que termina')
D.tabela([
 ('Tempo', 'P1', 'P2 / P3 / P4', 'P5'),
 ('0:00–0:20', 'Planejamento junto, PLANO.md', '', ''),
 ('0:20–0:50', 'Importa o banco; roteador; GET schools/teams/matches; login', 'Telas com uma lista de exemplo no formato do contrato', 'index.html, store, rotas, casca, modal, toast'),
 ('0:50–1:20', 'POST teams (422/409 + transação), check-in, bracket, score', 'Trocam o exemplo pela API; regras principais', 'Login, carregando/erro, Partidas'),
 ('1:20', 'Integração 1: P5 junta, publica e todos testam no servidor', '', ''),
 ('1:20–2:00', 'Revisão dos códigos HTTP com o script de curl', 'Animações, caminho, telão', '768 e 375 px, contagem, abas'),
 ('2:00–2:30', 'Integração 2, publicação, reimportar o banco, fluxo do pitch, ensaio. Nada novo.', '', ''),
], [0.15, 0.3, 0.3, 0.25])

D.h('3. P1 – API com PDO (api/index.php)')
D.s('3.1 Conexão e um atalho para consultas')
D.p('Três opções do PDO evitam metade dos problemas: erro vira exceção, linhas voltam como array associativo e números voltam como número (sem isso, "id": "1" chega como texto no front).')
D.code('''$pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
function q(string $sql, array $p = []): PDOStatement {
    $st = db()->prepare($sql); $st->execute($p); return $st;   // sempre com ?, nunca concatenando
}''')
D.p('No fim do arquivo, um try/catch em volta do roteador transforma qualquer PDOException em 500 com mensagem genérica. O detalhe vai para error_log. Mostrar $e->getMessage() ao navegador entrega nome de tabela e usuário do banco.')

D.s('3.2 Equipes com jogadores sem "N+1"')
D.p('O jeito ingênuo é buscar as equipes e, dentro do foreach, buscar os jogadores de cada uma: 10 equipes = 11 consultas. A solução faz duas consultas e agrupa em PHP:')
D.code('''$ids = array_column($linhas, 'id');
$marcas = implode(',', array_fill(0, count($ids), '?'));            // "?,?,?"
$jogadores = q("SELECT ... FROM players WHERE team_id IN ($marcas)
                ORDER BY FIELD(role, 'captain', 'player', 'substitute'), id", $ids)->fetchAll();
foreach ($jogadores as $j) {
    $j['age'] = idade($j['birth_date']);          // idade em 28/11/2026, não hoje
    $porEquipe[$j['team_id']][] = $j;
}''')
D.p('A idade usa DateTimeImmutable::diff()->y contra a data do torneio. É a mesma regra que o front usa em idadeNoTorneio(): se as duas não baterem, o formulário aceita e a API recusa.')

D.s('3.3 422 com erros de itens de lista')
D.p('Todos os erros entram no mesmo array antes de responder. Para os jogadores, a chave leva a posição na lista: o front sabe exatamente qual campo pintar de vermelho.')
D.code('''foreach (array_values($jogadores) as $i => $j) {
    if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $nick)) $erros["players.$i.nickname"] = 'Nick com 3 a 20 ...';
    elseif (isset($vistos[strtolower($nick)]))       $erros["players.$i.nickname"] = 'Nick repetido na equipe.';
    ...
}
if ($erros) erro(422, 'Dados inválidos.', $erros);''')
D.p('Data inválida: createFromFormat("!Y-m-d") aceita 2010-02-31 e "corrige" para março. Por isso a solução compara o resultado formatado com o texto original.')

D.s('3.4 409 só depois do 422, e a gravação numa transação')
D.p('Regra de negócio (nome repetido, escola com 2 equipes, inscrições fechadas, nick em outra equipe) só é conferida quando o formato já está certo. A ordem 401 → 404 → 422 → 409 é cobrada em toda prova de API.')
D.code('''db()->beginTransaction();
q('INSERT INTO teams ...', [...]);  $id = (int)db()->lastInsertId();
foreach ($jogadores as $j) q('INSERT INTO players ...', [$id, ...]);
db()->commit();     // se um INSERT falhar, o catch faz rollBack: não sobra equipe sem jogador''')
D.p('Excluir equipe é um DELETE só: os jogadores saem juntos pelo ON DELETE CASCADE que já está no banco. Ler as chaves estrangeiras do .sql nos primeiros minutos mostra isso.')

D.s('3.5 Chaveamento: criar de trás para frente')
D.p('Cada partida guarda para onde o vencedor vai (next_match_id) e em que lado (next_slot). Se a final for criada primeiro, as semis já nascem sabendo o id dela, e as quartas sabem o id das semis:')
D.code('''$final = $ins('final', 1, null, null, '17:00', null, null);
$semi1 = $ins('semifinal', 1, null, null, '14:00', $final, 'a');
$semi2 = $ins('semifinal', 2, null, null, '15:00', $final, 'b');
$s = fn($n) => $ids[$n - 1];                  // seed n = n-ésimo check-in
$ins('quarterfinal', 1, $s(1), $s(8), '09:00', $semi1, 'a');
$ins('quarterfinal', 2, $s(4), $s(5), '10:00', $semi1, 'b');
$ins('quarterfinal', 3, $s(2), $s(7), '11:00', $semi2, 'a');
$ins('quarterfinal', 4, $s(3), $s(6), '12:00', $semi2, 'b');''')
D.p('O pareamento 1×8, 4×5 / 2×7, 3×6 faz os dois melhores só se encontrarem na final. O status da partida (waiting, scheduled, finished) não fica no banco: é calculado na resposta, então nunca fica desatualizado.')

D.s('3.6 Placar: validar o par, avançar o vencedor, travar a correção')
D.code('''if (!is_int($a) || !is_int($b) || !in_array([$a, $b], [[2,0],[2,1],[1,2],[0,2]], true)) erro(422, ...);
if (!$m['team_a_id'] || !$m['team_b_id']) erro(409, 'A partida ainda não tem as duas equipes definidas.');
if ($m['next_match_id'] && <próxima já tem winner_id>) erro(409, 'A próxima partida já tem resultado...');
$col = $m['next_slot'] === 'a' ? 'team_a_id' : 'team_b_id';
q("UPDATE matches SET $col = ? WHERE id = ?", [$vencedor, $m['next_match_id']]);''')
D.p('A lista de pares válidos é mais curta e mais segura que uma conta (">= 2", "soma <= 3"...). A resposta devolve a lista inteira de partidas: o front grava em store.matches e todas as telas se atualizam sozinhas.')

D.h('4. P5 – a base Vue que todos usam')
D.s('4.1 Vue sem build')
D.p('Com o build global, as funções vêm do objeto Vue. Cada arquivo base desestrutura o que usa uma vez (store.js pega reactive e computed; componentes.js pega ref, watch, nextTick, onMounted, onUnmounted), e as telas carregadas depois usam esses nomes direto. Componente registrado em components: { ModalBase } vira a tag <modal-base> no template.')
D.s('4.2 Estado compartilhado e derivados')
D.code('''const store = reactive({ schools: [], teams: [], matches: [], org: JSON.parse(sessionStorage.getItem('copa-org') || 'null'),
                         carregando: true, erro: '', toasts: [] });
const derivados = {
  confirmadas: computed(() => store.teams.filter((t) => t.status === 'confirmed').length),
  chaveamentoGerado: computed(() => store.matches.length > 0),
  campeao: computed(() => { /* final com winner_id → a equipe vencedora */ }),
};''')
D.p('Regra que evita bug: nenhuma tela guarda cópia de equipe ou partida num ref() próprio. Se a tela Partidas lança um placar, a tela Chaveamento já está certa quando a pessoa chega lá. No template, derivados.campeao.value leva .value porque o computed está dentro de um objeto comum (não é desembrulhado).')
D.s('4.3 Rotas, link ativo e foco')
D.code('''{ path: '/partidas/:fase(quartas|semis|final)', component: PaginaPartidas },
{ path: '/:qualquer(.*)*', redirect: '/equipes' },
// link "Partidas" ativo também em /partidas/semis:
const ativo = (base) => route.path.startsWith(base);
router.afterEach((to, from) => {
  document.title = `${to.meta.titulo} – Copa Code`;
  const tela = (r) => r.path.split('/')[1];
  if (from.matched.length && tela(to) !== tela(from)) nextTick(() => document.getElementById('conteudo')?.focus());
});''')
D.p('O if do afterEach é a correção de um bug real encontrado no teste desta solução: os filtros de Equipes e as abas de Partidas também mudam a rota. Sem o if, a cada letra digitada na busca o foco pulava para o <main>.')
D.p('A transição entre telas usa :key="route.path.split(\'/\')[1]" no <component>: trocar de aba em Partidas não repete a animação da tela inteira.')
D.s('4.4 Modal com <dialog> controlado por prop')
D.code('''watch(() => props.aberto, async (abrir) => {
  await nextTick();
  if (abrir && !dialog.value.open) { origem = document.activeElement; dialog.value.showModal(); }
  else if (!abrir && dialog.value.open) {
    fechando.value = true;                       // classe com animação de saída
    setTimeout(() => { dialog.value.close(); origem?.focus(); }, 180);
  }
});
// @cancel (Esc): e.preventDefault() e emite 'fechar' -> quem manda é a prop, não o navegador
// @click no próprio <dialog> (e.target === dialog) = clique no fundo''')
D.p('showModal() já prende o Tab dentro do modal e cria o ::backdrop. O cuidado é não deixar o Esc fechar o <dialog> por conta própria: a prop continuaria true e o modal não abriria de novo.')
D.s('4.5 Datas sem erro de fuso e o 401 global')
D.p('As datas chegam como "2026-11-28 09:00:00". dataBR() só reordena o texto; nada de new Date("2026-11-28"), que é meia-noite UTC e vira 27/11 no Brasil. Para a contagem regressiva, paraDate() monta new Date(a, m - 1, d, h, mi) no fuso local.')
D.p('No api.js, qualquer resposta 401 com alguém logado limpa store.org e o sessionStorage. Assim "401 em qualquer tela desloga" fica resolvido num lugar só.')

D.h('5. P2 – Inscrição (js/inscricao.js)')
D.s('5.1 Lista dinâmica com chave estável')
D.p('Cada jogador nasce com um uid. O v-for usa :key="p.uid" e não o índice: quando a linha do reserva sai, o Vue sabe qual <li> animar e os campos digitados não trocam de linha.')
D.s('5.2 Uma validação, as mesmas chaves do servidor')
D.code('''const erros = computed(() => {            // recalcula sozinho a cada tecla
  const e = {};
  if (!/^[A-Z0-9]{2,4}$/.test(form.tag)) e.tag = 'A tag deve ter de 2 a 4 letras ou números.';
  form.players.forEach((p, i) => { ... e[`players.${i}.nickname`] = ... });
  return e;
});
const erro = (campo) => errosServidor.value[campo] || (tocados[campo] ? erros.value[campo] : '');''')
D.p('Como o 422 da API usa as mesmas chaves (players.2.nickname), o mesmo erro(campo) mostra tanto o erro do cliente quanto o do servidor, sem nenhum código extra. tocados guarda quem já perdeu o foco; no envio, todos viram tocados e o foco vai para o primeiro [aria-invalid="true"].')
D.s('5.3 Capitão e tag')
D.p('O rádio de capitão usa um computed com get e set: get acha o índice do captain; set muda o role de todos os titulares. A tag usa um watch que reescreve o valor (maiúsculas, só A-Z0-9, até 4). A linha do reserva entra e sai com <TransitionGroup name="linha">; a classe linha-leave-active com position: absolute deixa as outras linhas subirem suaves.')

D.h('6. P3 – Equipes (js/equipes.js)')
D.s('6.1 Três filtros na URL com uma função')
D.code('''const filtro = (nome) => computed({
  get: () => route.query[nome] || '',
  set: (v) => router.replace({ query: { ...route.query, [nome]: v || undefined } }),
});
const busca = filtro('busca'), escola = filtro('escola'), status = filtro('status');''')
D.p('O v-model do input escreve na URL e lê da URL. F5, link colado e Voltar funcionam sem nenhuma linha a mais. replace (não push) para o Voltar não desfazer letra por letra; undefined tira o parâmetro vazio da URL.')
D.s('6.2 Acordeão, exclusão e gerar')
D.p('Acordeão: um único ref aberta com o id. aberta === t.id decide aria-expanded e a classe. A altura anima com grid-template-rows: 0fr → 1fr (o filho com overflow: hidden), que funciona com qualquer quantidade de jogadores.')
D.p('Excluir: o botão do modal fica :disabled="confirmacao.toUpperCase() !== excluindo.tag". Gerar: :disabled="derivados.confirmadas.value !== 8"; depois do 201, grava store.matches, recarrega as equipes (agora com seed) e faz router.push("/chaveamento").')

D.h('7. P4 – Chaveamento (js/chaveamento.js)')
D.s('7.1 Pares e conectores')
D.code('''const pares = (lista) => lista.reduce((acc, m, i) => (i % 2 ? acc[acc.length - 1].push(m) : acc.push([m]), acc), []);
/* CSS: cada coluna tem a mesma altura; cada par ocupa flex: 1 e centraliza as 2 partidas.
   O colchete é um ::after com borda (top: 25%; bottom: 25%) e a linha de chegada um ::before. */''')
D.p('Com space-around, os centros das duas partidas de um par ficam a 25% e 75% da altura do par, exatamente onde o colchete começa e termina. As semis ocupam a coluna inteira, então caem no meio de cada par das quartas sem nenhum cálculo de pixel.')
D.s('7.2 Caminho, chegada e campeã')
D.p('foco guarda o id da equipe sob o mouse ou o foco (@mouseenter e @focusin). classeLado(m, lado) devolve { venceu, perdeu, caminho, apagado } comparando com ele: uma função, todas as partidas.')
D.p('A animação de chegada é um <Transition name="chegar" mode="out-in"> em volta do nome com :key="equipe?.id || \'vazio\'". Quando o lado deixa de ser "A definir", a key muda e o Vue anima a saída do antigo e a entrada do novo. O confete são 14 <span> com --x, --d e --c diferentes e uma única @keyframes.')
D.s('7.3 Modo telão')
D.code('''async function alternarTelao() {
  if (!document.fullscreenElement) await area.value.requestFullscreen?.();
  else await document.exitFullscreen();
}
const aoMudarTela = () => { telao.value = document.fullscreenElement === area.value; };
onMounted(() => document.addEventListener('fullscreenchange', aoMudarTela));
onUnmounted(() => document.removeEventListener('fullscreenchange', aoMudarTela));''')
D.p('O estado telao vem do evento, não do clique: a pessoa pode sair com Esc e o botão continua certo.')

D.h('8. P5 – Partidas (js/partidas.js)')
D.s('8.1 Aba = rota')
D.p('faseAtual é um computed de route.params.fase. Não existe ref de "aba ativa": a URL é a fonte da verdade. As setas fazem router.replace para a fase vizinha e, no nextTick, focam o botão da nova aba (padrão ARIA: só a aba ativa tem tabindex="0").')
D.s('8.2 Relógio que não vaza')
D.code('''const agora = ref(Date.now());
let relogio = null;
onMounted(() => { relogio = setInterval(() => (agora.value = Date.now()), 1000); });
onUnmounted(() => clearInterval(relogio));       // sem isto, cada visita cria mais um relógio
const falta = computed(() => { const ms = paraDate(proxima.value.starts_at) - agora.value; ... });''')
D.p('Só agora muda a cada segundo; falta e o template recalculam sozinhos. proxima é a primeira partida não encerrada em ordem de horário.')
D.s('8.3 Placar')
D.p('OPCOES = [[2,0],[2,1],[1,2],[0,2]]: o modal mostra só o que a API aceita, então o 422 nunca aparece na tela. O botão só existe quando há organização logada e as duas equipes definidas (podeLancar).')

D.h('9. Onde esta solução ataca os seus pontos fracos')
D.tabela([
 ('Ponto fraco registrado', 'Onde está resolvido aqui'),
 ('Interação JS de estado (modal, abas, acordeão, filtros)', 'componentes.js (modal), equipes.js (filtros na URL, acordeão), partidas.js (abas na rota)'),
 ('Regras de estado no back-end (401, 409, cascata)', 'api/index.php: ordem 401 → 404 → 422 → 409, transações, ON DELETE CASCADE, correção travada'),
 ('Formato de data', 'store.js: dataBR, dataHoraBR, paraDate e idadeNoTorneio, sem new Date("AAAA-MM-DD")'),
 ('375 px e acessibilidade', 'base.css (barra inferior, chave com rolagem própria), aria-current, aria-pressed, aria-expanded, padrão de abas'),
 ('Efeitos CSS', 'telas.css: conectores com pseudo-elementos, caminho, confete, troféu, acordeão com grid-template-rows'),
 ('Leitura do enunciado e tempo', 'PLANO.md, contrato lido junto, integrações marcadas'),
], [0.45, 0.55])

D.h('10. Checklist dos últimos 30 minutos (para o pitch não falhar)')
for t in ['Todos os arquivos juntos na pasta TEAM_X_modulo_g e publicados; config.php com o usuário e a senha do MySQL do servidor.',
          'Abrir http://IP/TEAM_X_modulo_g/ em outra máquina: aba Rede sem vermelho, Vue carregado de js/vendor.',
          'config.php e banco/copacode.sql dando 403 no navegador.',
          'Reimportar o banco e fazer o fluxo inteiro uma vez: inscrever → check-in → gerar → placares → campeã → telão.',
          'Console sem erro em todas as telas, também em 375 px.',
          'Reimportar o banco de novo antes de apresentar.',
          'Ensaiar quem fala o quê (roteiro no PLANO.md).']:
    D.i(0, '☐ ' + t)

D.h('11. Refaça sem olhar (20 a 25 minutos cada)')
for k, t in enumerate([
 'Escreva criarEquipe(): 422 com players.N.campo, os 409 na ordem do contrato e a gravação numa transação. Teste com o script de curl.',
 'Escreva gerarChaveamento() criando da final para as quartas e lancarPlacar() com o avanço pelo next_slot e a correção travada.',
 'Monte um app Vue sem build com duas telas em arquivos separados, rotas com hash, link ativo com startsWith e título da aba no afterEach.',
 'Faça o <modal-base> com <dialog>, prop aberto, Esc, fundo, animação de saída e foco de volta.',
 'Faça três filtros (texto, select, chips) gravados na URL com computed get/set e router.replace.',
 'Faça abas ligadas à rota com setas e uma contagem regressiva com setInterval destruído no onUnmounted.'], 1):
    D.i(0, f'{k}. {t}')
D.p('Elaborado por Raul Porto Lopes (Avaliador) – treino SP Skills 2026, ocupação 17 Tecnologias Web.')
D.save(OUT)
print('ok', OUT)
