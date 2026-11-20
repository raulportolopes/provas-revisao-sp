<?php
/*
 * ZELA BAIRRO – API (Pacote P1)
 * ---------------------------------------------------------------
 * PHP puro, sem framework e sem banco: os dados ficam em arquivos
 * JSON na pasta dados/. É o mesmo estilo das tarefas C do Speed Test.
 *
 * Todas as rotas passam por este arquivo. O .htaccess da pasta api/
 * manda qualquer endereço (api/chamados/3/status) para cá, e nós
 * lemos o caminho que vem depois de "api/".
 *
 * Ordem de leitura sugerida para revisar:
 *   1. funções de resposta (json, erro)
 *   2. repositório (ler/gravar JSON com trava)
 *   3. regras de negócio (prazo, atraso, transições de status)
 *   4. roteador no fim do arquivo
 */

declare(strict_types=1);
date_default_timezone_set('America/Sao_Paulo'); // datas sempre no fuso de Brasília

const DADOS = __DIR__ . '/../dados';
const UPLOADS = __DIR__ . '/../uploads';

/* ------------------------------------------------------------------
 * 1. Respostas
 * Toda resposta é JSON, inclusive os erros. O front confia nisso.
 * ------------------------------------------------------------------ */
function json($dados, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function erro(int $status, string $mensagem, array $erros = []): never
{
    $corpo = ['mensagem' => $mensagem];
    if ($erros) $corpo['erros'] = $erros; // 422 sempre traz o campo => mensagem
    json($corpo, $status);
}

/* ------------------------------------------------------------------
 * 2. Repositório JSON
 * flock() evita que dois pedidos ao mesmo tempo (dois "apoios" no
 * mesmo segundo) sobrescrevam o arquivo um do outro.
 * ------------------------------------------------------------------ */
function ler(string $nome): array
{
    $arq = DADOS . "/$nome.json";
    if (!file_exists($arq)) {
        // primeira execução: copia a carga inicial (seed) fornecida
        copy(DADOS . "/seed/$nome.json", $arq);
    }
    $fp = fopen($arq, 'r');
    flock($fp, LOCK_SH);
    $conteudo = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return json_decode($conteudo, true) ?? [];
}

function gravar(string $nome, array $dados): void
{
    $fp = fopen(DADOS . "/$nome.json", 'c');
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

/* Lê o corpo JSON do pedido (PATCH e POST sem arquivo). */
function corpo(): array
{
    if (str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) return $_POST;
    $dados = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($dados)) erro(400, 'Corpo JSON inválido.');
    return $dados;
}

/* ------------------------------------------------------------------
 * 3. Regras de negócio
 * ------------------------------------------------------------------ */

/* Máquina de estados: de cada status, para onde ele PODE ir.
 * Qualquer coisa fora desta tabela devolve 409. É a regra de estado
 * que mais cai em prova (Rotaract, PetLar, WSC C): escreva como tabela,
 * não como um monte de if. */
const TRANSICOES = [
    'aberto'    => ['triagem', 'cancelado'],
    'triagem'   => ['execucao', 'cancelado', 'aberto'],
    'execucao'  => ['concluido', 'triagem'],
    'concluido' => [],            // estado final
    'cancelado' => [],            // estado final
];

function categoriaPorId(int $id): ?array
{
    foreach (ler('categorias') as $c) if ($c['id'] === $id) return $c;
    return null;
}

/* Acrescenta os campos calculados que o front precisa. O cálculo fica
 * no servidor para que painel, mapa e indicadores mostrem a mesma coisa. */
function enriquecer(array $ch): array
{
    $cat = categoriaPorId($ch['categoria_id']);
    $aberto = new DateTimeImmutable($ch['aberto_em']);
    $prazo = $aberto->modify('+' . $cat['prazo_dias'] . ' days');
    $fim = $ch['concluido_em'] ? new DateTimeImmutable($ch['concluido_em']) : new DateTimeImmutable();
    $ch['categoria'] = $cat['nome'];
    $ch['prazo_em'] = $prazo->format('Y-m-d H:i:s');
    // atrasado = passou do prazo e ainda está em andamento.
    // Concluído fora do prazo conta como "concluido_no_prazo = false".
    $emAndamento = in_array($ch['status'], ['aberto', 'triagem', 'execucao'], true);
    $ch['atrasado'] = $emAndamento && $fim > $prazo;
    $ch['concluido_no_prazo'] = $ch['status'] === 'concluido' ? $fim <= $prazo : null;
    $ch['apoios'] = count($ch['apoiadores']);
    unset($ch['apoiadores']); // não expõe os ids dos dispositivos
    return $ch;
}

function semAcento(string $t): string
{
    $t = mb_strtolower($t);
    return strtr($t, ['á'=>'a','à'=>'a','â'=>'a','ã'=>'a','é'=>'e','ê'=>'e','í'=>'i','ó'=>'o','ô'=>'o','õ'=>'o','ú'=>'u','ç'=>'c']);
}

/* Autenticação da equipe de zeladoria: token simples guardado em
 * dados/tokens.json. Sem token ou token errado = 401. */
function exigirEquipe(): array
{
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = preg_replace('/^Bearer\s+/i', '', $token);
    foreach (ler('tokens') as $t) {
        if ($token !== '' && hash_equals($t['token'], $token)) return $t;
    }
    erro(401, 'Faça login como equipe de zeladoria.');
}

function acharChamado(array $lista, int $id): int
{
    foreach ($lista as $i => $c) if ($c['id'] === $id) return $i;
    erro(404, 'Chamado não encontrado.');
}

/* ------------------------------------------------------------------
 * 4. Ações (uma função por rota)
 * ------------------------------------------------------------------ */

function listarChamados(): never
{
    $lista = array_map('enriquecer', ler('chamados'));
    // filtros opcionais pela query string: ?status=aberto&categoria=2&busca=rua
    if (!empty($_GET['status']))    $lista = array_filter($lista, fn($c) => $c['status'] === $_GET['status']);
    if (!empty($_GET['categoria'])) $lista = array_filter($lista, fn($c) => $c['categoria_id'] === (int)$_GET['categoria']);
    if (!empty($_GET['busca'])) {
        $b = semAcento($_GET['busca']);
        $lista = array_filter($lista, fn($c) => str_contains(semAcento($c['titulo'] . ' ' . $c['rua'] . ' ' . $c['protocolo']), $b));
    }
    // mais recentes primeiro
    usort($lista, fn($a, $b) => strcmp($b['aberto_em'], $a['aberto_em']));
    json(array_values($lista));
}

function verChamado(int $id): never
{
    $lista = ler('chamados');
    json(enriquecer($lista[acharChamado($lista, $id)]));
}

function criarChamado(): never
{
    $d = corpo();
    $erros = [];

    // validação campo a campo: o 422 devolve TODOS os erros de uma vez
    $titulo = trim((string)($d['titulo'] ?? ''));
    if (mb_strlen($titulo) < 5 || mb_strlen($titulo) > 80) $erros['titulo'] = 'O título deve ter entre 5 e 80 caracteres.';

    $descricao = trim((string)($d['descricao'] ?? ''));
    if (mb_strlen($descricao) < 15) $erros['descricao'] = 'Descreva o problema com pelo menos 15 caracteres.';

    $catId = (int)($d['categoria_id'] ?? 0);
    if (!categoriaPorId($catId)) $erros['categoria_id'] = 'Escolha uma categoria válida.';

    $rua = trim((string)($d['rua'] ?? ''));
    if ($rua === '') $erros['rua'] = 'Informe a rua ou o ponto de referência.';

    // posição no mapa em porcentagem (0 a 100), marcada clicando no mapa
    $x = filter_var($d['x'] ?? null, FILTER_VALIDATE_FLOAT);
    $y = filter_var($d['y'] ?? null, FILTER_VALIDATE_FLOAT);
    if ($x === false || $y === false || $x < 0 || $x > 100 || $y < 0 || $y > 100) $erros['local'] = 'Marque o local no mapa.';

    // foto opcional: valida tipo REAL (finfo) e tamanho; nome aleatório
    $foto = null;
    if (!empty($_FILES['foto']) && $_FILES['foto']['error'] !== UPLOAD_ERR_NO_FILE) {
        $f = $_FILES['foto'];
        $tipos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $mime = $f['error'] === UPLOAD_ERR_OK ? (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) : '';
        if (!isset($tipos[$mime])) $erros['foto'] = 'A foto deve ser JPG, PNG ou WEBP.';
        elseif ($f['size'] > 2 * 1024 * 1024) $erros['foto'] = 'A foto deve ter no máximo 2 MB.';
        else $foto = bin2hex(random_bytes(8)) . '.' . $tipos[$mime];
    }

    if ($erros) erro(422, 'Dados inválidos.', $erros);

    if ($foto) move_uploaded_file($_FILES['foto']['tmp_name'], UPLOADS . '/' . $foto);

    $lista = ler('chamados');
    $novoId = $lista ? max(array_column($lista, 'id')) + 1 : 1;
    $agora = date('Y-m-d H:i:s');
    $chamado = [
        'id' => $novoId,
        // protocolo com zeros à esquerda: ZB-2026-0017
        'protocolo' => sprintf('ZB-%s-%04d', date('Y'), $novoId),
        'titulo' => $titulo,
        'descricao' => $descricao,
        'categoria_id' => $catId,
        'rua' => $rua,
        'x' => round($x, 1),
        'y' => round($y, 1),
        'foto' => $foto ? "uploads/$foto" : null,
        'status' => 'aberto',
        'aberto_em' => $agora,
        'concluido_em' => null,
        'apoiadores' => [],
        'historico' => [['de' => null, 'para' => 'aberto', 'em' => $agora, 'por' => 'Morador', 'nota' => 'Chamado aberto pelo site.']],
    ];
    $lista[] = $chamado;
    gravar('chamados', $lista);
    json(enriquecer($chamado), 201);
}

function mudarStatus(int $id): never
{
    $equipe = exigirEquipe();          // 1º: autenticação (401)
    $lista = ler('chamados');
    $i = acharChamado($lista, $id);     // 2º: existe? (404)
    $d = corpo();
    $novo = (string)($d['status'] ?? '');
    $nota = trim((string)($d['nota'] ?? ''));

    // 3º: o valor existe? (422)
    if (!array_key_exists($novo, TRANSICOES)) erro(422, 'Dados inválidos.', ['status' => 'Status desconhecido.']);
    // cancelar e devolver exigem justificativa
    $atual = $lista[$i]['status'];
    $voltando = in_array([$atual, $novo], [['triagem', 'aberto'], ['execucao', 'triagem']], true);
    if (($novo === 'cancelado' || $voltando) && mb_strlen($nota) < 10) {
        erro(422, 'Dados inválidos.', ['nota' => 'Explique o motivo com pelo menos 10 caracteres.']);
    }
    // 4º: a transição é permitida? (409)
    if (!in_array($novo, TRANSICOES[$atual], true)) {
        erro(409, "Não é possível passar de \"$atual\" para \"$novo\".");
    }

    $agora = date('Y-m-d H:i:s');
    $lista[$i]['status'] = $novo;
    if ($novo === 'concluido') $lista[$i]['concluido_em'] = $agora;
    $lista[$i]['historico'][] = ['de' => $atual, 'para' => $novo, 'em' => $agora, 'por' => $equipe['nome'], 'nota' => $nota ?: null];
    gravar('chamados', $lista);
    json(enriquecer($lista[$i]));
}

function apoiar(int $id): never
{
    $lista = ler('chamados');
    $i = acharChamado($lista, $id);
    $disp = (string)(corpo()['dispositivo'] ?? '');
    if (!preg_match('/^[a-f0-9-]{8,40}$/', $disp)) erro(422, 'Dados inválidos.', ['dispositivo' => 'Identificador inválido.']);
    if (in_array($lista[$i]['status'], ['concluido', 'cancelado'], true)) erro(409, 'Este chamado já foi encerrado.');
    if (in_array($disp, $lista[$i]['apoiadores'], true)) erro(409, 'Você já apoiou este chamado.');
    $lista[$i]['apoiadores'][] = $disp;
    gravar('chamados', $lista);
    json(enriquecer($lista[$i]), 201);
}

function login(): never
{
    $d = corpo();
    foreach (ler('usuarios') as $u) {
        if ($u['usuario'] === ($d['usuario'] ?? '') && password_verify((string)($d['senha'] ?? ''), $u['senha_hash'])) {
            $token = bin2hex(random_bytes(20));
            $tokens = ler('tokens');
            $tokens[] = ['token' => $token, 'nome' => $u['nome'], 'criado_em' => date('Y-m-d H:i:s')];
            gravar('tokens', $tokens);
            json(['token' => $token, 'nome' => $u['nome']]);
        }
    }
    erro(401, 'Usuário ou senha incorretos.');
}

function indicadores(): never
{
    $lista = array_map('enriquecer', ler('chamados'));
    $porStatus = array_fill_keys(array_keys(TRANSICOES), 0);
    foreach ($lista as $c) $porStatus[$c['status']]++;

    $porCategoria = [];
    foreach (ler('categorias') as $cat) {
        $porCategoria[] = [
            'id' => $cat['id'], 'nome' => $cat['nome'],
            'total' => count(array_filter($lista, fn($c) => $c['categoria_id'] === $cat['id'])),
        ];
    }
    usort($porCategoria, fn($a, $b) => $b['total'] <=> $a['total']);

    $concluidos = array_filter($lista, fn($c) => $c['status'] === 'concluido');
    $noPrazo = count(array_filter($concluidos, fn($c) => $c['concluido_no_prazo']));
    // tempo médio de solução em dias, uma casa decimal
    $dias = array_map(fn($c) => (strtotime($c['concluido_em']) - strtotime($c['aberto_em'])) / 86400, $concluidos);

    json([
        'total' => count($lista),
        'por_status' => $porStatus,
        'por_categoria' => $porCategoria,
        'atrasados' => count(array_filter($lista, fn($c) => $c['atrasado'])),
        'percentual_no_prazo' => $concluidos ? round($noPrazo / count($concluidos) * 100) : 0,
        'tempo_medio_dias' => $dias ? round(array_sum($dias) / count($dias), 1) : 0,
    ]);
}

/* ------------------------------------------------------------------
 * 5. Roteador
 * O .htaccess envia api/xxx para api/index.php?rota=xxx.
 * Cada rota é uma expressão regular + método HTTP.
 * Rota existe mas método errado = 405; rota não existe = 404.
 * ------------------------------------------------------------------ */
$rota = trim($_GET['rota'] ?? '', '/');
$metodo = $_SERVER['REQUEST_METHOD'];

$rotas = [
    ['GET',   '#^categorias$#',               fn() => json(ler('categorias'))],
    ['GET',   '#^chamados$#',                 fn() => listarChamados()],
    ['POST',  '#^chamados$#',                 fn() => criarChamado()],
    ['GET',   '#^chamados/(\d+)$#',           fn($id) => verChamado((int)$id)],
    ['PATCH', '#^chamados/(\d+)/status$#',    fn($id) => mudarStatus((int)$id)],
    ['POST',  '#^chamados/(\d+)/apoios$#',    fn($id) => apoiar((int)$id)],
    ['GET',   '#^indicadores$#',              fn() => indicadores()],
    ['POST',  '#^login$#',                    fn() => login()],
];

$achouCaminho = false;
foreach ($rotas as [$m, $padrao, $acao]) {
    if (preg_match($padrao, $rota, $p)) {
        $achouCaminho = true;
        if ($m === $metodo) $acao(...array_slice($p, 1));
    }
}
$achouCaminho ? erro(405, 'Método não permitido.') : erro(404, 'Rota não encontrada.');
