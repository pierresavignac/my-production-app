<?php
// config.php - Généré automatiquement

return array (
  'company' => 
  array (
    'domain' => 'garychartrand',
    'url' => 'https://garychartrand.progressionlive.com',
  ),
  'auth' => 
  array (
    'username' => 'pierre@garychartrand.com',
    'password' => 'A11gdb333!',
    'device_id' => 'CALENDAR_APP',
    'client_version' => '1.0',
  ),
  'soap' => 
  array (
    'options' => 
    array (
      'trace' => true,
      'exceptions' => true,
      'cache_wsdl' => 0,
      'stream_context' => NULL,
    ),
  ),
  'logging' => 
  array (
    'enabled' => true,
    'file' => '/Users/pierresavignac/Documents/PROGRAMMES/Calendar/my-production-app/api/progression/logs/progression.log',
  ),
  'api' => 
  array (
    'timeout' => 30,
    'max_retries' => 3,
  ),
);