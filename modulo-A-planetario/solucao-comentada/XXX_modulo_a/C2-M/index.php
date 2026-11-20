<?php
/* =====================================================================
   C2-M · API de sessões do planetário com login por token
   Rotas:
     POST /login      → gera token (válido por 2 horas)
     GET  /sessions   → lista paginada, filtro por data, ordenação (exige token)
     POST /logout     → invalida o token (exige token)
   Regras de estado que mais caem em prova:
     - sem token, token inventado ou vencido → 401 (nunca 302 para tela de login!)
     - data "2026-02-30" tem formato certo, mas não existe → 422
     - saída da data em dd/mm/aaaa, mas filtro de entrada em AAAA-MM-DD
   ===================================================================== */

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

const POR_PAGINA = 5;
const VALIDADE_TOKEN = 2 * 60 * 60;   // 2 horas em segundos

/* ---------- Funções de apoio ---------- */
function responder(int $status, $corpo = null): void {
    http_response_code($status);
    if ($corpo !== null) echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ler(string $arquivo): array {
    return json_decode(file_get_contents(__DIR__ . "/$arquivo"), true) ?? [];
}

function gravar(string $arquivo, array $dados): void {
    // LOCK_EX evita dois pedidos escrevendo ao mesmo tempo
    file_put_contents(__DIR__ . "/$arquivo", json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Corpo JSON da requisição; null se não for JSON válido
function corpoJson(): ?array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : null;
}

// Lê "Authorization: Bearer xxx" em qualquer configuração do Apache/PHP
function tokenDoCabecalho(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $h = $v;
    }
    return preg_match('/^Bearer\s+(\S+)$/i', $h, $m) ? $m[1] : null;
}

// Devolve o registro do token válido ou responde 401
function exigirLogin(): array {
    $tk = tokenDoCabecalho();
    if ($tk) {
        foreach (ler('tokens.json') as $t) {
            if (hash_equals($t['token'], $tk) && strtotime($t['expires_at']) > time()) return $t;
        }
    }
    responder(401, ['error' => 'Unauthenticated']);
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

// "2026-12-12" → ["12/12/2026", "sábado"]
function formatarData(string $iso): array {
    [$a, $m, $d] = explode('-', $iso);
    $w = (int) date('w', mktime(12, 0, 0, (int)$m, (int)$d, (int)$a));   // meio-dia: sem susto com horário de verão
    return ["$d/$m/$a", DIAS[$w]];
}

/* ---------- Roteamento ---------- */
$base   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$rota   = '/' . trim(substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), strlen($base)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

$rotas = ['/login' => 'POST', '/logout' => 'POST', '/sessions' => 'GET'];
if (!isset($rotas[$rota]))       responder(404, ['error' => 'Not found']);
if ($rotas[$rota] !== $metodo)   responder(405, ['error' => 'Method not allowed']);

/* =====================================================================
   POST /login
   ===================================================================== */
if ($rota === '/login') {
    $b = corpoJson();
    if (!$b || !is_string($b['email'] ?? null) || !is_string($b['password'] ?? null)) {
        responder(400, ['error' => 'Invalid request body']);
    }
    foreach (ler('users.json') as $u) {
        // e-mail sem diferenciar maiúsculas; senha com password_verify (bcrypt)
        if (strcasecmp($u['email'], trim($b['email'])) === 0 && password_verify($b['password'], $u['password'])) {
            $token = bin2hex(random_bytes(32));                // 64 caracteres hexadecimais
            $tokens = array_values(array_filter(ler('tokens.json'), fn($t) => strtotime($t['expires_at']) > time()));
            $tokens[] = ['token' => $token, 'user_id' => $u['id'], 'expires_at' => date('c', time() + VALIDADE_TOKEN)];
            gravar('tokens.json', $tokens);
            responder(200, ['token' => $token, 'user' => ['id' => $u['id'], 'name' => $u['name']]]);
        }
    }
    // mesma mensagem para e-mail ou senha errados (não entrega qual dos dois)
    responder(401, ['error' => 'Invalid credentials']);
}

/* =====================================================================
   POST /logout
   ===================================================================== */
if ($rota === '/logout') {
    $atual = exigirLogin();
    gravar('tokens.json', array_values(array_filter(ler('tokens.json'), fn($t) => $t['token'] !== $atual['token'])));
    responder(204);     // 204 = sem corpo
}

/* =====================================================================
   GET /sessions
   ===================================================================== */
exigirLogin();

$sessoes = ler('sessions.json');

// filtro por data (opcional)
if (isset($_GET['date'])) {
    $f = $_GET['date'];
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $f, $m) || !checkdate((int)$m[2], (int)$m[3], (int)$m[1])) {
        responder(422, ['error' => 'Invalid date']);
    }
    $sessoes = array_values(array_filter($sessoes, fn($s) => $s['date'] === $f));
}

// ordenação: date (padrão, mais cedo primeiro) ou -date (mais tarde primeiro)
$sort = $_GET['sort'] ?? 'date';
if (!in_array($sort, ['date', '-date'], true)) responder(422, ['error' => 'Invalid sort']);
usort($sessoes, function ($a, $b) use ($sort) {
    // "AAAA-MM-DD HH:MM" ordena certo como texto
    $c = strcmp($a['date'] . ' ' . $a['start'], $b['date'] . ' ' . $b['start']);
    if ($sort === '-date') $c = -$c;
    return $c ?: $a['id'] <=> $b['id'];       // empate: menor id primeiro
});

// paginação: page inválida (abc, 0, -1) vale 1
$total   = count($sessoes);
$paginas = max(1, (int) ceil($total / POR_PAGINA));
$page    = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 1;
$fatia   = array_slice($sessoes, ($page - 1) * POR_PAGINA, POR_PAGINA);

$data = array_map(function ($s) {
    [$br, $dia] = formatarData($s['date']);
    $vagas = max(0, $s['capacity'] - $s['reserved']);
    return [
        'id'         => $s['id'],
        'title'      => $s['title'],
        'date'       => $br,
        'weekday'    => $dia,
        'start'      => $s['start'],
        'seats_left' => $vagas,
        'sold_out'   => $vagas === 0,
    ];
}, $fatia);

responder(200, [
    'data' => $data,
    'meta' => ['total' => $total, 'page' => $page, 'per_page' => POR_PAGINA, 'total_pages' => $paginas],
]);
