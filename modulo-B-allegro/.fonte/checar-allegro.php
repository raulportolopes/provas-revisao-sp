<?php
// Checagem automática do Módulo B – Allegro (apoio do avaliador e teste da solução).
// Uso: php checar-allegro.php http://servidor/XX_modulo_b  
// ANTES de rodar: reimporte allegro_db.sql (o script cria, altera e apaga registros).
// Precisa da extensão curl. O resultado é evidência para a CIS, não a nota final.
// Os códigos [B3.2] etc. são as linhas da CIS e do guia do avaliador.

date_default_timezone_set('America/Sao_Paulo');
$base = rtrim($argv[1] ?? 'http://localhost/XX_modulo_b', '/');
$fotos = rtrim($argv[2] ?? __DIR__ . '/fotos-teste', '/');
$ok = 0; $falhas = 0; $jar = [];
$SENHA = 'ProvaB2026!';

function http(string $quem, string $metodo, string $url, array $dados = [], array $arquivos = []): array
{
    global $base, $jar;
    $jar[$quem] ??= tempnam(sys_get_temp_dir(), 'alg');
    $c = curl_init($base . $url);
    $op = [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 20,
        CURLOPT_COOKIEJAR => $jar[$quem], CURLOPT_COOKIEFILE => $jar[$quem]];
    if ($metodo !== 'GET') {
        if (in_array($metodo, ['PUT', 'DELETE'], true)) { $dados['_method'] = $metodo; }
        $op[CURLOPT_POST] = true;
        if ($arquivos) {
            $campos = [];
            foreach ($dados as $k => $v) {
                if (is_array($v)) { foreach ($v as $i => $x) $campos["{$k}[{$i}]"] = $x; } else { $campos[$k] = $v; }
            }
            foreach ($arquivos as $i => $f) $campos["fotos[$i]"] = new CURLFile($f);
            $op[CURLOPT_POSTFIELDS] = $campos;
        } else {
            $op[CURLOPT_POSTFIELDS] = http_build_query($dados);
        }
    }
    curl_setopt_array($c, $op);
    $r = curl_exec($c);
    if ($r === false) return [0, '', ''];
    $hs = curl_getinfo($c, CURLINFO_HEADER_SIZE);
    $cab = substr($r, 0, $hs);
    preg_match('/^Location:\s*(\S+)/mi', $cab, $m);
    return [curl_getinfo($c, CURLINFO_RESPONSE_CODE), substr($r, $hs), $m[1] ?? '', $cab];
}
function get(string $quem, string $url): array { return http($quem, 'GET', $url); }
// Envia formulário: pega o _token da página indicada e segue UM redirecionamento (para ver a mensagem)
function enviar(string $quem, string $metodo, string $url, array $dados, string $pagina = '/', array $arq = []): array
{
    [, $html] = get($quem, $pagina);
    preg_match('/name="_token"\s+value="([^"]+)"/', $html, $m);
    $dados['_token'] = $m[1] ?? '';
    [$s, $corpo, $loc, $cab] = http($quem, $metodo, $url, $dados, $arq);
    if ($s === 302 && $loc) {
        $destino = str_starts_with($loc, 'http') ? substr($loc, strlen($GLOBALS['base'])) : $loc;
        [$s2, $corpo2] = get($quem, $destino ?: '/');
        return [$s, $corpo2, $loc, $s2];
    }
    return [$s, $corpo, $loc, $s];
}
function t(string $id, string $nome, bool $passou, string $dica = ''): void
{
    global $ok, $falhas;
    $passou ? $ok++ : $falhas++;
    printf("%-7s %-5s %s%s\n", $id, $passou ? 'OK' : 'FALHA', $nome, $passou || ! $dica ? '' : "\n               -> $dica");
}
function txt(string $html): string { return html_entity_decode(preg_replace('/\s+/', ' ', strip_tags($html)), ENT_QUOTES, 'UTF-8'); }
function login(string $quem, string $email): array { return enviar($quem, 'POST', '/login', ['email' => $email, 'password' => $GLOBALS['SENHA']], '/login'); }
// Códigos OS-AAAA-NNNN que aparecem numa página, na ordem
function codigos(string $html): array { preg_match_all('/\b[A-Z]{3}-[A-Z]{3}-[A-Z]{3}\d{2}\b/', $html, $m); return array_values(array_unique($m[0])); }
function idDe(string $loc): ?int { return preg_match('#/(\d+)(/|$)#', $loc, $m) ? (int) $m[1] : null; }

// Valor atualizado: 2% de multa + 1% ao mês pro rata dia (dias / 30)
function atualizado(float $v, string $venc, string $em): float
{
    $d = (int) round((strtotime($em) - strtotime($venc)) / 86400);
    return $d <= 0 ? round($v, 2) : round($v * (1 + 0.02 + 0.01 * $d / 30), 2);
}
function moeda(float $v): string { return 'R$ ' . number_format($v, 2, ',', '.'); }
function nomesNaTabela(string $html): array { preg_match_all('#/alunos/\d+">([^<]+)</a>#u', $html, $m); return array_map(fn ($x) => html_entity_decode($x, ENT_QUOTES, 'UTF-8'), $m[1]); }

echo "Allegro – checagem em $base\n\n";
$hoje = date('Y-m-d');
$diaHoje = (int) date('N'); // 1 = segunda ... 7 = domingo

// ======================= B1 entrega =======================
[$s, , $loc] = get('anon', '/');
t('B1.1', 'raiz sem login redireciona para /login', $s === 302 && str_ends_with($loc, '/login'), "veio $s $loc");
[$s, $h] = get('anon', '/login');
t('B1.2', '/login abre com e-mail e senha', $s === 200 && str_contains($h, 'name="email"') && str_contains($h, 'name="password"'));

// ======================= B2 autenticação =======================
$ok2 = true;
foreach (['/turmas', '/turmas/1', '/alunos', '/alunos/1', '/mensalidades', '/relatorios/inadimplencia', '/turmas/criar'] as $u) {
    [$s, , $loc] = get('anon', $u); $ok2 = $ok2 && $s === 302 && str_ends_with($loc, '/login');
}
t('B2.1', 'rotas internas sem login redirecionam para /login', $ok2);
[, $h] = enviar('anon', 'POST', '/login', ['email' => 'secretaria.prova@allegro.com', 'password' => 'x'], '/login');
t('B2.2', 'senha errada: mensagem e e-mail preenchido', str_contains(txt($h), 'E-mail ou senha incorretos') && str_contains($h, 'value="secretaria.prova@allegro.com"'));
[, $h] = login('I', 'inativo.prova@allegro.com'); [$s2] = get('I', '/turmas');
t('B2.3', 'usuário inativo não entra', str_contains(txt($h), 'inativo') && $s2 === 302);
[, $h] = login('C', 'coordenacao.prova@allegro.com');
t('B2.4', 'login leva ao painel com o nome', str_contains(txt($h), 'Beatriz Amaral'));
login('S', 'secretaria.prova@allegro.com'); login('P', 'professor.prova@allegro.com'); login('P2', 'professor2.prova@allegro.com');
login('X', 'secretaria.prova@allegro.com'); enviar('X', 'POST', '/logout', [], '/');
[$s2, , $l2] = get('X', '/alunos');
t('B2.5', 'logout por POST encerra a sessão', $s2 === 302 && str_ends_with($l2, '/login'));

// ======================= B3 acesso =======================
$m = []; $todos = true;
foreach ([['P', '/alunos'], ['P', '/alunos/1'], ['P', '/mensalidades'], ['P', '/relatorios/inadimplencia'], ['P', '/turmas/criar'],
          ['S', '/turmas/criar'], ['S', '/turmas/1/editar'], ['S', '/relatorios/inadimplencia'], ['S', '/mensalidades/exportar'], ['S', '/turmas/1/apagar']] as [$q, $u]) {
    [$s] = get($q, $u); $m[] = "$q $u=$s"; $todos = $todos && $s === 403;
}
t('B3.1', '403 por cargo (professor em alunos/mensalidades/relatório; secretaria em turma, relatório e CSV)', $todos, implode(', ', $m));
[$s] = get('P', '/turmas/1'); [$s2] = get('P', '/turmas/3');
t('B3.2', 'professora abre a turma dela (1) e recebe 403 na turma de outro (3)', $s === 200 && $s2 === 403, "1=$s 3=$s2");
[, $h] = get('P', '/turmas'); $c = codigos($h); sort($c);
t('B3.3', 'professora vê só as turmas dela, sem valores em R$', $c === ['GUI-INT-SEX20', 'VIO-BAS-SEG18', 'VIO-INT-QUA18'] && ! str_contains($h, 'R$'), 'veio ' . implode(' ', $c));
[, $h] = get('P', '/');
t('B3.4', 'menu da professora sem Alunos, Mensalidades e Inadimplência', ! str_contains($h, '/alunos"') && ! str_contains($h, '/mensalidades"') && ! str_contains($h, '/relatorios/'));
[, $h] = get('S', '/turmas/1');
t('B3.5', 'secretaria não vê Editar/Apagar turma', ! str_contains($h, '/turmas/1/editar') && ! str_contains($h, '/turmas/1/apagar'));
[$s] = get('C', '/turmas/999'); [$s2] = get('C', '/alunos/999');
t('B3.6', 'registro inexistente: 404', $s === 404 && $s2 === 404, "$s $s2");
[$s] = enviar('S', 'POST', '/mensalidades/1/estornar', [], '/mensalidades');
t('B3.7', 'estorno por secretaria: 403', $s === 403, "veio $s");

// ======================= B4 turmas: listagem e detalhe =======================
[, $h] = get('C', '/turmas');
t('B4.1', 'ordem: dia da semana, horário, código', codigos($h) === ['VIO-BAS-SEG18', 'VLN-BAS-SEG19', 'PIA-BAS-TER14', 'CAN-INT-TER19', 'TEC-BAS-QUA15', 'VIO-INT-QUA18', 'PIA-AVA-QUI19', 'GUI-INT-SEX20', 'CAN-BAS-SAB09'], 'veio ' . implode(' ', codigos($h)));
t('B4.2', 'dia e horário "Segunda, 18:00–19:30", ocupação 4/4 e mensalidade R$ 240,00', str_contains(txt($h), 'Segunda, 18:00–19:30') && str_contains($h, '4/4') && str_contains($h, 'R$ 240,00'));
[, $h] = get('C', '/turmas?vagas=1'); $c = codigos($h); sort($c);
t('B4.3', '"só com vaga" exclui turmas cheias e inativas', $c === ['CAN-BAS-SAB09', 'CAN-INT-TER19', 'GUI-INT-SEX20', 'VIO-BAS-SEG18', 'VIO-INT-QUA18'], 'veio ' . implode(' ', $c));
[, $h] = get('C', '/turmas?dia=1&instrumento=4');
t('B4.4', 'filtros combinados (segunda + violino) e mantidos no select', codigos($h) === ['VLN-BAS-SEG19'] && preg_match('/value="1"\s+selected>Segunda/', $h));
[, $h] = get('C', '/turmas/6');
$pos1 = strpos($h, 'Carolina Vidal'); $pos2 = strpos($h, 'Gustavo Amorim');
t('B4.5', 'detalhe: lista de espera em ordem de chegada (Carolina 1º, Gustavo 2º) e "Turma cheia"', $pos1 && $pos2 && $pos1 < $pos2 && str_contains($h, 'Turma cheia'));
t('B4.6', 'detalhe: alunos ativos com idade e data de matrícula dd/mm/aaaa', (bool) preg_match('/\d+ anos/', $h) && str_contains($h, '02/02/2026'));

// ======================= B5 cadastro de turma =======================
$t0 = ['code' => 'TST-001', 'instrument_id' => 1, 'teacher_id' => 4, 'room_id' => 1, 'level' => 'basico', 'weekday' => 1, 'start_time' => '19:00', 'end_time' => '20:00', 'capacity' => 5, 'monthly_fee' => '200,00', 'active' => 1];
[, $h] = enviar('C', 'POST', '/turmas', $t0, '/turmas/criar');
t('B5.1', 'conflito de sala citando a turma e o horário', str_contains(txt($h), 'Sala Villa-Lobos ocupada pela turma VIO-BAS-SEG18 (Segunda, 18:00–19:30)'));
[, $h] = enviar('C', 'POST', '/turmas', ['teacher_id' => 5, 'room_id' => 3, 'start_time' => '19:30', 'end_time' => '20:30'] + $t0, '/turmas/criar');
t('B5.2', 'conflito de professor(a)', str_contains(txt($h), 'Lúcia Ferraz já dá aula na turma VLN-BAS-SEG19'));
[, $h] = enviar('C', 'POST', '/turmas', ['teacher_id' => 5, 'room_id' => 2] + $t0, '/turmas/criar');
t('B5.3', 'dois conflitos (sala e professora) listados de uma vez', str_contains(txt($h), 'Sala Chiquinha Gonzaga ocupada') && str_contains(txt($h), 'Lúcia Ferraz já dá aula'));
[, $h] = enviar('C', 'POST', '/turmas', ['start_time' => '20:00', 'end_time' => '19:00'] + $t0, '/turmas/criar');
[, $h2] = enviar('C', 'POST', '/turmas', ['start_time' => '07:30', 'end_time' => '08:30'] + $t0, '/turmas/criar');
[, $h3] = enviar('C', 'POST', '/turmas', ['start_time' => '21:30', 'end_time' => '22:30'] + $t0, '/turmas/criar');
t('B5.4', 'horário: término depois do início, entre 08:00 e 22:00', str_contains(txt($h), 'depois do início') && str_contains(txt($h2), '08:00') && str_contains(txt($h3), '22:00'));
[, $h] = enviar('C', 'POST', '/turmas', ['start_time' => '20:00', 'end_time' => '20:20', 'room_id' => 4] + $t0, '/turmas/criar');
[, $h2] = enviar('C', 'POST', '/turmas', ['start_time' => '12:00', 'end_time' => '15:30', 'room_id' => 4] + $t0, '/turmas/criar');
t('B5.5', 'duração de 30 min a 3 h', str_contains(txt($h), '30 minutos') && str_contains(txt($h2), '30 minutos'));
[, $h] = enviar('C', 'POST', '/turmas', ['room_id' => 3, 'weekday' => 5, 'start_time' => '10:00', 'end_time' => '11:00'] + $t0, '/turmas/criar');
t('B5.6', 'vagas não podem passar da capacidade da sala (Estúdio: 4)', str_contains(txt($h), 'no máximo 4'));
[, $h] = enviar('C', 'POST', '/turmas', ['teacher_id' => 6, 'weekday' => 5, 'start_time' => '10:00', 'end_time' => '11:00'] + $t0, '/turmas/criar');
t('B5.7', 'professor inativo é recusado', str_contains(txt($h), 'ativo'));
[$s, $h, $loc] = enviar('C', 'POST', '/turmas', ['code' => 'vio-ava-seg19', 'teacher_id' => 3, 'start_time' => '19:30', 'end_time' => '20:30', 'monthly_fee' => '1.250,00'] + $t0, '/turmas/criar');
$nova = idDe($loc);
t('B5.8', 'horários que só encostam (19:30) não conflitam; código em maiúsculas; R$ 1.250,00 aceito', $nova && str_contains($h, 'VIO-AVA-SEG19') && str_contains($h, 'R$ 1.250,00'), "loc $loc");
[, $h] = enviar('C', 'POST', '/turmas', ['code' => 'TEC-NOVA', 'room_id' => 2, 'weekday' => 3, 'start_time' => '15:00', 'end_time' => '16:00'] + $t0, '/turmas/criar');
t('B5.9', 'turma inativa não gera conflito (TEC-BAS-QUA15 inativa, mesma sala e professor)', str_contains($h, 'TEC-NOVA') && ! str_contains(txt($h), 'ocupada pela'));
[, $h] = enviar('C', 'POST', '/turmas', ['code' => 'VIO-BAS-SEG18', 'weekday' => 6, 'start_time' => '14:00', 'end_time' => '15:00'] + $t0, '/turmas/criar');
t('B5.10', 'código repetido é recusado', str_contains(txt($h), 'Já existe uma turma com este código'));
$ed = ['code' => 'VIO-BAS-SEG18', 'instrument_id' => 1, 'teacher_id' => 3, 'room_id' => 1, 'level' => 'basico', 'weekday' => 1, 'start_time' => '18:00', 'end_time' => '19:30', 'capacity' => 4, 'monthly_fee' => '180,00', 'active' => 1];
[, $h] = enviar('C', 'PUT', '/turmas/1', $ed, '/turmas/1/editar');
[, $h2] = enviar('C', 'PUT', '/turmas/1', ['capacity' => 6, 'active' => 0] + $ed, '/turmas/1/editar');
t('B5.11', 'edição: vagas abaixo dos ativos (5) e desativar com alunos são recusados', str_contains(txt($h), 'já tem 5 alunos') && str_contains(txt($h2), 'não pode ser desativada'));
[, $he] = get('C', '/turmas/1/editar');
t('B5.12', 'edição abre preenchida (18:00, 19:30, 180,00)', str_contains($he, 'value="18:00"') && str_contains($he, 'value="19:30"') && str_contains($he, 'value="180,00"'));
[, $h] = enviar('C', 'PUT', '/turmas/7', ['code' => 'GUI-INT-SEX20', 'instrument_id' => 5, 'teacher_id' => 3, 'room_id' => 2, 'level' => 'intermediario', 'weekday' => 5, 'start_time' => '20:00', 'end_time' => '21:30', 'capacity' => 5, 'monthly_fee' => '230,00', 'active' => 1], '/turmas/7/editar');
[, $ha] = get('C', '/alunos/30');
t('B5.13', 'mudar a mensalidade da turma não altera mensalidades já geradas (Helena continua com R$ 210,00)', str_contains($ha, 'R$ 210,00') && ! str_contains($ha, 'R$ 230,00'));
[, $h] = enviar('C', 'DELETE', '/turmas/1', [], '/turmas/1/apagar');
[, $h2] = enviar('C', 'DELETE', "/turmas/$nova", [], "/turmas/$nova/apagar"); [$s3] = get('C', "/turmas/$nova");
t('B5.14', 'turma com matrículas não é apagada; turma nova sem matrículas é apagada', str_contains(txt($h), 'não pode ser apagada') && $s3 === 404);

// ======================= B6 alunos =======================
[, $h] = get('S', '/alunos');
$n = nomesNaTabela($h);
preg_match_all('#<td>([^<]+)</td>\s*<td>\d+ anos#u', $h, $mm); $nomes = $mm[1];
$ord = $nomes; usort($ord, fn ($a, $b) => strcoll($a, $b));
t('B6.1', 'listagem: 15 por página em ordem de nome, com "Mostrando 1–15 de 32"', count($nomes) === 15 && ($nomes[0] ?? '') === 'Alice Monteiro' && str_contains(txt($h), 'Mostrando 1–15 de 32'), 'veio ' . count($nomes) . ' ' . ($nomes[0] ?? ''));
[, $h] = get('S', '/alunos?debito=1');
preg_match_all('#<td>([^<]+)</td>\s*<td>\d+ anos#u', $h, $mm);
$deb = $mm[1]; sort($deb);
t('B6.2', 'filtro "só em débito": 7 alunos com mensalidade vencida', $deb === ['Beatriz Quaresma', 'Elisa Moraes', 'Flávia Rocha', 'Isabela Duarte', 'Joana Bittencourt', 'Manuela Franco', 'Pedro Henrique Dias'], 'veio ' . implode(', ', $deb));
[, $h] = get('S', '/alunos?turma=6&busca=a');
preg_match_all('#<td>([^<]+)</td>\s*<td>\d+ anos#u', $h, $mm);
t('B6.3', 'filtro por turma (só ativos) combinado com a busca', count($mm[1]) === 4 && ! in_array('Carolina Vidal', $mm[1], true), 'veio ' . implode(', ', $mm[1]));
$menor = date('Y-m-d', strtotime('-12 years'));
$a0 = ['name' => 'Teste Menor', 'birth_date' => $menor, 'phone' => '(15) 99876-5432', 'email' => '', 'guardian_name' => '', 'guardian_phone' => ''];
[, $h] = enviar('S', 'POST', '/alunos', $a0, '/alunos/criar');
t('B6.4', 'menor de 18 sem responsável é recusado e o nome continua preenchido', str_contains(txt($h), 'informe o nome do responsável') && str_contains($h, 'value="Teste Menor"'));
$faz18 = date('Y-m-d', strtotime('-18 years'));
[$s, $h, $loc] = enviar('S', 'POST', '/alunos', ['name' => 'Faz Dezoito Hoje', 'birth_date' => $faz18] + $a0, '/alunos/criar');
$adulto = idDe($loc);
t('B6.5', 'quem faz 18 anos hoje já é maior (não pede responsável) e aparece com 18 anos', $adulto && str_contains($h, '(18 anos)'), "loc $loc");
[, $h] = enviar('S', 'POST', '/alunos', ['birth_date' => date('Y-m-d', strtotime('-3 years'))] + $a0, '/alunos/criar');
t('B6.6', 'aluno com menos de 5 anos é recusado', str_contains(txt($h), 'pelo menos 5 anos'));
[, $h] = enviar('S', 'POST', '/alunos', ['email' => 'isabela9@email.com', 'birth_date' => '1990-01-01'] + $a0, '/alunos/criar');
t('B6.7', 'e-mail repetido é recusado', str_contains(txt($h), 'Já existe um aluno com este e-mail'));
[$s, $h, $loc] = enviar('S', 'POST', '/alunos', ['name' => 'Segunda Aluna Teste', 'birth_date' => '1990-05-05'] + $a0, '/alunos/criar');
$adulto2 = idDe($loc);
[, $h] = get('S', '/alunos/9');
t('B6.8', 'detalhe: nascimento dd/mm/aaaa com idade, responsável e telefone com máscara', str_contains($h, '08/08/2013') && str_contains(txt($h), 'Ana Duarte') && preg_match('/\(15\) 9\d{4}-\d{4}/', $h));
[, $h] = enviar('S', 'DELETE', '/alunos/9', [], '/alunos/9/apagar'); [$s2] = get('S', '/alunos/9');
t('B6.9', 'aluno com matrícula não é apagado', str_contains(txt($h), 'não pode ser apagado') && $s2 === 200);

// ======================= B8 mensalidades (antes das matrículas, que mudam os dados) =======================
$venc9 = [['2026-10-10', 200.0], ['2026-11-10', 200.0]];
$tot = 0; foreach ($venc9 as [$v, $a]) if ($v < $hoje) $tot += atualizado($a, $v, $hoje);
[, $h] = get('S', '/mensalidades?busca=Isabela&situacao=vencida');
t('B8.1', 'filtro aluno + vencida: total vencido atualizado ' . moeda($tot), str_contains($h, moeda($tot)), 'esperado ' . moeda($tot));
$d = (int) round((strtotime($hoje) - strtotime('2026-11-10')) / 86400);
t('B8.2', "linha vencida: \"Vencida há $d dias\" e valor atualizado " . moeda(atualizado(200, '2026-11-10', $hoje)), str_contains(txt($h), "Vencida há $d dias") && str_contains($h, moeda(atualizado(200, '2026-11-10', $hoje))));
[, $h] = get('S', '/mensalidades?mes=2026-11&situacao=vencida');
preg_match_all('#/alunos/\d+">([^<]+)</a>#u', $h, $mm); $v = $mm[1]; sort($v);
t('B8.3', 'mês 11/2026 + vencida: 6 mensalidades', count($v) === 6, 'veio ' . count($v) . ': ' . implode(', ', $v));
t('B8.4', 'mês continua selecionado e referência em mm/aaaa', str_contains($h, 'value="2026-11"') && str_contains($h, '11/2026'));
[, $h] = get('S', '/mensalidades');
t('B8.5', 'paginação de 15 com "Mostrando"', str_contains(txt($h), 'Mostrando 1–15 de'));
[, $h] = get('S', '/mensalidades?situacao=paga&page=2');
t('B8.6', 'links de paginação mantêm o filtro', str_contains($h, 'situacao=paga&amp;page=3') || str_contains($h, 'situacao=paga&page=3'));
// pagamento: Isabela, outubro (id da mensalidade pela página do aluno)
[, $h] = get('S', '/alunos/9');
preg_match_all('#/mensalidades/(\d+)/pagar#', $h, $mm); $ids = $mm[1];
$out = $ids[0] ?? 0; $nov = $ids[1] ?? 0;
[, $h] = enviar('S', 'POST', "/mensalidades/$out/pagar", ['paid_at' => date('Y-m-d', strtotime('+1 day'))], '/alunos/9');
t('B8.7', 'data de pagamento no futuro é recusada', str_contains(txt($h), 'futuro'));
[, $h] = enviar('S', 'POST', "/mensalidades/$out/pagar", ['paid_at' => '2026-09-01'], '/alunos/9');
t('B8.8', 'data antes da matrícula (02/09/2026) é recusada', str_contains(txt($h), '02/09/2026'));
[, $h] = enviar('S', 'POST', "/mensalidades/$out/pagar", ['paid_at' => '2026-10-25'], '/alunos/9');
t('B8.9', 'pagar 15 dias depois: valor calculado no servidor R$ 205,00 e "Paga em 25/10/2026"', str_contains($h, 'R$ 205,00') && str_contains(txt($h), 'em 25/10/2026'));
[, $h] = enviar('S', 'POST', "/mensalidades/$nov/pagar", ['paid_at' => '2026-11-10', 'paid_amount' => '1'], '/alunos/9');
t('B8.10', 'pagar no dia do vencimento: sem multa (R$ 200,00), valor enviado pelo formulário é ignorado', str_contains(txt($h), 'Pagamento de R$ 200,00'));
[, $h] = enviar('S', 'POST', "/mensalidades/$nov/pagar", ['paid_at' => '2026-11-10'], '/alunos/9');
t('B8.11', 'mensalidade já paga não é paga de novo', str_contains(txt($h), 'já está paga'));
[, $h] = enviar('C', 'POST', "/mensalidades/$nov/estornar", [], '/alunos/9');
t('B8.12', 'coordenação estorna: volta a vencida', str_contains(txt($h), 'estornado') && str_contains(txt($h), "Vencida há $d dias"));
[$s, $csv] = get('C', '/mensalidades/exportar?situacao=vencida&mes=2026-11');
$lin = array_values(array_filter(explode("\n", trim($csv))));
t('B8.13', 'CSV (coordenação) com BOM, ; e os filtros (cabeçalho + 6 linhas)', $s === 200 && str_starts_with($csv, "\xEF\xBB\xBF") && str_contains($lin[0] ?? '', 'Aluno;Turma') && count($lin) === 7, "status $s, linhas " . count($lin));

// ======================= B9 relatório e painel =======================
$dados = ['Flávia Rocha' => [[240, '2026-10-10'], [240, '2026-11-10']], 'Isabela Duarte' => [[200, '2026-11-10']], 'Pedro Henrique Dias' => [[320, '2026-11-10']],
    'Joana Bittencourt' => [[210, '2026-11-10']], 'Manuela Franco' => [[180, '2026-06-10']], 'Elisa Moraes' => [[180, '2026-11-10']], 'Beatriz Quaresma' => [[150, '2026-11-10']]];
$esp = []; foreach ($dados as $nome => $l) { $s = 0; foreach ($l as [$a, $v]) $s += atualizado($a, $v, $hoje); $esp[$nome] = round($s, 2); }
uksort($esp, fn ($a, $b) => [$esp[$b], $a] <=> [$esp[$a], $b]);
[, $h] = get('C', '/relatorios/inadimplencia');
$ordem = nomesNaTabela($h);
t('B9.1', 'inadimplência do maior valor atualizado para o menor: ' . implode(', ', array_keys($esp)), $ordem === array_keys($esp), 'veio ' . implode(', ', $ordem));
t('B9.2', 'Flávia: 2 mensalidades, mais antiga 10/10/2026, ' . moeda($esp['Flávia Rocha']), str_contains($h, '10/10/2026') && str_contains($h, moeda($esp['Flávia Rocha'])));
[, $hc] = get('C', '/'); [, $hs] = get('S', '/');
t('B9.3', 'painel: coordenação vê "Recebido em", secretaria não; ambos veem lista de espera e vencidas', str_contains($hc, 'Recebido em') && ! str_contains($hs, 'Recebido em') && str_contains($hs, 'Na lista de espera'));
$aulas = [1 => ['VIO-BAS-SEG18'], 2 => [], 3 => ['VIO-INT-QUA18'], 4 => [], 5 => ['GUI-INT-SEX20'], 6 => [], 7 => []][$diaHoje];
[, $hp] = get('P', '/');
t('B9.4', 'painel da professora: aulas de hoje (' . (implode(', ', $aulas) ?: 'nenhuma') . ')', $aulas ? codigos($hp) === $aulas : str_contains($hp, 'Nenhuma aula hoje'), 'veio ' . implode(' ', codigos($hp)));

// ======================= B7 matrículas =======================
[, $h] = enviar('S', 'POST', "/alunos/$adulto/matriculas", ['school_class_id' => 1], "/alunos/$adulto");
$meses = 12 - (int) date('n') + 1;
preg_match_all('#<td>VIO-BAS-SEG18</td>#', $h, $mm);
t('B7.1', "matrícula com vaga fica ativa e gera $meses mensalidade(s) até dezembro", str_contains(txt($h), 'confirmada') && count($mm[0]) === $meses, 'linhas ' . count($mm[0]));
$dia10 = date('Y-m-10'); $prim = $hoje >= $dia10 ? date('d/m/Y', strtotime('+5 days')) : date('10/m/Y');
t('B7.2', "primeira mensalidade vence em $prim (dia 10 ou, se já passou, hoje + 5) no valor da turma", str_contains($h, $prim) && str_contains($h, 'R$ 180,00'));
[, $h] = enviar('S', 'POST', "/alunos/$adulto2/matriculas", ['school_class_id' => 1], "/alunos/$adulto2");
t('B7.3', 'turma cheia: aluno vai para a lista de espera com a posição', str_contains(txt($h), 'lista de espera (posição 1)') && ! preg_match('#<td>VIO-BAS-SEG18</td>#', $h));
[, $h] = enviar('S', 'POST', "/alunos/$adulto/matriculas", ['school_class_id' => 1], "/alunos/$adulto");
[, $h2] = enviar('S', 'POST', "/alunos/$adulto2/matriculas", ['school_class_id' => 1], "/alunos/$adulto2");
t('B7.4', 'matrícula repetida e espera repetida são recusadas', str_contains(txt($h), 'já está matriculado') && str_contains(txt($h2), 'já está na lista de espera'));
[, $h] = enviar('S', 'POST', '/alunos/1/matriculas', ['school_class_id' => 6], '/alunos/1');
t('B7.5', 'conflito de horário do aluno citando a turma', str_contains(txt($h), 'Conflito de horário com a turma VIO-BAS-SEG18 (Segunda, 18:00–19:30)'));
[, $h] = enviar('S', 'POST', '/alunos/1/matriculas', ['school_class_id' => 8], '/alunos/1');
t('B7.6', 'turma inativa não aceita matrícula', str_contains(txt($h), 'inativa'));
// cancelar Caio (25) na VLN-BAS-SEG19: Carolina (1ª, conflito) é pulada e Gustavo entra
[, $h] = get('S', '/alunos/25'); preg_match('#/matriculas/(\d+)/cancelar#', $h, $mm); $mc = $mm[1] ?? 0;
[, $h] = enviar('S', 'POST', "/matriculas/$mc/cancelar", [], '/alunos/25');
t('B7.7', 'cancelar ativa promove o primeiro SEM conflito (Gustavo; Carolina tem conflito)', str_contains(txt($h), 'Gustavo Amorim saiu da lista de espera'));
t('B7.8', 'cancelada mostra a data e as mensalidades futuras em aberto somem (dezembro); pagas ficam', str_contains(txt($h), 'Cancelada em ' . date('d/m/Y')) && ! str_contains($h, '12/2026') && str_contains($h, 'Paga'));
[, $h] = get('S', '/alunos/29');
t('B7.9', 'promovido fica ativo com mensalidades geradas', str_contains(txt($h), 'VLN-BAS-SEG19') && str_contains(txt($h), 'Ativa desde ' . date('d/m/Y')) && str_contains($h, 'R$ 240,00'));
[, $h] = get('S', '/alunos/3');
t('B7.10', 'quem tinha conflito continua na espera (Carolina, posição 1)', str_contains(txt($h), 'posição 1'));
[, $h] = get('S', '/alunos/9'); preg_match('#/matriculas/(\d+)/cancelar#', $h, $mm); $mi = $mm[1] ?? 0;
[, $h] = enviar('S', 'POST', "/matriculas/$mi/cancelar", [], '/alunos/9');
t('B7.11', 'mensalidade vencida e não paga continua como dívida depois do cancelamento', str_contains(txt($h), 'Vencida há') && ! str_contains($h, '12/2026'));
[, $h] = enviar('S', 'POST', "/matriculas/$mi/cancelar", [], '/alunos/9');
t('B7.12', 'cancelar de novo é recusado', str_contains(txt($h), 'já está cancelada'));
[, $h] = get('C', '/turmas/1');
t('B7.13', 'cancelar uma espera não promove ninguém; turma mostra a espera do aluno novo', str_contains($h, 'Segunda Aluna Teste'));
[, $h] = enviar('S', 'DELETE', "/alunos/$adulto2", [], "/alunos/$adulto2/apagar");
t('B7.14', 'aluno com matrícula (mesmo em espera) não é apagado', str_contains(txt($h), 'não pode ser apagado'));

echo "\n$ok OK, $falhas FALHA(S)\n";
