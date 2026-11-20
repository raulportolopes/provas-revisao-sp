<?php
/*
 * API Pulso Academias – fornecida pronta para a prova. NÃO ALTERE ESTE ARQUIVO.
 * Documentação completa no enunciado (seção "A API") e em api/LEIA-ME.md.
 */
require __DIR__ . '/nucleo.php';

/* Primeira execução (ou depois de POST /reset): copia a semente para api/dados/ e gera o histórico do aluno. */
function restaurar() {
    if (!is_dir(PASTA_DADOS)) mkdir(PASTA_DADOS, 0775, true);
    foreach (glob(PASTA_DADOS . '/*.json') as $f) unlink($f);
    foreach (['unidades', 'modalidades', 'instrutores', 'grade', 'usuarios', 'regras'] as $n)
        copy(PASTA_SEMENTE . "/$n.json", PASTA_DADOS . "/$n.json");
    gravar('sessoes', []);
    gravar('espera', []);
    // Histórico do aluno 1: aulas concluídas nos últimos 6 meses, algumas canceladas, 2 reservas futuras.
    mt_srand(2026);
    $grade = ler('grade'); $res = []; $id = 1;
    $hoje = new DateTime('today');
    for ($d = 180; $d >= 1; $d--) {
        $dia = (clone $hoje)->modify("-$d day");
        $n = (int)$dia->format('N');
        $chance = in_array($n, [1, 3, 5]) ? 62 : ($n == 6 ? 35 : 12);
        if (mt_rand(1, 100) > $chance) continue;
        $op = array_values(array_filter($grade, fn($g) => $g['dia_semana'] == $n && $g['unidade_id'] == 2));
        if (!$op) continue;
        $g = $op[mt_rand(0, count($op) - 1)];
        $ini = DateTime::createFromFormat('Y-m-d H:i', $dia->format('Y-m-d') . ' ' . $g['hora']);
        $cancelada = mt_rand(1, 100) <= 8;
        $res[] = reserva_de($id++, 1, $g, $ini, $cancelada ? 'cancelada' : 'ativa', (clone $ini)->modify('-2 day'));
    }
    foreach ([1, 3] as $k) { // 2 próximas reservas (uma amanhã, outra daqui a 3 dias), sempre na unidade Jardins
        $dia = (clone $hoje)->modify("+$k day"); $n = (int)$dia->format('N');
        $op = array_values(array_filter($grade, fn($g) => $g['dia_semana'] == $n && $g['ocupacao_base'] < $g['capacidade'] - 1));
        if (!$op) continue;
        $g = $op[0];
        $ini = DateTime::createFromFormat('Y-m-d H:i', $dia->format('Y-m-d') . ' ' . $g['hora']);
        $res[] = reserva_de($id++, 1, $g, $ini, 'ativa', new DateTime('-1 day'));
    }
    gravar('reservas', $res);
}
function reserva_de($id, $uid, $g, DateTime $ini, $status, DateTime $criada) {
    $fim = (clone $ini)->modify('+' . $g['duracao_min'] . ' minutes');
    return ['id' => $id, 'usuario_id' => $uid, 'aula_id' => id_aula($ini, $g['modelo']), 'status' => $status,
            'modalidade_id' => $g['modalidade_id'], 'instrutor_id' => $g['instrutor_id'], 'unidade_id' => $g['unidade_id'], 'sala' => $g['sala'],
            'inicio' => $ini->format('c'), 'fim' => $fim->format('c'),
            // ATENÇÃO: criada_em e cancelada_em vêm em UTC (terminam com Z). Converta para o horário de Brasília na tela.
            'criada_em' => gmdate('Y-m-d\TH:i:s\Z', $criada->getTimestamp()),
            'cancelada_em' => $status === 'cancelada' ? gmdate('Y-m-d\TH:i:s\Z', $ini->getTimestamp() - 6 * 3600) : null];
}
function id_aula(DateTime $dia, $modelo) { return (int)($dia->format('Ymd') . sprintf('%03d', $modelo)); }

if (!file_exists(PASTA_DADOS . '/grade.json')) restaurar();

/* Aulas existem de 14 dias atrás até 13 dias para frente, geradas a partir da grade semanal. */
const DIAS_FUTUROS = 13;
function aulas_do_dia(DateTime $dia) {
    $n = (int)$dia->format('N'); $out = [];
    foreach (ler('grade') as $g) if ($g['dia_semana'] == $n) $out[] = montar_aula($dia, $g);
    return $out;
}
function montar_aula(DateTime $dia, $g) {
    $ini = DateTime::createFromFormat('Y-m-d H:i', $dia->format('Y-m-d') . ' ' . $g['hora']);
    $id = id_aula($ini, $g['modelo']);
    $fim = (clone $ini)->modify('+' . $g['duracao_min'] . ' minutes');
    $variacao = (crc32((string)$id) % 5) - 2; // ocupação varia um pouco de um dia para o outro
    $base = min($g['capacidade'], max(0, $g['ocupacao_base'] + ($g['ocupacao_base'] >= $g['capacidade'] - 1 ? 0 : $variacao)));
    $ativas = count(array_filter(ler('reservas'), fn($r) => $r['aula_id'] === $id && $r['status'] === 'ativa'));
    $ocup = min($g['capacidade'], $base + $ativas);
    $agora = time();
    $status = $agora < $ini->getTimestamp() ? 'agendada' : ($agora < $fim->getTimestamp() ? 'em_andamento' : 'encerrada');
    $fila = count(array_filter(ler('espera'), fn($e) => $e['aula_id'] === $id));
    if ($ocup >= $g['capacidade']) $fila += $id % 3; // pessoas fictícias na fila
    return ['id' => $id, 'modalidade_id' => $g['modalidade_id'], 'instrutor_id' => $g['instrutor_id'], 'unidade_id' => $g['unidade_id'],
            'sala' => $g['sala'], 'nivel' => $g['nivel'], 'inicio' => $ini->format('c'), 'fim' => $fim->format('c'), 'duracao_min' => $g['duracao_min'],
            'capacidade' => $g['capacidade'], 'vagas_ocupadas' => $ocup, 'vagas_livres' => $g['capacidade'] - $ocup,
            'lotada' => $ocup >= $g['capacidade'], 'fila_espera' => $fila, 'status' => $status];
}
function achar_aula($id) {
    $s = (string)$id;
    if (!preg_match('/^(\d{8})(\d{3})$/', $s, $m)) return null;
    $dia = DateTime::createFromFormat('Ymd H:i', $m[1] . ' 00:00');
    if (!$dia) return null;
    foreach (ler('grade') as $g) if ($g['modelo'] === (int)$m[2] && $g['dia_semana'] == (int)$dia->format('N')) {
        $a = montar_aula($dia, $g);
        $hoje = new DateTime('today');
        $diff = (int)$hoje->diff($dia)->format('%r%a');
        if ($diff < -14 || $diff > DIAS_FUTUROS) return null;
        return $a;
    }
    return null;
}
/* Campos do aluno logado em cada aula (só quando o token é enviado). */
function com_dados_do_aluno($a, $u) {
    $a['minha_reserva_id'] = null; $a['minha_posicao_espera'] = null;
    if (!$u) return $a;
    foreach (ler('reservas') as $r) if ($r['aula_id'] === $a['id'] && $r['usuario_id'] === $u['id'] && $r['status'] === 'ativa') $a['minha_reserva_id'] = $r['id'];
    $fila = array_values(array_filter(ler('espera'), fn($e) => $e['aula_id'] === $a['id']));
    foreach ($fila as $i => $e) if ($e['usuario_id'] === $u['id']) $a['minha_posicao_espera'] = $i + 1 + ($a['id'] % 3);
    return $a;
}
function status_reserva($r) {
    if ($r['status'] === 'ativa' && strtotime($r['fim']) < time()) return 'concluida';
    return $r['status'];
}
function reserva_publica($r) { $r['status'] = status_reserva($r); unset($r['usuario_id']); return $r; }
function usuario_publico($u) { unset($u['senha']); return $u; }

$r = rota(); $m = metodo();

/* ---------- Autenticação ---------- */
if ($r === '/login' && $m === 'POST') {
    atraso(300, 700);
    $c = corpo_json(); $err = [];
    $email = trim($c['email'] ?? ''); $senha = (string)($c['senha'] ?? '');
    if ($email === '') $err['email'][] = 'Informe o e-mail.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $err['email'][] = 'Digite um e-mail válido.';
    if ($senha === '') $err['senha'][] = 'Informe a senha.';
    if ($err) erros_validacao($err);
    foreach (ler('usuarios') as $u) if (strcasecmp($u['email'], $email) === 0 && $u['senha'] === $senha)
        responder(200, ['token' => criar_sessao($u['id']), 'expira_em_minutos' => SESSAO_MINUTOS, 'usuario' => usuario_publico($u)]);
    erro(401, 'E-mail ou senha incorretos.');
}
if ($r === '/logout' && $m === 'POST') { usuario_logado(); encerrar_sessao(); responder(204); }
if ($r === '/sessao/expirar' && $m === 'POST') { usuario_logado(); expirar_sessao(); responder(204); }
if ($r === '/reset' && $m === 'POST') { restaurar(); responder(200, ['mensagem' => 'Dados restaurados.']); }

/* ---------- Catálogos (públicos) ---------- */
foreach (['unidades', 'modalidades', 'instrutores', 'regras'] as $rec)
    if ($r === "/$rec" && $m === 'GET') { atraso(150, 400); responder(200, ['dados' => ler($rec)]); }

/* ---------- Aulas ---------- */
if ($r === '/aulas' && $m === 'GET') {
    atraso(250, 900); // de propósito: respostas podem chegar fora de ordem
    $u = usuario_logado(false);
    $err = [];
    $data = $_GET['data'] ?? date('Y-m-d');
    $dia = DateTime::createFromFormat('!Y-m-d', $data);
    if (!$dia || $dia->format('Y-m-d') !== $data) $err['data'][] = 'Use o formato AAAA-MM-DD.';
    else {
        $diff = (int)(new DateTime('today'))->diff($dia)->format('%r%a');
        if ($diff < 0 || $diff > DIAS_FUTUROS) $err['data'][] = 'A agenda mostra só de hoje até ' . DIAS_FUTUROS . ' dias para frente.';
    }
    $periodo = $_GET['periodo'] ?? '';
    if ($periodo !== '' && !in_array($periodo, ['manha', 'tarde', 'noite'])) $err['periodo'][] = 'Use manha, tarde ou noite.';
    $ordem = $_GET['ordem'] ?? 'horario';
    if (!in_array($ordem, ['horario', 'vagas', 'modalidade'])) $err['ordem'][] = 'Use horario, vagas ou modalidade.';
    if ($err) erros_validacao($err);
    $lista = aulas_do_dia($dia);
    $mods = array_column(ler('modalidades'), 'nome', 'id');
    $ins = array_column(ler('instrutores'), 'nome', 'id');
    if (!empty($_GET['unidade_id'])) $lista = array_filter($lista, fn($a) => $a['unidade_id'] == $_GET['unidade_id']);
    if (!empty($_GET['modalidade_id'])) { $ids = array_map('intval', explode(',', $_GET['modalidade_id'])); $lista = array_filter($lista, fn($a) => in_array($a['modalidade_id'], $ids)); }
    if ($periodo) $lista = array_filter($lista, function ($a) use ($periodo) {
        $h = (int)substr($a['inicio'], 11, 2);
        return $periodo === 'manha' ? $h < 12 : ($periodo === 'tarde' ? $h >= 12 && $h < 18 : $h >= 18);
    });
    if (!empty($_GET['somente_vagas'])) $lista = array_filter($lista, fn($a) => !$a['lotada']);
    if (($b = trim($_GET['busca'] ?? '')) !== '') { $b = sem_acento($b); $lista = array_filter($lista, fn($a) => str_contains(sem_acento($mods[$a['modalidade_id']] . ' ' . $ins[$a['instrutor_id']]), $b)); }
    $lista = array_values($lista);
    usort($lista, function ($x, $y) use ($ordem, $mods) {
        if ($ordem === 'vagas') return [$y['vagas_livres'], $x['inicio']] <=> [$x['vagas_livres'], $y['inicio']];
        if ($ordem === 'modalidade') return [$mods[$x['modalidade_id']], $x['inicio']] <=> [$mods[$y['modalidade_id']], $y['inicio']];
        return [$x['inicio'], $x['unidade_id']] <=> [$y['inicio'], $y['unidade_id']];
    });
    $p = paginar($lista, 6, 30);
    $p['dados'] = array_map(fn($a) => com_dados_do_aluno($a, $u), $p['dados']);
    responder(200, $p);
}
if (preg_match('#^/aulas/(\d+)$#', $r, $mm) && $m === 'GET') {
    atraso(200, 500);
    $a = achar_aula($mm[1]);
    if (!$a) erro(404, 'Aula não encontrada.');
    $a = com_dados_do_aluno($a, usuario_logado(false));
    $mod = array_values(array_filter(ler('modalidades'), fn($x) => $x['id'] === $a['modalidade_id']))[0];
    $a['descricao'] = $mod['descricao'];
    responder(200, ['dados' => $a]);
}
if (preg_match('#^/aulas/(\d+)/espera$#', $r, $mm) && in_array($m, ['POST', 'DELETE'])) {
    $u = usuario_logado(); atraso(200, 500);
    $a = achar_aula($mm[1]);
    if (!$a) erro(404, 'Aula não encontrada.');
    $fila = ler('espera');
    $estou = array_filter($fila, fn($e) => $e['aula_id'] === $a['id'] && $e['usuario_id'] === $u['id']);
    if ($m === 'DELETE') {
        if (!$estou) erro(404, 'Você não está na lista de espera desta aula.');
        gravar('espera', array_values(array_filter($fila, fn($e) => !($e['aula_id'] === $a['id'] && $e['usuario_id'] === $u['id']))));
        responder(204);
    }
    if ($a['status'] !== 'agendada') erro(422, 'Esta aula já começou.');
    if (!$a['lotada']) erro(409, 'A aula ainda tem vagas. Faça a reserva.', ['codigo' => 'AULA_COM_VAGAS']);
    if ($estou) erro(409, 'Você já está na lista de espera.', ['codigo' => 'JA_NA_ESPERA']);
    $fila[] = ['aula_id' => $a['id'], 'usuario_id' => $u['id'], 'entrou_em' => gmdate('Y-m-d\TH:i:s\Z')];
    gravar('espera', $fila);
    $a = com_dados_do_aluno($a, $u);
    responder(201, ['dados' => ['aula_id' => $a['id'], 'posicao' => $a['minha_posicao_espera']]]);
}

/* ---------- Reservas ---------- */
if ($r === '/reservas' && $m === 'GET') {
    $u = usuario_logado(); atraso(200, 600);
    $tipo = $_GET['tipo'] ?? 'proximas';
    if (!in_array($tipo, ['proximas', 'historico', 'canceladas'])) erros_validacao(['tipo' => ['Use proximas, historico ou canceladas.']]);
    $lista = array_values(array_filter(ler('reservas'), function ($x) use ($u, $tipo) {
        if ($x['usuario_id'] !== $u['id']) return false;
        $s = status_reserva($x);
        return $tipo === 'proximas' ? $s === 'ativa' : ($tipo === 'historico' ? $s === 'concluida' : $s === 'cancelada');
    }));
    usort($lista, fn($a, $b) => $tipo === 'proximas' ? strcmp($a['inicio'], $b['inicio']) : strcmp($b['inicio'], $a['inicio']));
    $p = paginar($lista, 5, 20);
    $p['dados'] = array_map('reserva_publica', $p['dados']);
    responder(200, $p);
}
if ($r === '/reservas' && $m === 'POST') {
    $u = usuario_logado(); atraso(300, 700);
    $c = corpo_json();
    if (!isset($c['aula_id']) || !is_int($c['aula_id'])) erros_validacao(['aula_id' => ['Informe o id da aula (número).']]);
    $a = achar_aula($c['aula_id']);
    if (!$a) erro(404, 'Aula não encontrada.');
    if ($a['status'] !== 'agendada') erro(422, 'Esta aula já começou ou terminou.');
    $todas = ler('reservas');
    $minhas = array_filter($todas, fn($x) => $x['usuario_id'] === $u['id'] && $x['status'] === 'ativa');
    foreach ($minhas as $x) if ($x['aula_id'] === $a['id']) erro(409, 'Você já reservou esta aula.', ['codigo' => 'JA_RESERVADA']);
    foreach ($minhas as $x) if ($x['inicio'] < $a['fim'] && $a['inicio'] < $x['fim'])
        erro(409, 'Você já tem outra aula neste horário.', ['codigo' => 'CONFLITO_HORARIO', 'reserva_id' => $x['id']]);
    $mesmoDia = array_filter($minhas, fn($x) => substr($x['inicio'], 0, 10) === substr($a['inicio'], 0, 10));
    if (count($mesmoDia) >= 2) erro(409, 'Limite de 2 aulas por dia atingido.', ['codigo' => 'LIMITE_DIARIO']);
    if ($a['lotada']) erro(409, 'Aula lotada. Entre na lista de espera.', ['codigo' => 'AULA_LOTADA']);
    $ini = new DateTime($a['inicio']);
    $g = ['modelo' => (int)substr((string)$a['id'], 8), 'duracao_min' => $a['duracao_min'], 'modalidade_id' => $a['modalidade_id'],
          'instrutor_id' => $a['instrutor_id'], 'unidade_id' => $a['unidade_id'], 'sala' => $a['sala']];
    $nova = reserva_de(proximo_id($todas), $u['id'], $g, $ini, 'ativa', new DateTime());
    $todas[] = $nova; gravar('reservas', $todas);
    // se estava na fila desta aula, sai da fila
    gravar('espera', array_values(array_filter(ler('espera'), fn($e) => !($e['aula_id'] === $a['id'] && $e['usuario_id'] === $u['id']))));
    responder(201, ['dados' => reserva_publica($nova)]);
}
if (preg_match('#^/reservas/(\d+)$#', $r, $mm) && $m === 'DELETE') {
    $u = usuario_logado(); atraso(300, 600);
    $todas = ler('reservas');
    foreach ($todas as &$x) {
        if ($x['id'] !== (int)$mm[1] || $x['usuario_id'] !== $u['id']) continue;
        $s = status_reserva($x);
        if ($s === 'cancelada') erro(409, 'Esta reserva já foi cancelada.', ['codigo' => 'JA_CANCELADA']);
        if ($s === 'concluida') erro(409, 'Esta aula já aconteceu.', ['codigo' => 'JA_CONCLUIDA']);
        if (strtotime($x['inicio']) - time() < 2 * 3600) erro(422, 'Cancelamento só é permitido até 2 horas antes do início.', ['codigo' => 'PRAZO_ENCERRADO']);
        $x['status'] = 'cancelada'; $x['cancelada_em'] = gmdate('Y-m-d\TH:i:s\Z');
        gravar('reservas', $todas);
        responder(200, ['dados' => reserva_publica($x)]);
    }
    erro(404, 'Reserva não encontrada.');
}

/* ---------- Perfil e progresso ---------- */
if ($r === '/me' && $m === 'GET') { $u = usuario_logado(); atraso(100, 300); responder(200, ['dados' => usuario_publico($u)]); }
if ($r === '/me' && $m === 'PATCH') {
    $u = usuario_logado(); atraso(300, 600);
    $c = corpo_json(); $err = [];
    if (array_key_exists('nome', $c)) { $n = trim((string)$c['nome']); if (mb_strlen($n) < 3) $err['nome'][] = 'O nome precisa ter pelo menos 3 letras.'; elseif (!str_contains($n, ' ')) $err['nome'][] = 'Informe nome e sobrenome.'; }
    if (array_key_exists('telefone', $c) && !preg_match('/^\(\d{2}\) 9\d{4}-\d{4}$/', (string)$c['telefone'])) $err['telefone'][] = 'Use o formato (11) 91234-5678.';
    if (array_key_exists('meta_mensal', $c) && (!is_int($c['meta_mensal']) || $c['meta_mensal'] < 4 || $c['meta_mensal'] > 30)) $err['meta_mensal'][] = 'A meta deve ser um número inteiro entre 4 e 30.';
    if (array_key_exists('unidade_id', $c) && !in_array($c['unidade_id'], array_column(ler('unidades'), 'id'), true)) $err['unidade_id'][] = 'Unidade inexistente.';
    if ($err) erros_validacao($err);
    $us = ler('usuarios');
    foreach ($us as &$x) if ($x['id'] === $u['id']) {
        foreach (['nome', 'telefone', 'meta_mensal', 'unidade_id'] as $k) if (array_key_exists($k, $c)) $x[$k] = is_string($c[$k]) ? trim($c[$k]) : $c[$k];
        $u = $x;
    }
    gravar('usuarios', $us);
    responder(200, ['dados' => usuario_publico($u)]);
}
if ($r === '/me/foto' && $m === 'POST') {
    $u = usuario_logado(); atraso(300, 600);
    $f = $_FILES['foto'] ?? null;
    if (!$f || $f['error'] === UPLOAD_ERR_NO_FILE) erros_validacao(['foto' => ['Envie um arquivo no campo "foto".']]);
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 2 * 1024 * 1024) erros_validacao(['foto' => ['A foto pode ter no máximo 2 MB.']]);
    $tipo = mime_content_type($f['tmp_name']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$tipo] ?? null;
    if (!$ext) erros_validacao(['foto' => ['Use uma imagem JPG, PNG ou WEBP.']]);
    if (!is_dir(__DIR__ . '/uploads')) mkdir(__DIR__ . '/uploads', 0775, true);
    $nome = 'aluno-' . $u['id'] . '-' . time() . ".$ext";
    move_uploaded_file($f['tmp_name'], __DIR__ . "/uploads/$nome");
    $us = ler('usuarios');
    foreach ($us as &$x) if ($x['id'] === $u['id']) { $x['foto'] = "api/uploads/$nome"; $u = $x; }
    gravar('usuarios', $us);
    responder(200, ['dados' => usuario_publico($u)]);
}
if ($r === '/me/progresso' && $m === 'GET') {
    $u = usuario_logado(); atraso(200, 500);
    $conc = array_filter(ler('reservas'), fn($x) => $x['usuario_id'] === $u['id'] && status_reserva($x) === 'concluida');
    $meses = [];
    for ($i = 5; $i >= 0; $i--) { $k = date('Y-m', strtotime("first day of -$i month")); $meses[$k] = 0; }
    $porMod = [];
    foreach ($conc as $x) {
        $k = substr($x['inicio'], 0, 7);
        if (isset($meses[$k])) { $meses[$k]++; $porMod[$x['modalidade_id']] = ($porMod[$x['modalidade_id']] ?? 0) + 1; }
    }
    arsort($porMod);
    $janela = array_filter($conc, fn($x) => isset($meses[substr($x['inicio'], 0, 7)])); // só os 6 meses do gráfico
    $minutos = 0; foreach ($janela as $x) $minutos += (strtotime($x['fim']) - strtotime($x['inicio'])) / 60;
    responder(200, ['dados' => [
        'meta_mensal' => $u['meta_mensal'],
        'meses' => array_map(fn($k, $v) => ['mes' => $k, 'total' => $v], array_keys($meses), array_values($meses)),
        'por_modalidade' => array_map(fn($k, $v) => ['modalidade_id' => $k, 'total' => $v], array_keys($porMod), array_values($porMod)),
        'total_aulas' => count($janela), 'total_minutos' => (int)$minutos,
    ]]);
}

erro(404, 'Rota não encontrada: ' . $m . ' ' . $r);
