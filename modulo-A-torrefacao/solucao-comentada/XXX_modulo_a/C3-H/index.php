<?php
/* =====================================================================
   C3-H · Programa de fidelidade (token + papéis + regras de resgate)
   Rotas:
     POST /login          → token válido por 1 hora
     POST /logout         → 204
     GET  /me             → dados e saldo de pontos
     GET  /me/history     → extrato (só cliente)
     POST /purchases      → lança compra e gera pontos (só funcionário)
     POST /redeem         → resgata recompensa (só cliente)
   Ordem que vale para TODA rota protegida:
     401 (quem é você?) → 403 (você pode?) → 400 (corpo) → regras de negócio.
   O saldo NUNCA é guardado: é a soma do extrato (earn − redeem).
   ===================================================================== */

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

const VALIDADE_TOKEN = 3600;
const RESGATES_POR_DIA = 2;

function responder(int $s, $c = null): void {
    http_response_code($s);
    if ($c !== null) echo json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function ler(string $a): array { return json_decode(file_get_contents(__DIR__ . "/$a"), true) ?? []; }
function gravar(string $a, array $d): void {
    file_put_contents(__DIR__ . "/$a", json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
function corpoJson(): ?array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : null;
}
function proximoId(array $l): int { return ($l ? max(array_column($l, 'id')) : 0) + 1; }

function tokenDoCabecalho(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $h = $v;
    }
    return preg_match('/^Bearer\s+(\S+)$/i', $h, $m) ? $m[1] : null;
}

// 401 se não logado; 403 se o papel não for o exigido. Devolve o usuário.
function exigir(?string $papel = null): array {
    $tk = tokenDoCabecalho();
    $uid = null;
    if ($tk) {
        foreach (ler('tokens.json') as $t) {
            if (hash_equals($t['token'], $tk) && strtotime($t['expires_at']) > time()) { $uid = $t['user_id']; break; }
        }
    }
    if ($uid === null) responder(401, ['error' => 'Unauthenticated']);
    $u = array_values(array_filter(ler('users.json'), fn($x) => $x['id'] === $uid))[0];
    if ($papel && $u['role'] !== $papel) responder(403, ['error' => 'Forbidden']);
    return $u;
}

function saldo(int $uid): int {
    $s = 0;
    foreach (ler('transactions.json') as $t) {
        if ($t['user_id'] === $uid) $s += $t['type'] === 'earn' ? $t['points'] : -$t['points'];
    }
    return $s;
}

/* ---------- Roteamento ---------- */
$base   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$rota   = '/' . trim(substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), strlen($base)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

$rotas = [
    '/login'      => ['POST', 'login'],
    '/logout'     => ['POST', 'logout'],
    '/me'         => ['GET',  'eu'],
    '/me/history' => ['GET',  'historico'],
    '/purchases'  => ['POST', 'compra'],
    '/redeem'     => ['POST', 'resgate'],
];
if (!isset($rotas[$rota]))          responder(404, ['error' => 'Not found']);
if ($rotas[$rota][0] !== $metodo)   responder(405, ['error' => 'Method not allowed']);
$rotas[$rota][1]();

/* ---------- POST /login ---------- */
function login(): void {
    $b = corpoJson();
    if (!$b || !is_string($b['email'] ?? null) || !is_string($b['password'] ?? null)) responder(400, ['error' => 'Invalid request body']);
    foreach (ler('users.json') as $u) {
        if (strcasecmp($u['email'], trim($b['email'])) === 0 && password_verify($b['password'], $u['password'])) {
            $token = bin2hex(random_bytes(32));
            $tokens = array_values(array_filter(ler('tokens.json'), fn($t) => strtotime($t['expires_at']) > time()));   // limpa vencidos
            $tokens[] = ['token' => $token, 'user_id' => $u['id'], 'expires_at' => date('c', time() + VALIDADE_TOKEN)];
            gravar('tokens.json', $tokens);
            responder(200, ['token' => $token, 'role' => $u['role'], 'expires_in' => VALIDADE_TOKEN]);
        }
    }
    responder(401, ['error' => 'Invalid credentials']);
}

/* ---------- POST /logout ---------- */
function logout(): void {
    exigir();
    $tk = tokenDoCabecalho();
    gravar('tokens.json', array_values(array_filter(ler('tokens.json'), fn($t) => $t['token'] !== $tk)));
    responder(204);
}

/* ---------- GET /me ---------- */
function eu(): void {
    $u = exigir();
    $out = ['id' => $u['id'], 'name' => $u['name'], 'role' => $u['role']];
    if ($u['role'] === 'customer') $out['points'] = saldo($u['id']);
    responder(200, ['data' => $out]);
}

/* ---------- GET /me/history (mais recente primeiro) ---------- */
function historico(): void {
    $u = exigir('customer');
    $lista = array_filter(ler('transactions.json'), fn($t) => $t['user_id'] === $u['id']);
    usort($lista, fn($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']) ?: $b['id'] <=> $a['id']);
    responder(200, ['data' => array_map(fn($t) => [
        'id'          => $t['id'],
        'date'        => date('d/m/Y H:i', strtotime($t['created_at'])),
        'description' => $t['description'],
        'points'      => $t['type'] === 'earn' ? $t['points'] : -$t['points'],   // sinal: + ganhou, − gastou
    ], array_values($lista)), 'balance' => saldo($u['id'])]);
}

/* ---------- POST /purchases (funcionário) ---------- */
function compra(): void {
    exigir('staff');
    $b = corpoJson();
    if (!$b || !array_key_exists('customer_id', $b) || !array_key_exists('amount_cents', $b)) responder(400, ['error' => 'Invalid request body']);

    $cliente = null;
    foreach (ler('users.json') as $u) if ($u['id'] === $b['customer_id'] && $u['role'] === 'customer') $cliente = $u;
    if (!$cliente) responder(404, ['error' => 'Customer not found']);
    if (!is_int($b['amount_cents']) || $b['amount_cents'] <= 0) responder(422, ['error' => 'Invalid amount']);

    $pontos = intdiv($b['amount_cents'], 100);                     // 1 ponto por real inteiro
    $trans = ler('transactions.json');
    $trans[] = [
        'id' => proximoId($trans), 'user_id' => $cliente['id'], 'type' => 'earn', 'points' => $pontos,
        'description' => 'Compra de R$ ' . number_format($b['amount_cents'] / 100, 2, ',', '.'),
        'created_at' => date('c'),
    ];
    gravar('transactions.json', $trans);
    responder(201, ['data' => ['customer_id' => $cliente['id'], 'points_earned' => $pontos, 'balance' => saldo($cliente['id'])]]);
}

/* ---------- POST /redeem (cliente) — regras na ordem do enunciado ---------- */
function resgate(): void {
    $u = exigir('customer');
    $b = corpoJson();
    if (!$b || !is_int($b['reward_id'] ?? null)) responder(400, ['error' => 'Invalid request body']);

    $rec = null;
    foreach (ler('rewards.json') as $r) if ($r['id'] === $b['reward_id']) $rec = $r;
    if (!$rec) responder(404, ['error' => 'Reward not found']);

    // vencida? compara AAAA-MM-DD como texto: válida ATÉ o fim do dia valid_until
    if ($rec['valid_until'] < date('Y-m-d')) responder(422, ['error' => 'Reward expired']);

    $trans = ler('transactions.json');
    $meus = array_filter($trans, fn($t) => $t['user_id'] === $u['id'] && $t['type'] === 'redeem');

    if ($rec['once'] && array_filter($meus, fn($t) => ($t['reward_id'] ?? null) === $rec['id'])) {
        responder(409, ['error' => 'Reward already redeemed']);
    }

    $hoje = date('Y-m-d');
    $deHoje = array_filter($meus, fn($t) => date('Y-m-d', strtotime($t['created_at'])) === $hoje);
    if (count($deHoje) >= RESGATES_POR_DIA) responder(422, ['error' => 'Daily limit reached']);

    $saldo = saldo($u['id']);
    if ($saldo < $rec['cost']) responder(422, ['error' => 'Insufficient points', 'balance' => $saldo, 'cost' => $rec['cost']]);

    $voucher = 'TP-' . strtoupper(bin2hex(random_bytes(2))) . '-' . strtoupper(bin2hex(random_bytes(2)));
    $trans[] = [
        'id' => proximoId($trans), 'user_id' => $u['id'], 'type' => 'redeem', 'points' => $rec['cost'],
        'description' => 'Resgate: ' . $rec['name'], 'reward_id' => $rec['id'], 'voucher' => $voucher, 'created_at' => date('c'),
    ];
    gravar('transactions.json', $trans);
    responder(201, ['data' => ['reward' => $rec['name'], 'cost' => $rec['cost'], 'balance' => $saldo - $rec['cost'], 'voucher' => $voucher]]);
}
