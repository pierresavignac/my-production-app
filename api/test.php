<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$response = [
    'status' => 'success',
    'message' => 'L\'API fonctionne correctement !',
    'php_version' => PHP_VERSION,
    'extensions' => [
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
        'mysqli' => extension_loaded('mysqli')
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); 