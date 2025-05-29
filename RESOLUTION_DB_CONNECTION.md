# Résolution du problème de base de données

## Erreur
`Access denied for user ''@'localhost'` - Les informations de connexion à MySQL sont incorrectes.

## Solutions

### Option 1 : Configuration automatique (Recommandé)

Exécutez ce script qui va automatiquement :
- Tester différents mots de passe
- Créer la base de données si nécessaire
- Mettre à jour la configuration

```bash
cd api
php setup_database.php
```

Une fois terminé, exécutez :
```bash
php add_no_appointment_column.php
```

### Option 2 : Configuration manuelle

1. **Identifiez votre configuration MySQL**
   
   - **MAMP** : Utilisateur = `root`, Mot de passe = `root`
   - **XAMPP** : Utilisateur = `root`, Mot de passe = `` (vide)
   - **MySQL local** : Selon votre installation

2. **Testez la connexion**
   ```bash
   php test_db_connection.php
   ```

3. **Si échec, modifiez manuellement `api/config.php`**
   ```php
   define('DB_PASS', 'votre_mot_de_passe_ici');
   ```

4. **Créez la base de données si nécessaire**
   
   Connectez-vous à MySQL :
   ```bash
   mysql -u root -p
   ```
   
   Puis :
   ```sql
   CREATE DATABASE IF NOT EXISTS local_calendar_db;
   USE local_calendar_db;
   ```

5. **Exécutez le script d'ajout de colonne**
   ```bash
   php add_no_appointment_column.php
   ```

## Vérification

Après avoir configuré la base de données, redémarrez le serveur API et testez la fonctionnalité "Sans rendez-vous".
