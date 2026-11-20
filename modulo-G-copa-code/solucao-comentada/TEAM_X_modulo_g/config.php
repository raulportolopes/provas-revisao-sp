<?php
/* Configuração do banco. No XAMPP o padrão é usuário root sem senha.
 * Fora do XAMPP, troque aqui (ou defina as variáveis de ambiente). */
define('DB_DSN',  getenv('COPA_DB_DSN')  ?: 'mysql:host=localhost;dbname=copacode;charset=utf8mb4');
define('DB_USER', getenv('COPA_DB_USER') ?: 'root');
define('DB_PASS', getenv('COPA_DB_PASS') !== false ? getenv('COPA_DB_PASS') : '');
