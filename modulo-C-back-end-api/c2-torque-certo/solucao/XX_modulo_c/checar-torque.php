<?php
// Script de conferência – prova de revisão Torque Certo (Módulo C – Back-end API, oficina mecânica).
// Uso:   php checar-torque.php http://localhost/XX_modulo_c/public/api
// ANTES de rodar: importe o torque_db.sql de novo (o script muda estoque, situações e cria OS).
// Precisa das extensões curl e gd (vêm ligadas no XAMPP). O resultado é evidência para a CIS, não a nota final.
date_default_timezone_set('America/Sao_Paulo');
$base = rtrim($argv[1] ?? 'http://localhost/XX_modulo_c/public/api', '/');
$ok = 0; $falhas = 0;

function req(string $metodo, string $url, $corpo = null, ?string $token = null, ?array $arquivo = null, bool $absoluta = false): array
{
    global $base;
    $c = curl_init($absoluta ? $url : $base . $url);
    $h = ['Accept: application/json'];
    if ($token) $h[] = "Authorization: Bearer $token";
    if ($arquivo) curl_setopt($c, CURLOPT_POSTFIELDS, $arquivo);
    elseif ($corpo !== null) { $h[] = 'Content-Type: application/json'; curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($corpo)); }
    curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $h,
        CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 20]);
    $r = curl_exec($c);
    if ($r === false) return [0, null, '', curl_error($c)];
    $hs = curl_getinfo($c, CURLINFO_HEADER_SIZE);
    $j = json_decode(substr($r, $hs), true);
    if (is_array($j) && isset($j['data']) && !isset($j['meta']) && array_is_list($j['data']) === false) $j = $j['data']; // aceita resource com "data"
    return [curl_getinfo($c, CURLINFO_RESPONSE_CODE), $j, substr($r, 0, $hs), substr($r, $hs)];
}
function t(string $id, string $nome, bool $passou, string $dica = ''): void
{
    global $ok, $falhas;
    $passou ? $ok++ : $falhas++;
    printf("%-7s %-5s %s%s\n", $id, $passou ? 'OK' : 'FALHA', $nome, $passou || !$dica ? '' : "\n               -> $dica");
}
function login(string $email): ?string { [, $j] = req('POST', '/login', ['email' => $email, 'password' => 'Torque@2026']); return $j['token'] ?? null; }
function jpeg(int $w, int $h): string
{
    $im = imagecreatetruecolor($w, $h); imagefill($im, 0, 0, imagecolorallocate($im, 30, 90, 160));
    $f = tempnam(sys_get_temp_dir(), 'f') . '.jpg'; imagejpeg($im, $f, 85); return $f;
}
$esp = json_decode(file_get_contents(__DIR__ . '/esperado.json'), true);
$id = $esp['ids'];
$ano = date('Y');
echo "Torque Certo – conferência da API em $base\n\n";

// ================= C1 base e autenticação
[$st, $j] = req('GET', '');
t('C1.1', 'GET /api responde 200 em JSON', $st === 200 && is_array($j), "veio $st");
[$st, $j] = req('GET', '/nao-existe');
t('C1.2', 'rota inexistente: 404 em JSON', $st === 404 && isset($j['message']), "veio $st");
[$st, $j] = req('GET', '/orders');
t('C1.3', 'sem token: 401 em JSON', $st === 401 && isset($j['message']), "veio $st");
[$st] = req('POST', '/login', ['email' => 'admin@torque.test', 'password' => 'x']);
t('C1.4', 'senha errada: 401', $st === 401, "veio $st");
$adm = login('admin@torque.test'); $ate = login('atendente@torque.test'); $joao = login('joao@torque.test'); $pedro = login('pedro@torque.test');
[$st, $j] = req('GET', '/me', null, $joao);
t('C1.5', 'login dos 4 perfis e GET /me com role', $adm && $ate && $joao && $pedro && ($j['role'] ?? '') === 'mecanico');
$tmp = login('atendente@torque.test');
[$a] = req('POST', '/logout', null, $tmp); [$b] = req('GET', '/me', null, $tmp);
t('C1.6', 'logout 204 e o token deixa de valer', $a === 204 && $b === 401, "veio $a e $b");

// ================= C2 relatórios (antes de mexer no estoque)
[$st, $j] = req('GET', '/reports/revenue?year=2025', null, $adm);
$okR = $st === 200 && count($j['months'] ?? []) === 12;
if ($okR) foreach ($esp['revenue_2025'] as $k => $e) { $g = $j['months'][$k];
    if ($g['month'] !== $e['month'] || (int) $g['orders'] !== $e['orders'] || (int) $g['revenue_cents'] !== $e['revenue_cents'] || abs($g['average_ticket_cents'] - $e['average_ticket_cents']) > 1) $okR = false; }
t('C2.1', 'faturamento 2025: 12 meses (abril zerado), OS entregues, total com desconto e ticket médio', $okR,
    'esperado: ' . implode(' ', array_map(fn ($e) => substr($e['month'], 5) . '=' . $e['revenue_cents'], $esp['revenue_2025'])));
t('C2.2', 'faturamento: valor formatado R$ e total do ano', ($j['totals']['revenue_cents'] ?? 0) === $esp['revenue_2025_total'] && str_starts_with($j['months'][0]['revenue_formatted'] ?? '', 'R$ '));
[$a] = req('GET', '/reports/revenue?year=2025', null, $ate); [$b] = req('GET', '/reports/revenue?year=abc', null, $adm);
t('C2.3', 'faturamento: atendente 403; ano inválido 422', $a === 403 && $b === 422, "veio $a e $b");
[$st, $j] = req('GET', '/reports/low-stock', null, $ate);
$skus = array_column((array) $j, 'sku'); $sug = array_column((array) $j, 'suggested_purchase');
t('C2.4', 'estoque baixo: ' . implode(', ', array_column($esp['low_stock'], 'sku')) . ' (mais crítico primeiro)', $st === 200 && $skus === array_column($esp['low_stock'], 'sku'), 'veio ' . implode(', ', $skus));
t('C2.5', 'sugestão de compra = 2 × mínimo − estoque', $sug === array_column($esp['low_stock'], 'suggested_purchase'));
[$st] = req('GET', '/reports/low-stock', null, $joao);
t('C2.6', 'estoque baixo com mecânico: 403', $st === 403, "veio $st");

// ================= C3 clientes e veículos
[$st, $j] = req('GET', '/customers?search=adriana', null, $joao);
t('C3.1', 'busca por nome: Adriana com 2 veículos, CPF e telefone com máscara', ($j['meta']['total'] ?? 0) === 1 && count($j['data'][0]['vehicles'] ?? []) === 2
    && preg_match('/^\(\d{2}\) \d{5}-\d{4}$/', $j['data'][0]['phone'] ?? '') && preg_match('/^\d{3}\.\d{3}\.\d{3}-\d{2}$/', $j['data'][0]['cpf'] ?? ''));
[, $j1] = req('GET', '/customers?search=ftc-3b21', null, $ate);
$cpfC = $esp['cpfs']['Célia Moraes']; [, $j2] = req('GET', '/customers?search=' . substr($cpfC, 0, 3) . '.' . substr($cpfC, 3, 3), null, $ate);
t('C3.2', 'busca por placa com hífen e por começo do CPF com máscara', ($j1['data'][0]['name'] ?? '') === 'Adriana Soares' && in_array('Célia Moraes', array_column($j2['data'] ?? [], 'name')),
    'veio ' . ($j1['data'][0]['name'] ?? '-'));
[$st, $j] = req('POST', '/customers', [], $ate);
t('C3.3', 'cliente vazio: 422 com name, cpf e phone', $st === 422 && isset($j['errors']['name'], $j['errors']['cpf'], $j['errors']['phone']), "veio $st");
$novo = ['name' => 'Lara Revisão', 'cpf' => '529.982.247-25', 'phone' => '(11) 99876-5432', 'email' => 'lara@cliente.test'];
[$a, $ja] = req('POST', '/customers', ['cpf' => '111.111.111-11'] + $novo, $ate);
[$b, $jb] = req('POST', '/customers', ['cpf' => $esp['cpfs']['Adriana Soares']] + $novo, $ate);
[$c, $jc] = req('POST', '/customers', ['phone' => '9876-543'] + $novo, $ate);
t('C3.4', 'CPF inválido (todos iguais), CPF repetido e telefone curto: 422', $a === 422 && $b === 422 && $c === 422 && isset($ja['errors']['cpf'], $jb['errors']['cpf'], $jc['errors']['phone']), "veio $a, $b, $c");
[$st] = req('POST', '/customers', $novo, $joao);
t('C3.5', 'mecânico cadastrando cliente: 403', $st === 403, "veio $st");
[$st, $j] = req('POST', '/customers', $novo, $ate);
$cli = $j['id'] ?? 0;
t('C3.6', 'cliente certo: 201, CPF e telefone gravados só com números e devolvidos com máscara', $st === 201 && ($j['cpf'] ?? '') === '529.982.247-25' && ($j['phone'] ?? '') === '(11) 99876-5432', "veio $st");
[$st, $j] = req('POST', "/customers/$cli/vehicles", ['plate' => 'rev-1a23', 'brand' => 'Fiat', 'model' => 'Pulse', 'year' => 2024], $ate);
t('C3.7', 'veículo com placa "rev-1a23": 201 e placa REV1A23', $st === 201 && ($j['plate'] ?? '') === 'REV1A23', "veio $st " . ($j['plate'] ?? ''));
$r = [];
foreach ([['plate' => 'AB12345'], ['plate' => 'FTC-3B21'], ['year' => 1900]] as $x) {
    [$s2, $j2] = req('POST', "/customers/$cli/vehicles", $x + ['plate' => 'NEW2B34', 'brand' => 'Fiat', 'model' => 'Uno', 'year' => 2010], $ate);
    $r[] = $s2 === 422 ? 'ok' : $s2;
}
t('C3.8', 'placa inválida, placa repetida e ano 1900: 422', $r === ['ok', 'ok', 'ok'], 'veio ' . json_encode($r));
[$st] = req('POST', '/customers/999/vehicles', ['plate' => 'NEW2B34', 'brand' => 'Fiat', 'model' => 'Uno', 'year' => 2010], $ate);
t('C3.9', 'cliente inexistente: 404', $st === 404, "veio $st");

// ================= C4 peças
[$st, $j] = req('GET', '/parts', null, $joao);
t('C4.1', 'peças: 10 por página, ' . $esp['parts'] . ' no total, ordem de nome', $st === 200 && count($j['data'] ?? []) === 10 && ($j['meta']['total'] ?? 0) === $esp['parts']
    && ($j['data'][0]['sku'] ?? '') === 'ADI-RAD01', 'primeira: ' . ($j['data'][0]['sku'] ?? '-'));
[, $jx] = req('GET', '/parts?search=OLE-5W30', null, $joao);
t('C4.2', 'busca por SKU; preço em centavos e formatado "R$ 48,90"', ($jx['meta']['total'] ?? 0) === 1 && ($jx['data'][0]['price_cents'] ?? 0) === 4890 && ($jx['data'][0]['price_formatted'] ?? '') === 'R$ 48,90');
[, $j] = req('GET', '/parts?low_stock=1', null, $joao);
t('C4.3', 'low_stock=1: ' . count($esp['low_stock']) . ' peças', ($j['meta']['total'] ?? 0) === count($esp['low_stock']));
[, $j] = req('GET', '/parts?sort=-price', null, $joao);
[, $j2] = req('GET', '/parts?search=filtro', null, $joao);
t('C4.4', 'sort=-price começa pela bateria; search=filtro acha 3', ($j['data'][0]['sku'] ?? '') === 'BAT-60AH' && ($j2['meta']['total'] ?? 0) === 3);
[$st] = req('GET', '/parts?sort=valor', null, $joao);
t('C4.5', 'sort inválido: 422', $st === 422, "veio $st");

// ================= C5 abertura da OS
[$st, $j] = req('POST', '/orders', [], $ate);
t('C5.1', 'OS vazia: 422 com vehicle_id e complaint', $st === 422 && isset($j['errors']['vehicle_id'], $j['errors']['complaint']), "veio $st");
[$st] = req('POST', '/orders', ['vehicle_id' => 1, 'complaint' => 'Barulho na roda'], $joao);
t('C5.2', 'mecânico abrindo OS: 403', $st === 403, "veio $st");
[$st, $j] = req('POST', '/orders', ['vehicle_id' => 1, 'complaint' => 'Barulho na roda dianteira'], $ate);
$n1 = $j['number'] ?? ''; $osNova = $j['id'] ?? 0;
t('C5.3', "OS criada: 201, número OS-$ano-NNNN, status aberta, histórico com a abertura", $st === 201 && preg_match("/^OS-$ano-\\d{4}$/", $n1) && ($j['status'] ?? '') === 'aberta'
    && count($j['history'] ?? []) === 1, "veio $st $n1");
[$st, $j] = req('POST', '/orders', ['vehicle_id' => 2, 'complaint' => 'Revisão de rotina'], $ate);
t('C5.4', 'próxima OS: número seguinte', (int) substr($j['number'] ?? '0', -4) === (int) substr($n1, -4) + 1, 'veio ' . ($j['number'] ?? '-'));
[$st, $j] = req('GET', '/orders/' . $id['OS-2026-0004'], null, $adm);
$e = $esp['totais']['OS-2026-0004'];
t('C5.5', 'detalhe da OS-2026-0004: totais de peças, serviços, subtotal, desconto 5% e total', ($j['totals']['parts_cents'] ?? 0) === $e['parts_cents'] && ($j['totals']['services_cents'] ?? 0) === $e['services_cents']
    && ($j['totals']['discount_cents'] ?? 0) === $e['discount_cents'] && ($j['totals']['total_cents'] ?? 0) === $e['total_cents'], 'esperado ' . json_encode($e));
[, $j] = req('GET', '/orders/' . $id['OS-2025-0002'], null, $adm);
t('C5.6', 'valor formatado com milhar: ' . $esp['brl']['OS-2025-0002'], ($j['totals']['total_formatted'] ?? ($j['total_formatted'] ?? '')) === $esp['brl']['OS-2025-0002'], 'veio ' . ($j['totals']['total_formatted'] ?? '-'));
t('C5.7', 'detalhe com veículo, cliente, itens com descrição e histórico com quem fez', isset($j['vehicle']['plate'], $j['customer']['name'], $j['items'][0]['description'], $j['history'][0]['by']));

// ================= C6 itens e desconto (OS-2026-0002, aberta)
$o2 = $id['OS-2026-0002'];
[$st, $j] = req('POST', "/orders/$o2/items", ['type' => 'part', 'item_id' => 2, 'quantity' => 2], $ate);
[$st2, $j2] = req('POST', "/orders/$o2/items", ['type' => 'part', 'item_id' => 2, 'quantity' => 1], $ate);
$linhas = array_values(array_filter($j2['items'] ?? [], fn ($i) => $i['type'] === 'part' && $i['item_id'] === 2));
t('C6.1', 'mesma peça duas vezes: uma linha só com quantidade 3 e preço copiado (3250)', $st === 201 && $st2 === 201 && count($linhas) === 1 && $linhas[0]['quantity'] === 3 && $linhas[0]['unit_price_cents'] === 3250, "veio $st e $st2");
[$a, $ja] = req('POST', "/orders/$o2/items", ['type' => 'service', 'item_id' => 1, 'quantity' => 2], $ate);
[$b, $jb] = req('POST', "/orders/$o2/items", ['type' => 'part', 'item_id' => 999, 'quantity' => 1], $ate);
[$c, $jc] = req('POST', "/orders/$o2/items", ['type' => 'kit', 'item_id' => 1, 'quantity' => 1], $ate);
t('C6.2', 'serviço com quantidade 2, peça inexistente e tipo inválido: 422', $a === 422 && $b === 422 && $c === 422, "veio $a, $b, $c");
[$st] = req('POST', '/orders/' . $id['OS-2026-0003'] . '/items', ['type' => 'part', 'item_id' => 1, 'quantity' => 1], $ate);
t('C6.3', 'item em OS orçada: 409', $st === 409, "veio $st");
[, $jo3] = req('GET', '/orders/' . $id['OS-2026-0003'], null, $adm); $itemOutra = $jo3['items'][0]['id'] ?? 0;
[$st] = req('DELETE', "/orders/$o2/items/$itemOutra", null, $ate);
t('C6.4', 'apagar item de OUTRA OS pela URL desta: 404', $st === 404, "veio $st");
[$st] = req('DELETE', "/orders/$o2/items/" . $linhas[0]['id'], null, $ate);
[, $j] = req('GET', "/orders/$o2", null, $ate);
t('C6.5', 'apagar item da própria OS: 204 e o total cai', $st === 204 && count($j['items'] ?? []) === 2, "veio $st");
$sub = $j['totals']['subtotal_cents'] ?? 0;
[$a] = req('PATCH', "/orders/$o2/discount", ['percent' => 15], $ate);
[$b, $jb] = req('PATCH', "/orders/$o2/discount", ['percent' => 10], $ate);
t('C6.6', 'atendente: 15% dá 403; 10% dá 200', $a === 403 && $b === 200, "veio $a e $b");
[$a] = req('PATCH', "/orders/$o2/discount", ['percent' => 25], $adm);
[$b, $jb] = req('PATCH', "/orders/$o2/discount", ['percent' => 12.5], $adm);
$desc = (int) round($sub * 12.5 / 100, 0, PHP_ROUND_HALF_UP);
t('C6.7', 'admin: 25% dá 422; 12,5% dá 200 com desconto arredondado no centavo', $a === 422 && $b === 200 && ($jb['totals']['discount_cents'] ?? -1) === $desc && ($jb['totals']['total_cents'] ?? 0) === $sub - $desc,
    "veio $a e $b; esperado desconto $desc");
[$a] = req('PATCH', '/orders/' . $id['OS-2026-0005'] . '/discount', ['percent' => 5], $adm);
[$b] = req('PATCH', "/orders/$o2/discount", ['percent' => 5], $joao);
t('C6.8', 'desconto em OS aprovada: 409; mecânico: 403', $a === 409 && $b === 403, "veio $a e $b");

// ================= C7 máquina de estados e estoque
$estoque = function () use ($adm) { [, $j] = req('GET', '/parts?sort=name&page=1', null, $adm); [, $k] = req('GET', '/parts?sort=name&page=2', null, $adm);
    $m = []; foreach (array_merge($j['data'] ?? [], $k['data'] ?? []) as $p) $m[$p['sku']] = $p['stock_qty']; return $m; };
$antes = $estoque();
[$st] = req('POST', '/orders/' . $id['OS-2026-0009'] . '/transition', ['to' => 'orcada'], $ate);
t('C7.1', 'orçar OS sem itens: 409', $st === 409, "veio $st");
[$st, $j] = req('POST', "/orders/$o2/transition", ['to' => 'entregue'], $ate);
t('C7.2', 'aberta -> entregue: 409 com allowed [orcada, cancelada]', $st === 409 && ($j['allowed'] ?? []) === ['orcada', 'cancelada'], "veio $st");
[$st] = req('POST', "/orders/$o2/transition", ['to' => 'voando'], $ate);
t('C7.3', 'situação desconhecida: 422', $st === 422, "veio $st");
[$st, $j] = req('POST', '/orders/' . $id['OS-2026-0003'] . '/transition', ['to' => 'aprovada'], $ate);
$falta = []; foreach ($j['missing'] ?? [] as $m) $falta[$m['sku']] = [$m['needed'], $m['available']];
ksort($falta);
t('C7.4', 'aprovar sem estoque: 409 com missing LAM-H4 (2/0) e PAS-DIA01 (3/2)', $st === 409 && $falta === ['LAM-H4' => [2, 0], 'PAS-DIA01' => [3, 2]], 'veio ' . json_encode($j['missing'] ?? $st));
t('C7.5', 'aprovação recusada não mexe em nenhuma peça', $estoque() === $antes);
[$st] = req('POST', '/orders/' . $id['OS-2026-0004'] . '/transition', ['to' => 'aprovada'], $ate);
$depois = $estoque();
t('C7.6', 'aprovar OS-2026-0004: 200 e baixa 5 de OLE-5W30 e 1 de FIL-OLE01', $st === 200 && $depois['OLE-5W30'] === $antes['OLE-5W30'] - 5 && $depois['FIL-OLE01'] === $antes['FIL-OLE01'] - 1, "veio $st");
$o5 = $id['OS-2026-0005'];
[$a, $ja] = req('POST', "/orders/$o5/transition", ['to' => 'em_execucao'], $ate);
[$b, $jb] = req('POST', "/orders/$o5/transition", ['to' => 'em_execucao', 'mechanic_id' => 2], $ate);
t('C7.7', 'em_execucao sem mecânico ou com usuário que não é mecânico: 422 em mechanic_id', $a === 422 && $b === 422 && isset($ja['errors']['mechanic_id'], $jb['errors']['mechanic_id']), "veio $a e $b");
[$st, $j] = req('POST', "/orders/$o5/transition", ['to' => 'em_execucao', 'mechanic_id' => 4], $ate);
t('C7.8', 'em_execucao com Pedro: 200 e mechanic Pedro', $st === 200 && ($j['mechanic']['id'] ?? 0) === 4, "veio $st");
$o6 = $id['OS-2026-0006'];
[$a] = req('POST', "/orders/$o6/transition", ['to' => 'concluida'], $pedro);
[$b] = req('POST', "/orders/$o6/transition", ['to' => 'concluida'], $ate);
t('C7.9', 'concluir OS do João: Pedro 403 e atendente 403', $a === 403 && $b === 403, "veio $a e $b");
[$st] = req('POST', "/orders/$o6/transition", ['to' => 'concluida'], $joao);
t('C7.10', 'João conclui a própria OS: 200', $st === 200, "veio $st");
[$st] = req('POST', '/orders/' . $id['OS-2026-0007'] . '/transition', ['to' => 'entregue'], $joao);
t('C7.11', 'mecânico tentando entregar: 403', $st === 403, "veio $st");
[$st, $j] = req('POST', '/orders/' . $id['OS-2026-0007'] . '/transition', ['to' => 'entregue'], $ate);
t('C7.12', 'atendente entrega: 200 com delivered_at preenchido', $st === 200 && !empty($j['delivered_at']), "veio $st");
[$st, $j] = req('POST', '/orders/' . $id['OS-2026-0008'] . '/transition', ['to' => 'cancelada'], $adm);
t('C7.13', 'OS entregue não muda mais: 409 com allowed vazio', $st === 409 && ($j['allowed'] ?? null) === [], "veio $st");
$a1 = $estoque()['AMO-DIA01'];
[$st, $j] = req('POST', '/orders/' . $id['OS-2026-0012'] . '/transition', ['to' => 'cancelada'], $adm);
t('C7.14', 'cancelar OS aprovada devolve as peças ao estoque (AMO-DIA01 +2)', $st === 200 && $estoque()['AMO-DIA01'] === $a1 + 2, "veio $st");
$ult = end($j['history']);
t('C7.15', 'histórico registra a mudança com quem fez', ($ult['from'] ?? '') === 'aprovada' && ($ult['to'] ?? '') === 'cancelada' && ($ult['by'] ?? '') === 'Raul Avaliador');
[, $j] = req('GET', '/orders', null, $joao);
$todasDele = $j['data'] && !array_filter($j['data'], fn ($o) => ($o['mechanic']['id'] ?? 0) !== 3);
[$st] = req('GET', '/orders/' . $id['OS-2026-0007'], null, $joao);
t('C7.16', 'mecânico só lista as OS dele e recebe 403 na OS de outro', $todasDele && $st === 403, "veio $st");

// ================= C8 fotos
$o9 = $id['OS-2026-0009'];
[$st, $j] = req('POST', "/orders/$o9/photos", null, $ate, ['photo' => new CURLFile(jpeg(800, 600), 'image/jpeg', 'frente.jpg')]);
t('C8.1', 'foto 800×600: 201 com miniatura 320×240', $st === 201 && ($j['thumb_width'] ?? 0) === 320 && ($j['thumb_height'] ?? 0) === 240, "veio $st");
[$s1] = req('GET', $j['thumb_url'] ?? 'http://x/', null, null, null, true); [$s2] = req('GET', $j['url'] ?? 'http://x/', null, null, null, true);
t('C8.2', 'foto e miniatura acessíveis pela URL devolvida', $s1 === 200 && $s2 === 200, "veio $s1 e $s2 (rodou php artisan storage:link?)");
$txt = tempnam(sys_get_temp_dir(), 't'); file_put_contents($txt, 'nao sou imagem');
[$a] = req('POST', "/orders/$o9/photos", null, $ate, ['photo' => new CURLFile($txt, 'image/jpeg', 'falsa.jpg')]);
[$b] = req('POST', "/orders/$o9/photos", null, $ate, ['photo' => new CURLFile(jpeg(120, 90), 'image/jpeg', 'mini.jpg')]);
t('C8.3', 'arquivo que não é imagem e imagem pequena demais: 422', $a === 422 && $b === 422, "veio $a e $b");
for ($k = 0; $k < 4; $k++) req('POST', "/orders/$o9/photos", null, $ate, ['photo' => new CURLFile(jpeg(640, 480), 'image/jpeg', "f$k.jpg")]);
[$st] = req('POST', "/orders/$o9/photos", null, $ate, ['photo' => new CURLFile(jpeg(640, 480), 'image/jpeg', 'sexta.jpg')]);
[, $j] = req('GET', "/orders/$o9", null, $ate);
t('C8.4', 'sexta foto: 409 e o detalhe mostra 5 fotos', $st === 409 && count($j['photos'] ?? []) === 5, "veio $st");

// ================= C9 exclusão lógica
$o10 = $id['OS-2026-0010'];
[$a] = req('DELETE', "/orders/$o10", null, $ate);
[$b] = req('DELETE', "/orders/$o6", null, $adm);
t('C9.1', 'excluir: atendente 403; OS concluída 409', $a === 403 && $b === 409, "veio $a e $b");
[$st] = req('DELETE', "/orders/$o10", null, $adm);
[$st2] = req('GET', "/orders/$o10", null, $adm);
t('C9.2', 'admin exclui OS cancelada: 204 e ela some (404)', $st === 204 && $st2 === 404, "veio $st e $st2");
[$st, $j] = req('GET', '/orders/trash', null, $adm);
$nums = array_column((array) $j, 'number');
t('C9.3', 'lixeira lista OS-2026-0010 e OS-2026-0011', $st === 200 && in_array('OS-2026-0010', $nums) && in_array('OS-2026-0011', $nums), 'veio ' . implode(', ', $nums));
[$a, $ja] = req('POST', "/orders/$o10/restore", null, $adm);
[$b] = req('POST', "/orders/$o10/restore", null, $adm);
[$c] = req('POST', '/orders/99999/restore', null, $adm);
t('C9.4', 'restaurar: 200; de novo 409; inexistente 404', $a === 200 && ($ja['number'] ?? '') === 'OS-2026-0010' && $b === 409 && $c === 404, "veio $a, $b, $c");
[, $j] = req('GET', '/orders?status=cancelada', null, $adm);
t('C9.5', 'OS na lixeira não aparece na lista (OS-2026-0011 fora)', !in_array('OS-2026-0011', array_column($j['data'] ?? [], 'number')));

// ================= C10 lista de OS
[$st, $j] = req('GET', '/orders?from=2026-11-10&to=2026-11-12&sort=opened_at', null, $adm);
$nums = array_column($j['data'] ?? [], 'number');
t('C10.1', 'from/to incluem o dia inteiro: 5 OS de 10 a 12/11/2026 em ordem de abertura', $nums === ['OS-2026-0002', 'OS-2026-0003', 'OS-2026-0004', 'OS-2026-0005', 'OS-2026-0006'], 'veio ' . implode(', ', $nums));
[, $j] = req('GET', '/orders?search=gkp7e45', null, $adm);
[, $j2] = req('GET', '/orders?search=danilo', null, $adm);
t('C10.2', 'search por placa (minúscula) e por nome do cliente', ($j['meta']['total'] ?? 0) >= 1 && !array_filter($j['data'], fn ($o) => $o['vehicle']['plate'] !== 'GKP7E45')
    && ($j2['meta']['total'] ?? 0) >= 1 && !array_filter($j2['data'], fn ($o) => $o['customer']['name'] !== 'Danilo Prates'));
[, $j] = req('GET', '/orders?sort=-total', null, $adm);
$tot = array_column($j['data'] ?? [], 'total_cents'); $ord = $tot; rsort($ord);
$maior = max(array_map(fn ($e) => $e['total_cents'], $esp['totais']));
t('C10.3', 'sort=-total: maior total primeiro (calculado com desconto)', $tot && $tot === $ord && $tot[0] >= $maior - 1, 'veio ' . implode(',', array_slice($tot, 0, 4)));
[, $j] = req('GET', '/orders?status=entregue&page=2', null, $adm);
t('C10.4', 'filtro status com paginação de 10 (meta)', ($j['meta']['per_page'] ?? 0) === 10 && ($j['meta']['current_page'] ?? 0) === 2 && !array_filter($j['data'] ?? [], fn ($o) => $o['status'] !== 'entregue'));
[$a] = req('GET', '/orders?from=2026-11-12&to=2026-11-10', null, $adm); [$b] = req('GET', '/orders?sort=preco', null, $adm);
t('C10.5', 'to antes de from e sort inválido: 422', $a === 422 && $b === 422, "veio $a e $b");

echo "\nResultado: $ok OK, $falhas FALHA (de " . ($ok + $falhas) . ")\n";
