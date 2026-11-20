<?php
// Checagem automática do Módulo B – Garagem 47 (apoio do avaliador e teste da solução).
// Uso: php checar-garagem47.php http://servidor/XX_modulo_b  [pasta-das-fotos-teste]
// ANTES de rodar: reimporte garagem47_db.sql (o script cria, altera e apaga registros).
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
    $jar[$quem] ??= tempnam(sys_get_temp_dir(), 'g47');
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
function codigos(string $html): array { preg_match_all('/OS-\d{4}-\d{4}/', $html, $m); return array_values(array_unique($m[0])); }
function idDe(string $loc): ?int { return preg_match('#/(\d+)(/|$)#', $loc, $m) ? (int) $m[1] : null; }

echo "Garagem 47 – checagem em $base\n\n";
$hoje = date('Y-m-d');

// ======================= B1 entrega =======================
[$s, $h, $loc] = get('anon', '/');
t('B1.1', 'raiz sem login redireciona para /login', $s === 302 && str_ends_with($loc, '/login'), "veio $s $loc");
[$s, $h] = get('anon', '/login');
t('B1.2', '/login abre com campos de e-mail e senha', $s === 200 && str_contains($h, 'name="email"') && str_contains($h, 'name="password"'), "veio $s");

// ======================= B2 autenticação =======================
$todasRedir = true;
foreach (['/ordens', '/ordens/1', '/clientes', '/clientes/1', '/servicos', '/ordens/criar'] as $u) {
    [$s, , $loc] = get('anon', $u);
    $todasRedir = $todasRedir && $s === 302 && str_ends_with($loc, '/login');
}
t('B2.1', 'rotas internas sem login redirecionam para /login', $todasRedir);
[$s, $h] = enviar('anon', 'POST', '/login', ['email' => 'gerente.prova@garagem47.com', 'password' => 'errada'], '/login');
t('B2.2', 'senha errada: volta ao login com "E-mail ou senha incorretos" e e-mail preenchido',
    str_contains(txt($h), 'E-mail ou senha incorretos') && str_contains($h, 'value="gerente.prova@garagem47.com"'));
[$s, $h] = login('inativo', 'inativo.prova@garagem47.com');
[$s2] = get('inativo', '/ordens');
t('B2.3', 'usuário inativo não entra e vê "Usuário inativo"', str_contains(txt($h), 'inativo') && $s2 === 302);
[$s, $h] = login('G', 'gerente.prova@garagem47.com');
t('B2.4', 'gerente entra e vê o painel com o nome', str_contains(txt($h), 'Helena Duarte'));
login('A', 'atendente.prova@garagem47.com');
login('M', 'mecanico.prova@garagem47.com');
login('M2', 'mecanico2.prova@garagem47.com');
login('X', 'atendente.prova@garagem47.com');
[$s, , $loc] = enviar('X', 'POST', '/logout', [], '/');
[$s2, , $loc2] = get('X', '/ordens');
t('B2.5', 'logout encerra a sessão (depois dele /ordens vai para /login)', $s2 === 302 && str_ends_with($loc2, '/login'), "logout $s, depois $s2");

// ======================= B3 controle de acesso =======================
$m = [];
foreach ([['M', '/clientes'], ['M', '/clientes/1'], ['M', '/servicos'], ['A', '/servicos'], ['M', '/ordens/criar'], ['A', '/servicos/1/editar']] as [$q, $u]) {
    [$s] = get($q, $u); $m[] = "$q $u=$s"; $todos403[] = $s === 403;
}
t('B3.1', 'cargo sem permissão recebe 403 (mecânico em clientes/criar ordem, atendente em serviços)', ! in_array(false, $todos403, true), implode(', ', $m));
[$s] = get('M', '/ordens/4');
[$s2] = get('M', '/ordens/5');
t('B3.2', 'mecânico abre a ordem dele (5) e recebe 403 na ordem de outro mecânico (4)', $s === 403 && $s2 === 200, "4=$s 5=$s2");
[, $h] = get('M', '/ordens');
$cod = codigos($h);
t('B3.3', 'listagem do mecânico só tem as ordens dele', $cod && ! array_intersect($cod, ['OS-2026-0004', 'OS-2026-0006', 'OS-2026-0010', 'OS-2026-0007']), 'veio ' . implode(' ', $cod));
[, $h] = get('M', '/');
t('B3.4', 'menu do mecânico não mostra Clientes nem Serviços', ! str_contains($h, '/clientes"') && ! str_contains($h, '/servicos"'));
[, $h] = get('A', '/ordens/1');
t('B3.5', 'atendente não vê botões de peça nem Apagar numa ordem entregue', ! str_contains($h, 'Lançar peça') && ! str_contains($h, '/apagar"'));
[$s] = get('G', '/ordens/9999'); [$s2] = get('G', '/clientes/9999');
t('B3.6', 'registro inexistente responde 404', $s === 404 && $s2 === 404, "ordem $s, cliente $s2");

// ======================= B4 listagem de ordens =======================
[, $h] = get('G', '/ordens');
$cod = codigos($h);
// Ordem padrão: prazo crescente, desempate por id (dados do banco fornecido)
$esperado = ['OS-2026-0001', 'OS-2026-0002', 'OS-2026-0003', 'OS-2026-0011', 'OS-2026-0004', 'OS-2026-0015', 'OS-2026-0005', 'OS-2026-0012', 'OS-2026-0013', 'OS-2026-0007'];
t('B4.1', 'padrão: prazo crescente com desempate por id, 10 por página', $cod === $esperado, 'veio ' . implode(' ', $cod));
t('B4.2', 'datas em dd/mm/aaaa e total em R$ (OS-2026-0001 = R$ 498,80)', str_contains($h, '02/10/2026') && str_contains($h, 'R$ 498,80'));
[, $h] = get('G', '/ordens?page=2');
t('B4.3', 'página 2 tem as 6 restantes', count(codigos($h)) === 6, 'veio ' . count(codigos($h)));
[, $h] = get('G', '/ordens?ordem=recentes');
$c = codigos($h);
t('B4.4', 'ordem=recentes: abertura decrescente (0014 primeiro, depois 0009)', ($c[0] ?? '') === 'OS-2026-0014' && ($c[1] ?? '') === 'OS-2026-0009', 'veio ' . implode(' ', array_slice($c, 0, 3)));
[, $h] = get('G', '/ordens?ordem=total');
$c = codigos($h);
t('B4.5', 'ordem=total: maior total primeiro (0006 = R$ 679,90)', ($c[0] ?? '') === 'OS-2026-0006', 'veio ' . ($c[0] ?? '-'));
[, $h] = get('G', '/ordens?status=aberta');
t('B4.6', 'filtro situação=aberta: 4 ordens e a opção continua selecionada', count(codigos($h)) === 4 && preg_match('/value="aberta"\s+selected/', $h), 'veio ' . count(codigos($h)));
[, $h] = get('G', '/ordens?mecanico=nenhum');
$c = codigos($h); sort($c);
t('B4.7', 'filtro "sem mecânico": 0007, 0009, 0014', $c === ['OS-2026-0007', 'OS-2026-0009', 'OS-2026-0014'], 'veio ' . implode(' ', $c));
[, $h] = get('G', '/ordens?busca=fjk-2b31');
$c = codigos($h); sort($c);
t('B4.8', 'busca por placa com hífen e minúscula (fjk-2b31): 0001 e 0015', $c === ['OS-2026-0001', 'OS-2026-0015'], 'veio ' . implode(' ', $c));
[, $h] = get('G', '/ordens?busca=Juliana&status=entregue');
$c = codigos($h);
t('B4.9', 'busca por cliente + situação combinadas (Juliana, entregue): só 0011', $c === ['OS-2026-0011'], 'veio ' . implode(' ', $c));
[, $h] = get('G', '/ordens?de=2026-11-17&ate=2026-11-18');
$c = codigos($h); sort($c);
t('B4.10', 'período de abertura 17/11 a 18/11 inclui o dia final inteiro (0008, 0009, 0010, 0016)', $c === ['OS-2026-0008', 'OS-2026-0009', 'OS-2026-0010', 'OS-2026-0016'], 'veio ' . implode(' ', $c));
// Atrasadas: calculado a partir da data de hoje
$prazos = [5 => '2026-11-12', 6 => '2026-11-25', 7 => '2026-11-18', 8 => '2026-11-30', 9 => '2026-11-19', 10 => '2026-11-26', 13 => '2026-11-14', 14 => '2026-11-21', 16 => '2026-11-18'];
$atr = []; foreach ($prazos as $id => $p) if ($p < $hoje) $atr[] = sprintf('OS-2026-%04d', $id);
[, $h] = get('G', '/ordens?atrasadas=1');
$c = codigos($h); sort($c);
t('B4.11', 'só atrasadas (prazo < hoje e ainda na oficina): ' . implode(' ', $atr), $c === $atr, 'veio ' . implode(' ', $c));
[, $h] = get('G', '/ordens?status=aberta&page=1&ordem=recentes');
t('B4.12', 'filtros ficam na URL dos links de paginação/campos (ordem=recentes selecionada)', (bool) preg_match('/value="recentes"\s+selected/', $h));
$d = (int) ((strtotime($hoje) - strtotime('2026-11-12')) / 86400);
[, $h] = get('G', '/ordens?status=em_execucao');
t('B4.13', "ordem atrasada mostra \"Atrasada há $d dias\" (0005)", $d <= 0 || str_contains(txt($h), "Atrasada há $d dias"));
[, $h] = get('G', '/ordens?status=bobagem&ordem=xyz&de=31/12/2026');
t('B4.14', 'valores inválidos na URL não quebram a página (cai no padrão)', count(codigos($h)) === 10);

// ======================= B5 clientes e veículos =======================
[, $h] = get('A', '/clientes?busca=' . urlencode(substr(txt(get('A', '/clientes/3')[1]), 0, 0)));
[, $h3] = get('A', '/clientes/3');
preg_match('/\d{3}\.\d{3}\.\d{3}-\d{2}/', $h3, $mm); $cpf3 = $mm[0] ?? '';
[, $h] = get('A', '/clientes?busca=' . urlencode($cpf3));
t('B5.1', 'cliente: CPF exibido com máscara e busca por CPF com máscara acha o cliente', $cpf3 && str_contains($h, 'Juliana Prado'), "cpf $cpf3");
[, $h] = enviar('A', 'POST', '/clientes', ['name' => 'Teste CPF', 'cpf' => '123.456.789-00', 'phone' => '(15) 99999-1111'], '/clientes/criar');
t('B5.2', 'CPF com dígito verificador errado é recusado e o nome continua preenchido', str_contains(txt($h), 'CPF informado é inválido') && str_contains($h, 'value="Teste CPF"'));
[, $h] = enviar('A', 'POST', '/clientes', ['name' => 'Duplicado', 'cpf' => $cpf3, 'phone' => '15999991111'], '/clientes/criar');
t('B5.3', 'CPF repetido (digitado com máscara) é recusado', str_contains(txt($h), 'Já existe um cliente com este CPF'));
[$s, $h, $loc] = enviar('A', 'POST', '/clientes', ['name' => 'Cliente Novo da Silva', 'cpf' => '529.982.247-25', 'phone' => '(15) 3232-4545', 'email' => ''], '/clientes/criar');
$novo = idDe($loc);
t('B5.4', 'cliente válido é criado; telefone fixo exibido como (15) 3232-4545', $novo && str_contains($h, '(15) 3232-4545') && str_contains($h, '529.982.247-25'), "loc $loc");
[, $h] = enviar('A', 'POST', "/clientes/$novo/veiculos", ['plate' => 'ab-12345', 'brand' => 'Fiat', 'model' => 'Uno', 'year' => 2010], "/clientes/$novo/veiculos/criar");
t('B5.5', 'placa fora do padrão é recusada', str_contains(txt($h), 'Placa inválida'));
[, $h] = enviar('A', 'POST', "/clientes/$novo/veiculos", ['plate' => 'fjk-2b31', 'brand' => 'Fiat', 'model' => 'Uno', 'year' => 2010], "/clientes/$novo/veiculos/criar");
t('B5.6', 'placa repetida (digitada com hífen e minúscula) é recusada', str_contains(txt($h), 'placa já está cadastrada'));
[, $h] = enviar('A', 'POST', "/clientes/$novo/veiculos", ['plate' => 'xyz-9a87', 'brand' => 'Fiat', 'model' => 'Uno', 'year' => 2010], "/clientes/$novo/veiculos/criar");
t('B5.7', 'placa "xyz-9a87" é gravada como XYZ9A87', str_contains($h, 'XYZ9A87'));
[, $h] = enviar('A', 'PUT', '/clientes/1', ['name' => 'Ana Beatriz Rocha', 'cpf' => get('A', '/clientes/1/editar')[1] ? preg_replace('/.*name="cpf" value="([^"]+)".*/s', '$1', get('A', '/clientes/1/editar')[1]) : '', 'phone' => '15988887777', 'email' => 'nao-e-email'], '/clientes/1/editar');
t('B5.8', 'edição: formulário vem preenchido e e-mail inválido é recusado', str_contains(txt($h), 'e-mail válido'));
[$s] = get('A', '/clientes/1/apagar');
[, $h] = enviar('A', 'DELETE', '/clientes/1', [], '/clientes/1/apagar');
[$s2] = get('A', '/clientes/1');
t('B5.9', 'cliente com ordens: página de confirmação existe, exclusão é recusada e o cliente continua', $s === 200 && str_contains(txt($h), 'não pode ser apagado') && $s2 === 200, "confirmação $s, depois $s2");
[, $h] = enviar('A', 'DELETE', '/clientes/12', [], '/clientes/12/apagar');
[$s2] = get('A', '/clientes/12');
[, $hv] = get('G', '/ordens/criar');
t('B5.10', 'cliente sem ordens é apagado junto com o veículo (UYT3R02 some do formulário de ordem)', $s2 === 404 && ! str_contains($hv, 'UYT3R02'), "depois $s2");
[, $h] = enviar('A', 'DELETE', '/veiculos/1', [], '/clientes/1');
t('B5.11', 'veículo com ordens não pode ser apagado', str_contains(txt($h), 'não pode ser apagado'));

// ======================= B6 abrir e editar ordem =======================
[, $h] = get('A', '/ordens/criar');
t('B6.1', 'formulário de abertura não oferece serviço inativo (Lavagem simples) nem mecânico inativo (Jair)', ! str_contains($h, 'Lavagem simples') && ! str_contains($h, 'Jair'));
$base6 = ['vehicle_id' => 5, 'km' => 132500, 'complaint' => 'Barulho na suspensão traseira.', 'due_date' => date('Y-m-d', strtotime('+2 days')), 'mechanic_id' => 3, 'services' => [9, 2]];
[, $h] = enviar('A', 'POST', '/ordens', ['km' => 100] + $base6, '/ordens/criar');
t('B6.2', 'km menor que a última registrada do veículo é recusada (132.400 km)', str_contains(txt($h), '132.400 km') && str_contains($h, 'Barulho na suspensão traseira.'));
[, $h] = enviar('A', 'POST', '/ordens', ['due_date' => date('Y-m-d', strtotime('-1 day'))] + $base6, '/ordens/criar');
t('B6.3', 'prazo no passado é recusado e os serviços marcados continuam marcados', str_contains(txt($h), 'prazo') && preg_match('/value="9"\s+checked/', $h));
[, $h] = enviar('A', 'POST', '/ordens', ['vehicle_id' => 8, 'km' => 60000] + $base6, '/ordens/criar');
t('B6.4', 'veículo com ordem em andamento é recusado citando a ordem (OS-2026-0005)', str_contains(txt($h), 'OS-2026-0005'));
[, $h] = enviar('A', 'POST', '/ordens', ['services' => [10]] + $base6, '/ordens/criar');
t('B6.5', 'serviço inativo enviado à força é recusado', str_contains(txt($h), 'inativo'));
$ano = date('Y'); $esperadoCod = $ano === '2026' ? 'OS-2026-0017' : "OS-$ano-0001";
[$s, $h, $loc] = enviar('A', 'POST', '/ordens', $base6, '/ordens/criar');
$nova = idDe($loc);
t('B6.6', "ordem válida é criada com código $esperadoCod, situação Aberta e histórico", $nova && str_contains($h, $esperadoCod) && str_contains($h, 'Aberta'), "loc $loc");
t('B6.7', 'total da nova ordem = R$ 500,00 (380,00 + 120,00)', str_contains($h, 'R$ 500,00'));
// preço congelado
[, $h] = enviar('G', 'PUT', '/servicos/2', ['name' => 'Alinhamento', 'price' => '150,00', 'active' => 1], '/servicos/2/editar');
[, $h1] = get('G', "/ordens/$nova");
t('B6.8', 'mudar o preço do serviço não altera ordens já abertas (continua R$ 500,00)', str_contains($h1, 'R$ 500,00'));
[, $h] = enviar('A', 'PUT', "/ordens/$nova", ['complaint' => 'Barulho na suspensão traseira.', 'due_date' => $base6['due_date'], 'mechanic_id' => 3, 'services' => [9, 2, 3]], "/ordens/$nova/editar");
t('B6.9', 'editar acrescentando serviço: antigo mantém o preço, novo entra com o preço atual (R$ 590,00)', str_contains($h, 'R$ 590,00'));
[, $he] = get('A', "/ordens/$nova/editar");
t('B6.10', 'formulário de edição vem com os serviços da ordem marcados', preg_match('/value="9"\s+checked/', $he) && preg_match('/value="3"\s+checked/', $he) && ! preg_match('/value="1"\s+checked/', $he));
[, $h] = enviar('A', 'PUT', '/ordens/5', ['complaint' => 'Luz da injeção acesa.', 'due_date' => '2026-11-12', 'mechanic_id' => '', 'services' => [6]], '/ordens/5/editar');
t('B6.11', 'ordem em execução não pode ficar sem mecânico', str_contains(txt($h), 'mecânico é obrigatório'));
[$s] = get('A', '/ordens/1/editar');
t('B6.12', 'ordem entregue não pode ser editada (403)', $s === 403, "veio $s");

// ======================= B7 situação (máquina de estados) =======================
[$s] = enviar('A', 'POST', '/ordens/8/situacao', ['para' => 'em_execucao'], '/ordens/8');
t('B7.1', 'atendente não inicia execução (403)', $s === 403, "veio $s");
[$s] = enviar('M2', 'POST', '/ordens/8/situacao', ['para' => 'em_execucao'], '/ordens/10');
t('B7.2', 'mecânico que não é o responsável não muda a situação (403)', $s === 403, "veio $s");
[, $h] = enviar('G', 'POST', '/ordens/7/situacao', ['para' => 'em_execucao'], '/ordens/7');
t('B7.3', 'iniciar execução sem mecânico definido é recusado', str_contains(txt($h), 'Defina o mecânico'));
[, $h] = enviar('M', 'POST', '/ordens/8/situacao', ['para' => 'em_execucao'], '/ordens/8');
t('B7.4', 'mecânico responsável inicia a execução da ordem dele', str_contains($h, 'Em execução') && str_contains(txt($h), 'Carlos Menezes'));
[, $h] = enviar('M', 'POST', '/ordens/8/situacao', ['para' => 'aguardando_peca', 'note' => ''], '/ordens/8');
t('B7.5', '"aguardando peça" exige observação', str_contains(txt($h), 'Informe') && ! str_contains($h, 'situacao st-aguardando_peca'));
[, $h] = enviar('M', 'POST', '/ordens/8/situacao', ['para' => 'entregue'], '/ordens/8');
[, $h2] = enviar('G', 'POST', '/ordens/8/situacao', ['para' => 'entregue'], '/ordens/8');
t('B7.6', 'mecânico não registra entrega (403) e o gerente não pula de "em execução" para "entregue"', str_contains(txt($h2), 'Não é possível passar'));
[, $h] = enviar('M', 'POST', '/ordens/5/situacao', ['para' => 'concluida'], '/ordens/5');
t('B7.7', 'concluir grava a data de conclusão (aparece no detalhe)', str_contains($h, 'Concluída') && str_contains($h, date('d/m/Y')));
[, $h] = enviar('A', 'POST', '/ordens/5/situacao', ['para' => 'cancelada', 'note' => 'Cliente desistiu de tudo.'], '/ordens/5');
t('B7.8', 'ordem concluída não pode ser cancelada', str_contains(txt($h), 'Não é possível passar'));
[, $h] = enviar('A', 'POST', '/ordens/4/situacao', ['para' => 'entregue'], '/ordens/4');
t('B7.9', 'atendente registra a entrega de ordem concluída', str_contains($h, 'situacao st-entregue'));
[, $hp] = get('G', '/ordens/6');
[, $h] = enviar('A', 'POST', '/ordens/6/situacao', ['para' => 'cancelada', 'note' => 'curto'], '/ordens/6');
t('B7.10', 'motivo de cancelamento com menos de 10 caracteres é recusado', ! str_contains($h, 'situacao st-cancelada'));
[, $h] = enviar('A', 'POST', '/ordens/6/situacao', ['para' => 'cancelada', 'note' => 'Cliente vendeu o carro.'], '/ordens/6');
t('B7.11', 'cancelamento grava o motivo e entra no histórico', str_contains($h, 'situacao st-cancelada') && substr_count($h, 'Cliente vendeu o carro.') >= 2);
[, $h] = get('G', '/ordens/10');
preg_match('/Óleo 5W30[^<]*estoque (\d+)/u', $h, $mm);
t('B7.12', 'cancelar devolve as peças da ordem ao estoque (óleo 5W30: 40 + 4 = 44)', ($mm[1] ?? '') === '44', 'estoque mostrado ' . ($mm[1] ?? '?'));

// ======================= B8 peças =======================
[, $h] = enviar('M2', 'POST', '/ordens/10/pecas', ['part_id' => 5, 'quantity' => 3], '/ordens/10');
t('B8.1', 'quantidade acima do estoque é recusada ("Estoque insuficiente ... disponível 2")', str_contains(txt($h), 'disponível 2'));
[, $h] = enviar('M2', 'POST', '/ordens/10/pecas', ['part_id' => 10, 'quantity' => 1], '/ordens/10');
t('B8.2', 'mesma peça lançada de novo soma na mesma linha (fluido: 2 + 1 = 3 unidades) e baixa o estoque (10 - 1 = 9)',
    (bool) preg_match('/Fluido de freio DOT4 \(500 ml\)<\/td>\s*<td class="num">3</u', $h) && str_contains($h, 'estoque 9'));
[$s] = enviar('M', 'POST', '/ordens/10/pecas', ['part_id' => 1, 'quantity' => 1], '/ordens/5');
[$s2] = enviar('A', 'POST', '/ordens/10/pecas', ['part_id' => 1, 'quantity' => 1], '/ordens/10');
t('B8.3', 'peça só pelo mecânico responsável ou gerente (outro mecânico e atendente: 403)', $s === 403 && $s2 === 403, "M=$s A=$s2");
preg_match('#/ordens/10/pecas/(\d+)#', $h, $mm); $item = $mm[1] ?? 0;
[$s] = enviar('G', 'DELETE', "/ordens/5/pecas/$item", [], '/ordens/10');
t('B8.4', 'item de outra ordem na URL responde 404', $s === 404, "veio $s");
[, $h] = enviar('M2', 'DELETE', "/ordens/10/pecas/$item", [], '/ordens/10');
t('B8.5', 'retirar a linha devolve as 3 unidades ao estoque (fluido: 9 + 3 = 12)', str_contains($h, 'estoque 12'));
[$s] = enviar('G', 'POST', '/ordens/1/pecas', ['part_id' => 1, 'quantity' => 1], '/ordens/1');
t('B8.6', 'ordem entregue não aceita peça (403)', $s === 403, "veio $s");

// ======================= B9 fotos =======================
[, $h] = enviar('G', 'POST', '/ordens/10/fotos', [], '/ordens/10', ["$fotos/invalida-texto-renomeado.jpg"]);
t('B9.1', 'arquivo de texto com extensão .jpg é recusado', str_contains(txt($h), 'JPG, PNG ou WEBP') || str_contains(txt($h), 'imagem'));
[, $h] = enviar('G', 'POST', '/ordens/10/fotos', [], '/ordens/10', ["$fotos/invalida-documento.pdf"]);
t('B9.2', 'PDF é recusado', str_contains(txt($h), 'JPG, PNG ou WEBP'));
[, $h] = enviar('G', 'POST', '/ordens/10/fotos', [], '/ordens/10', ["$fotos/invalida-grande-3mb.png"]);
t('B9.3', 'imagem acima de 2 MB é recusada', str_contains(txt($h), '2 MB') || str_contains(txt($h), 'grande') || str_contains(txt($h), 'enviar'));
[, $h] = enviar('G', 'POST', '/ordens/10/fotos', [], '/ordens/10', ["$fotos/valida-1-dianteira.jpg", "$fotos/valida-2-lateral.png"]);
preg_match_all('#src="([^"]+/storage/ordens/10/[^"]+)"#', $h, $mm);
$url = $mm[1][0] ?? '';
$st = $url ? curl_getinfo((function ($u) { $c = curl_init($u); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_NOBODY => true]); curl_exec($c); return $c; })($url), CURLINFO_RESPONSE_CODE) : 0;
t('B9.4', 'duas fotos válidas enviadas juntas aparecem e abrem em /storage/ordens/10/...', count($mm[1]) === 2 && $st === 200, "fotos " . count($mm[1]) . ", status $st");
preg_match('#/ordens/10/fotos/(\d+)#', $h, $mm); $foto = $mm[1] ?? 0;
[, $hm] = get('M2', '/ordens/10');
[$s] = enviar('M2', 'DELETE', "/ordens/10/fotos/$foto", [], '/ordens/10');
t('B9.5', 'só quem enviou (ou o gerente) apaga a foto: mecânica não vê o botão e recebe 403', $s === 403 && ! str_contains($hm, "/ordens/10/fotos/$foto\""), "veio $s");
[, $h] = enviar('M2', 'POST', '/ordens/10/fotos', [], '/ordens/10', ["$fotos/valida-3-painel.webp", "$fotos/valida-1-dianteira.jpg", "$fotos/valida-2-lateral.png", "$fotos/valida-1-dianteira.jpg", "$fotos/valida-2-lateral.png"]);
t('B9.6', 'limite de 6 fotos por ordem (já tem 2, envio de 5 é recusado)', str_contains(txt($h), 'no máximo 6 fotos'));
[, $h] = enviar('G', 'DELETE', "/ordens/10/fotos/$foto", [], '/ordens/10');
$c = curl_init($url); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_NOBODY => true]); curl_exec($c);
$st = curl_getinfo($c, CURLINFO_RESPONSE_CODE);
t('B9.7', 'apagar a foto remove o registro e o arquivo (URL antiga não abre mais)', $st === 404 || $st === 403, "veio $st");

// ======================= B10 apagar ordem, catálogo, painel, exportação =======================
[$s] = get('G', '/ordens/1/apagar');
[$s2] = get('A', '/ordens/3/apagar');
t('B10.1', 'apagar ordem: 403 para ordem não cancelada e para quem não é gerente', $s === 403 && $s2 === 403, "G/1=$s A/3=$s2");
[$s] = get('G', '/ordens/3/apagar');
[, $h] = enviar('G', 'DELETE', '/ordens/3', [], '/ordens/3/apagar');
[$s2] = get('G', '/ordens/3');
t('B10.2', 'gerente apaga ordem cancelada depois da confirmação', $s === 200 && $s2 === 404, "confirmação $s, depois $s2");
[, $h] = enviar('G', 'DELETE', '/servicos/1', [], '/servicos/1/apagar');
t('B10.3', 'serviço usado em ordens não pode ser apagado (mensagem sugere desativar)', str_contains(txt($h), 'Desative'));
[, $h] = enviar('G', 'POST', '/servicos', ['name' => 'Polimento técnico', 'price' => '1.234,50', 'active' => 1], '/servicos/criar');
t('B10.4', 'preço digitado como 1.234,50 é aceito e exibido como R$ 1.234,50', str_contains($h, 'R$ 1.234,50'));
[, $h] = enviar('G', 'POST', '/servicos', ['name' => 'Polimento técnico', 'price' => '-5'], '/servicos/criar');
t('B10.5', 'nome repetido e preço não positivo são recusados', str_contains(txt($h), 'Já existe um serviço') && str_contains(txt($h), 'maior que'));
[, $hg] = get('G', '/'); [, $ha] = get('A', '/');
t('B10.6', 'painel: gerente vê "Faturado", atendente não', str_contains($hg, 'Faturado') && ! str_contains($ha, 'Faturado'));
[$s, $csv, , $cab] = get('G', '/ordens/exportar?status=entregue');
$linhas = array_values(array_filter(explode("\n", trim($csv))));
t('B10.7', 'exportação CSV (gerente) com BOM, separador ; e os filtros da tela', $s === 200 && str_starts_with($csv, "\xEF\xBB\xBF") && str_contains($linhas[0] ?? '', 'Código;Placa') && count($linhas) === 1 + 4,
    "status $s, linhas " . count($linhas));
[$s] = get('A', '/ordens/exportar');
t('B10.8', 'exportação negada para atendente (403)', $s === 403, "veio $s");

echo "\n$ok OK, $falhas FALHA(S)\n";
