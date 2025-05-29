# Configuration des chemins pour le serveur API

## Structure actuelle correcte

### Serveur API démarré depuis `/api/`
Quand vous exécutez `cd api && php -S localhost:8080`, le serveur PHP sert les fichiers depuis le dossier `api/`.

### Chemins corrects actuels

1. **Dans les fichiers PHP** (✅ Correct)
   - Les includes utilisent des chemins relatifs : `require_once 'config.php';`
   - Les chemins vers les fichiers utilisent `__DIR__` : `__DIR__ . '/files/'`
   - Ceci fonctionne car `__DIR__` pointe vers `/api/`

2. **Dans `.env`** (✅ Correct)
   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```
   Pas de `/api` car le serveur est démarré directement dans ce dossier

3. **Dans les viewers HTML** (✅ Correct)
   - `file-proxy-viewer.html` : utilise `${API_BASE_URL}/binary_file.php`
   - `simple-viewer.html` : utilise `${apiBaseUrl}/binary_file.php`
   - L'URL de base est passée en paramètre depuis React

## Fichiers à la racine (OK de les laisser)

Ces fichiers sont des utilitaires de test et ne font pas partie de l'application principale :
- `test-progression-connection.php`
- `update-progression-password.php`

Ils utilisent des chemins absolus pour accéder aux fichiers dans `/api/` :
```php
require __DIR__ . '/api/progression/config.php';
```

## Checklist de vérification

1. ✅ Serveur API démarré depuis le bon dossier : `cd api && php -S localhost:8080`
2. ✅ VITE_API_BASE_URL dans `.env` : `http://localhost:8080` (sans `/api`)
3. ✅ Fichiers viewers dans `public/` :
   - `public/file-proxy-viewer.html`
   - `public/simple-viewer.html`
   - `public/pdf-viewer.html`
   - `public/image-viewer.html`

## Si l'erreur JSX persiste

1. **Vider complètement le cache** :
   - Ouvrir DevTools (F12)
   - Clic droit sur le bouton refresh
   - "Empty Cache and Hard Reload"

2. **Vérifier la console réseau** :
   - Onglet Network dans DevTools
   - Chercher `file-proxy-viewer.html`
   - Vérifier le statut (devrait être 200)
   - Vérifier le Content-Type (devrait être `text/html`)

3. **Tester directement l'URL** :
   ```
   http://localhost:5173/file-proxy-viewer.html
   ```
   Devrait afficher la page HTML

## Structure finale correcte
```
my-production-app/
├── api/                    # Serveur PHP démarré ici
│   ├── binary_file.php
│   ├── config.php
│   ├── files/             # Fichiers stockés
│   └── ...
├── public/                # Fichiers statiques servis par Vite
│   ├── file-proxy-viewer.html
│   ├── simple-viewer.html
│   └── ...
├── src/
│   └── components/
│       └── FileViewerModal.jsx
└── .env                   # VITE_API_BASE_URL=http://localhost:8080
```
