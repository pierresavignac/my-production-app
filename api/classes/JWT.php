<?php
class JWT {
    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        error_log('Décodage base64Url de: ' . $data);
        $pad = strlen($data) % 4;
        if ($pad) {
            $data .= str_repeat('=', 4 - $pad);
        }
        $decoded = base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
        if ($decoded === false) {
            throw new Exception('Échec du décodage base64');
        }
        return $decoded;
    }

    public static function encode($payload, $secret) {
        error_log('Encodage du payload: ' . print_r($payload, true));
        
        // Header
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);

        // Prepare segments
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        error_log('Header encodé: ' . $headerEncoded);
        error_log('Payload encodé: ' . $payloadEncoded);
        
        // Create signature
        $signature = hash_hmac('sha256', 
            $headerEncoded . "." . $payloadEncoded, 
            $secret, 
            true
        );
        $signatureEncoded = self::base64UrlEncode($signature);
        
        error_log('Signature encodée: ' . $signatureEncoded);

        // Create JWT
        $token = $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
        error_log('Token généré: ' . $token);
        return $token;
    }

    public static function decode($token, $secret) {
        error_log('Décodage du token: ' . $token);
        
        // Split token
        $parts = explode('.', $token);
        if (count($parts) != 3) {
            throw new Exception('Format de token invalide - nombre de parties incorrect');
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        error_log('Header encodé: ' . $headerEncoded);
        error_log('Payload encodé: ' . $payloadEncoded);
        error_log('Signature encodée: ' . $signatureEncoded);

        try {
            // Decode header
            $header = json_decode(self::base64UrlDecode($headerEncoded), true);
            if (!$header) {
                throw new Exception('Header invalide');
            }
            error_log('Header décodé: ' . print_r($header, true));

            // Verify algorithm
            if (!isset($header['alg']) || $header['alg'] !== 'HS256') {
                throw new Exception('Algorithme non supporté');
            }

            // Verify signature
            $signature = self::base64UrlDecode($signatureEncoded);
            $expectedSignature = hash_hmac('sha256', 
                $headerEncoded . "." . $payloadEncoded, 
                $secret, 
                true
            );

            if (!hash_equals($signature, $expectedSignature)) {
                error_log('Signature attendue: ' . bin2hex($expectedSignature));
                error_log('Signature reçue: ' . bin2hex($signature));
                throw new Exception('Signature invalide');
            }

            // Decode payload
            $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
            if (!$payload) {
                throw new Exception('Payload invalide');
            }
            error_log('Payload décodé: ' . print_r($payload, true));
            
            // Verify expiration
            if (isset($payload['exp'])) {
                error_log('Expiration: ' . date('Y-m-d H:i:s', $payload['exp']));
                error_log('Heure actuelle: ' . date('Y-m-d H:i:s', time()));
                
                if ($payload['exp'] < time()) {
                    throw new Exception('Token expiré');
                }
            }

            return $payload;
        } catch (Exception $e) {
            error_log('Erreur lors du décodage du token: ' . $e->getMessage());
            throw $e;
        }
    }
} 