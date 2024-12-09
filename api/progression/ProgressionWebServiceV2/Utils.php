<?php

namespace ProgressionWebService;

class Utils {
    /**
     * Convertit une date en format DateTime
     */
    public static function toDateTime($date) {
        if ($date instanceof \DateTime) {
            return $date;
        }
        if (is_string($date)) {
            return new \DateTime($date);
        }
        return null;
    }

    /**
     * Crée une SoapVar pour les paramètres de type string
     */
    public static function createStringParam($value) {
        return new \SoapVar($value, XSD_STRING, 'string', 'http://www.w3.org/2001/XMLSchema');
    }

    /**
     * Crée une SoapVar pour les paramètres de type integer
     */
    public static function createIntParam($value) {
        return new \SoapVar($value, XSD_INTEGER, 'integer', 'http://www.w3.org/2001/XMLSchema');
    }

    /**
     * Crée une SoapVar pour les paramètres de type float
     */
    public static function createFloatParam($value) {
        return new \SoapVar($value, XSD_FLOAT, 'float', 'http://www.w3.org/2001/XMLSchema');
    }

    /**
     * Crée une SoapVar pour les paramètres de type boolean
     */
    public static function createBoolParam($value) {
        return new \SoapVar($value, XSD_BOOLEAN, 'boolean', 'http://www.w3.org/2001/XMLSchema');
    }

    /**
     * Formate une réponse de tâche en format standard
     */
    public static function formatTaskResponse($record) {
        if (!$record) {
            return null;
        }

        return [
            'code' => $record->getCode(),
            'summary' => $record->getSummary(),
            'description' => $record->getDescription(),
            'date' => $record->getRv(),
            'client' => [
                'name' => $record->getClientRef() ? $record->getClientRef()->getLabel() : null,
                'phone' => $record->getClientAddress() ? $record->getClientAddress()->getPhone() : null,
                'adresse' => $record->getClientAddress() ? $record->getClientAddress()->getAddress() : null,
                'ville' => $record->getClientAddress() ? $record->getClientAddress()->getCity() : null,
                'province' => $record->getClientAddress() ? $record->getClientAddress()->getProvince() : null,
                'code_postal' => $record->getClientAddress() ? $record->getClientAddress()->getPostalCode() : null
            ],
            'installation' => $record->getNodeAddress() ? self::addressToArray($record->getNodeAddress()) : null,
            'task' => [
                'id' => $record->getId(),
                'title' => $record->getSummary(),
                'description' => $record->getDescription(),
                'price' => $record->getTaskItemList() ? $record->getTaskItemList()->getTotal() : null
            ]
        ];
    }

    /**
     * Convertit un objet Properties en tableau associatif
     */
    public static function propertiesToArray($properties) {
        if (!$properties) {
            return [];
        }

        $result = [];
        $props = $properties->getProperty();

        if (!$props) {
            return [];
        }

        if (is_array($props)) {
            foreach ($props as $prop) {
                $result[$prop->getName()] = $prop->getValue();
            }
        } else {
            $result[$props->getName()] = $props->getValue();
        }

        return $result;
    }

    /**
     * Convertit un objet Address en tableau associatif
     */
    public static function addressToArray($address) {
        if (!$address) {
            return [];
        }

        return [
            'nom' => $address->getAddress(),  // On utilise l'adresse comme nom par défaut
            'telephone' => $address->getPhone(),
            'adresse' => $address->getAddress(),
            'ville' => $address->getCity(),
            'province' => $address->getProvince(),
            'code_postal' => $address->getPostalCode()
        ];
    }

    /**
     * Récupère une propriété personnalisée d'une tâche
     */
    private static function getCustomProperty($task, $propertyName) {
        if (!$task->getProperties() || !$task->getProperties()->getProperty()) {
            return null;
        }

        foreach ($task->getProperties()->getProperty() as $property) {
            if ($property->getName() === $propertyName) {
                return $property->getValue();
            }
        }

        return null;
    }
}

?>