<?php
/*
 * API Sabor de Bairro – fornecida pronta para a prova. NÃO ALTERE ESTE ARQUIVO.
 * Documentação no enunciado (seção "A API").
 * Valores em dinheiro são sempre INTEIROS EM CENTAVOS (5490 = R$ 54,90).
 */
require __DIR__ . '/nucleo.php';

const ARQUIVOS = ['categorias', 'restaurantes', 'secoes', 'itens', 'usuarios', 'ceps', 'cupons'];
/* Relógio acelerado da prova: o pedido muda de status a cada poucos segundos. */
const ETAPAS = [['recebido', 0], ['em_preparo', 30], ['a_caminho', 90], ['entregue', 150]];

function restaurar() {
    if (!is_dir(PASTA_DADOS)) mkdir(PASTA_DADOS, 0775, true);
    foreach (glob(PASTA_DADOS . '/*.json') as $f) unlink($f);
    foreach (ARQUIVOS as $n) copy(PASTA_SEMENTE . "/$n.json", PASTA_DADOS . "/$n.json");
    gravar('sessoes', []);
    // Histórico: 7 pedidos antigos e entregues do cliente 1 (para a lista paginada de pedidos).
    $pedidos = []; $rs = ler('restaurantes'); $its = ler('itens'); $secs = ler('secoes');
    for ($i = 1; $i <= 7; $i++) {
        $r = $rs[($i * 5) % count($rs)];
        $secIds = array_column(array_filter($secs, fn($s) => $s['restaurante_id'] === $r['id']), 'id');
        $item = array_values(array_filter($its, fn($x) => in_array($x['secao_id'], $secIds) && !$x['grupos']))[0] ?? null;
        if (!$item) continue;
        $qtd = 1 + $i % 3;
        $sub = $item['preco'] * $qtd;
        // A cada 3 dias, no horário do jantar ou do almoço de Brasília (12:10 a 21:40).
        $quando = strtotime(date('Y-m-d', time() - $i * 86400 * 3) . ' ' . sprintf('%02d:%02d', [19, 20, 12, 21, 13, 19, 20][$i - 1], ($i * 17) % 60));
        $pedidos[] = [
            'id' => 1000 + $i, 'usuario_id' => 1, 'restaurante_id' => $r['id'],
            'itens' => [['item_id' => $item['id'], 'nome' => $item['nome'], 'quantidade' => $qtd, 'opcoes' => [], 'observacao' => '', 'preco_unitario' => $item['preco'], 'total' => $sub]],
            'subtotal' => $sub, 'taxa_entrega' => $r['taxa_entrega'], 'desconto' => 0, 'total' => $sub + $r['taxa_entrega'],
            'cupom' => null, 'pagamento' => ['pix', 'cartao', 'dinheiro'][$i % 3], 'troco_para' => null,
            'endereco' => ['cep' => '03101-001', 'logradouro' => 'Rua Javari', 'numero' => '120', 'complemento' => 'apto 31', 'bairro' => 'Mooca'],
            'criado_em' => gmdate('Y-m-d\TH:i:s\Z', $quando), 'cancelado_em' => $i === 4 ? gmdate('Y-m-d\TH:i:s\Z', $quando + 60) : null,
            'avaliacao' => $i % 2 === 1 ? ['nota' => 4 + $i % 2, 'comentario' => 'Chegou quentinho!'] : null,
        ];
    }
    gravar('pedidos', $pedidos);
}
if (!file_exists(PASTA_DADOS . '/restaurantes.json')) restaurar();

/* ---------- Horário de funcionamento ---------- */
function aberto_agora($r, $t = null) {
    $t = $t ?? time();
    $dia = (int)date('N', $t); $hm = date('H:i', $t);
    foreach ($r['horarios'] as $h) if ($h['dia_semana'] === $dia && $hm >= $h['abre'] && $hm <= $h['fecha']) return true;
    return false;
}
/* Próxima abertura (ISO com fuso), procurando nos próximos 7 dias. */
function proxima_abertura($r) {
    for ($k = 0; $k <= 7; $k++) {
        $d = strtotime("+$k day", strtotime('today'));
        $n = (int)date('N', $d);
        foreach ($r['horarios'] as $h) if ($h['dia_semana'] === $n) {
            $ini = strtotime(date('Y-m-d', $d) . ' ' . $h['abre']);
            if ($ini > time()) return date('c', $ini);
        }
    }
    return null;
}
function restaurante_publico($r) {
    $r['aberto_agora'] = aberto_agora($r);
    $r['abre_em'] = $r['aberto_agora'] ? null : proxima_abertura($r);
    return $r;
}
function achar_restaurante($campo, $valor) {
    foreach (ler('restaurantes') as $r) if ((string)$r[$campo] === (string)$valor) return $r;
    return null;
}

/* ---------- Status do pedido (calculado pelo tempo desde a criação) ---------- */
function pedido_publico($p) {
    $criado = strtotime($p['criado_em']);
    $hist = [];
    if ($p['cancelado_em']) {
        $hist[] = ['status' => 'recebido', 'em' => $p['criado_em']];
        $hist[] = ['status' => 'cancelado', 'em' => $p['cancelado_em']];
        $status = 'cancelado';
    } else {
        $status = 'recebido';
        foreach (ETAPAS as [$nome, $seg]) if (time() >= $criado + $seg) { $status = $nome; $hist[] = ['status' => $nome, 'em' => gmdate('Y-m-d\TH:i:s\Z', $criado + $seg)]; }
    }
    $p['status'] = $status;
    $p['historico'] = $hist;
    $r = achar_restaurante('id', $p['restaurante_id']);
    $p['previsao_entrega'] = gmdate('Y-m-d\TH:i:s\Z', $criado + $r['tempo_max'] * 60);
    $p['pode_cancelar'] = $status === 'recebido';
    $p['pode_avaliar'] = $status === 'entregue' && !$p['avaliacao'];
    unset($p['usuario_id']);
    return $p;
}

/* ---------- Cupom ---------- */
function aplicar_cupom($codigo, $subtotal, $taxa) {
    $codigo = strtoupper(trim((string)$codigo));
    foreach (ler('cupons') as $c) if ($c['codigo'] === $codigo) {
        if ($c['validade'] < date('Y-m-d')) return ['erro' => 'Este cupom venceu em ' . date('d/m/Y', strtotime($c['validade'])) . '.'];
        if ($subtotal < $c['minimo']) return ['erro' => 'Este cupom vale para pedidos a partir de R$ ' . number_format($c['minimo'] / 100, 2, ',', '.') . '.'];
        $desc = $c['tipo'] === 'percentual' ? (int)round($subtotal * $c['valor'] / 100) : ($c['tipo'] === 'valor' ? min($subtotal, $c['valor']) : $taxa);
        return ['codigo' => $c['codigo'], 'tipo' => $c['tipo'], 'descricao' => $c['descricao'], 'desconto' => $desc];
    }
    return ['erro' => 'Cupom inexistente.'];
}

$r = rota(); $m = metodo();

/* ---------- Autenticação ---------- */
if ($r === '/login' && $m === 'POST') {
    atraso(300, 700);
    $c = corpo_json(); $err = [];
    $email = trim($c['email'] ?? ''); $senha = (string)($c['senha'] ?? '');
    if ($email === '') $err['email'][] = 'Informe o e-mail.'; elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $err['email'][] = 'Digite um e-mail válido.';
    if ($senha === '') $err['senha'][] = 'Informe a senha.';
    if ($err) erros_validacao($err);
    foreach (ler('usuarios') as $u) if (strcasecmp($u['email'], $email) === 0 && $u['senha'] === $senha) {
        unset($u['senha']);
        responder(200, ['token' => criar_sessao($u['id']), 'expira_em_minutos' => SESSAO_MINUTOS, 'usuario' => $u]);
    }
    erro(401, 'E-mail ou senha incorretos.');
}
if ($r === '/logout' && $m === 'POST') { usuario_logado(); encerrar_sessao(); responder(204); }
if ($r === '/sessao/expirar' && $m === 'POST') { usuario_logado(); expirar_sessao(); responder(204); }
if ($r === '/reset' && $m === 'POST') { restaurar(); responder(200, ['mensagem' => 'Dados restaurados.']); }
if ($r === '/me' && $m === 'GET') { $u = usuario_logado(); unset($u['senha']); responder(200, ['dados' => $u]); }

/* ---------- Catálogo ---------- */
if ($r === '/categorias' && $m === 'GET') { atraso(150, 350); responder(200, ['dados' => ler('categorias')]); }

if ($r === '/restaurantes' && $m === 'GET') {
    atraso(250, 900);
    $ordem = $_GET['ordem'] ?? 'relevancia';
    if (!in_array($ordem, ['relevancia', 'avaliacao', 'tempo', 'taxa', 'nome'])) erros_validacao(['ordem' => ['Use relevancia, avaliacao, tempo, taxa ou nome.']]);
    $lista = array_map('restaurante_publico', ler('restaurantes'));
    if (!empty($_GET['categoria_id'])) $lista = array_filter($lista, fn($x) => $x['categoria_id'] == $_GET['categoria_id']);
    if (!empty($_GET['aberto'])) $lista = array_filter($lista, fn($x) => $x['aberto_agora']);
    if (!empty($_GET['entrega_gratis'])) $lista = array_filter($lista, fn($x) => $x['taxa_entrega'] === 0);
    if (($b = trim($_GET['busca'] ?? '')) !== '') {
        $b = sem_acento($b);
        $nomesItens = [];
        $secRest = array_column(ler('secoes'), 'restaurante_id', 'id');
        foreach (ler('itens') as $it) $nomesItens[$secRest[$it['secao_id']]][] = $it['nome'];
        $lista = array_filter($lista, fn($x) => str_contains(sem_acento($x['nome'] . ' ' . implode(' ', $nomesItens[$x['id']] ?? [])), $b));
    }
    $lista = array_values($lista);
    usort($lista, function ($a, $b) use ($ordem) {
        if ($ordem === 'avaliacao') return [$b['avaliacao'], $b['avaliacoes_total']] <=> [$a['avaliacao'], $a['avaliacoes_total']];
        if ($ordem === 'tempo') return [$a['tempo_min'], $a['nome']] <=> [$b['tempo_min'], $b['nome']];
        if ($ordem === 'taxa') return [$a['taxa_entrega'], $a['nome']] <=> [$b['taxa_entrega'], $b['nome']];
        if ($ordem === 'nome') return strcmp(sem_acento($a['nome']), sem_acento($b['nome']));
        return [$b['aberto_agora'], $b['avaliacao']] <=> [$a['aberto_agora'], $a['avaliacao']]; // relevância: abertos primeiro
    });
    responder(200, paginar($lista, 6, 20));
}
if (preg_match('#^/restaurantes/([a-z0-9-]+)$#', $r, $mm) && $m === 'GET') {
    atraso(250, 600);
    $rest = achar_restaurante('slug', $mm[1]);
    if (!$rest) erro(404, 'Restaurante não encontrado.');
    $rest = restaurante_publico($rest);
    $itens = ler('itens');
    $secs = array_values(array_filter(ler('secoes'), fn($s) => $s['restaurante_id'] === $rest['id']));
    usort($secs, fn($a, $b) => $a['ordem'] <=> $b['ordem']);
    foreach ($secs as &$s) { $s['itens'] = array_values(array_filter($itens, fn($i) => $i['secao_id'] === $s['id'])); unset($s['restaurante_id']); }
    $rest['cardapio'] = $secs;
    responder(200, ['dados' => $rest]);
}
if (preg_match('#^/ceps/(\d{5}-?\d{3})$#', $r, $mm) && $m === 'GET') {
    atraso(300, 700);
    $cep = substr($mm[1], 0, 5) . '-' . substr(str_replace('-', '', $mm[1]), 5);
    foreach (ler('ceps') as $c) if ($c['cep'] === $cep) responder(200, ['dados' => $c]);
    erro(404, 'Ainda não entregamos neste CEP.');
}
if ($r === '/cupons/validar' && $m === 'POST') {
    atraso(300, 600);
    $c = corpo_json();
    $rest = achar_restaurante('id', $c['restaurante_id'] ?? 0);
    if (!$rest) erros_validacao(['restaurante_id' => ['Restaurante inexistente.']]);
    if (!isset($c['subtotal']) || !is_int($c['subtotal']) || $c['subtotal'] < 0) erros_validacao(['subtotal' => ['Informe o subtotal em centavos (inteiro).']]);
    $res = aplicar_cupom($c['codigo'] ?? '', $c['subtotal'], $rest['taxa_entrega']);
    if (isset($res['erro'])) erros_validacao(['codigo' => [$res['erro']]]);
    responder(200, ['dados' => $res]);
}

/* ---------- Pedidos ---------- */
if ($r === '/pedidos' && $m === 'GET') {
    $u = usuario_logado(); atraso(250, 600);
    $lista = array_values(array_filter(ler('pedidos'), fn($p) => $p['usuario_id'] === $u['id']));
    usort($lista, fn($a, $b) => strcmp($b['criado_em'], $a['criado_em']));
    $pg = paginar($lista, 5, 20);
    $pg['dados'] = array_map('pedido_publico', $pg['dados']);
    responder(200, $pg);
}
if ($r === '/pedidos' && $m === 'POST') {
    $u = usuario_logado(); atraso(500, 900);
    $c = corpo_json(); $err = [];
    $rest = achar_restaurante('id', $c['restaurante_id'] ?? 0);
    if (!$rest) erros_validacao(['restaurante_id' => ['Restaurante inexistente.']]);
    $todos = array_column(ler('itens'), null, 'id');
    $secRest = array_column(ler('secoes'), 'restaurante_id', 'id');
    $linhas = []; $sub = 0;
    if (empty($c['itens']) || !is_array($c['itens'])) $err['itens'][] = 'O carrinho está vazio.';
    foreach ($c['itens'] ?? [] as $k => $li) {
        $it = $todos[$li['item_id'] ?? 0] ?? null;
        if (!$it || $secRest[$it['secao_id']] !== $rest['id']) { $err["itens.$k.item_id"][] = 'Item não pertence a este restaurante.'; continue; }
        if (!$it['disponivel']) { $err["itens.$k.item_id"][] = "\"{$it['nome']}\" está esgotado."; continue; }
        $q = $li['quantidade'] ?? 0;
        if (!is_int($q) || $q < 1 || $q > 20) $err["itens.$k.quantidade"][] = 'Quantidade entre 1 e 20.';
        $ops = $li['opcoes'] ?? []; $unit = $it['preco']; $nomesOps = [];
        foreach ($it['grupos'] as $g) {
            $escolhidas = array_values(array_filter($g['opcoes'], fn($o) => in_array($o['id'], $ops, true)));
            $n = count($escolhidas);
            if ($n < $g['min'] || $n > $g['max'])
                $err["itens.$k.opcoes"][] = $g['min'] === $g['max'] ? "Escolha {$g['min']} opção em \"{$g['nome']}\" ({$it['nome']})." : "Escolha de {$g['min']} a {$g['max']} opções em \"{$g['nome']}\" ({$it['nome']}).";
            foreach ($escolhidas as $o) { $unit += $o['preco']; $nomesOps[] = $o['nome']; }
        }
        $validos = array_merge(...array_map(fn($g) => array_column($g['opcoes'], 'id'), $it['grupos'] ?: [['opcoes' => []]]));
        foreach ($ops as $o) if (!in_array($o, $validos, true)) $err["itens.$k.opcoes"][] = 'Opção inválida para este item.';
        $obs = trim((string)($li['observacao'] ?? ''));
        if (mb_strlen($obs) > 140) $err["itens.$k.observacao"][] = 'A observação pode ter até 140 caracteres.';
        if (is_int($q)) { $linhas[] = ['item_id' => $it['id'], 'nome' => $it['nome'], 'quantidade' => $q, 'opcoes' => $nomesOps, 'observacao' => $obs, 'preco_unitario' => $unit, 'total' => $unit * $q]; $sub += $unit * $q; }
    }
    // Endereço
    $e = $c['endereco'] ?? [];
    $cepInfo = null;
    foreach (ler('ceps') as $x) if ($x['cep'] === ($e['cep'] ?? '')) $cepInfo = $x;
    if (!preg_match('/^\d{5}-\d{3}$/', $e['cep'] ?? '')) $err['endereco.cep'][] = 'Use o formato 00000-000.';
    elseif (!$cepInfo) $err['endereco.cep'][] = 'Ainda não entregamos neste CEP.';
    if (trim($e['numero'] ?? '') === '') $err['endereco.numero'][] = 'Informe o número.';
    // Pagamento
    $pag = $c['pagamento'] ?? '';
    if (!in_array($pag, ['pix', 'cartao', 'dinheiro'])) $err['pagamento'][] = 'Escolha pix, cartao ou dinheiro.';
    $troco = $c['troco_para'] ?? null;
    if ($err) erros_validacao($err);
    if (!aberto_agora($rest)) erro(409, 'O restaurante fechou. Abre ' . date('d/m \à\s H:i', strtotime(proxima_abertura($rest))) . '.', ['codigo' => 'RESTAURANTE_FECHADO']);
    if ($sub < $rest['pedido_minimo']) erro(409, 'O pedido mínimo deste restaurante é R$ ' . number_format($rest['pedido_minimo'] / 100, 2, ',', '.') . '.', ['codigo' => 'PEDIDO_MINIMO']);
    $taxa = $rest['taxa_entrega'] + $cepInfo['acrescimo_taxa'];
    $desconto = 0; $cupom = null;
    if (!empty($c['cupom'])) {
        $cp = aplicar_cupom($c['cupom'], $sub, $taxa);
        if (isset($cp['erro'])) erros_validacao(['cupom' => [$cp['erro']]]);
        $desconto = $cp['desconto']; $cupom = $cp['codigo'];
    }
    $total = $sub + $taxa - $desconto;
    if ($pag === 'dinheiro' && $troco !== null && (!is_int($troco) || $troco < $total)) erros_validacao(['troco_para' => ['O troco precisa ser para um valor maior que o total.']]);
    // O front manda o total que mostrou na tela; se o servidor calcular diferente, avisa (preço mudou ou conta errada no front).
    if (isset($c['total_esperado']) && $c['total_esperado'] !== $total)
        erro(409, 'O total mudou: o valor certo é R$ ' . number_format($total / 100, 2, ',', '.') . '.', ['codigo' => 'TOTAL_DIVERGENTE', 'total' => $total]);
    $todosPed = ler('pedidos');
    $novo = ['id' => proximo_id($todosPed) ?: 1001, 'usuario_id' => $u['id'], 'restaurante_id' => $rest['id'], 'itens' => $linhas,
             'subtotal' => $sub, 'taxa_entrega' => $taxa, 'desconto' => $desconto, 'total' => $total, 'cupom' => $cupom,
             'pagamento' => $pag, 'troco_para' => $pag === 'dinheiro' ? $troco : null,
             'endereco' => ['cep' => $cepInfo['cep'], 'logradouro' => $cepInfo['logradouro'], 'numero' => trim($e['numero']), 'complemento' => trim($e['complemento'] ?? ''), 'bairro' => $cepInfo['bairro']],
             'criado_em' => gmdate('Y-m-d\TH:i:s\Z'), 'cancelado_em' => null, 'avaliacao' => null];
    $todosPed[] = $novo; gravar('pedidos', $todosPed);
    responder(201, ['dados' => pedido_publico($novo)]);
}
if (preg_match('#^/pedidos/(\d+)(/cancelar|/avaliacao)?$#', $r, $mm)) {
    $u = usuario_logado(); atraso(150, 400);
    $todos = ler('pedidos');
    $idx = null;
    foreach ($todos as $k => $p) if ($p['id'] === (int)$mm[1] && $p['usuario_id'] === $u['id']) $idx = $k;
    if ($idx === null) erro(404, 'Pedido não encontrado.');
    $acao = $mm[2] ?? '';
    if ($acao === '' && $m === 'GET') responder(200, ['dados' => pedido_publico($todos[$idx])]);
    if ($acao === '/cancelar' && $m === 'POST') {
        $pub = pedido_publico($todos[$idx]);
        if (!$pub['pode_cancelar']) erro(409, 'O pedido já está ' . str_replace('_', ' ', $pub['status']) . ' e não pode mais ser cancelado.', ['codigo' => 'NAO_PODE_CANCELAR']);
        $todos[$idx]['cancelado_em'] = gmdate('Y-m-d\TH:i:s\Z');
        gravar('pedidos', $todos);
        responder(200, ['dados' => pedido_publico($todos[$idx])]);
    }
    if ($acao === '/avaliacao' && $m === 'POST') {
        $pub = pedido_publico($todos[$idx]);
        if ($todos[$idx]['avaliacao']) erro(409, 'Você já avaliou este pedido.', ['codigo' => 'JA_AVALIADO']);
        if ($pub['status'] !== 'entregue') erro(409, 'Só é possível avaliar depois da entrega.', ['codigo' => 'AINDA_NAO_ENTREGUE']);
        $c = corpo_json(); $err = [];
        if (!isset($c['nota']) || !is_int($c['nota']) || $c['nota'] < 1 || $c['nota'] > 5) $err['nota'][] = 'Escolha de 1 a 5 estrelas.';
        if (mb_strlen(trim($c['comentario'] ?? '')) > 280) $err['comentario'][] = 'O comentário pode ter até 280 caracteres.';
        if (($c['nota'] ?? 5) <= 2 && mb_strlen(trim($c['comentario'] ?? '')) < 10) $err['comentario'][] = 'Para notas 1 e 2, conte o que aconteceu (mínimo de 10 caracteres).';
        if ($err) erros_validacao($err);
        $todos[$idx]['avaliacao'] = ['nota' => $c['nota'], 'comentario' => trim($c['comentario'] ?? '')];
        gravar('pedidos', $todos);
        responder(201, ['dados' => pedido_publico($todos[$idx])]);
    }
}

erro(404, 'Rota não encontrada: ' . $m . ' ' . $r);
