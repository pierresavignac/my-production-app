#!/bin/bash

# Script pour redémarrer les serveurs

echo "🛑 Arrêt des serveurs existants..."

# Tuer tous les processus PHP sur le port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "✅ Serveur PHP arrêté" || echo "⚠️  Aucun serveur PHP à arrêter"

# Tuer tous les processus Node/Vite sur le port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "✅ Serveur Vite arrêté" || echo "⚠️  Aucun serveur Vite à arrêter"

echo ""
echo "⏳ Attente de 2 secondes..."
sleep 2

echo ""
echo "🚀 Redémarrage des serveurs..."
echo ""

# Utiliser le script start.sh existant
./start.sh
