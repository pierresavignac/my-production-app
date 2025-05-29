#!/bin/bash

# Script pour copier les fichiers importants de Calendrier-Claude-code vers le projet principal
# NE PAS exécuter automatiquement - Vérifier chaque commande

echo "=== Copie des fichiers depuis Calendrier-Claude-code ==="

# Variables
SOURCE_DIR="/Users/pierresavignac/Documents/PROGRAMMES/Calendar/my-production-app/Calendrier-Claude-code"
TARGET_DIR="/Users/pierresavignac/Documents/PROGRAMMES/Calendar/my-production-app"

# Créer les dossiers nécessaires
echo "Création des dossiers..."
mkdir -p "$TARGET_DIR/src/components/views"

# Copier les vues
echo "Copie des vues..."
cp "$SOURCE_DIR/src/components/views/NoAppointmentView.jsx" "$TARGET_DIR/src/components/views/"
cp "$SOURCE_DIR/src/components/views/ListView.jsx" "$TARGET_DIR/src/components/views/"
cp "$SOURCE_DIR/src/components/views/BlockView.jsx" "$TARGET_DIR/src/components/views/"

# Copier les modals améliorés
echo "Copie des modals..."
cp "$SOURCE_DIR/src/components/AddEventModal.jsx" "$TARGET_DIR/src/components/modals/"
# ATTENTION: EditEventModal a déjà été modifié - à vérifier manuellement

# Copier le SideMenu avec le bon lien
echo "Copie du SideMenu..."
cp "$SOURCE_DIR/src/components/SideMenu.jsx" "$TARGET_DIR/src/components/layout/"

# Copier les composants manquants
echo "Copie des composants additionnels..."
cp "$SOURCE_DIR/src/components/ProgressionLoginForm.jsx" "$TARGET_DIR/src/components/"
cp "$SOURCE_DIR/src/components/FileViewerModal.jsx" "$TARGET_DIR/src/components/modals/" 2>/dev/null || echo "FileViewerModal déjà présent"

# Copier les scripts SQL
echo "Copie des scripts SQL..."
cp "$SOURCE_DIR/sql/add_no_appointment_column.sql" "$TARGET_DIR/sql/"

# Supprimer le composant WalkIn.jsx qui n'est plus nécessaire
echo "Nettoyage..."
rm -f "$TARGET_DIR/src/components/WalkIn.jsx"

echo "=== Copie terminée ==="
echo ""
echo "ACTIONS MANUELLES NÉCESSAIRES :"
echo "1. Mettre à jour App.jsx pour utiliser NoAppointmentView au lieu de WalkIn"
echo "2. Changer la route de /walk-in à /no-appointment"
echo "3. Vérifier EditEventModal.jsx pour ne pas perdre les modifications récentes"
echo "4. Exécuter le script SQL add_no_appointment_column.sql"
echo "5. Vérifier les imports dans les fichiers copiés"
