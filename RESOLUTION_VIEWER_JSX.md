# Résolution du problème "Consulter" - Page blanche avec erreur JSX

## Problème identifié
Le bouton "Consulter" dans les modales d'événements essayait d'ouvrir un fichier JSX au lieu d'une page HTML, causant l'erreur :
```
TypeError: 'text/jsx' is not a valid JavaScript MIME type
```

## Solution appliquée

### 1. Fichiers viewers manquants
Les fichiers HTML nécessaires pour visualiser les documents étaient présents dans le dossier `Calendrier-Claude-code/public` mais pas à la racine du projet principal.

**Fichiers copiés :**
- `file-proxy-viewer.html` - Viewer principal pour tous types de fichiers
- `pdf-viewer.html` - Viewer spécifique pour les PDFs  
- `image-viewer.html` - Viewer spécifique pour les images

### 2. Script de démarrage corrigé
Le serveur API doit être démarré depuis le dossier `api/` et non depuis la racine.

**Nouveau script créé : `start.sh`**
Ce script démarre automatiquement :
1. Le serveur PHP API sur le port 8080 (depuis le dossier `api/`)
2. Le serveur de développement Vite sur le port 5173

## Comment démarrer l'application

### Option 1 : Utiliser le script de démarrage (Recommandé)
```bash
./start.sh
```

### Option 2 : Démarrer manuellement les deux serveurs

**Terminal 1 - Serveur API :**
```bash
cd api
php -S localhost:8080
```

**Terminal 2 - Serveur Vite :**
```bash
npm run dev
```

## Vérifications à faire

1. **Tester le bouton Consulter** : Cliquez sur "Consulter" pour un fichier dans la modal d'édition d'événement
2. **Vérifier la console** : L'erreur JSX ne devrait plus apparaître
3. **Navigation entre fichiers** : Les boutons Précédent/Suivant devraient fonctionner

## Configuration
- API URL : `http://localhost:8080` (configuré dans `.env`)
- Vite Dev Server : `http://localhost:5173`

## Notes importantes
- Le FileViewerModal utilise maintenant `file-proxy-viewer.html` qui est une page HTML pure
- Les fichiers sont chargés via iframe pour éviter les problèmes de MIME type
- L'API doit absolument être démarrée depuis le dossier `api/` pour que les chemins relatifs fonctionnent

