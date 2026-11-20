<?php
/* =====================================================================
   C1-E · Relatório de vendas por dia (lê vendas.csv)
   GET /report?from=dd/mm/aaaa&to=dd/mm/aaaa
   Armadilhas:
   - entrada em dd/mm/aaaa, CSV em AAAA-MM-DD HH:MM: converta para o
     mesmo formato antes de comparar;
   - dia sem venda TAMBÉM aparece (com zeros): percorra o calendário,
     não o arquivo;
   - "pedidos" conta pedidos DISTINTOS (um pedido tem várias linhas);
   - dinheiro em centavos: "13,90" → 1390 (nunca float).
   ===================================================================== */

date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');

function responder(int $s, $c): void {
    http_response_code($s);
    echo json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// "13,90" → 1390 ; "7" → 700
function centavos(string $v): int {
    $v = trim($v);
    [$int, $dec] = array_pad(explode(',', $v), 2, '0');
    return (int)$int * 100 + (int)str_pad(substr($dec, 0, 2), 2, '0');
}

// 123450 → "R$ 1.234,50"
function reais(int $c): string { return 'R$ ' . number_format($c / 100, 2, ',', '.'); }

// "02/11/2026" → "2026-11-02" ou null se inválida
function isoDe(string $br): ?string {
    if (!preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', $br, $m)) return null;
    if (!checkdate((int)$m[2], (int)$m[1], (int)$m[3])) return null;
    return "$m[3]-$m[2]-$m[1]";
}
function brDe(string $iso): string { return implode('/', array_reverse(explode('-', $iso))); }

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/* ---------- Rota ---------- */
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$rota = '/' . trim(substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), strlen($base)), '/');
if ($rota !== '/report') responder(404, ['error' => 'Not found']);
if ($_SERVER['REQUEST_METHOD'] !== 'GET') responder(405, ['error' => 'Method not allowed']);

/* ---------- Ler o CSV e agrupar por dia ---------- */
$linhas = array_filter(preg_split('/\r\n|\n|\r/', preg_replace('/^\xEF\xBB\xBF/', '', file_get_contents(__DIR__ . '/vendas.csv'))), 'strlen');
array_shift($linhas);                                         // tira o cabeçalho

$porDia = [];                                                 // "2026-11-02" => [pedidos => set, itens, receita]
foreach ($linhas as $l) {
    [$pedido, $dataHora, , $qtd, $preco] = str_getcsv($l, ';');
    $dia = substr($dataHora, 0, 10);
    $porDia[$dia] ??= ['pedidos' => [], 'itens' => 0, 'receita' => 0];
    $porDia[$dia]['pedidos'][$pedido] = true;                 // chave = conta distinto
    $porDia[$dia]['itens'] += (int)$qtd;
    $porDia[$dia]['receita'] += (int)$qtd * centavos($preco);
}
ksort($porDia);

/* ---------- Validar o período ---------- */
$from = isset($_GET['from']) ? isoDe($_GET['from']) : array_key_first($porDia);
$to   = isset($_GET['to'])   ? isoDe($_GET['to'])   : array_key_last($porDia);
if ($from === null || $to === null) responder(422, ['error' => 'Invalid date']);
if ($from > $to) responder(422, ['error' => 'Invalid range']);               // texto AAAA-MM-DD compara certo
$dias = (new DateTime($from))->diff(new DateTime($to))->days + 1;
if ($dias > 31) responder(422, ['error' => 'Range too long']);

/* ---------- Percorrer o calendário, dia a dia ---------- */
$saida = [];
$tot = ['orders' => 0, 'items' => 0, 'cents' => 0];
$melhor = null;
for ($d = new DateTime($from); $d->format('Y-m-d') <= $to; $d->modify('+1 day')) {
    $iso = $d->format('Y-m-d');
    $info = $porDia[$iso] ?? ['pedidos' => [], 'itens' => 0, 'receita' => 0];
    $saida[] = [
        'date'          => brDe($iso),
        'weekday'       => DIAS[(int)$d->format('w')],
        'orders'        => count($info['pedidos']),
        'items'         => $info['itens'],
        'revenue'       => reais($info['receita']),
        'revenue_cents' => $info['receita'],
    ];
    $tot['orders'] += count($info['pedidos']);
    $tot['items']  += $info['itens'];
    $tot['cents']  += $info['receita'];
    if ($info['receita'] > 0 && ($melhor === null || $info['receita'] > $melhor[1])) $melhor = [$iso, $info['receita']];
}

responder(200, [
    'from'    => brDe($from),
    'to'      => brDe($to),
    'days'    => $saida,
    'summary' => [
        'orders'        => $tot['orders'],
        'items'         => $tot['items'],
        'revenue'       => reais($tot['cents']),
        'revenue_cents' => $tot['cents'],
        'best_day'      => $melhor ? brDe($melhor[0]) : null,
    ],
]);
