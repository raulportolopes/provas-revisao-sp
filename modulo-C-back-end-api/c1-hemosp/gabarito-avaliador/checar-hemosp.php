<?php
// Script de conferência – prova de revisão HemoSP (Módulo C – Back-end API).
// Uso:   php checar-hemosp.php http://localhost/XX_modulo_c/public/api
// ANTES de rodar: importe o hemosp_db.sql de novo (o script cria, cancela e muda agendamentos).
// Precisa da extensão curl (já vem ligada no XAMPP). O resultado é evidência para a CIS, não a nota final.
date_default_timezone_set('America/Sao_Paulo');
$base = rtrim($argv[1] ?? 'http://localhost/XX_modulo_c/public/api', '/');
$ok = 0; $falhas = 0;

function req(string $metodo, string $url, $corpo = null, ?string $token = null, array $arquivo = null): array
{
    global $base;
    $c = curl_init($base . $url);
    $h = ['Accept: application/json'];
    if ($token) $h[] = "Authorization: Bearer $token";
    if ($arquivo) {
        curl_setopt($c, CURLOPT_POSTFIELDS, $arquivo);           // multipart
    } elseif ($corpo !== null) {
        $h[] = 'Content-Type: application/json';
        curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($corpo));
    }
    curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $h,
        CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 20]);
    $r = curl_exec($c);
    if ($r === false) return [0, null, '', curl_error($c)];
    $hs = curl_getinfo($c, CURLINFO_HEADER_SIZE);
    return [curl_getinfo($c, CURLINFO_RESPONSE_CODE), json_decode(substr($r, $hs), true), substr($r, 0, $hs), substr($r, $hs)];
}
function t(string $id, string $nome, bool $passou, string $dica = ''): void
{
    global $ok, $falhas;
    $passou ? $ok++ : $falhas++;
    printf("%-7s %-5s %s%s\n", $id, $passou ? 'OK' : 'FALHA', $nome, $passou || !$dica ? '' : "\n               -> $dica");
}
function semAcento(string $s): string { return strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $s)); }
function login(string $email, bool $staff = false): ?string
{
    [, $j] = req('POST', $staff ? '/staff/login' : '/login', ['email' => $email, 'password' => $staff ? 'Hemo@2026' : 'Doador@2026']);
    return $j['token'] ?? null;
}

// Datas de teste calculadas a partir de hoje (o banco também é relativo a hoje)
$fechados = ['2026-11-20', '2026-12-25', '2026-12-08', '2027-01-01', '2027-01-25', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21',
    '2027-05-01', '2027-05-27', '2027-07-09', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25', '2027-01-15'];
$d = new DateTime('today +2 day');
while ((int) $d->format('N') >= 6 || in_array($d->format('Y-m-d'), $fechados)) $d->modify('+1 day');
$D = $d->format('Y-m-d');                                  // dia útil aberto em todas as unidades
$s = new DateTime('today +1 day');
while ($s->format('N') !== '6' || in_array($s->format('Y-m-d'), $fechados)) $s->modify('+1 day');
$SAB = $s->format('Y-m-d');
$dom = new DateTime('today +1 day'); while ($dom->format('N') !== '7') $dom->modify('+1 day');
$DOM = $dom->format('Y-m-d');
$hoje = date('Y-m-d');
$mais = fn (int $n) => (new DateTime(sprintf('today %+d day', $n)))->format('Y-m-d');
$esp = json_decode(file_get_contents(__DIR__ . '/esperado.json'), true);

echo "HemoSP – conferência da API em $base\nDia útil de teste: $D · sábado: $SAB · domingo: $DOM\n\n";

// ================= C2 estrutura e erros JSON
[$st, $j] = req('GET', '');
t('C2.1', 'GET /api responde 200 em JSON', $st === 200 && is_array($j), "veio $st");
[$st, $j] = req('GET', '/rota-que-nao-existe');
t('C2.2', 'rota inexistente: 404 em JSON', $st === 404 && isset($j['message']), "veio $st");
[$st, $j, $cab] = req('DELETE', '/centers');
t('C2.3', 'método errado (DELETE /centers): 405 em JSON', $st === 405 && isset($j['message']), "veio $st");

// ================= C3 rotas públicas
[$st, $j] = req('GET', '/blood-stock');
$ok1 = $st === 200 && is_array($j) && count($j) === 8;
if ($ok1) foreach ($esp['estoque'] as $k => $e) {
    $g = $j[$k] ?? [];
    if (($g['blood_type'] ?? '') !== $e['blood_type'] || (int) ($g['volume_ml'] ?? -1) !== $e['volume_ml']
        || abs((float) ($g['percent'] ?? -1) - $e['percent']) > 0.05 || ($g['level'] ?? '') !== $e['level']) { $ok1 = false; break; }
}
t('C3.1', 'estoque: volume dos últimos 35 dias, percentual, nível e ordem (mais crítico primeiro)', $ok1,
    'esperado: ' . implode(', ', array_map(fn ($e) => "{$e['blood_type']} {$e['percent']}% {$e['level']}", $esp['estoque'])));
[$st, $j] = req('GET', '/centers');
t('C3.2', 'unidades: só as 3 ativas, em ordem de nome', $st === 200 && array_column((array) $j, 'id') === [1, 2, 3], 'veio ids ' . json_encode(array_column((array) $j, 'id')));
[$st, $j] = req('GET', '/centers?neighborhood=mooca');
t('C3.3', 'filtro neighborhood=mooca (parte do nome, sem diferenciar maiúscula)', $st === 200 && array_column((array) $j, 'id') === [2]);
[$st, $j] = req('GET', "/centers?open_on=$SAB");
t('C3.4', "filtro open_on=$SAB (sábado): unidades 1 e 3", $st === 200 && array_column((array) $j, 'id') === [1, 3], 'veio ' . json_encode(array_column((array) $j, 'id')));
[$st] = req('GET', '/centers?open_on=2026-02-30');
t('C3.5', 'open_on inválido (2026-02-30): 422', $st === 422, "veio $st");

[$st, $j] = req('GET', "/centers/1/slots?date=$D");
$sl = $j['slots'] ?? [];
t('C3.6', 'vagas do Hemocentro em dia útil: 33 horários de 07:00 a 17:40, 3 vagas cada', $st === 200 && count($sl) === 33
    && ($sl[0]['time'] ?? '') === '07:00' && (end($sl)['time'] ?? '') === '17:40' && ($sl[5]['available'] ?? 0) === 3,
    'veio ' . count($sl) . ' horários');
t('C3.7', 'starts_at do horário em ISO 8601 com -03:00', isset($sl[0]['starts_at']) && $sl[0]['starts_at'] === "{$D}T07:00:00-03:00", 'veio ' . ($sl[0]['starts_at'] ?? '-'));
[$st, $j] = req('GET', "/centers/2/slots?date=$SAB");
t('C3.8', 'unidade que não abre sábado: 200, open=false, slots vazio e motivo', $st === 200 && ($j['open'] ?? null) === false && ($j['slots'] ?? 1) === [] && !empty($j['reason']));
[$st, $j] = req('GET', "/centers/1/slots?date=$DOM");
t('C3.9', 'domingo: open=false', $st === 200 && ($j['open'] ?? null) === false);
$fer = null; foreach (['2026-12-25', '2027-01-01', '2027-01-25', '2027-02-08', '2027-03-26', '2027-04-21', '2027-05-27', '2027-07-09', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-12-25'] as $f)
    if ($f > $hoje && $f <= $mais(90) && (new DateTime($f))->format('N') < 7) { $fer = $f; break; }
if ($fer) { [$st, $j] = req('GET', "/centers/1/slots?date=$fer");
    t('C3.10', "feriado da tabela closures ($fer): open=false com o motivo", $st === 200 && ($j['open'] ?? null) === false && str_contains((string) ($j['reason'] ?? ''), 'Natal') || ($j['open'] ?? null) === false); }
[$st] = req('GET', "/centers/4/slots?date=$D");
[$st2] = req('GET', "/centers/999/slots?date=$D");
t('C3.11', 'unidade inativa (4) e inexistente (999): 404', $st === 404 && $st2 === 404, "veio $st e $st2");
[$a] = req('GET', '/centers/1/slots?date=2026-02-30'); [$b] = req('GET', '/centers/1/slots?date=' . $mais(-1)); [$c] = req('GET', '/centers/1/slots?date=' . $mais(95));
t('C3.12', 'data inválida, passada e além de 90 dias: 422', $a === 422 && $b === 422 && $c === 422, "veio $a, $b, $c");

// ================= C4 cadastro e autenticação
[$st, $j] = req('POST', '/register', []);
$campos = ['name', 'cpf', 'email', 'password', 'birth_date', 'sex', 'weight_kg'];
t('C4.1', 'cadastro vazio: 422 com TODOS os campos em errors', $st === 422 && !array_diff($campos, array_keys($j['errors'] ?? [])), 'faltou: ' . implode(',', array_diff($campos, array_keys($j['errors'] ?? []))));
$novo = ['name' => 'Teste Revisão', 'cpf' => '529.982.247-25', 'email' => 'teste@doador.test', 'password' => 'Senha1234',
    'birth_date' => '1990-05-10', 'sex' => 'F', 'weight_kg' => 64.5, 'blood_type' => 'AB-'];
[$st, $j] = req('POST', '/register', ['cpf' => '529.982.247-24'] + $novo);
t('C4.2', 'CPF com dígito verificador errado: 422 em cpf', $st === 422 && isset($j['errors']['cpf']), "veio $st");
[$st, $j] = req('POST', '/register', ['cpf' => $esp['cpfs']['Ana Beatriz Souza']] + $novo);
t('C4.3', 'CPF já cadastrado (só números): 422 em cpf', $st === 422 && isset($j['errors']['cpf']), "veio $st");
[$st, $j] = req('POST', '/register', ['birth_date' => $mais(-15 * 365)] + $novo);
t('C4.4', 'menor de 16 anos: 422 em birth_date', $st === 422 && isset($j['errors']['birth_date']), "veio $st");
[$st, $j] = req('POST', '/register', ['password' => 'somenteletras'] + $novo);
t('C4.5', 'senha sem número: 422 em password', $st === 422 && isset($j['errors']['password']), "veio $st");
[$st, $j] = req('POST', '/register', $novo);
$tkNovo = $j['token'] ?? null;
t('C4.6', 'cadastro certo (CPF com máscara): 201 com token', $st === 201 && $tkNovo, "veio $st");
[$st, $j] = req('GET', '/me', null, $tkNovo);
t('C4.7', 'CPF gravado sem máscara e devolvido com máscara; tipo AB-', ($j['cpf'] ?? '') === '529.982.247-25' && ($j['blood_type'] ?? '') === 'AB-', 'veio ' . ($j['cpf'] ?? '-'));
[$st] = req('POST', '/login', ['email' => 'ana@doador.test', 'password' => 'errada']);
t('C4.8', 'login com senha errada: 401', $st === 401, "veio $st");
[$st, $j] = req('GET', '/me');
t('C4.9', 'GET /me sem token: 401 JSON', $st === 401 && isset($j['message']), "veio $st");
$tk = []; foreach (['ana', 'bruno', 'camila', 'diego', 'eduarda', 'felipe', 'gabriela', 'heitor', 'isabel', 'joao', 'karina', 'lucas', 'otavio'] as $n) $tk[$n] = login("$n@doador.test");
$adm = login('admin@hemosp.test', true); $tri = login('triagem@hemosp.test', true);
t('C4.10', 'login de doadores e da equipe devolvem token', !in_array(null, $tk, true) && $adm && $tri);
[$a] = req('GET', '/me', null, $adm); [$b] = req('GET', '/staff/appointments', null, $tk['ana']);
t('C4.11', 'token da equipe em /me e token de doador em /staff: 403', $a === 403 && $b === 403, "veio $a e $b");
[$st] = req('POST', '/logout', null, $tkNovo); [$st2] = req('GET', '/me', null, $tkNovo);
t('C4.12', 'logout: 204 e o token deixa de valer (401)', $st === 204 && $st2 === 401, "veio $st e $st2");

// ================= C5 elegibilidade (GET /me)
$el = function ($n) use ($tk) { [, $j] = req('GET', '/me', null, $tk[$n]); return $j['eligibility'] ?? []; };
$codes = fn ($e) => array_column($e['reasons'] ?? [], 'code');
$e = $el('ana');
t('C5.1', 'Ana: apta hoje, next_eligible_date = hoje', ($e['eligible_today'] ?? null) === true && ($e['next_eligible_date'] ?? '') === $hoje);
$e = $el('bruno');
t('C5.2', 'Bruno (H, doou há 30 dias): INTERVAL, próxima = hoje + 30', $codes($e) === ['INTERVAL'] && ($e['next_eligible_date'] ?? '') === $mais(30), 'veio ' . json_encode($e));
$e = $el('camila');
t('C5.3', 'Camila (M, doou há 70 dias): INTERVAL de 90 dias, próxima = hoje + 20', $codes($e) === ['INTERVAL'] && ($e['next_eligible_date'] ?? '') === $mais(20), 'veio ' . ($e['next_eligible_date'] ?? '-'));
$e = $el('diego');
t('C5.4', 'Diego (4 doações em 12 meses): YEARLY_LIMIT, próxima = hoje + 65', $codes($e) === ['YEARLY_LIMIT'] && ($e['next_eligible_date'] ?? '') === $mais(65), 'veio ' . json_encode($e));
t('C5.5', 'Eduarda (17 anos, sem autorização): GUARDIAN_DOCUMENT', $codes($el('eduarda')) === ['GUARDIAN_DOCUMENT']);
$e = $el('gabriela');
t('C5.6', 'Gabriela (48 kg): WEIGHT e next_eligible_date null', $codes($e) === ['WEIGHT'] && array_key_exists('next_eligible_date', $e) && $e['next_eligible_date'] === null);
t('C5.7', 'Heitor (63 anos, nunca doou): FIRST_DONATION_AGE', $codes($el('heitor')) === ['FIRST_DONATION_AGE']);
t('C5.8', 'Isabel (66 anos, já doou): apta', ($el('isabel')['eligible_today'] ?? null) === true);
t('C5.9', 'João Pedro (70 anos): AGE_MAX', $codes($el('joao')) === ['AGE_MAX']);

// ================= C6 agendamento
[$st, $j] = req('POST', '/me/appointments', [], $tk['ana']);
t('C6.1', 'agendamento vazio: 422 com center_id e starts_at', $st === 422 && isset($j['errors']['center_id'], $j['errors']['starts_at']), "veio $st");
[$st, $j] = req('POST', '/me/appointments', ['center_id' => 4, 'starts_at' => "$D 09:00"], $tk['ana']);
t('C6.2', 'unidade inativa: 422 em center_id', $st === 422 && isset($j['errors']['center_id']), "veio $st");
$r = [];
foreach (["$D 09:10", "$D 17:50", "$DOM 09:00", $mais(-1) . ' 09:00', $mais(95) . ' 09:00', "{$D}T09:00"] as $q) {
    [$st, $j] = req('POST', '/me/appointments', ['center_id' => 1, 'starts_at' => $q], $tk['ana']); $r[] = $st === 422 && isset($j['errors']['starts_at']) ? 'ok' : $st;
}
t('C6.3', 'fora da grade, terminando depois de fechar, domingo, passado, +90 dias e formato errado: 422 em starts_at', $r === array_fill(0, 6, 'ok'), 'veio ' . json_encode($r));
[$st, $j] = req('POST', '/me/appointments', ['center_id' => 1, 'starts_at' => "$D 09:00"], $tk['bruno']);
t('C6.4', 'Bruno inapto: 422 com reasons[].code = INTERVAL', $st === 422 && array_column($j['reasons'] ?? [], 'code') === ['INTERVAL'], "veio $st");
[$st, $j] = req('POST', '/me/appointments', ['center_id' => 1, 'starts_at' => "$D 09:00"], $tk['karina']);
t('C6.5', 'Karina já tem agendamento futuro: 409', $st === 409, "veio $st");
[$st, $j] = req('POST', '/me/appointments', ['center_id' => 2, 'starts_at' => "$D 10:00"], $tk['ana']);
$apAna = $j['id'] ?? ($j['data']['id'] ?? null); $j = $j['data'] ?? $j;
t('C6.6', 'Ana agenda: 201 com protocolo HEMO-AAAA-NNNNN e status scheduled', $st === 201 && preg_match('/^HEMO-\d{4}-\d{5}$/', $j['protocol'] ?? '') && ($j['status'] ?? '') === 'scheduled', "veio $st");
t('C6.7', 'starts_at e ends_at (+20 min) em ISO com -03:00', ($j['starts_at'] ?? '') === "{$D}T10:00:00-03:00" && ($j['ends_at'] ?? '') === "{$D}T10:20:00-03:00");
$p1 = (int) substr($j['protocol'] ?? '0', -5);
[$st, $j] = req('POST', '/me/appointments', ['center_id' => 2, 'starts_at' => "$D 10:00"], $tk['isabel']); $j = $j['data'] ?? $j;
t('C6.8', 'Isabel no mesmo horário (2ª vaga): 201 e protocolo seguinte', $st === 201 && (int) substr($j['protocol'] ?? '0', -5) === $p1 + 1, "veio $st " . ($j['protocol'] ?? ''));
[$st] = req('POST', '/me/appointments', ['center_id' => 2, 'starts_at' => "$D 10:00"], $tk['felipe']);
t('C6.9', 'Felipe no mesmo horário (capacidade 2 esgotada): 409', $st === 409, "veio $st");
[, $j] = req('GET', "/centers/2/slots?date=$D");
$v = array_values(array_filter($j['slots'] ?? [], fn ($x) => $x['time'] === '10:00'))[0]['available'] ?? -1;
t('C6.10', 'vagas do horário 10:00 na Mooca agora = 0', $v === 0, "veio $v");
[$st] = req('POST', '/me/appointments', ['center_id' => 1, 'starts_at' => "$D 11:00"], $tk['ana']);
t('C6.11', 'Ana tenta um 2º agendamento em aberto: 409', $st === 409, "veio $st");
$pdf = tempnam(sys_get_temp_dir(), 'h') . '.pdf'; file_put_contents($pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
[$st, $j] = req('POST', '/me/guardian-document', null, $tk['ana'], ['document' => new CURLFile($pdf, 'application/pdf', 'autorizacao.pdf')]);
t('C6.12', 'autorização enviada por adulta: 409', $st === 409, "veio $st");
$tmp = tempnam(sys_get_temp_dir(), 'h'); file_put_contents($tmp, "texto qualquer");
[$st, $j] = req('POST', '/me/guardian-document', null, $tk['eduarda'], ['document' => new CURLFile($tmp, 'text/plain', 'doc.txt')]);
t('C6.13', 'autorização em .txt: 422 em document', $st === 422 && isset($j['errors']['document']), "veio $st");
[$st] = req('POST', '/me/guardian-document', null, $tk['eduarda'], ['document' => new CURLFile($pdf, 'application/pdf', 'autorizacao.pdf')]);
[$st2] = req('POST', '/me/appointments', ['center_id' => 3, 'starts_at' => "$D 08:00"], $tk['eduarda']);
t('C6.14', 'Eduarda envia o PDF (201) e então consegue agendar (201)', $st === 201 && $st2 === 201, "veio $st e $st2");

// ================= C7 histórico e cancelamento do doador
[$st, $j] = req('GET', '/me/appointments', null, $tk['ana']);
t('C7.1', 'Ana: 3 agendamentos, o mais recente primeiro, meta com total', $st === 200 && ($j['meta']['total'] ?? 0) === 3 && ($j['data'][0]['id'] ?? 0) === $apAna, 'veio total ' . ($j['meta']['total'] ?? '-'));
[$st, $j] = req('GET', '/me/appointments?status=donated', null, $tk['ana']);
t('C7.2', 'filtro status=donated: 2', ($j['meta']['total'] ?? 0) === 2);
[$st, $j] = req('GET', '/me/appointments?status=xyz', null, $tk['ana']);
t('C7.3', 'status inválido: 422', $st === 422, "veio $st");
[, $jk] = req('GET', '/me/appointments', null, $tk['karina']); $idK = $jk['data'][0]['id'] ?? 0;
[$st] = req('DELETE', "/me/appointments/$idK", null, $tk['ana']);
t('C7.4', 'cancelar agendamento de outra pessoa: 403', $st === 403, "veio $st");
[$st] = req('DELETE', '/me/appointments/99999', null, $tk['ana']);
t('C7.5', 'cancelar agendamento inexistente: 404', $st === 404, "veio $st");
[, $jl] = req('GET', '/me/appointments', null, $tk['lucas']); $idL = $jl['data'][0]['id'] ?? 0;
[$st] = req('DELETE', "/me/appointments/$idL", null, $tk['lucas']);
t('C7.6', 'cancelar com menos de 2 h de antecedência: 409', $st === 409, "veio $st");
[$st, $j] = req('DELETE', "/me/appointments/$apAna", null, $tk['ana']); $j = $j['data'] ?? $j;
t('C7.7', 'Ana cancela: 200, status cancelled e cancelled_at preenchido', $st === 200 && ($j['status'] ?? '') === 'cancelled' && !empty($j['cancelled_at']), "veio $st");
[$st] = req('DELETE', "/me/appointments/$apAna", null, $tk['ana']);
t('C7.8', 'cancelar de novo: 409', $st === 409, "veio $st");
[, $j] = req('GET', '/me/appointments', null, $tk['ana']);
t('C7.9', 'cancelado continua no histórico (linha não é apagada): total 3', ($j['meta']['total'] ?? 0) === 3);
[$st] = req('POST', '/me/appointments', ['center_id' => 2, 'starts_at' => "$D 10:00"], $tk['felipe']);
t('C7.10', 'a vaga liberada pelo cancelamento pode ser usada (Felipe 201)', $st === 201, "veio $st");

// ================= C8 equipe
[$st, $j] = req('GET', '/staff/appointments?date=2025-06-10', null, $tri);
t('C8.1', 'lista do dia 10/06/2025: total ' . $esp['total_10_06'] . ', 10 por página, 2 páginas', $st === 200 && ($j['meta']['total'] ?? 0) === $esp['total_10_06']
    && count($j['data'] ?? []) === 10 && ($j['meta']['last_page'] ?? 0) === 2, 'veio ' . json_encode($j['meta'] ?? $st));
$h = array_column($j['data'] ?? [], 'starts_at'); $hs = $h; sort($hs);
t('C8.2', 'ordem padrão por horário crescente e com o doador (nome e CPF com máscara)', $h === $hs && preg_match('/^\d{3}\.\d{3}\.\d{3}-\d{2}$/', $j['data'][0]['donor']['cpf'] ?? ''));
[, $j] = req('GET', '/staff/appointments?date=2025-06-10&sort=-starts_at&page=2', null, $tri);
$h = array_column($j['data'] ?? [], 'starts_at'); $hs = $h; rsort($hs);
t('C8.3', 'sort=-starts_at com page=2: o restante em ordem decrescente', count($h) === $esp['total_10_06'] - 10 && $h === $hs);
[, $j] = req('GET', '/staff/appointments?date=2025-06-10&sort=donor', null, $tri);
$n = array_map(fn ($x) => semAcento($x['donor']['name'] ?? ''), $j['data'] ?? []); $ns = $n; sort($ns);
t('C8.4', 'sort=donor: nomes em ordem alfabética (ignorando acentos)', $n && $n === $ns, 'veio ' . implode(', ', array_slice($n, 0, 5)));
[, $j] = req('GET', '/staff/appointments?search=ribeiro', null, $tri);
[, $j2] = req('GET', '/staff/appointments?search=' . urlencode(substr(preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $esp['cpfs']['Natália Ribeiro']), 0, 7)), null, $tri);
t('C8.5', 'search por parte do nome e por início do CPF com máscara', ($j['meta']['total'] ?? 0) >= 1 && ($j2['meta']['total'] ?? 0) >= 1
    && ($j2['data'][0]['donor']['name'] ?? '') === 'Natália Ribeiro', 'veio ' . ($j['meta']['total'] ?? '-') . ' e ' . ($j2['meta']['total'] ?? '-'));
[$a] = req('GET', '/staff/appointments?status=xyz', null, $tri); [$b] = req('GET', '/staff/appointments?sort=nome', null, $tri);
t('C8.6', 'status ou sort inválidos: 422', $a === 422 && $b === 422, "veio $a e $b");
[$st] = req('GET', '/staff/appointments');
t('C8.7', 'rotas da equipe sem token: 401', $st === 401, "veio $st");

// transições (ids pelos nomes)
$idDe = function (string $nome) use ($tri) { [, $j] = req('GET', '/staff/appointments?search=' . urlencode($nome) . '&sort=-starts_at', null, $tri); return $j['data'][0]['id'] ?? 0; };
$paula = $idDe('Paula Castro'); $nat = $idDe('Natália Ribeiro'); $ota = $idDe('Otávio Mendes'); $mar = $idDe('Marcos Vinícius'); $kar = $idDe('Karina Duarte');
[$st, $j] = req('PATCH', "/staff/appointments/$paula/status", ['status' => 'attended'], $tri);
t('C9.1', 'donated -> attended: 409 com "allowed" vazio', $st === 409 && ($j['allowed'] ?? null) === [], "veio $st");
[$st] = req('PATCH', "/staff/appointments/$paula/status", ['status' => 'xyz'], $tri);
t('C9.2', 'status inexistente: 422', $st === 422, "veio $st");
[$a] = req('PATCH', "/staff/appointments/$kar/status", ['status' => 'attended'], $tri);
[$b] = req('PATCH', "/staff/appointments/$kar/status", ['status' => 'no_show'], $tri);
t('C9.3', 'Karina (daqui a 3 dias): presença cedo demais e falta antes da hora: 409', $a === 409 && $b === 409, "veio $a e $b");
[$st, $j] = req('PATCH', "/staff/appointments/$mar/status", ['status' => 'no_show'], $tri); $j = $j['data'] ?? $j;
t('C9.4', 'Marcos (começou há 2 h): no_show 200', $st === 200 && ($j['status'] ?? '') === 'no_show', "veio $st");
[$st] = req('PATCH', "/staff/appointments/$nat/status", ['status' => 'attended'], $tri);
[$st2, $j] = req('PATCH', "/staff/appointments/$nat/status", ['status' => 'donated'], $tri);
t('C9.5', 'Natália: attended 200; donated sem volume: 422 em volume_ml', $st === 200 && $st2 === 422 && isset($j['errors']['volume_ml']), "veio $st e $st2");
[$a] = req('PATCH', "/staff/appointments/$nat/status", ['status' => 'donated', 'volume_ml' => 600], $tri);
[$b, $j] = req('PATCH', "/staff/appointments/$nat/status", ['status' => 'donated', 'volume_ml' => 450], $tri); $j = $j['data'] ?? $j;
t('C9.6', 'volume 600: 422; volume 450: 200 com volume_ml 450', $a === 422 && $b === 200 && ($j['volume_ml'] ?? 0) === 450, "veio $a e $b");
[$a, $j1] = req('PATCH', "/staff/appointments/$ota/status", ['status' => 'unfit'], $tri);
[$b, $j2] = req('PATCH', "/staff/appointments/$ota/status", ['status' => 'donated', 'volume_ml' => 450], $tri);
t('C9.7', 'Otávio: unfit sem motivo 422; donated sem tipo sanguíneo (doador sem tipo) 422 em blood_type', $a === 422 && isset($j1['errors']['unfit_reason']) && $b === 422 && isset($j2['errors']['blood_type']), "veio $a e $b");
[$st] = req('PATCH', "/staff/appointments/$ota/status", ['status' => 'donated', 'volume_ml' => 470, 'blood_type' => 'O-'], $tri);
[, $j] = req('GET', '/me', null, $tk['otavio']);
t('C9.8', 'com blood_type O-: 200 e o doador passa a ter tipo O-', $st === 200 && ($j['blood_type'] ?? '') === 'O-', "veio $st, tipo " . ($j['blood_type'] ?? '-'));
[$st] = req('PATCH', "/staff/appointments/$kar/status", ['status' => 'cancelled'], $tri);
t('C9.9', 'equipe cancela o agendamento futuro da Karina: 200', $st === 200, "veio $st");
[$st, $j] = req('GET', "/staff/appointments/$nat/history", null, $tri);
$ev = array_map(fn ($e) => ($e['from'] ?? 'null') . '>' . $e['to'], $j['events'] ?? []);
t('C9.10', 'histórico da Natália: null>scheduled, scheduled>attended, attended>donated, com quem fez', $ev === ['null>scheduled', 'scheduled>attended', 'attended>donated']
    && ($j['events'][2]['by'] ?? '') === 'Tânia Triagem', 'veio ' . implode(', ', $ev));

// ================= C10 exportação e relatório
[$st, , $cab, $txt] = req('GET', '/staff/appointments/export?date=2025-06-10', null, $tri);
$linhas = preg_split('/\r?\n/', rtrim($txt));
t('C10.1', 'CSV: Content-Type text/csv e download com nome do arquivo', $st === 200 && stripos($cab, 'text/csv') !== false && stripos($cab, 'attachment') !== false, "veio $st");
t('C10.2', 'CSV com BOM, separador ; e cabeçalho', str_starts_with($txt, "\xEF\xBB\xBF") && str_contains($linhas[0], 'Protocolo;'));
t('C10.3', 'CSV com ' . ($esp['total_10_06'] + 1) . ' linhas, data dd/mm/aaaa e CPF com máscara', count($linhas) === $esp['total_10_06'] + 1
    && str_contains($linhas[1] ?? '', ';10/06/2025;') && preg_match('/;\d{3}\.\d{3}\.\d{3}-\d{2};/', $linhas[1] ?? ''), 'veio ' . count($linhas) . ' linhas');
[$st] = req('GET', '/staff/appointments/export', null, $tri);
t('C10.4', 'exportação sem date: 422', $st === 422, "veio $st");
[$st] = req('GET', '/staff/reports/monthly?month=2025-06', null, $tri);
t('C10.5', 'relatório com usuário da triagem: 403', $st === 403, "veio $st");
[$st, $j] = req('GET', '/staff/reports/monthly?month=2025-06', null, $adm);
$okR = $st === 200 && count($j['centers'] ?? []) === 4;
if ($okR) foreach ($esp['relatorio_2025_06'] as $k => $e) { $g = $j['centers'][$k];
    foreach (['total', 'donated', 'unfit', 'no_show', 'cancelled'] as $c) if ((int) $g[$c] !== $e[$c]) $okR = false;
    if (abs($g['no_show_rate'] - $e['no_show_rate']) > 0.05 || abs($g['volume_liters'] - $e['volume_liters']) > 0.011) $okR = false; }
t('C10.6', 'relatório de 06/2025 por unidade (inclui a inativa com zeros), taxa de falta e litros', $okR,
    'esperado: ' . implode(' | ', array_map(fn ($e) => "{$e['center_id']}: {$e['total']} tot, {$e['donated']} doou, {$e['no_show_rate']}% falta, {$e['volume_liters']} L", $esp['relatorio_2025_06'])));
[$st] = req('GET', '/staff/reports/monthly?month=2026-13', null, $adm);
t('C10.7', 'mês inválido (2026-13): 422', $st === 422, "veio $st");

echo "\nResultado: $ok OK, $falhas FALHA (de " . ($ok + $falhas) . ")\n";
