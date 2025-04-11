<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$testCodes = [
    'INS0010310',  // Format actuel
    'INS010310',   // Sans le deuxième 0
    'INS001031',   // 6 chiffres
    'INS000123'    // Format avec padding
];

foreach ($testCodes as $code) {
    echo "Test du code: $code\n";
    echo "Longueur: " . strlen($code) . " caractères\n";
    echo "Format INS0 + 5 chiffres: " . (preg_match('/^INS0\d{5}$/', $code) ? 'Oui' : 'Non') . "\n";
    echo "Format INS + 6 chiffres: " . (preg_match('/^INS\d{6}$/', $code) ? 'Oui' : 'Non') . "\n";
    echo "Format INS0 + nombre quelconque: " . (preg_match('/^INS0\d+$/', $code) ? 'Oui' : 'Non') . "\n";
    echo "\n";
}
