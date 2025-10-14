# Guide de Déploiement en Production - Banque Atlantique

## 🚀 Mise en Production

### Prérequis

- **Node.js** 18+ 
- **Docker** et **Docker Compose**
- **Nginx** (si déploiement sans Docker)
- Certificat SSL pour HTTPS

### Configuration de l'Environnement

1. **Variables d'environnement**
   ```bash
   cp .env.production.example .env.production
   # Modifier les valeurs selon votre environnement
   ```

2. **Configuration des services externes**
   - SMTP pour les emails
   - Service de monitoring (optionnel)
   - Base de données (si Supabase)

### Déploiement avec Docker

```bash
# Construction et déploiement automatique
./deploy.sh

# Ou manuellement
docker-compose -f docker-compose.prod.yml up -d
```

### Déploiement Manuel

```bash
# Installation des dépendances
npm ci --only=production

# Construction
npm run build:prod

# Servir avec nginx
sudo cp dist/* /var/www/html/
sudo systemctl restart nginx
```

## 🔧 Configuration Nginx

```nginx
server {
    listen 80;
    server_name banqueatlantique.tg;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name banqueatlantique.tg;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📊 Monitoring et Logs

### Logs d'Application
```bash
# Voir les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques
docker logs banque-atlantique-prod
```

### Métriques de Performance
- Temps de chargement des pages
- Utilisation mémoire/CPU
- Erreurs JavaScript
- Taux de conversion

### Alertes Recommandées
- Erreurs 5xx > 1%
- Temps de réponse > 3s
- Utilisation CPU > 80%
- Espace disque < 10%

## 🔒 Sécurité

### Headers de Sécurité
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

### Authentification
- Sessions sécurisées
- Chiffrement des mots de passe
- Limitation des tentatives de connexion

### Sauvegarde
```bash
# Sauvegarde automatique quotidienne
0 2 * * * /path/to/backup-script.sh
```

## 🚨 Procédures d'Urgence

### Rollback Rapide
```bash
# Revenir à la version précédente
docker-compose -f docker-compose.prod.yml down
docker run -d --name banque-atlantique-prod -p 80:80 banque-atlantique:previous
```

### Mode Maintenance
```bash
# Activer le mode maintenance
echo "VITE_MAINTENANCE_MODE=true" >> .env.production
docker-compose -f docker-compose.prod.yml restart
```

### Contacts d'Urgence
- **Administrateur Système**: +228-XX-XX-XX-XX
- **Support Technique**: support@banqueatlantique.tg
- **Escalade**: admin@banqueatlantique.tg

## 📈 Optimisations

### Performance
- Compression Gzip activée
- Cache navigateur (1 an pour les assets)
- Minification CSS/JS
- Lazy loading des composants

### SEO
- Meta tags optimisés
- Sitemap.xml
- Robots.txt configuré
- Schema.org markup

### Accessibilité
- Contraste WCAG AA
- Navigation clavier
- Lecteurs d'écran compatibles
- Textes alternatifs

## 🔄 Mise à Jour

### Déploiement Continu
```bash
# Mise à jour automatique
git pull origin main
./deploy.sh
```

### Tests de Régression
- Tests automatisés avant déploiement
- Vérification des fonctionnalités critiques
- Tests de charge

## 📞 Support

Pour toute question ou problème :
- **Documentation**: [docs.banqueatlantique.tg](https://docs.banqueatlantique.tg)
- **Support**: support@banqueatlantique.tg
- **Urgences**: +228-XX-XX-XX-XX (24h/24)