# Modification : Consultation directe des fichiers depuis ProgressionLive

## Changements effectués

### 1. Nouveau système d'affichage direct
- Les fichiers sont maintenant consultés directement depuis ProgressionLive
- URL format : `https://[domain].progressionlive.com/web/exe/attachment/[filename]?id=[id]&entityName=TXAttachment`
- Plus besoin de télécharger les fichiers localement

### 2. Fichiers modifiés

#### `src/utils/progressionFileUtils.js` (nouveau)
- Fonction `getProgressionDirectUrl()` pour construire l'URL directe

#### `src/components/FileViewerModal.jsx`
- Import de `getProgressionDirectUrl`
- Utilisation de l'URL directe vers ProgressionLive
- Suppression de la fonction de téléchargement
- Suppression du bouton "Télécharger"

#### `src/components/modals/EditEventModal.jsx`
- Suppression des boutons "Télécharger" et "Ouvrir PDF"
- Conservation uniquement du bouton "Consulter"
- Commentaire de la fonction `handleFileDownload`

#### `src/components/modals/AddEventModal.jsx`
- Suppression du bouton "Télécharger"
- Commentaire de la fonction `handleFileDownload`

### 3. Fonctionnement

1. L'utilisateur clique sur "Consulter"
2. Le FileViewerModal s'ouvre
3. L'iframe charge directement le fichier depuis ProgressionLive
4. Navigation possible entre les fichiers

### 4. Avantages

- ✅ Pas de téléchargement local
- ✅ Toujours la version la plus récente du fichier
- ✅ Économie d'espace serveur
- ✅ Plus rapide et plus simple

### 5. Prérequis

- L'utilisateur doit être connecté à ProgressionLive
- Le domaine doit être stocké dans localStorage (`progressionUser`)

### 6. Test

Une page de test est disponible : http://localhost:5173/test-progression-direct-url.html

## URL exemple

Pour un fichier avec :
- Domain : garychartrand
- File ID : 31177
- Filename : PANNEAU.jpeg

L'URL sera :
```
https://garychartrand.progressionlive.com/web/exe/attachment/PANNEAU.jpeg?id=31177&entityName=TXAttachment
```
