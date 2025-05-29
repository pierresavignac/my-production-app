# Résolution complète - Erreur "text/jsx is not a valid JavaScript MIME type"

## Problème
Le bouton "Consulter" tentait d'ouvrir un fichier JSX au lieu d'une page HTML, causant l'erreur de MIME type.

## Solution appliquée

### 1. Fichiers HTML déplacés au bon endroit
Les fichiers viewer doivent être dans le dossier `public/` pour que Vite puisse les servir :
- ✅ `public/file-proxy-viewer.html`
- ✅ `public/pdf-viewer.html`
- ✅ `public/image-viewer.html`
- ✅ `public/simple-viewer.html`

### 2. FileViewerModal corrigé
- URL modifiée : `/file-proxy-viewer.html` au lieu de `${window.location.origin}/file-proxy-viewer.html`
- Support des propriétés `fileId` et `fileName` en plus de `file`
- Toutes les références internes mises à jour

### 3. Scripts de démarrage
- `start.sh` : Démarre les deux serveurs
- `restart.sh` : Tue les serveurs existants et redémarre

## Instructions pour corriger le problème

### 1. Arrêter les serveurs actuels
Appuyez sur `Ctrl+C` dans les terminaux où les serveurs tournent.

### 2. Redémarrer avec le nouveau script
```bash
./restart.sh
```

Ou manuellement :
```bash
# Terminal 1
cd api && php -S localhost:8080

# Terminal 2  
npm run dev
```

### 3. Vider le cache du navigateur
- Chrome/Safari : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (PC)
- Ou ouvrez les DevTools et faites un clic droit sur le bouton refresh → "Empty Cache and Hard Reload"

### 4. Tester
1. Connectez-vous à l'application
2. Ouvrez un événement avec des fichiers
3. Cliquez sur "Consulter"
4. Le fichier devrait s'ouvrir sans erreur

## Structure finale des fichiers
```
my-production-app/
├── public/
│   ├── file-proxy-viewer.html ✅
│   ├── pdf-viewer.html ✅
│   ├── image-viewer.html ✅
│   └── simple-viewer.html ✅
├── src/
│   └── components/
│       └── FileViewerModal.jsx ✅ (corrigé)
├── api/
│   └── (fichiers PHP)
├── start.sh ✅
└── restart.sh ✅
```

## Points clés
- Les fichiers HTML DOIVENT être dans `public/`
- L'URL dans FileViewerModal ne doit PAS utiliser `window.location.origin`
- Le serveur API DOIT être démarré depuis le dossier `api/`
- Toujours vider le cache après des changements de fichiers statiques
