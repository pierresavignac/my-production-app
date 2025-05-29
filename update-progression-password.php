<?php
// update-progression-password.php
// Script pour mettre à jour le mot de passe ProgressionLive

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    $configFile = __DIR__ . '/api/progression/config.php';
    $config = require $configFile;
    
    // Mettre à jour le mot de passe
    $config['auth']['password'] = $_POST['password'];
    
    // Sauvegarder la configuration
    $configContent = "<?php\n// config.php\n\nreturn " . var_export($config, true) . ";";
    file_put_contents($configFile, $configContent);
    
    $message = "Mot de passe mis à jour avec succès!";
    $messageClass = "success";
} else {
    $message = "";
    $messageClass = "";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Mise à jour du mot de passe ProgressionLive</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .success { color: green; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 20px; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Mise à jour du mot de passe ProgressionLive</h1>
    
    <?php if ($message): ?>
        <div class="<?php echo $messageClass; ?>"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <div class="info">
        <p><strong>Configuration actuelle :</strong></p>
        <ul>
            <li>Domaine : garychartrand</li>
            <li>Email : pierre@garychartrand.com</li>
            <li>Mot de passe actuel : A11gdb333!</li>
        </ul>
    </div>
    
    <form method="POST">
        <div class="form-group">
            <label for="password">Nouveau mot de passe :</label>
            <input type="password" id="password" name="password" required>
        </div>
        
        <button type="submit">Mettre à jour le mot de passe</button>
    </form>
    
    <p style="margin-top: 30px;">
        <a href="test-progression-connection.php">Tester la connexion</a>
    </p>
</body>
</html>
