# Résolution du problème d'affichage des tâches/événements

## Problème identifié
Les tâches ne s'affichaient pas car il y avait une erreur de chemin dans l'API :
- `apiUtils.js` ajoutait `/api` à la fin de l'URL : `http://localhost:8080/api`
- Cela créait un double chemin incorrect : `/api/api/events.php`

## Corrections appliquées

### 1. Correction de l'URL de base dans apiUtils.js
**Avant :**
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';
```

**Après :**
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

### 2. Correction de l'appel API dans ProductionCalendar.jsx
- Importation de `updateEvent` depuis apiUtils
- Remplacement de l'appel direct par l'utilisation de la fonction utilitaire

**Avant :**
```javascript
const response = await fetch(`/api/events.php?id=${updatedEvent.id}`, {
    method: 'PUT',
    // ...
});
```

**Après :**
```javascript
const response = await updateEvent(updatedEvent);
```

## Test de vérification

1. **Démarrez les serveurs** (si pas déjà fait) :
   ```bash
   # Terminal 1
   cd api && php -S localhost:8080
   
   # Terminal 2
   npm run dev
   ```

2. **Testez l'API directement** :
   Ouvrez http://localhost:5173/test-api-events.html

3. **Rafraîchissez l'application** :
   Les tâches devraient maintenant s'afficher correctement

## Configuration correcte
- Serveur API : démarré depuis le dossier `api/`
- URL de base : `http://localhost:8080` (sans `/api` à la fin)
- Tous les endpoints : `events.php`, `users.php`, etc. directement à la racine

## En cas de problème persistant
1. Vider le cache du navigateur (Cmd+Shift+R)
2. Vérifier la console pour les erreurs
3. Vérifier que l'API répond sur http://localhost:8080/events.php
