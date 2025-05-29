# Résolution du problème de connexion ProgressionLive
Date: 27 Mai 2025

## Problème
Vous n'arrivez plus à vous connecter à ProgressionLive avec les identifiants :
- Domaine : garychartrand
- Email : pierre@garychartrand.com

## Fichiers restaurés depuis Calendrier-Claude-code

J'ai copié les fichiers nécessaires :
1. ✅ `progression_login.php` - Script de connexion principal
2. ✅ `config.example.php` - Template de configuration
3. ✅ Le dossier `ProgressionWebServiceV2` était déjà présent

## Solutions possibles

### 1. Vérifier le mot de passe
Le mot de passe configuré actuellement est : **A11gdb333!**

Si ce n'est pas le bon mot de passe :
1. Ouvrez : http://localhost:5174/update-progression-password.php
2. Entrez le nouveau mot de passe
3. Cliquez sur "Mettre à jour"

### 2. Tester la connexion
Ouvrez : http://localhost:5174/test-progression-connection.php

Ce script va :
- Afficher la configuration actuelle
- Tester l'accès au service ProgressionLive
- Tenter une connexion
- Afficher les erreurs détaillées

### 3. Vider le cache du navigateur
Dans l'application React, le cache peut parfois poser problème :
1. Ouvrez les outils de développement (F12)
2. Console JavaScript
3. Tapez : `localStorage.removeItem('progressionUser')`
4. Rechargez la page

### 4. Vérifier les logs
Les logs de connexion sont dans :
- `/api/progression/logs/progression.log`
- `/api/logs/progression_login.log`

### 5. Si le problème persiste

Vérifiez que :
1. Le domaine est correct : `garychartrand` (sans .progressionlive.com)
2. L'email est correct : `pierre@garychartrand.com`
3. Le mot de passe est correct

## Structure des fichiers de connexion

```
api/
├── progression_login.php        # Endpoint de connexion
├── progression/
│   ├── config.php              # Configuration actuelle
│   ├── config.example.php      # Template
│   ├── ProgressionWebServiceV2/
│   │   └── autoload.php        # Autoloader des classes
│   └── logs/
│       └── progression_login.log
```

## Flux de connexion

1. Le formulaire React envoie les credentials à `/api/progression_login.php`
2. Le script PHP vérifie les credentials avec ProgressionLive
3. Si succès, sauvegarde la configuration et retourne un token
4. Le frontend stocke le token dans localStorage

## Actions recommandées

1. **Testez d'abord** avec le script : http://localhost:5174/test-progression-connection.php
2. **Si échec**, mettez à jour le mot de passe : http://localhost:5174/update-progression-password.php
3. **Videz le cache** du navigateur si nécessaire
4. **Vérifiez les logs** pour plus de détails

Le système de connexion a été entièrement restauré depuis Calendrier-Claude-code.
