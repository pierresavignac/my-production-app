#!/bin/bash

# Script pour démarrer l'application de calendrier de production
echo "🚀 Démarrage de l'application de calendrier..."

# Démarrer le serveur PHP API dans un terminal séparé
echo "📡 Démarrage du serveur API PHP (port 8080)..."
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/api\" && php -S localhost:8080"'

# Attendre un peu pour que le serveur API démarre
sleep 2

# Démarrer le serveur de développement Vite
echo "🔧 Démarrage du serveur de développement Vite (port 5173)..."
npm run dev
