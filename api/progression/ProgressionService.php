<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/ProgressionWebServiceV2/autoload.php';
require_once __DIR__ . '/ProgressionWebServiceV2/Utils.php';

use ProgressionWebService\ArrayOfProperty;
use ProgressionWebService\Credentials;
use ProgressionWebService\LoginRequest;
use ProgressionWebService\ProgressionPortType;
use ProgressionWebService\Property;
use ProgressionWebService\RecordType;
use ProgressionWebService\SearchRecordsRequest;
use ProgressionWebService\GetRecordRequest;

class ProgressionService {
    private $config;
    private $service;
    private $credentials;

    public function __construct() {
        $this->config = require 'config.php';
        $this->initializeService();
    }

    private function log($message, $context = []) {
        $logMessage = sprintf(
            "[%s] %s - %s\n",
            date('Y-m-d H:i:s'),
            $message,
            json_encode($context, JSON_UNESCAPED_UNICODE)
        );
        error_log($logMessage, 3, __DIR__ . '/logs/progression.log');
    }

    private function initializeService() {
        try {
            $baseUrl = $this->config['company']['url'];
            $serviceUrl = $baseUrl . '/server/ws/v2/ProgressionWebService';
            $wsdlUrl = $serviceUrl . '?wsdl';

            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ]);

            $options = [
                'trace' => true,
                'exceptions' => true,
                'cache_wsdl' => WSDL_CACHE_NONE,
                'stream_context' => $context
            ];

            $this->service = new ProgressionPortType($options, $wsdlUrl);
            $this->service->__setLocation($serviceUrl);

        } catch (Exception $e) {
            $this->log('Erreur initialisation service', ['error' => $e->getMessage()]);
            throw new Exception('Erreur lors de l\'initialisation du service: ' . $e->getMessage());
        }
    }

    public function connect() {
        try {
            $this->log('Tentative de connexion');
            
            $credentials = new Credentials();
            $credentials->setUsername($this->config['auth']['username']);
            $credentials->setPassword($this->config['auth']['password']);
            $credentials->setDeviceId($this->config['auth']['device_id']);
            $credentials->setClientVersion($this->config['auth']['client_version']);

            $loginRequest = new LoginRequest($credentials);
            $loginResponse = $this->service->Login($loginRequest);
            
            if (!$loginResponse || !$loginResponse->getCredentials()) {
                throw new Exception('Échec de l\'authentification');
            }

            $this->credentials = $loginResponse->getCredentials();
            $this->log('Connexion réussie');
            
            return true;

        } catch (Exception $e) {
            $this->log('Erreur de connexion', ['error' => $e->getMessage()]);
            throw new Exception('Erreur de connexion: ' . $e->getMessage());
        }
    }

    public function getTaskByCode($code) {
        try {
            if (!$this->credentials) {
                $this->connect();
            }

            $searchRequest = new SearchRecordsRequest();
            $searchRequest->setCredentials($this->credentials);
            $searchRequest->setRecordType(RecordType::TASK);
            $searchRequest->setQuery('code = :code');
            
            $property = new Property();
            $property->setName('code');
            $property->setValue(new \SoapVar($code, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema'));
            
            $properties = new ArrayOfProperty();
            $properties->setProperty([$property]);
            $searchRequest->setParameters($properties);

            $this->log('Recherche de tâche', ['code' => $code]);
            $response = $this->service->SearchRecords($searchRequest);

            if (!$response || !$response->getRecords() || !$response->getRecords()->getRecord()) {
                throw new Exception('Aucune tâche trouvée');
            }

            $task = $response->getRecords()->getRecord()[0];
            return $this->formatTaskData($task);

        } catch (Exception $e) {
            $this->log('Erreur lors de la recherche', ['error' => $e->getMessage(), 'code' => $code]);
            throw new Exception('Erreur lors de la recherche de la tâche: ' . $e->getMessage());
        }
    }

    private function getQuoteAmount($quoteNumber) {
        try {
            $searchRequest = new SearchRecordsRequest();
            $searchRequest->setCredentials($this->credentials);
            $searchRequest->setRecordType(RecordType::TASK);
            $searchRequest->setQuery('code = :code');
            
            $property = new Property();
            $property->setName('code');
            $property->setValue(new \SoapVar($quoteNumber, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema'));
            
            $properties = new ArrayOfProperty();
            $properties->setProperty([$property]);
            $searchRequest->setParameters($properties);

            $this->log('Recherche soumission', ['quote_number' => $quoteNumber]);
            $response = $this->service->SearchRecords($searchRequest);

            if ($response && $response->getRecords() && $response->getRecords()->getRecord()) {
                $quote = $response->getRecords()->getRecord()[0];
                $logContext = ['quote_number' => $quoteNumber];
                $finalAmount = null;

                // Essayer d'accéder au TaskItemList
                if (method_exists($quote, 'getTaskItemList')) {
                    $taskItemList = $quote->getTaskItemList();
                    
                    if ($taskItemList) {
                        // Tentative 1: Accéder directement au Total du TaskItemList
                        if (method_exists($taskItemList, 'getTotal') && is_numeric($taskItemList->getTotal())) {
                            $finalAmount = floatval($taskItemList->getTotal());
                            $logContext['source'] = 'TaskItemList->getTotal()';
                            $logContext['total'] = $finalAmount;
                        } else {
                            // Tentative 2 (si Total échoue): Calculer depuis SubTotal et TaxAmounts du TaskItemList
                            $logContext['getTotal_failed'] = true;
                            $subTotal = null;
                            $taxSum = 0;

                            if (method_exists($taskItemList, 'getSubTotal') && is_numeric($taskItemList->getSubTotal())) {
                                $subTotal = floatval($taskItemList->getSubTotal());
                                $logContext['subTotal'] = $subTotal;
                            } else {
                                $logContext['subTotal_error'] = 'Non trouvé/numérique sur TaskItemList';
                            }

                            if ($subTotal !== null && method_exists($taskItemList, 'getTaxAmounts')) {
                                $taxAmountsObj = $taskItemList->getTaxAmounts();
                                $taxes = null;
                                if ($taxAmountsObj && method_exists($taxAmountsObj, 'getRecord')) {
                                    $taxes = $taxAmountsObj->getRecord();
                                } elseif ($taxAmountsObj && isset($taxAmountsObj->Record)) {
                                    $taxes = $taxAmountsObj->Record;
                                }

                                if (is_array($taxes)) {
                                    $logContext['taxes_found_count'] = count($taxes);
                                    foreach ($taxes as $tax) {
                                        if ($tax && method_exists($tax, 'getAmount') && is_numeric($tax->getAmount())) {
                                            $taxSum += floatval($tax->getAmount());
                                        } else {
                                            $logContext['tax_amount_error'] = 'Taxe invalide/montant non trouvé/numérique';
                                            $taxSum = null; break;
                                        }
                                    }
                                } elseif (!empty($taxes)) { // Cas taxe unique
                                     if ($taxes && method_exists($taxes, 'getAmount') && is_numeric($taxes->getAmount())) {
                                          $taxSum = floatval($taxes->getAmount());
                                          $logContext['single_tax_amount'] = $taxSum;
                                     } else {
                                         $logContext['tax_amount_error'] = 'Taxe unique invalide'; $taxSum = null;
                                     }
                                } else {
                                    $logContext['taxes_error'] = 'Aucun tableau de taxes trouvé dans TaxAmounts';
                                    // Si pas de taxes trouvées, la somme est 0 (pas null)
                                }
                            } else {
                                $logContext['taxes_error'] = 'SubTotal manquant ou getTaxAmounts inexistant sur TaskItemList';
                                $taxSum = null;
                            }

                            if ($subTotal !== null && $taxSum !== null) {
                                $finalAmount = round($subTotal + $taxSum, 2);
                                $logContext['source'] = 'Calculé depuis TaskItemList SubTotal+Taxes';
                                $logContext['calculated_total'] = $finalAmount;
                            }
                        }
                    } else {
                        $logContext['taskItemList_error'] = 'TaskItemList est null ou vide';
                    }
                } else {
                    $logContext['taskItemList_error'] = 'Méthode getTaskItemList non trouvée sur Task';
                }

                $this->log('Tentative récupération montant depuis TaskItemList', $logContext);

                if ($finalAmount !== null) {
                    return $finalAmount;
                }
            }
            // Si la soumission n'est pas trouvée ou si le calcul échoue
            $this->log('Soumission non trouvée ou montant non récupéré depuis la soumission', ['quote_number' => $quoteNumber]);
            return null;
        } catch (Exception $e) {
            $this->log('Erreur recherche soumission', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function formatTaskData($task) {
        try {
            $data = [
                'client_name' => null,
                'phone' => null,
                'address' => null,
                'city' => null,
                'Sommaire' => $task->getSummary(),
                'Description' => str_replace('\n', "\n", $task->getDescription()),
                'task_code' => $task->getCode(),
                'amount' => null,
                'quote_number' => null,
                'representative' => null,
                'status' => null
            ];

            // Gestion du statut
            $taskState = $task->getCurrentState();
            if ($taskState) {
                $data['status'] = $taskState->getLogicId();
                $this->log('Statut trouvé', [
                    'task_code' => $task->getCode(),
                    'status' => $data['status']
                ]);
            }

            // Gestion des adresses
            $address = $task->getNodeAddress() ?? $task->getClientAddress();
            if ($address) {
                $data['address'] = $address->getAddress();
                $data['city'] = $address->getCity();
                $data['phone'] = $address->getPhone();
            }

            // Information du client
            if ($task->getClientRef()) {
                $data['client_name'] = $task->getClientRef()->getLabel();
            }

            // Propriétés personnalisées de la tâche
            if ($task->getProperties()) {
                $this->log('Début analyse des propriétés pour ' . $task->getCode(), [
                    'task_id' => $task->getCode()
                ]);

                foreach ($task->getProperties()->getProperty() as $prop) {
                    $name = trim(strtolower($prop->getName()));
                    $value = $prop->getValue();
                    
                    // Log détaillé pour chaque propriété
                    $this->log('Propriété trouvée', [
                        'task_code' => $task->getCode(),
                        'name' => $name,
                        'value' => $value,
                        'type' => gettype($value),
                        'raw' => var_export($value, true)
                    ]);

                    switch ($name) {
                        case 'info.po':
                            $data['quote_number'] = $value;
                            $this->log('Quote number trouvé', [
                                'task_code' => $task->getCode(),
                                'value' => $value
                            ]);
                            break;
                        case 'info.deposit':
                        case 'info.total':
                        case 'soumission.montant':
                        case 'soumission.total':
                            if (is_numeric($value)) {
                                $data['amount'] = floatval($value);
                                $this->log('Montant trouvé dans la tâche', [
                                    'task_code' => $task->getCode(),
                                    'amount' => $data['amount']
                                ]);
                            }
                            break;
                        case 'soumission.rep':
                            $data['representative'] = $value;
                            $this->log('Représentant trouvé', [
                                'task_code' => $task->getCode(),
                                'value' => $value
                            ]);
                            break;
                    }
                }
                
                $this->log('Fin analyse des propriétés', [
                    'task_code' => $task->getCode(),
                    'amount_final' => $data['amount']
                ]);
            }

            // Recherche du montant dans la soumission si non trouvé
            if ($data['amount'] === null && $data['quote_number']) {
                $data['amount'] = $this->getQuoteAmount($data['quote_number']);
                $this->log('Montant récupéré depuis la soumission', [
                    'task_code' => $task->getCode(),
                    'quote_number' => $data['quote_number'],
                    'amount' => $data['amount']
                ]);
            }

            // Log final des données
            $this->log('Données formatées', [
                'task_code' => $task->getCode(),
                'data' => $data
            ]);

            return $data;

        } catch (Exception $e) {
            $this->log('Erreur lors du formatage des données', [
                'task_code' => $task->getCode(),
                'error' => $e->getMessage()
            ]);
            throw new Exception('Erreur lors du formatage des données: ' . $e->getMessage());
        }
    }

    public function testConnection() {
        try {
            $this->log('Test de connexion...');
            
            if (!file_exists(__DIR__ . '/ProgressionWebServiceV2/autoload.php')) {
                throw new Exception('Fichier autoload.php manquant');
            }

            return $this->connect();
            
        } catch (Exception $e) {
            $this->log('Erreur de test de connexion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    // --- AJOUT DES MÉTHODES PUBLIQUES --- 
    public function getCredentials() {
        return $this->credentials;
    }

    public function getSoapService() {
        return $this->service; // Retourne l'instance de ProgressionPortType (SoapClient)
    }
    // --- FIN AJOUT --- 
}
?>