<?php
// config.example.php - Exemple de configuration (copier vers config.php)

return [
    'company' => [
        'domain' => 'votredomaine',
        'url' => 'https://votredomaine.progressionlive.com'
    ],
    'auth' => [
        'username' => '', // Sera rempli par l'interface utilisateur
        'password' => '', // Sera rempli par l'interface utilisateur
        'device_id' => 'CALENDAR_APP',
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
    'api' => [
        'timeout' => 30,  // Timeout en secondes
        'max_retries' => 3  // Nombre maximum de tentatives
    ]
];