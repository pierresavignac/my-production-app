# Documentation du Visualiseur de Fichiers

## Vue d'ensemble

Le système de visualisation de fichiers permet d'afficher différents types de fichiers (PDF, images, etc.) directement dans l'application web. Il gère automatiquement les cas particuliers et les fichiers problématiques.

## Composants principaux

1. **FileViewerModal.jsx**: Composant React qui affiche les fichiers dans une fenêtre modale.
2. **file-proxy-viewer.html**: Page HTML intermédiaire qui gère l'affichage des différents types de fichiers.
3. **Scripts API**: Plusieurs scripts PHP qui servent les fichiers et résolvent les problèmes courants.

## Utilisation basique

```jsx
// Exemple d'utilisation du composant FileViewerModal
<FileViewerModal
  show={showModal}
  onHide={() => setShowModal(false)}
  fileId="123"
  fileName="document.pdf" 
  installationNumber="INS012345"
  files={arrayOfFiles}        // Optionnel - pour la navigation entre fichiers
  currentIndex={currentIndex} // Optionnel - pour la navigation entre fichiers
  onNavigate={handleNavigate} // Optionnel - pour la navigation entre fichiers
/>
```

## Résolution des problèmes d'affichage

### Pour les fichiers image

Si une image ne s'affiche pas correctement:

1. **Utiliser le bouton "Réparer l'image"** dans l'interface du visualiseur (disponible pour les images)

2. **Utiliser l'outil de réparation directement** via l'URL:
   ```
   http://votre-serveur/api/fix_image.php?ins=NUMERO_INSTALLATION&file=NOM_FICHIER.jpg&action=convert
   ```
   
   Paramètres:
   - `ins`: Numéro d'installation (ex: INS011658)
   - `file`: Nom du fichier image (ex: EMPL_EXT.jpg)
   - `format`: Format de sortie souhaité (jpg, png, gif, webp)
   - `action`: 
     - `analyze`: Analyse sans conversion
     - `convert`: Convertit l'image si possible
     - `force_convert`: Force la conversion même si le fichier semble invalide
     - `view`: Affiche directement l'image convertie

### Pour les fichiers PDF

Pour les fichiers PDF qui ne s'affichent pas correctement:

1. **Utiliser le bouton "Essayer une méthode alternative"** dans l'interface du visualiseur

2. **Télécharger le fichier** et l'ouvrir directement avec un lecteur PDF

## Scripts API et leurs fonctions

| Script | Description |
|--------|-------------|
| `direct_file_viewer.php` | Accède aux fichiers depuis ProgressionLive, les met en cache localement et les sert directement |
| `repair_image.php` | Répare les images corrompues en utilisant GD |
| `process_binary.php` | Convertit les fichiers binaires problématiques en formats visualisables |
| `binary_decoder.php` | Outil de diagnostic pour analyser les fichiers problématiques |
| `fix_image.php` | Interface web pour la réparation et conversion d'images |
| `safari_download.php` | Optimisé pour Safari qui peut avoir des problèmes avec certains types de fichiers |

## Dépannage

1. **Image affichée comme corrompue**:
   - Utilisez le bouton "Réparer l'image" dans l'interface
   - Si cela ne fonctionne pas, utilisez l'outil `/api/fix_image.php` directement

2. **PDF qui ne s'affiche pas**:
   - Essayez la méthode alternative dans le visualiseur
   - Vérifiez que le fichier est un PDF valide

3. **Fichier introuvable**:
   - Vérifiez que le numéro d'installation et le nom de fichier sont corrects
   - Vérifiez que le fichier existe sur le serveur

## Limitations connues

- Certains fichiers très corrompus peuvent ne pas être réparables
- Les fichiers très volumineux peuvent dépasser les limites de PHP
- Safari peut avoir des problèmes avec certains fichiers PDF