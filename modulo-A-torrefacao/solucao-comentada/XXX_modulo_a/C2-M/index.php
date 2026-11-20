<?php
/* =====================================================================
   C2-M · Pedidos da cafeteria com máquina de estados
   Rotas:
     GET   /orders[?status=...]     lista
     GET   /orders/{id}             um pedido
     POST  /orders                  cria (preço calculado NO SERVIDOR)
     PATCH /orders/{id}/status      muda o status seguindo as transições
   Máquina de estados: em vez de vários if, uma tabela diz para onde
   cada status pode ir. Mudar regra = mudar a tabela.
   ===================================================================== */

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

const TRANSICOES = [
    'received'  => ['preparing', 'cancelled'],
    'preparing' => ['ready', 'cancelled'],
    'ready'     => ['delivered'],
    'delivered' => [],
    'cancelled' => [],
];

function responder(int $s, $c): void {
    http_response_code($s);
    echo json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
function reais(int $c): string { return 'R$ ' . number_format($c / 100, 2, ',', '.'); }

// formato de saída: código, total em reais e datas dd/mm/aaaa HH:MM
function saida(array $o): array {
    $o['code']  = 'TP-2026-' . str_pad((string)$o['id'], 4, '0', STR_PAD_LEFT);
    $o['total'] = reais($o['total_cents']);
    $o['history'] = array_map(fn($h) => ['status' => $h['status'], 'at' => date('d/m/Y H:i', strtotime($h['at']))], $o['history']);
    // ordem das chaves fica igual ao exemplo do enunciado
    return ['id' => $o['id'], 'code' => $o['code'], 'customer' => $o['customer'], 'items' => $o['items'],
            'total_cents' => $o['total_cents'], 'total' => $o['total'], 'status' => $o['status'], 'history' => $o['history']];
}

function acharPedido(array $pedidos, int $id): int|false {
    return array_search($id, array_column($pedidos, 'id'), true);
}

/* ---------- Roteamento ---------- */
$base   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$rota   = '/' . trim(substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), strlen($base)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

if ($rota === '/orders') {
    if ($metodo === 'GET')  listar();
    if ($metodo === 'POST') criar();
    responder(405, ['error' => 'Method not allowed']);
}
if (preg_match('#^/orders/(\d+)$#', $rota, $m)) {
    if ($metodo === 'GET') mostrar((int)$m[1]);
    responder(405, ['error' => 'Method not allowed']);
}
if (preg_match('#^/orders/(\d+)/status$#', $rota, $m)) {
    if ($metodo === 'PATCH') mudarStatus((int)$m[1]);
    responder(405, ['error' => 'Method not allowed']);
}
responder(404, ['error' => 'Not found']);

/* =====================================================================
   GET /orders?status=...
   ===================================================================== */
function listar(): void {
    $pedidos = ler('orders.json');
    if (isset($_GET['status'])) {
        if (!array_key_exists($_GET['status'], TRANSICOES)) responder(422, ['error' => 'Invalid status']);
        $pedidos = array_filter($pedidos, fn($o) => $o['status'] === $_GET['status']);
    }
    usort($pedidos, fn($a, $b) => $a['id'] <=> $b['id']);
    responder(200, ['data' => array_map('saida', array_values($pedidos))]);
}

function mostrar(int $id): void {
    $pedidos = ler('orders.json');
    $i = acharPedido($pedidos, $id);
    if ($i === false) responder(404, ['error' => 'Order not found']);
    responder(200, ['data' => saida($pedidos[$i])]);
}

/* =====================================================================
   POST /orders — validações em ordem; o preço vem do products.json
   ===================================================================== */
function criar(): void {
    $b = corpoJson();
    if (!$b || !is_string($b['customer'] ?? null) || trim($b['customer']) === ''
        || !is_array($b['items'] ?? null) || !$b['items'] || !array_is_list($b['items'])) {
        responder(400, ['error' => 'Invalid request body']);
    }

    $produtos = array_column(ler('products.json'), null, 'id');     // indexa por id
    $itens = [];
    $total = 0;
    foreach ($b['items'] as $it) {
        if (!is_array($it)) responder(400, ['error' => 'Invalid request body']);
        $pid = $it['product_id'] ?? null;
        if (!is_int($pid) || !isset($produtos[$pid])) responder(422, ['error' => 'Product ' . json_encode($pid) . ' not found']);
        $p = $produtos[$pid];
        $tam = $it['size'] ?? null;
        if (!is_string($tam) || !isset($p['prices'][$tam])) responder(422, ['error' => 'Invalid size ' . (is_string($tam) ? $tam : json_encode($tam)) . " for product $pid"]);
        $q = $it['qty'] ?? null;
        if (!is_int($q) || $q < 1 || $q > 10) responder(422, ['error' => 'Invalid quantity']);

        $unit = $p['prices'][$tam];                               // ignora qualquer preço enviado pelo cliente
        $itens[] = ['product_id' => $pid, 'name' => $p['name'], 'size' => $tam, 'qty' => $q,
                    'unit_price_cents' => $unit, 'subtotal_cents' => $unit * $q];
        $total += $unit * $q;
    }

    $pedidos = ler('orders.json');
    $novo = [
        'id'          => ($pedidos ? max(array_column($pedidos, 'id')) : 0) + 1,
        'customer'    => trim($b['customer']),
        'items'       => $itens,
        'total_cents' => $total,
        'status'      => 'received',
        'history'     => [['status' => 'received', 'at' => date('c')]],
    ];
    $pedidos[] = $novo;
    gravar('orders.json', $pedidos);
    responder(201, ['data' => saida($novo)]);
}

/* =====================================================================
   PATCH /orders/{id}/status
   ===================================================================== */
function mudarStatus(int $id): void {
    $b = corpoJson();
    if (!$b || !is_string($b['status'] ?? null)) responder(400, ['error' => 'Invalid request body']);

    $pedidos = ler('orders.json');
    $i = acharPedido($pedidos, $id);
    if ($i === false) responder(404, ['error' => 'Order not found']);

    $novo = $b['status'];
    if (!array_key_exists($novo, TRANSICOES)) responder(422, ['error' => 'Invalid status']);

    $atual = $pedidos[$i]['status'];
    if (!in_array($novo, TRANSICOES[$atual], true)) {
        responder(409, ['error' => "Invalid transition from $atual to $novo"]);
    }

    $pedidos[$i]['status'] = $novo;
    $pedidos[$i]['history'][] = ['status' => $novo, 'at' => date('c')];
    gravar('orders.json', $pedidos);
    responder(200, ['data' => saida($pedidos[$i])]);
}
