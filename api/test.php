<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'ok',
    'message' => 'API fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_dir' => __DIR__,
    'php_version' => phpversion()
]);
