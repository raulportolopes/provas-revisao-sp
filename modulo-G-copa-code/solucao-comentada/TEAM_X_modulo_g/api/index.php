<?php
/*
 * COPA CODE – API (Pacote P1)
 * ---------------------------------------------------------------
 * PHP puro + PDO + MySQL (banco pronto em banco/copacode.sql).
 * Mesma estrutura do Zela Bairro: respostas JSON, regras, ações e,
 * no fim, a tabela de rotas.
 *
 * O que esta API tem de mais difícil (e mais cobrado em prova):
 *   - 422 com erros de itens de lista: "players.2.nickname"
 *   - 409 de regra de negócio: nome repetido, escola com 2 equipes,
 *     inscrições fechadas depois do chaveamento
 *   - transação (beginTransaction/commit) ao gerar o chaveamento e
 *     ao lançar placar, porque mexem em várias linhas juntas
 *   - o vencedor "anda" sozinho para a próxima partida
 */

declare(strict_types=1);
date_default_timezone_set('America/Sao_Paulo');
require __DIR__ . '/../config.php';

const DATA_TORNEIO = '2026-11-28';    // idade conferida nesta data
const IDADE_MIN = 14;
const IDADE_MAX = 19;
const EQUIPES_NO_CHAVEAMENTO = 8;

/* ---------------- Respostas ---------------- */
function json($dados, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    if ($status !== 204) echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function erro(int $status, string $mensagem, array $erros = []): never
{
    $corpo = ['message' => $mensagem];
    if ($erros) $corpo['errors'] = $erros;
    json($corpo, $status);
}
function corpo(): array
{
    $dados = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($dados)) erro(400, 'Corpo JSON inválido.');
    return $dados;
}

/* ---------------- Banco ---------------- */
function db(): PDO
{
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,   // números voltam como número
        ]);
    }
    return $pdo;
}
/* atalho: executa com parâmetros e devolve o statement */
function q(string $sql, array $p = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($p);
    return $st;
}
function agora(): string { return date('Y-m-d H:i:s'); }

/* ---------------- Autenticação ---------------- */
function exigirOrganizador(): array
{
    $token = preg_replace('/^Bearer\s+/i', '', $_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $org = $token ? q('SELECT o.id, o.name FROM api_tokens t JOIN organizers o ON o.id = t.organizer_id WHERE t.token = ?', [$token])->fetch() : null;
    if (!$org) erro(401, 'Faça login como organizador.');
    return $org;
}

/* ---------------- Montagem das respostas ---------------- */
function idade(string $nascimento): int
{
    return (new DateTimeImmutable($nascimento))->diff(new DateTimeImmutable(DATA_TORNEIO))->y;
}
function chaveamentoExiste(): bool
{
    return (int)q('SELECT COUNT(*) FROM matches')->fetchColumn() > 0;
}

/* Uma consulta para as equipes e uma para os jogadores (nada de consulta
 * dentro de laço: é o "N+1" que deixa a API lenta). */
function equipes(?int $id = null): array
{
    $sql = 'SELECT t.id, t.name, t.tag, t.status, t.seed, t.checked_in_at,
                   s.id AS s_id, s.name AS s_name, s.acronym AS s_acronym, s.city AS s_city, s.color AS s_color
            FROM teams t JOIN schools s ON s.id = t.school_id';
    $p = [];
    if ($id) { $sql .= ' WHERE t.id = ?'; $p[] = $id; }
    $sql .= ' ORDER BY t.checked_in_at IS NULL, t.checked_in_at, t.id';
    $linhas = q($sql, $p)->fetchAll();
    if (!$linhas) return [];

    $ids = array_column($linhas, 'id');
    $marcas = implode(',', array_fill(0, count($ids), '?'));
    $jogadores = q("SELECT id, team_id, nickname, full_name, birth_date, role FROM players WHERE team_id IN ($marcas)
                    ORDER BY FIELD(role, 'captain', 'player', 'substitute'), id", $ids)->fetchAll();
    $porEquipe = [];
    foreach ($jogadores as $j) {
        $j['age'] = idade($j['birth_date']);
        $porEquipe[$j['team_id']][] = $j;
    }
    return array_map(fn($t) => [
        'id' => $t['id'], 'name' => $t['name'], 'tag' => $t['tag'], 'status' => $t['status'],
        'seed' => $t['seed'], 'checked_in_at' => $t['checked_in_at'],
        'school' => ['id' => $t['s_id'], 'name' => $t['s_name'], 'acronym' => $t['s_acronym'], 'city' => $t['s_city'], 'color' => $t['s_color']],
        'players' => $porEquipe[$t['id']] ?? [],
    ], $linhas);
}

function partidas(?int $id = null): array
{
    $sql = 'SELECT m.*, a.name AS a_name, a.tag AS a_tag, sa.color AS a_color, b.name AS b_name, b.tag AS b_tag, sb.color AS b_color
            FROM matches m
            LEFT JOIN teams a ON a.id = m.team_a_id LEFT JOIN schools sa ON sa.id = a.school_id
            LEFT JOIN teams b ON b.id = m.team_b_id LEFT JOIN schools sb ON sb.id = b.school_id';
    $p = [];
    if ($id) { $sql .= ' WHERE m.id = ?'; $p[] = $id; }
    $sql .= " ORDER BY FIELD(m.stage, 'quarterfinal', 'semifinal', 'final'), m.position";
    return array_map(function ($m) {
        $time = fn($l) => $m["team_{$l}_id"] ? ['id' => $m["team_{$l}_id"], 'name' => $m["{$l}_name"], 'tag' => $m["{$l}_tag"], 'color' => $m["{$l}_color"]] : null;
        return [
            'id' => $m['id'], 'stage' => $m['stage'], 'position' => $m['position'],
            'team_a' => $time('a'), 'team_b' => $time('b'),
            'score_a' => $m['score_a'], 'score_b' => $m['score_b'], 'winner_id' => $m['winner_id'],
            'starts_at' => $m['starts_at'], 'next_match_id' => $m['next_match_id'], 'next_slot' => $m['next_slot'],
            // status calculado: waiting = falta equipe; scheduled = pronta; finished = tem vencedor
            'status' => $m['winner_id'] ? 'finished' : (($m['team_a_id'] && $m['team_b_id']) ? 'scheduled' : 'waiting'),
        ];
    }, q($sql, $p)->fetchAll());
}

/* ---------------- Ações ---------------- */
function criarEquipe(): never
{
    $d = corpo();
    $erros = [];
    $nome = trim((string)($d['name'] ?? ''));
    $tag = strtoupper(trim((string)($d['tag'] ?? '')));
    $escola = (int)($d['school_id'] ?? 0);
    $jogadores = $d['players'] ?? null;

    if (mb_strlen($nome) < 3 || mb_strlen($nome) > 40) $erros['name'] = 'O nome da equipe deve ter entre 3 e 40 caracteres.';
    if (!preg_match('/^[A-Z0-9]{2,4}$/', $tag)) $erros['tag'] = 'A tag deve ter de 2 a 4 letras ou números.';
    if (!q('SELECT 1 FROM schools WHERE id = ?', [$escola])->fetch()) $erros['school_id'] = 'Escolha uma escola válida.';

    if (!is_array($jogadores) || !in_array(count($jogadores), [5, 6], true)) {
        $erros['players'] = 'A equipe precisa de 5 titulares e pode ter 1 reserva.';
    } else {
        $papeis = array_count_values(array_map(fn($j) => $j['role'] ?? '', $jogadores));
        if (($papeis['captain'] ?? 0) !== 1) $erros['players'] = 'Escolha exatamente um capitão.';
        elseif (($papeis['substitute'] ?? 0) > 1) $erros['players'] = 'Só pode haver um reserva.';
        elseif (count($jogadores) === 6 && ($papeis['substitute'] ?? 0) !== 1) $erros['players'] = 'O sexto jogador deve ser o reserva.';
        elseif (count($jogadores) === 5 && ($papeis['substitute'] ?? 0) !== 0) $erros['players'] = 'Com 5 jogadores, todos são titulares.';

        $vistos = [];
        foreach (array_values($jogadores) as $i => $j) {
            $nick = trim((string)($j['nickname'] ?? ''));
            $nomeJ = trim((string)($j['full_name'] ?? ''));
            $nasc = (string)($j['birth_date'] ?? '');
            if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $nick)) $erros["players.$i.nickname"] = 'Nick com 3 a 20 letras, números ou _.';
            elseif (isset($vistos[strtolower($nick)])) $erros["players.$i.nickname"] = 'Nick repetido na equipe.';
            $vistos[strtolower($nick)] = true;
            if (mb_strlen($nomeJ) < 5 || !str_contains($nomeJ, ' ')) $erros["players.$i.full_name"] = 'Informe nome e sobrenome.';
            $data = DateTimeImmutable::createFromFormat('!Y-m-d', $nasc);
            if (!$data || $data->format('Y-m-d') !== $nasc) $erros["players.$i.birth_date"] = 'Data de nascimento inválida.';
            elseif (($id = idade($nasc)) < IDADE_MIN || $id > IDADE_MAX) $erros["players.$i.birth_date"] = 'A idade no dia do torneio deve ser de 14 a 19 anos.';
            if (!in_array($j['role'] ?? '', ['captain', 'player', 'substitute'], true)) $erros["players.$i.role"] = 'Função inválida.';
        }
    }
    if ($erros) erro(422, 'Dados inválidos.', $erros);

    // regras de negócio (409) só depois que o formato está certo
    if (chaveamentoExiste()) erro(409, 'Inscrições encerradas: o chaveamento já foi gerado.');
    if (q('SELECT 1 FROM teams WHERE name = ?', [$nome])->fetch()) erro(409, 'Já existe uma equipe com esse nome.');
    if (q('SELECT 1 FROM teams WHERE tag = ?', [$tag])->fetch()) erro(409, 'Já existe uma equipe com essa tag.');
    if ((int)q('SELECT COUNT(*) FROM teams WHERE school_id = ?', [$escola])->fetchColumn() >= 2) erro(409, 'Esta escola já tem 2 equipes inscritas.');
    $nicks = array_map(fn($j) => trim($j['nickname']), $jogadores);
    $marcas = implode(',', array_fill(0, count($nicks), '?'));
    $repetidos = q("SELECT nickname FROM players WHERE nickname IN ($marcas)", $nicks)->fetchAll(PDO::FETCH_COLUMN);
    if ($repetidos) erro(409, 'Nick já inscrito em outra equipe: ' . implode(', ', $repetidos) . '.');

    // equipe + jogadores juntos: ou entra tudo, ou nada
    db()->beginTransaction();
    q('INSERT INTO teams (school_id, name, tag, status, created_at) VALUES (?, ?, ?, ?, ?)', [$escola, $nome, $tag, 'registered', agora()]);
    $id = (int)db()->lastInsertId();
    foreach ($jogadores as $j) {
        q('INSERT INTO players (team_id, nickname, full_name, birth_date, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [$id, trim($j['nickname']), trim($j['full_name']), $j['birth_date'], $j['role'], agora()]);
    }
    db()->commit();
    json(equipes($id)[0], 201);
}

function checkin(int $id): never
{
    exigirOrganizador();
    $t = q('SELECT status FROM teams WHERE id = ?', [$id])->fetch() ?: erro(404, 'Equipe não encontrada.');
    if (chaveamentoExiste()) erro(409, 'O chaveamento já foi gerado.');
    if ($t['status'] === 'confirmed') erro(409, 'Esta equipe já fez check-in.');
    $confirmadas = (int)q("SELECT COUNT(*) FROM teams WHERE status = 'confirmed'")->fetchColumn();
    if ($confirmadas >= EQUIPES_NO_CHAVEAMENTO) erro(409, 'Já há 8 equipes confirmadas. Esta fica na lista de espera.');
    q("UPDATE teams SET status = 'confirmed', checked_in_at = ?, updated_at = ? WHERE id = ?", [agora(), agora(), $id]);
    json(equipes($id)[0]);
}

function excluirEquipe(int $id): never
{
    exigirOrganizador();
    q('SELECT 1 FROM teams WHERE id = ?', [$id])->fetch() ?: erro(404, 'Equipe não encontrada.');
    if (chaveamentoExiste()) erro(409, 'Não é possível excluir depois do chaveamento.');
    q('DELETE FROM teams WHERE id = ?', [$id]);   // jogadores saem juntos (ON DELETE CASCADE)
    json(null, 204);
}

/* Chaveamento de 8: 1×8, 4×5, 2×7, 3×6 (cabeças de chave só se
 * encontram na final). Seed = ordem de check-in. */
function gerarChaveamento(): never
{
    exigirOrganizador();
    if (chaveamentoExiste()) erro(409, 'O chaveamento já foi gerado.');
    $ids = q("SELECT id FROM teams WHERE status = 'confirmed' ORDER BY checked_in_at, id")->fetchAll(PDO::FETCH_COLUMN);
    if (count($ids) !== EQUIPES_NO_CHAVEAMENTO) erro(409, 'São necessárias 8 equipes confirmadas. Há ' . count($ids) . '.');

    db()->beginTransaction();
    foreach ($ids as $i => $id) q('UPDATE teams SET seed = ? WHERE id = ?', [$i + 1, $id]);
    $ins = function ($stage, $pos, $a, $b, $hora, $next, $slot): int {
        q('INSERT INTO matches (stage, position, team_a_id, team_b_id, starts_at, next_match_id, next_slot, created_at) VALUES (?,?,?,?,?,?,?,?)',
          [$stage, $pos, $a, $b, DATA_TORNEIO . " $hora:00", $next, $slot, agora()]);
        return (int)db()->lastInsertId();
    };
    // de trás para frente, para já saber o id da próxima partida
    $final = $ins('final', 1, null, null, '17:00', null, null);
    $semi1 = $ins('semifinal', 1, null, null, '14:00', $final, 'a');
    $semi2 = $ins('semifinal', 2, null, null, '15:00', $final, 'b');
    $s = fn($n) => $ids[$n - 1];
    $ins('quarterfinal', 1, $s(1), $s(8), '09:00', $semi1, 'a');
    $ins('quarterfinal', 2, $s(4), $s(5), '10:00', $semi1, 'b');
    $ins('quarterfinal', 3, $s(2), $s(7), '11:00', $semi2, 'a');
    $ins('quarterfinal', 4, $s(3), $s(6), '12:00', $semi2, 'b');
    db()->commit();
    json(partidas(), 201);
}

function apagarChaveamento(): never
{
    exigirOrganizador();
    if ((int)q('SELECT COUNT(*) FROM matches WHERE winner_id IS NOT NULL')->fetchColumn() > 0) erro(409, 'Já há placar lançado: o chaveamento não pode ser desfeito.');
    db()->beginTransaction();
    q('UPDATE matches SET next_match_id = NULL');
    q('DELETE FROM matches');
    q('UPDATE teams SET seed = NULL');
    db()->commit();
    json(null, 204);
}

/* Melhor de 3: resultados possíveis 2×0, 2×1, 1×2, 0×2. */
function lancarPlacar(int $id): never
{
    exigirOrganizador();
    $m = q('SELECT * FROM matches WHERE id = ?', [$id])->fetch() ?: erro(404, 'Partida não encontrada.');
    $d = corpo();
    $a = $d['score_a'] ?? null; $b = $d['score_b'] ?? null;
    if (!is_int($a) || !is_int($b) || !in_array([$a, $b], [[2, 0], [2, 1], [1, 2], [0, 2]], true)) {
        erro(422, 'Dados inválidos.', ['score' => 'Melhor de 3: o placar deve ser 2×0, 2×1, 1×2 ou 0×2.']);
    }
    if (!$m['team_a_id'] || !$m['team_b_id']) erro(409, 'A partida ainda não tem as duas equipes definidas.');
    // corrigir placar só enquanto a próxima partida não foi jogada
    if ($m['next_match_id'] && q('SELECT winner_id FROM matches WHERE id = ?', [$m['next_match_id']])->fetchColumn()) {
        erro(409, 'A próxima partida já tem resultado: este placar não pode mais mudar.');
    }
    $vencedor = $a > $b ? $m['team_a_id'] : $m['team_b_id'];

    db()->beginTransaction();
    q('UPDATE matches SET score_a = ?, score_b = ?, winner_id = ?, updated_at = ? WHERE id = ?', [$a, $b, $vencedor, agora(), $id]);
    if ($m['next_match_id']) {
        // o vencedor ocupa o lado (a ou b) reservado para ele na próxima partida
        $col = $m['next_slot'] === 'a' ? 'team_a_id' : 'team_b_id';
        q("UPDATE matches SET $col = ?, updated_at = ? WHERE id = ?", [$vencedor, agora(), $m['next_match_id']]);
    }
    db()->commit();
    json(partidas());
}

function login(): never
{
    $d = corpo();
    $o = q('SELECT id, name, password FROM organizers WHERE username = ?', [(string)($d['username'] ?? '')])->fetch();
    if (!$o || !password_verify((string)($d['password'] ?? ''), $o['password'])) erro(401, 'Usuário ou senha incorretos.');
    $token = bin2hex(random_bytes(20));
    q('INSERT INTO api_tokens (organizer_id, token, created_at) VALUES (?, ?, ?)', [$o['id'], $token, agora()]);
    json(['token' => $token, 'name' => $o['name']]);
}

/* ---------------- Roteador ---------------- */
$rota = trim($_GET['rota'] ?? '', '/');
$metodo = $_SERVER['REQUEST_METHOD'];
$rotas = [
    ['GET',    '#^schools$#',               fn() => json(q('SELECT id, name, acronym, city, color FROM schools ORDER BY name')->fetchAll())],
    ['GET',    '#^teams$#',                 fn() => json(equipes())],
    ['POST',   '#^teams$#',                 fn() => criarEquipe()],
    ['GET',    '#^teams/(\d+)$#',           fn($id) => json(equipes((int)$id)[0] ?? erro(404, 'Equipe não encontrada.'))],
    ['DELETE', '#^teams/(\d+)$#',           fn($id) => excluirEquipe((int)$id)],
    ['POST',   '#^teams/(\d+)/check-in$#',  fn($id) => checkin((int)$id)],
    ['GET',    '#^matches$#',               fn() => json(partidas())],
    ['POST',   '#^bracket$#',               fn() => gerarChaveamento()],
    ['DELETE', '#^bracket$#',               fn() => apagarChaveamento()],
    ['PATCH',  '#^matches/(\d+)/score$#',   fn($id) => lancarPlacar((int)$id)],
    ['POST',   '#^login$#',                 fn() => login()],
];
try {
    $achou = false;
    foreach ($rotas as [$m, $padrao, $acao]) {
        if (preg_match($padrao, $rota, $p)) {
            $achou = true;
            if ($m === $metodo) $acao(...array_slice($p, 1));
        }
    }
    $achou ? erro(405, 'Método não permitido.') : erro(404, 'Rota não encontrada.');
} catch (PDOException $e) {
    if (db()->inTransaction()) db()->rollBack();
    error_log($e->getMessage());      // detalhe só no log do servidor, nunca na resposta
    erro(500, 'Erro no banco de dados.');
}
