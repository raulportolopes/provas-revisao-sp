<?php
/* =====================================================================
   C3-H · Reserva de assentos do planetário (PHP puro + JSON)
   Rotas:
     GET   /sessions/{id}/seats          mapa de assentos (livre/ocupado)
     POST  /sessions/{id}/reservations   nova reserva (validações em ORDEM)
     PATCH /reservations/{id}/cancel     cancela (não apaga!)
     GET   /reservations?email=...       reservas de um e-mail
   Regras de estado (o que mais derruba nota):
     - reserva cancelada continua no arquivo com status "cancelled"
       e os assentos dela voltam a ficar livres;
     - só a reserva "active" ocupa assento;
     - quem cancela precisa informar o mesmo e-mail (senão 403);
     - cancelar duas vezes → 409; perto demais da sessão → 422.
   ===================================================================== */

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

const MAX_POR_RESERVA = 4;
const MAX_POR_EMAIL   = 4;
const HORAS_CANCELAR  = 2;

function responder(int $status, $corpo): void {
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function ler(string $a): array   { return json_decode(file_get_contents(__DIR__ . "/$a"), true) ?? []; }
function gravar(string $a, array $d): void {
    file_put_contents(__DIR__ . "/$a", json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
function corpoJson(): ?array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : null;
}
function emailValido($e): bool { return is_string($e) && filter_var(trim($e), FILTER_VALIDATE_EMAIL) !== false; }

// "2026-11-05T08:40:00-03:00" → "05/11/2026 08:40"
function dataHoraBr(string $iso): string { return date('d/m/Y H:i', strtotime($iso)); }

function acharSessao(int $id): ?array {
    foreach (ler('sessions.json') as $s) if ($s['id'] === $id) return $s;
    return null;
}

// início da sessão como timestamp (horário de Brasília)
function inicio(array $s): int { return strtotime("{$s['date']} {$s['start']}:00"); }

// todos os assentos válidos da sessão: A1..A10, B1..B10 ...
function assentos(array $s): array {
    $lista = [];
    foreach (str_split($s['rows']) as $fila) {
        for ($n = 1; $n <= $s['seats_per_row']; $n++) $lista[] = $fila . $n;
    }
    return $lista;
}

// assentos ocupados = só de reservas ativas daquela sessão
function ocupados(int $sessaoId, array $reservas): array {
    $o = [];
    foreach ($reservas as $r) {
        if ($r['session_id'] === $sessaoId && $r['status'] === 'active') $o = array_merge($o, $r['seats']);
    }
    return $o;
}

// formato de saída (datas em dd/mm/aaaa hh:mm)
function saida(array $r): array {
    $s = acharSessao($r['session_id']);
    $out = [
        'id'         => $r['id'],
        'code'       => 'EG-' . str_pad((string)$r['id'], 5, '0', STR_PAD_LEFT),
        'session_id' => $r['session_id'],
        'session'    => $s ? $s['title'] . ' · ' . date('d/m/Y', inicio($s)) . ' ' . $s['start'] : null,
        'name'       => $r['name'],
        'email'      => $r['email'],
        'seats'      => $r['seats'],
        'status'     => $r['status'],
        'created_at' => dataHoraBr($r['created_at']),
    ];
    if (isset($r['cancelled_at'])) $out['cancelled_at'] = dataHoraBr($r['cancelled_at']);
    return $out;
}

/* ---------- Roteamento com parâmetros {id} ---------- */
$base   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$rota   = '/' . trim(substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), strlen($base)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

$rotas = [
    ['GET',   '#^/sessions/(\d+)/seats$#',        'verAssentos'],
    ['POST',  '#^/sessions/(\d+)/reservations$#', 'reservar'],
    ['PATCH', '#^/reservations/(\d+)/cancel$#',   'cancelar'],
    ['GET',   '#^/reservations$#',                'listarPorEmail'],
];

$achouCaminho = false;
foreach ($rotas as [$m, $regex, $funcao]) {
    if (preg_match($regex, $rota, $p)) {
        $achouCaminho = true;
        if ($m === $metodo) { $funcao(isset($p[1]) ? (int)$p[1] : 0); }
    }
}
responder($achouCaminho ? 405 : 404, ['error' => $achouCaminho ? 'Method not allowed' : 'Not found']);

/* =====================================================================
   GET /sessions/{id}/seats
   ===================================================================== */
function verAssentos(int $id): void {
    $s = acharSessao($id);
    if (!$s) responder(404, ['error' => 'Session not found']);
    $ocup = ocupados($id, ler('reservations.json'));
    $mapa = [];
    foreach (assentos($s) as $a) $mapa[$a] = in_array($a, $ocup, true) ? 'taken' : 'free';
    $tomados = count(array_filter($mapa, fn($v) => $v === 'taken'));
    responder(200, ['session_id' => $id, 'free' => count($mapa) - $tomados, 'taken' => $tomados, 'seats' => $mapa]);
}

/* =====================================================================
   POST /sessions/{id}/reservations — validações NA ORDEM do enunciado,
   respondendo só o primeiro erro encontrado.
   ===================================================================== */
function reservar(int $id): void {
    // 1) corpo
    $b = corpoJson();
    $seatsOk = $b && is_array($b['seats'] ?? null) && $b['seats'] && array_is_list($b['seats'])
               && count(array_filter($b['seats'], 'is_string')) === count($b['seats']);
    if (!$b || !is_string($b['name'] ?? null) || trim($b['name']) === '' || !emailValido($b['email'] ?? null) || !$seatsOk) {
        responder(400, ['error' => 'Invalid request body']);
    }
    // 2) sessão existe
    $s = acharSessao($id);
    if (!$s) responder(404, ['error' => 'Session not found']);
    // 3) sessão ainda não começou
    if (inicio($s) <= time()) responder(422, ['error' => 'Session already started']);
    // 4) no máximo 4 assentos no pedido
    if (count($b['seats']) > MAX_POR_RESERVA) responder(422, ['error' => 'Maximum 4 seats per reservation']);
    // 5) assento existe (normaliza para maiúscula: "c4" → "C4")
    $pedidos = array_map(fn($a) => strtoupper(trim($a)), $b['seats']);
    $validos = assentos($s);
    foreach ($pedidos as $a) if (!in_array($a, $validos, true)) responder(422, ['error' => "Invalid seat $a"]);
    // 6) assento repetido no próprio pedido
    $vistos = [];
    foreach ($pedidos as $a) {
        if (isset($vistos[$a])) responder(422, ['error' => "Duplicate seat $a"]);
        $vistos[$a] = true;
    }
    // 7) assento já ocupado por reserva ATIVA (lista todos os ocupados pedidos)
    $reservas = ler('reservations.json');
    $conflito = array_values(array_intersect($pedidos, ocupados($id, $reservas)));
    if ($conflito) responder(409, ['error' => 'Seats already taken', 'seats' => $conflito]);
    // 8) limite por e-mail na sessão (somando as reservas ativas dele)
    $email = strtolower(trim($b['email']));
    $jaTem = 0;
    foreach ($reservas as $r) {
        if ($r['session_id'] === $id && $r['status'] === 'active' && strtolower($r['email']) === $email) $jaTem += count($r['seats']);
    }
    if ($jaTem + count($pedidos) > MAX_POR_EMAIL) responder(422, ['error' => 'Limit of 4 seats per email per session']);

    // grava: id = maior id + 1 (os ids não são sequenciais)
    $nova = [
        'id'         => ($reservas ? max(array_column($reservas, 'id')) : 0) + 1,
        'session_id' => $id,
        'name'       => trim($b['name']),
        'email'      => $email,
        'seats'      => $pedidos,
        'status'     => 'active',
        'created_at' => date('c'),
    ];
    $reservas[] = $nova;
    gravar('reservations.json', $reservas);
    responder(201, ['data' => saida($nova)]);
}

/* =====================================================================
   PATCH /reservations/{id}/cancel — muda o status, nunca apaga a linha
   ===================================================================== */
function cancelar(int $id): void {
    $b = corpoJson();
    if (!$b || !emailValido($b['email'] ?? null)) responder(400, ['error' => 'Invalid request body']);

    $reservas = ler('reservations.json');
    $i = array_search($id, array_column($reservas, 'id'), true);
    if ($i === false) responder(404, ['error' => 'Reservation not found']);
    $r = $reservas[$i];

    if (strcasecmp($r['email'], trim($b['email'])) !== 0) responder(403, ['error' => 'Forbidden']);
    if ($r['status'] === 'cancelled') responder(409, ['error' => 'Reservation already cancelled']);

    $s = acharSessao($r['session_id']);
    if (inicio($s) - time() < HORAS_CANCELAR * 3600) responder(422, ['error' => 'Too late to cancel']);

    $reservas[$i]['status'] = 'cancelled';
    $reservas[$i]['cancelled_at'] = date('c');
    gravar('reservations.json', $reservas);
    responder(200, ['data' => saida($reservas[$i])]);
}

/* =====================================================================
   GET /reservations?email=...  (mais recentes primeiro)
   ===================================================================== */
function listarPorEmail(int $_): void {
    $email = $_GET['email'] ?? null;
    if (!emailValido($email)) responder(422, ['error' => 'Invalid email']);
    $lista = array_filter(ler('reservations.json'), fn($r) => strcasecmp($r['email'], trim($email)) === 0);
    usort($lista, fn($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']) ?: $b['id'] <=> $a['id']);
    responder(200, ['data' => array_map('saida', array_values($lista))]);
}
