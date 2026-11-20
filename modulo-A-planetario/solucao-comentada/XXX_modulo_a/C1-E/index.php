<?php
/* =====================================================================
   C1-E · Conversor de registros de observação (CSV brasileiro → JSON)
   Armadilhas da tarefa:
   - o arquivo vem do Excel: separador ";" e BOM UTF-8 no começo
     (o BOM gruda na primeira chave: "\u{FEFF}data" em vez de "data");
   - números com vírgula decimal ("4,5") viram número 4.5;
   - datas dd/mm/aaaa viram AAAA-MM-DD; data que não existe vai para errors;
   - linhas em branco são ignoradas, mas a numeração de linha continua.
   ===================================================================== */

header('Content-Type: application/json; charset=utf-8');

function responder(int $status, $corpo): void {
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

/* ---------- Roteamento relativo à pasta da tarefa ---------- */
$base   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rota   = '/' . trim(substr($path, strlen($base)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

if ($rota !== '/convert') responder(404, ['error' => 'Not found']);
if ($metodo !== 'POST')   responder(405, ['error' => 'Method not allowed']);

/* ---------- 1. Arquivo enviado? ---------- */
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    responder(400, ['error' => 'No file uploaded']);
}

/* ---------- 2. É CSV? (pela extensão do nome original) ---------- */
$nome = $_FILES['file']['name'];
if (strtolower(pathinfo($nome, PATHINFO_EXTENSION)) !== 'csv') {
    responder(415, ['error' => 'Invalid file type']);
}

/* ---------- 3. Ler e limpar ---------- */
$texto = file_get_contents($_FILES['file']['tmp_name']);
$texto = preg_replace('/^\xEF\xBB\xBF/', '', $texto);        // tira o BOM
$linhas = preg_split('/\r\n|\n|\r/', $texto);                  // Windows ou Linux

// acha o cabeçalho (primeira linha não vazia)
$numCab = null;
foreach ($linhas as $i => $l) {
    if (trim($l) !== '') { $numCab = $i; break; }
}
if ($numCab === null) responder(422, ['error' => 'Empty file']);

$chaves = array_map('trim', str_getcsv($linhas[$numCab], ';'));

/* ---------- 4. Converter um valor ---------- */
// devolve [valor convertido, erro ou null]
function converter(string $v): array {
    $v = trim($v);
    // dd/mm/aaaa → AAAA-MM-DD (checkdate recusa 31/04 e 29/02 de ano comum)
    if (preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', $v, $m)) {
        if (!checkdate((int)$m[2], (int)$m[1], (int)$m[3])) return [null, 'Invalid date'];
        return ["$m[3]-$m[2]-$m[1]", null];
    }
    // inteiro (sem zero à esquerda, para não estragar códigos como "007")
    if (preg_match('/^-?(0|[1-9]\d*)$/', $v)) return [(int)$v, null];
    // decimal com vírgula: "4,5" → 4.5
    if (preg_match('/^-?(0|[1-9]\d*),\d+$/', $v)) return [(float)str_replace(',', '.', $v), null];
    return [$v, null];
}

/* ---------- 5. Percorrer as linhas de dados ---------- */
$dados = [];
$erros = [];
for ($i = $numCab + 1; $i < count($linhas); $i++) {
    if (trim($linhas[$i]) === '') continue;                    // linha em branco: ignora
    $numLinha = $i + 1;                                         // numeração do arquivo (começa em 1)
    $valores = str_getcsv($linhas[$i], ';');

    if (count($valores) !== count($chaves)) {
        $erros[] = ['line' => $numLinha, 'error' => 'Wrong number of columns'];
        continue;
    }

    $obj = [];
    $erroLinha = null;
    foreach ($chaves as $k => $chave) {
        [$valor, $erro] = converter($valores[$k]);
        if ($erro) { $erroLinha = $erro; break; }
        $obj[$chave] = $valor;
    }
    if ($erroLinha) { $erros[] = ['line' => $numLinha, 'error' => $erroLinha]; continue; }
    $dados[] = $obj;
}

if (!$dados && !$erros) responder(422, ['error' => 'Empty file']);

responder(200, ['total' => count($dados), 'data' => $dados, 'errors' => $erros]);
