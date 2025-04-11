<?php
// config.php

return [
    'company' => [
        'domain' => 'garychartrand',
        'url' => 'https://garychartrand.progressionlive.com'
    ],
    'auth' => [
        'username' => 'pierre@garychartrand.com',
        'password' => 'A11gdb333!',
        'device_id' => 'TEST_DEVICE',
        'client_version' => '1.0'
    ],
    'soap' => [
        'options' => [
            'trace' => true,             // Active le traçage des requêtes
            'exceptions' => true,         // Active la gestion des exceptions
            'cache_wsdl' => WSDL_CACHE_NONE,  // Désactive le cache WSDL en développement
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ])
        ]
    ],
    'logging' => [
        'enabled' => true,
        'file' => __DIR__ . '/logs/progression.log'  // Chemin vers le fichier de log
    ],
    // Ajoutez d'autres configurations si nécessaire
    'api' => [
        'timeout' => 30,  // Timeout en secondes
        'max_retries' => 3  // Nombre maximum de tentatives
    ]
];