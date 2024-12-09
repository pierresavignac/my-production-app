<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$config = require_once __DIR__ . '/config.php';
$wsdlUrl = "https://{$config['company_domain']}.progressionlive.com/server/ws/v2/ProgressionWebService?wsdl";

echo "Téléchargement du WSDL depuis: $wsdlUrl\n";
$wsdlContent = file_get_contents($wsdlUrl);

if ($wsdlContent === false) {
    die("Impossible de télécharger le WSDL\n");
}

echo "\nAnalyse du WSDL...\n";
$xml = new SimpleXMLElement($wsdlContent);
$xml->registerXPathNamespace('wsdl', 'http://schemas.xmlsoap.org/wsdl/');
$xml->registerXPathNamespace('xs', 'http://www.w3.org/2001/XMLSchema');

// Chercher la définition du type Login
$loginElements = $xml->xpath('//xs:element[@name="Login"]');
if (!empty($loginElements)) {
    echo "\nStructure de Login trouvée:\n";
    print_r($loginElements);
}

// Chercher la définition des credentials
$credentialsElements = $xml->xpath('//xs:complexType[@name="Credentials"]');
if (!empty($credentialsElements)) {
    echo "\nStructure des Credentials trouvée:\n";
    print_r($credentialsElements);
}

?>
