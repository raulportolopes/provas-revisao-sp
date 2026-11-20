<?php
// Roteador só para testar com "php -S" (imita o .htaccess do Apache).
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$doc = $_SERVER['DOCUMENT_ROOT'];
if (preg_match('#^(/[^/]+/C\d-[EMH])(/.*)?$#', $path, $m)) {
    $f = $doc . $path;
    if ($path !== $m[1] . '/' && is_file($f)) return false;
    if (($m[2] ?? '') === '' || $m[2] === '/') { if (is_file($doc . $m[1] . '/README.md') && !is_file($doc.$m[1].'/index.html')) { /* segue para index.php */ } }
    $_SERVER['SCRIPT_NAME'] = $m[1] . '/index.php';
    chdir($doc . $m[1]);
    require $doc . $m[1] . '/index.php';
    return true;
}
return false;
