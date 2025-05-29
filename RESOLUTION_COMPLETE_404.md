# Résolution complète - Erreur 404 universal_file_server.php

## Problème
Quand vous cliquiez sur "Consulter", une erreur 404 apparaissait car le fichier `universal_file_server.php` n'existait pas.

## Solutions appliquées

### 1. ✅ Copie du fichier manquant
```bash
cp Calendrier-Claude-code/api/universal_file_server.php api/
```

### 2. ✅ Correction des URLs pour utiliser la bonne API
- Remplacé `universal_file_server.php` par `download_attachment.php`
- Cette API télécharge les fichiers directement depuis ProgressionLive

### 3. ✅ Utilisation du FileViewerModal
- Au lieu d'ouvrir directement une nouvelle fenêtre
- Le modal gère correctement l'affichage des fichiers

## Code corrigé dans EditEventModal.jsx

**Avant :**
```javascript
// Ouverture directe dans une nouvelle fenêtre
window.open(fileUrl, '_blank');
```

**Après :**
```javascript
// Utilisation du modal de visualisation
setShowFileViewer(true);
```

## Comment ça fonctionne maintenant

1. **Cliquez sur "Consulter"**
   - Le FileViewerModal s'ouvre
   - Il charge le fichier via `download_attachment.php`
   - Le fichier est affiché dans un iframe

2. **Navigation entre fichiers**
   - Les boutons Précédent/Suivant fonctionnent
   - Pas besoin de fermer/rouvrir pour chaque fichier

3. **Téléchargement**
   - Utilise aussi `download_attachment.php`
   - Télécharge directement depuis ProgressionLive

## Test final

1. **Rafraîchissez l'application** (Cmd+R)
2. **Ouvrez un événement** avec des fichiers
3. **Cliquez sur "Consulter"**
   - Le modal devrait s'ouvrir
   - Le fichier devrait s'afficher sans erreur 404

## Pages de test disponibles
- http://localhost:5173/test-download-attachment.html
- http://localhost:5173/test-progression-fetch.html

## Structure des APIs
- `get_progression_files.php` : Liste des fichiers
- `download_attachment.php` : Téléchargement/visualisation
- `file-proxy-viewer.html` : Interface de visualisation
