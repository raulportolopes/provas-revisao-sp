<?php
/*
 * Núcleo da API de treino (não precisa ser alterado pelo competidor).
 * - Rotas por PATH_INFO: api/index.php/recurso/1
 * - Dados guardados em arquivos JSON na pasta api/dados/ (a pasta precisa ter permissão de escrita).
 * - Respostas sempre em JSON, UTF-8.
 */
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const PASTA_DADOS = __DIR__ . '/dados';
const PASTA_SEMENTE = __DIR__ . '/semente';

function responder($status, $corpo = null) {
    http_response_code($status);
    if ($corpo !== null) echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function erro($status, $mensagem, $extra = []) {
    responder($status, array_merge(['mensagem' => $mensagem], $extra));
}
function erros_validacao($erros) {
    erro(422, 'Os dados enviados são inválidos.', ['erros' => $erros]);
}

function ler($nome) {
    $arq = PASTA_DADOS . "/$nome.json";
    if (!file_exists($arq)) return [];
    return json_decode(file_get_contents($arq), true) ?? [];
}
function gravar($nome, $dados) {
    if (!is_dir(PASTA_DADOS)) mkdir(PASTA_DADOS, 0775, true);
    file_put_contents(PASTA_DADOS . "/$nome.json", json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
function proximo_id($lista) {
    $m = 0; foreach ($lista as $x) $m = max($m, $x['id']); return $m + 1;
}

function corpo_json() {
    $bruto = file_get_contents('php://input');
    if ($bruto === '' || $bruto === false) return [];
    $j = json_decode($bruto, true);
    if (!is_array($j)) erro(400, 'O corpo da requisição precisa ser um JSON válido.');
    return $j;
}

function rota() {
    $p = $_SERVER['PATH_INFO'] ?? '';
    if ($p === '' && isset($_GET['rota'])) $p = $_GET['rota']; // alternativa: index.php?rota=/aulas
    return '/' . trim($p, '/');
}
function metodo() { return $_SERVER['REQUEST_METHOD']; }

/* Atraso artificial: deixa o "carregando" visível e permite ver respostas fora de ordem. */
function atraso($min = 200, $max = 600) { usleep(random_int($min, $max) * 1000); }

/* Token Bearer: sessões guardadas em dados/sessoes.json, válidas por 30 minutos. */
const SESSAO_MINUTOS = 30;
function token_da_requisicao() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $h = $v;
    }
    if (preg_match('/^Bearer\s+(\S+)$/i', $h, $m)) return $m[1];
    return null;
}
function usuario_logado($obrigatorio = true) {
    $t = token_da_requisicao();
    if (!$t) { if ($obrigatorio) erro(401, 'Faça login para continuar.'); return null; }
    $sessoes = ler('sessoes');
    foreach ($sessoes as $s) {
        if ($s['token'] === $t) {
            if (strtotime($s['expira_em']) < time()) { if ($obrigatorio) erro(401, 'Sua sessão expirou. Entre novamente.'); return null; }
            foreach (ler('usuarios') as $u) if ($u['id'] === $s['usuario_id']) return $u;
        }
    }
    if ($obrigatorio) erro(401, 'Token inválido. Entre novamente.');
    return null;
}
function criar_sessao($usuario_id) {
    $sessoes = array_values(array_filter(ler('sessoes'), fn($s) => strtotime($s['expira_em']) > time()));
    $token = bin2hex(random_bytes(20));
    $sessoes[] = ['token' => $token, 'usuario_id' => $usuario_id, 'expira_em' => date('c', time() + SESSAO_MINUTOS * 60)];
    gravar('sessoes', $sessoes);
    return $token;
}
function encerrar_sessao() {
    $t = token_da_requisicao();
    gravar('sessoes', array_values(array_filter(ler('sessoes'), fn($s) => $s['token'] !== $t)));
}
/* Rota de apoio ao teste: faz o token atual vencer na hora (para testar o 401). */
function expirar_sessao() {
    $t = token_da_requisicao();
    $s = ler('sessoes');
    foreach ($s as &$x) if ($x['token'] === $t) $x['expira_em'] = date('c', time() - 1);
    gravar('sessoes', $s);
}

/* Paginação no servidor: devolve {dados, meta}. */
function paginar($lista, $padrao = 8, $maximo = 50) {
    $pp = (int)($_GET['por_pagina'] ?? $padrao);
    if ($pp < 1 || $pp > $maximo) erros_validacao(['por_pagina' => ["Use um valor entre 1 e $maximo."]]);
    $pag = (int)($_GET['pagina'] ?? 1);
    if ($pag < 1) erros_validacao(['pagina' => ['A página começa em 1.']]);
    $total = count($lista);
    $tp = max(1, (int)ceil($total / $pp));
    return ['dados' => array_values(array_slice($lista, ($pag - 1) * $pp, $pp)),
            'meta' => ['pagina' => $pag, 'por_pagina' => $pp, 'total' => $total, 'total_paginas' => $tp]];
}

function sem_acento($s) {
    $s = mb_strtolower($s, 'UTF-8');
    return strtr($s, ['á'=>'a','à'=>'a','â'=>'a','ã'=>'a','é'=>'e','ê'=>'e','í'=>'i','ó'=>'o','ô'=>'o','õ'=>'o','ú'=>'u','ü'=>'u','ç'=>'c']);
}
