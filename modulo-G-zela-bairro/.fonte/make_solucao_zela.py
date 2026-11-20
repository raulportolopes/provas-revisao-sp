import sys
sys.path.insert(0, sys.path[0])
from docbase import Doc
OUT = sys.argv[1]
D = Doc('Projeto pronto comentado – material de revisão', 'Módulo G – Zela Bairro: a solução explicada', 'SPSKILLS_MG_ZELABAIRRO_SOLUCAO_2026')

D.h('Como usar este material')
D.p('Este é o Zela Bairro pronto, do jeito que uma equipe bem organizada entregaria. O código completo está em solucao-comentada/TEAM_X_modulo_g, com comentários em cada parte importante. Este documento explica as decisões: por que a equipe dividiu assim, em que ordem atacou e como cada requisito difícil foi resolvido.')
D.p('Sugestão de estudo (cerca de 1 hora):')
D.i(0, '1. Leia o enunciado (Projeto_Teste) e assista design/Design.mp4 (3 min e 36 s).')
D.i(0, '2. Rode a solução no XAMPP (ver LEIA-ME.md) e faça o fluxo do pitch: abrir chamado com foto → painel → entrar como equipe → mover até concluir → indicadores.')
D.i(0, '3. Leia este documento com o código aberto do lado. Cada seção diz o arquivo.')
D.i(0, '4. No fim, faça os cinco "refaça sem olhar" da última seção.')

D.h('1. A decisão que ganha o Team Challenge: dividir por arquivo, não por tela')
D.p('Cinco pessoas no mesmo index.html e no mesmo style.css = conflito na hora de juntar. A equipe da solução dividiu por pacote, e cada pacote tem seus arquivos:')
D.tabela([
 ('Pacote', 'Arquivos'),
 ('P1 API', 'api/index.php, api/.htaccess, dados/, uploads/.htaccess'),
 ('P2 Painel', 'js/painel.js e o bloco "P2" de css/telas.css'),
 ('P3 Abrir chamado', 'js/novo-chamado.js e o bloco "P3" de css/telas.css'),
 ('P4 Mapa e indicadores', 'js/mapa.js, js/indicadores.js e o bloco "P4" de css/telas.css'),
 ('P5 Design e integração', 'css/tokens.css, css/layout.css, css/componentes.css, js/util.js, js/api.js, js/app.js, index.html (esqueleto)'),
], [0.3, 0.7])
D.p('Três combinados feitos nos 20 minutos de planejamento deixaram todo mundo trabalhar sem esperar ninguém:')
D.i(0, '• O contrato da API (já vinha pronto). Enquanto P1 não terminava, P2, P3 e P4 liam dados/seed/chamados.json, que tem exatamente o formato da resposta.')
D.i(0, '• Um único objeto Estado, em js/util.js, e uma função de desenho por tela (renderPainel, renderMapa, renderIndicadores). Quem muda dado, muda o Estado e chama o render.')
D.i(0, '• Nomes iguais em tudo: os status (aberto, triagem, execucao, concluido, cancelado) viram classes (.status--aberto, .pino--aberto, .coluna--aberto). Ninguém inventa nome na hora.')
D.p('O PLANO.md da solução mostra isso escrito, com os horários de integração e o roteiro do pitch. Ele vale 0,20 ponto e economiza 10 minutos de discussão no meio da prova.')

D.h('2. Linha do tempo de uma equipe que termina')
D.tabela([
 ('Tempo', 'P1', 'P2 / P3 / P4', 'P5'),
 ('0:00–0:20', 'Planejamento junto, PLANO.md', '', ''),
 ('0:20–0:50', 'Roteador + GET categorias e chamados + login', 'Telas com o seed', 'tokens.css, cabeçalho, rotas, modal base, api.js'),
 ('0:50–1:25', 'POST com upload, PATCH status, apoios, indicadores', 'Trocam seed por API; interações principais', 'Tema, toast, carregando/erro'),
 ('1:25', 'Integração 1: P5 junta, publica e todos testam no servidor', '', ''),
 ('1:25–2:00', 'Proteção das pastas, revisão dos códigos HTTP', 'Arrastar, teclado, gráficos', '768 e 375 px'),
 ('2:00–2:30', 'Integração 2, publicação, fluxo do pitch, ensaio. Ninguém começa nada novo.', '', ''),
], [0.15, 0.3, 0.3, 0.25])

D.h('3. P1 – API em PHP puro (api/index.php)')
D.s('3.1 Roteador: uma tabela de rotas')
D.p('O .htaccess manda qualquer endereço de api/ para o index.php com ?rota=. O PHP compara a rota com expressões regulares e o método. Se o caminho existe mas o método não, é 405; se o caminho não existe, 404.')
D.code('''$rotas = [
    ['GET',   '#^chamados$#',              fn() => listarChamados()],
    ['POST',  '#^chamados$#',              fn() => criarChamado()],
    ['PATCH', '#^chamados/(\\d+)/status$#', fn($id) => mudarStatus((int)$id)],
    ...
];
foreach ($rotas as [$m, $padrao, $acao]) {
    if (preg_match($padrao, $rota, $p)) {
        $achouCaminho = true;
        if ($m === $metodo) $acao(...array_slice($p, 1));
    }
}
$achouCaminho ? erro(405, 'Método não permitido.') : erro(404, 'Rota não encontrada.');''')
D.p('Armadilha do Apache: ele não repassa o cabeçalho Authorization ao PHP. Sem a linha abaixo no api/.htaccess, toda chamada com token dá 401 e a equipe perde meia hora procurando o erro no código.')
D.code('SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1')

D.s('3.2 Máquina de estados como tabela')
D.p('É a regra de estado que mais tirou pontos do Eduardo (PetLar, WSC Módulo C). Escrita como tabela, cada regra nova é uma linha, e a verificação é uma linha só:')
D.code('''const TRANSICOES = [
    'aberto'    => ['triagem', 'cancelado'],
    'triagem'   => ['execucao', 'cancelado', 'aberto'],
    'execucao'  => ['concluido', 'triagem'],
    'concluido' => [],
    'cancelado' => [],
];
if (!in_array($novo, TRANSICOES[$atual], true)) {
    erro(409, "Não é possível passar de \\"$atual\\" para \\"$novo\\".");
}''')
D.p('A ordem das verificações em mudarStatus é: 401 (quem é você) → 404 (o chamado existe) → 422 (o pedido é válido: status conhecido, nota quando exigida) → 409 (a transição é permitida no estado atual). Inverter a ordem dá código errado em algum caso do roteiro.')

D.s('3.3 422 com todos os erros')
D.p('Cada campo é validado e o erro vai para um array; só no fim, se o array não estiver vazio, sai o 422. Nunca "return" no primeiro erro.')
D.code('''$erros = [];
if (mb_strlen($titulo) < 5 || mb_strlen($titulo) > 80) $erros['titulo'] = '...';
if (mb_strlen($descricao) < 15) $erros['descricao'] = '...';
...
if ($erros) erro(422, 'Dados inválidos.', $erros);''')

D.s('3.4 Arquivo JSON com trava e upload seguro')
D.p('Dois moradores apoiando no mesmo segundo leriam o mesmo arquivo e o segundo apagaria o apoio do primeiro. flock(LOCK_EX) faz um esperar o outro. No upload, o tipo é conferido pelo conteúdo (finfo), não pela extensão, e o arquivo ganha nome aleatório (bin2hex(random_bytes(8))). A pasta uploads/ tem .htaccess que impede executar PHP, e dados/ tem "Require all denied" para ninguém baixar os hashes de senha.')

D.s('3.5 Campos calculados no servidor')
D.p('prazo_em, atrasado, concluido_no_prazo e apoios são calculados na API (função enriquecer). Assim o painel, o mapa e os indicadores mostram exatamente o mesmo número, sem cada colega fazer a conta do seu jeito.')

D.h('4. P5 – base que todos usam (js/util.js, js/api.js, js/app.js, css/)')
D.s('4.1 Datas sem erro de fuso')
D.p('new Date("2026-11-16") é lido como meia-noite em UTC, que no Brasil é 21h do dia 15. A solução não usa Date para exibir: quebra o texto.')
D.code('''function dataBR(texto) {            // "2026-11-16 19:40:00" -> "16/11/2026"
  const [d] = texto.split(' ');
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}''')
D.s('4.2 Modal com <dialog>')
D.p('showModal() já entrega fundo escuro (::backdrop), Esc, foco preso e o resto da página inerte. Falta fazer à mão três coisas:')
D.code('''dialog.addEventListener('click', e => { if (e.target === dialog) fecharModal(dialog); }); // clique no fundo
dialog.addEventListener('cancel', e => { e.preventDefault(); fecharModal(dialog); });     // Esc com animação
dialog.addEventListener('close', () => origem.focus());                                  // foco volta''')
D.p('E travar a rolagem de trás: body.sem-rolagem { overflow: hidden }.')
D.s('4.3 Tema sem piscar')
D.p('O tema salvo é aplicado num script pequeno dentro do <head>, antes de o CSS pintar. Se ficasse no fim do body, a página apareceria clara por um instante e depois escureceria.')
D.code('''<script>
  document.documentElement.dataset.tema = localStorage.getItem('zela-tema') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
</script>''')
D.p('O CSS inteiro usa variáveis; [data-tema="escuro"] só troca os valores delas.')
D.s('4.4 Três armadilhas de CSS e de navegador que a solução evita')
D.i(0, '• backdrop-filter no cabeçalho faz a barra inferior (position: fixed, filha do cabeçalho) ficar presa ao cabeçalho e aparecer no topo. No celular o cabeçalho perde o desfoque.')
D.i(0, '• [hidden] perde para display: flex de uma classe. A regra [hidden] { display: none !important } resolve de vez.')
D.i(0, '• crypto.randomUUID() e navigator.clipboard só existem em https ou localhost. No servidor da prova (http://IP) eles somem. A solução usa crypto.getRandomValues() e o caminho antigo de copiar (textarea + execCommand).')
D.s('4.5 Rotas e link ativo')
D.p('Uma função irPara(rota) faz tudo: mostra só a tela certa, coloca active e aria-current no link, muda o título da aba e chama o render daquela tela. hashchange e a carga inicial chamam a mesma função, então F5 e Voltar ficam certos sem código extra.')

D.h('5. P2 – Painel (js/painel.js)')
D.s('5.1 Filtros na URL sem trocar de tela')
D.p('history.replaceState troca o endereço sem disparar hashchange e sem criar entrada no histórico. Na volta (F5 ou link colado), lerRota() lê os parâmetros para o Estado e sincronizarFiltros() marca os controles.')
D.code('''const p = new URLSearchParams();
if (Estado.filtros.busca) p.set('busca', Estado.filtros.busca);
if (Estado.filtros.categoria) p.set('categoria', Estado.filtros.categoria);
if (Estado.filtros.atrasados) p.set('atrasados', '1');
history.replaceState(null, '', `#/painel${p.toString() ? '?' + p : ''}`);''')
D.s('5.2 Delegação de eventos')
D.p('Os cards são recriados a cada render, então listener colocado em cada botão se perde. Um único listener no #kanban descobre o que foi clicado com closest():')
D.code('''kanban.addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  if (e.target.closest('[data-detalhe]')) abrirDetalhe(...);
  if (e.target.closest('[data-mover]'))   abrirMudarStatus(...);
  if (e.target.closest('[data-apoiar]'))  apoiarChamado(...);
});''')
D.s('5.3 Arrastar e soltar que respeita a máquina de estados')
D.p('No dragstart, cada coluna ganha a classe "pode" ou "não pode" pela mesma tabela TRANSICOES (cópia da API só para a interface). O drop só acontece se o dragover for cancelado com preventDefault(), e ele só é cancelado nas colunas permitidas.')
D.code('''kanban.addEventListener('dragover', e => {
  const col = e.target.closest('.coluna--pode');
  if (col) { e.preventDefault(); col.classList.add('coluna--sobre'); }
});''')
D.p('Mesmo assim o servidor continua mandando: se alguém forçar uma transição pelo Postman, a API devolve 409.')

D.h('6. P3 – Abrir chamado (js/novo-chamado.js)')
D.s('6.1 Regras em um objeto')
D.code('''const REGRAS = {
  titulo: v => v.trim().length < 5 || v.trim().length > 80 ? 'O título deve ter entre 5 e 80 caracteres.' : '',
  categoria_id: v => !v ? 'Escolha uma categoria válida.' : '',
  ...
};
// ao enviar: valida TODOS (map + every), não para no primeiro
const ok = Object.keys(REGRAS).map(validarCampo).every(Boolean);''')
D.p('As mensagens são as do contrato. Se o servidor ainda assim devolver 422, o mesmo mostrarErro(campo, msg) põe a mensagem no lugar certo.')
D.s('6.2 Clique no mapa em porcentagem')
D.code('''const r = miniMapa.getBoundingClientRect();
const x = (e.clientX - r.left) / r.width * 100;
const y = (e.clientY - r.top) / r.height * 100;''')
D.p('Em porcentagem, o mesmo x/y serve para o mini-mapa do formulário, o do detalhe e o mapa grande, em qualquer largura de tela.')
D.s('6.3 Foto: FileReader e FormData')
D.p('FileReader.readAsDataURL gera a prévia. No envio, FormData leva campos e arquivo juntos; o Content-Type não é definido à mão (o navegador põe o boundary do multipart).')

D.h('7. P4 – Mapa e indicadores (js/mapa.js, js/indicadores.js)')
D.s('7.1 Destaque nos dois sentidos com uma função só')
D.code('''function destacar(id, rolarLista) {
  document.querySelectorAll('.pino.ativo, .item-mapa.ativo').forEach(el => el.classList.remove('ativo'));
  pino(id)?.classList.add('ativo');
  item(id)?.classList.add('ativo');
  if (rolarLista) item(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}''')
D.p('mouseover e focusin chamam destacar() tanto no pino quanto no item, então funciona com mouse e com teclado.')
D.s('7.2 Gráficos só com CSS')
D.p('O JavaScript só escreve números em variáveis CSS; quem desenha e anima é o CSS.')
D.code('''<li class="barra" style="--v:75;--i:2">...</li>

.barra__valor { width: 0; transition: width .8s; transition-delay: calc(var(--i) * 120ms); }
.barras--animar .barra__valor { width: calc(var(--v) * 1%); }

.rosca { background: var(--fatias); border-radius: 50%; }
/* JS: --fatias = conic-gradient(var(--st-aberto) 0% 31.25%, var(--st-triagem) 31.25% 50%, ...) */''')
D.p('A classe barras--animar é ligada dois quadros depois do desenho (dois requestAnimationFrame), senão o navegador não vê o "antes" e a barra aparece cheia sem crescer.')

D.h('8. Onde esta solução ataca os seus pontos fracos')
D.tabela([
 ('Ponto fraco registrado', 'Onde está resolvido aqui'),
 ('Interação JS de estado (modal, filtros, paginação, tema)', 'util.js (modais), painel.js (filtros + URL, mover), app.js (tema, rotas)'),
 ('Regras de estado no back-end (401, 409, cascata)', 'api/index.php: TRANSICOES, ordem 401 → 404 → 422 → 409'),
 ('Formato de data', 'util.js: dataBR e dataHoraBR sem Date'),
 ('375 px e acessibilidade', 'layout.css (barra inferior, FAB), telas.css (scroll-snap), foco visível, aria-current, aria-pressed'),
 ('Efeitos CSS (gráficos, efeito no hover)', 'telas.css: barras com --v/--i, rosca com conic-gradient, pinos com anel'),
 ('Leitura do enunciado e tempo', 'PLANO.md, integrações marcadas, contrato lido nos 20 minutos'),
], [0.45, 0.55])

D.h('9. Checklist dos últimos 30 minutos (para o pitch não falhar)')
for t in ['Todos os arquivos juntos na pasta TEAM_X_modulo_g e publicados.',
          'Abrir http://IP/TEAM_X_modulo_g/ em outra máquina: CSS, JS e imagens carregando (aba Rede sem vermelho).',
          'dados/ e uploads/ com permissão de escrita; dados/usuarios.json dando 403 no navegador.',
          'Fluxo do pitch inteiro uma vez: abrir com foto → painel → mapa → login → mover até concluir → indicadores.',
          'Console sem erro em todas as telas.',
          'Voltar os dados para a carga inicial antes de apresentar.',
          'Ensaiar quem fala o quê (roteiro no PLANO.md).']:
    D.i(0, '☐ ' + t)

D.h('10. Refaça sem olhar (25 minutos cada)')
for k, t in enumerate([
 'Escreva o roteador do api/index.php com 404 e 405 e a função erro() que sempre devolve JSON.',
 'Escreva mudarStatus com a tabela TRANSICOES e a ordem 401 → 404 → 422 → 409. Teste no Postman os quatro códigos.',
 'Monte um <dialog> que fecha com Esc, X e fundo, com animação de saída e foco voltando para o botão que abriu.',
 'Faça busca + chip + interruptor combinados, guardados na URL com replaceState e restaurados no F5.',
 'Faça as barras por categoria com --v e --i crescendo em sequência e a rosca com conic-gradient a partir de um objeto JS.'], 1):
    D.i(0, f'{k}. {t}')
D.save(OUT)
print('ok', OUT)
