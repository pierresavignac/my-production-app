# Restauration des fichiers ProgressionLive
Date: 27 Mai 2025

## Problème
La section "Fichiers liés à l'installation" ne se remplissait pas dans le modal d'ajout d'événement.

## Fichiers copiés depuis Calendrier-Claude-code

### 1. API Backend
- ✅ `get_progression_files.php` - Récupération des fichiers depuis ProgressionLive
- ✅ `files.php` - Affichage des fichiers locaux
- ✅ `download_attachment.php` - Téléchargement des fichiers depuis ProgressionLive
- ✅ `direct_download.php` - Téléchargement direct avec gestion des formats

### 2. Fichiers HTML (viewers)
- ✅ `simple-viewer.html` - Visualiseur universel de fichiers
- ✅ `pdf-viewer.html` - Visualiseur PDF
- ✅ `image-viewer.html` - Visualiseur d'images
- ✅ `file-proxy-viewer.html` - Proxy pour fichiers distants

### 3. Dossiers créés
- ✅ `/api/files/` - Pour stocker les fichiers téléchargés localement
- ✅ `/api/logs/` - Pour les logs de débogage

## Corrections apportées

### 1. URLs d'API
- Ajouté `/api` dans `apiUtils.js` et `progressionApi.js`
- Corrigé les URLs hardcodées dans `AddEventModal.jsx`

### 2. Structure complète
Le système de fichiers ProgressionLive nécessite :
1. **Authentification** - Via config.php avec les credentials
2. **Recherche de la tâche** - Par numéro d'installation (INS)
3. **Récupération des attachments** - Via SOAP API
4. **Décodage Base64** - Les fichiers sont encodés
5. **Affichage/Téléchargement** - Via les viewers

## Test de la fonctionnalité

1. **Ouvrir la page de test** : http://localhost:5173/test-progression-files.html
   - Permet de tester la récupération des fichiers
   - Affiche l'état de la connexion
   - Teste les APIs directement

2. **Dans l'application principale** :
   - Ouvrir le modal d'ajout d'événement
   - Entrer un numéro d'installation (ex: INS011873)
   - Cliquer sur "Fetch"
   - La section "Fichiers liés à l'installation" devrait se remplir

## Architecture du système

```
Frontend (React)
    ↓
progressionApi.js
    ↓
get_progression_files.php
    ↓
ProgressionLive SOAP API
    ↓
Retour des fichiers (Base64)
    ↓
Décodage et affichage
```

## Logs de débogage

Les logs sont disponibles dans :
- `/api/progression_files_debug.log` - Logs détaillés des appels API
- `/api/progression/logs/progression.log` - Logs généraux ProgressionLive
- Console du navigateur - Logs JavaScript

## Problèmes possibles

1. **Pas de fichiers** - L'installation n'a peut-être pas de fichiers attachés
2. **Erreur d'authentification** - Vérifier les credentials dans config.php
3. **Timeout** - Les fichiers volumineux peuvent prendre du temps
4. **CORS** - Les headers sont configurés dans les fichiers PHP

## Prochaines étapes

Si les fichiers ne s'affichent toujours pas :
1. Vérifier les logs dans `/api/progression_files_debug.log`
2. Tester avec la page http://localhost:5173/test-progression-files.html
3. Vérifier la console du navigateur pour les erreurs JavaScript
4. S'assurer que le numéro d'installation existe dans ProgressionLive
