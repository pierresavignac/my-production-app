<?php
class ProgressionHelper {
    private static function getPropertyValue($record, $propertyName) {
        if ($record && $record->getProperties()) {
            foreach ($record->getProperties()->getProperty() as $prop) {
                if ($prop->getName() === $propertyName) {
                    return $prop->getValue();
                }
            }
        }
        return null;
    }
} 