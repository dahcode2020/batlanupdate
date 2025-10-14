# Banque Atlantique - Système de Microfinance

## 🚀 Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anonyme

### 2. Configurer les variables d'environnement

```bash
# Copiez le fichier .env et ajoutez vos clés Supabase
cp .env .env.local
```

Modifiez `.env.local` avec vos vraies clés :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

### 3. Exécuter les migrations

Dans votre dashboard Supabase :
1. Allez dans l'onglet "SQL Editor"
2. Exécutez le contenu de `supabase/migrations/create_initial_schema.sql`
3. Puis exécutez `supabase/migrations/insert_initial_data.sql`

### 4. Démarrer l'application

```bash
npm install
npm run dev
```

## 🔐 Comptes de test

- **Admin** : `admin` / `admin1237575@@xyz`
- **Client 1** : `client1` / `client123`
- **Client 2** : `client2` / `client123`

## 📁 Structure du projet

- `src/services/database.ts` - Services pour interagir avec Supabase
- `src/hooks/useData.ts` - Hooks React pour la gestion des données
- `supabase/migrations/` - Scripts de migration de la base de données

## 🛠️ Développement

L'application utilise maintenant Supabase pour la persistance des données au lieu des données mockées.

## 🚀 Production

Pour la production, suivez le guide dans `README.production.md`.
