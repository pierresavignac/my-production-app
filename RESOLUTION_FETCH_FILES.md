# Résolution du problème "Fetch" - Les fichiers ne s'affichent pas

## Problème identifié
Quand vous cliquiez sur "Fetch", les données de l'installation étaient récupérées mais pas les fichiers associés. 

### Causes du problème :

1. **Mauvais numéro d'installation utilisé** : Le code utilisait l'ancien `formData.installation_number` au lieu du nouveau `updatedData.installation_number` après la mise à jour.

2. **Chemin API incorrect** : progressionApi.js ajoutait `/api` à la fin de l'URL, créant un double chemin.

## Corrections appliquées

### 1. Correction de l'appel aux fichiers dans EditEventModal.jsx
**Avant :**
```javascript
await fetchInstallationFiles(formData.installation_number);
```

**Après :**
```javascript
if (updatedData.installation_number) {
    await fetchInstallationFiles(updatedData.installation_number);
}
```

### 2. Même correction dans AddEventModal.jsx

### 3. Correction du chemin API dans progressionApi.js
**Avant :**
```javascript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api';
```

**Après :**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

## Test de vérification

1. **Page de test créée** : http://localhost:5173/test-progression-fetch.html
   - Testez tasks.php avec un numéro d'installation
   - Testez get_progression_files.php pour vérifier les fichiers

2. **Dans l'application** :
   - Ouvrez un événement existant
   - Entrez un numéro d'installation
   - Cliquez sur "Fetch"
   - Les données ET les fichiers devraient maintenant s'afficher

## Configuration correcte
- API_BASE_URL : `http://localhost:8080` (sans `/api` à la fin)
- Le serveur PHP doit être démarré dans le dossier `api/`
- Les chemins : `/progression/tasks.php` et `/get_progression_files.php`

## En cas de problème
1. Vérifiez que vous êtes connecté à ProgressionLive
2. Vérifiez que le numéro d'installation existe dans ProgressionLive
3. Consultez la console du navigateur pour les erreurs
4. Utilisez la page de test pour déboguer les API individuellement
