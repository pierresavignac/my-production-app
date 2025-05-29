# Solution : Ouverture directe dans ProgressionLive

## Problème identifié
L'affichage des fichiers dans un iframe (FileViewerModal) ne fonctionne pas avec ProgressionLive à cause des restrictions de sécurité :
- **X-Frame-Options** : ProgressionLive empêche l'affichage dans un iframe
- **CORS** : Restrictions cross-origin

## Solution appliquée

### Ouverture directe dans un nouvel onglet
Au lieu d'utiliser le FileViewerModal avec un iframe, les fichiers s'ouvrent maintenant directement dans un nouvel onglet du navigateur.

### Modifications apportées

#### EditEventModal.jsx et AddEventModal.jsx
```javascript
// Avant : setShowFileViewer(true);
// Après :
const directUrl = getProgressionDirectUrl(file.id, file.name);
if (directUrl) {
    window.open(directUrl, '_blank');
}
```

## Avantages de cette approche

1. **Simplicité** : Pas de problème de sécurité avec les iframes
2. **Fiabilité** : ProgressionLive gère l'authentification et l'affichage
3. **Performances** : Chargement direct sans intermédiaire
4. **Expérience utilisateur** : Les fichiers s'ouvrent dans leur interface native ProgressionLive

## Fonctionnement

1. L'utilisateur clique sur "Consulter"
2. L'URL directe vers ProgressionLive est construite
3. Le fichier s'ouvre dans un nouvel onglet
4. ProgressionLive gère l'authentification et l'affichage

## URL format
```
https://[domain].progressionlive.com/web/exe/attachment/[filename]?id=[id]&entityName=TXAttachment
```

## Prérequis
- L'utilisateur doit être connecté à ProgressionLive
- Le domaine doit être stocké dans localStorage

## Note
Le FileViewerModal n'est plus utilisé pour les fichiers ProgressionLive mais pourrait être conservé pour d'autres usages futurs.
