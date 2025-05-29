# Résolution de l'erreur 404 - universal_file_server.php

## Problème
Le fichier `universal_file_server.php` n'existait pas, causant une erreur 404 lors du clic sur "Consulter" ou "Télécharger".

## Solution appliquée

### 1. Copie du fichier manquant
J'ai copié `universal_file_server.php` depuis le dossier `Calendrier-Claude-code/api/` vers `api/`.

### 2. Correction des URLs dans EditEventModal.jsx
J'ai remplacé les références à `universal_file_server.php` par `download_attachment.php` qui est l'API correcte pour télécharger les fichiers depuis ProgressionLive.

**Avant :**
```javascript
const fileUrl = `${apiBaseUrl}/universal_file_server.php?ins=${...}&file=${...}`;
```

**Après :**
```javascript
const fileUrl = `${apiBaseUrl}/download_attachment.php?id=${file.id}&ins=${...}&mode=inline`;
```

## Comment ça fonctionne maintenant

1. **Fetch** : Récupère les métadonnées des fichiers depuis ProgressionLive
2. **Consulter** : Télécharge le fichier depuis ProgressionLive et l'affiche
3. **Télécharger** : Télécharge le fichier depuis ProgressionLive vers votre ordinateur

## Architecture des fichiers

- `get_progression_files.php` : Récupère la liste des fichiers (métadonnées)
- `download_attachment.php` : Télécharge un fichier spécifique depuis ProgressionLive
- `universal_file_server.php` : Sert les fichiers stockés localement (copié mais non utilisé actuellement)

## Test

1. Rafraîchissez votre application (Cmd+R)
2. Ouvrez un événement avec des fichiers
3. Cliquez sur "Consulter" - le fichier devrait s'ouvrir sans erreur 404

## Note importante

Les fichiers sont récupérés en temps réel depuis ProgressionLive, ils ne sont pas stockés localement. Cela garantit que vous avez toujours la version la plus récente des fichiers.
