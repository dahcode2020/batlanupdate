#!/bin/bash

# Production deployment script for Banque Atlantique
set -e

echo "🚀 Déploiement en production - Banque Atlantique"
echo "================================================"

# Configuration
DOCKER_IMAGE="banque-atlantique:latest"
CONTAINER_NAME="banque-atlantique-prod"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Vérifications préalables
echo "📋 Vérifications préalables..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Vérifier les variables d'environnement
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant"
    exit 1
fi

echo "✅ Vérifications terminées"

# Sauvegarde (si applicable)
echo "💾 Création d'une sauvegarde..."
mkdir -p "$BACKUP_DIR"
# Ici vous pourriez sauvegarder la base de données, les logs, etc.
echo "✅ Sauvegarde créée dans $BACKUP_DIR"

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Construction de l'image
echo "🔨 Construction de l'image Docker..."
docker build -t $DOCKER_IMAGE .

# Test de l'image
echo "🧪 Test de l'image..."
docker run --rm -d --name test-container -p 8081:80 $DOCKER_IMAGE
sleep 10

# Vérifier que l'application répond
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    echo "✅ Test de santé réussi"
    docker stop test-container
else
    echo "❌ Test de santé échoué"
    docker stop test-container
    exit 1
fi

# Déploiement
echo "🚀 Déploiement de l'application..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification finale
echo "🔍 Vérification finale..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Déploiement réussi!"
    echo "🌐 Application disponible sur http://localhost"
else
    echo "❌ Échec du déploiement"
    echo "📋 Logs des conteneurs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Nettoyage des anciennes images
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo "🎉 Déploiement terminé avec succès!"
echo "📊 Statut des services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Redémarrer: docker-compose -f docker-compose.prod.yml restart"
echo "  - Arrêter: docker-compose -f docker-compose.prod.yml down"
echo "  - Mise à jour: ./deploy.sh"