# Alenia Pulse

**Consulting & Connection** - Application de newsletter interne sécurisée pour Alenia.

![Alenia Pulse Logo](public/alenia_logo.png)

## 🎯 Description

Alenia Pulse est une plateforme de communication interne permettant aux consultants de rester connectés et informés. L'application offre :

- **Gestion de contenu** par domaines (Hiring, Event, Journey, Communication, Admin)
- **Authentification sécurisée** avec JWT et bcrypt
- **Contrôle d'accès** basé sur les rôles (Admin, Contributeur, Utilisateur)
- **Interface moderne** avec dark mode et animations fluides

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- PostgreSQL 15+ (ou Docker)
- npm ou yarn

### Installation

```bash
# Cloner le dépôt
git clone git@github.com:MBAlenia/ALENIA_Pulse.git
cd ALENIA_Pulse

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer la base de données (Docker)
docker-compose up -d db

# Créer la base de données
node create-db.js

# Peupler avec des données de test
node seed-database.js

# Migrer les mots de passe (si nécessaire)
node migrate-passwords.js

# Démarrer l'application
npm run start-secure
```

L'application sera accessible sur :
- Frontend : http://localhost:5174
- Backend : http://localhost:3002

## 🔐 Sécurité

L'application implémente les meilleures pratiques de sécurité :

- ✅ **Authentification JWT** avec tokens d'accès et de rafraîchissement
- ✅ **Hachage bcrypt** des mots de passe (10 rounds)
- ✅ **Cookies httpOnly** pour stocker les tokens
- ✅ **Rate limiting** (5 tentatives de login / 15 min)
- ✅ **Validation des entrées** avec express-validator
- ✅ **Headers de sécurité** avec Helmet
- ✅ **CORS** configuré pour les origines autorisées

## 👥 Identifiants de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@company.com | admin123 |
| Hiring | hiring@company.com | hiring123 |
| Event | events@company.com | event123 |

## 🐳 Déploiement en Production

```bash
# Construire et déployer avec Docker Compose
docker-compose -f docker-compose-prod.yml up -d --build
```

L'application sera accessible sur :
- Frontend : https://pulse.academy.alenia.io
- Backend API : https://pulse-api.academy.alenia.io
- PgAdmin : https://pgadmin.pulse.academy.alenia.io

### Variables d'Environnement de Production

Créer un fichier `.env` avec :

```env
# Database
POSTGRES_USER_PROD=your_db_user
POSTGRES_PASSWORD_PROD=your_db_password
POSTGRES_DB_PROD=newsletter

# JWT Secrets (générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET_PROD=your_jwt_secret_here
JWT_REFRESH_SECRET_PROD=your_refresh_secret_here

# PgAdmin
PGADMIN_PASSWORD_PROD=your_pgadmin_password
```

## 📁 Structure du Projet

```
.
├── src/                    # Code source frontend (React)
│   ├── App.jsx            # Composant principal
│   ├── App.css            # Styles
│   └── main.jsx           # Point d'entrée
├── middleware/            # Middlewares backend
│   ├── auth.js           # Authentification JWT
│   └── validators.js     # Validation des données
├── public/               # Assets statiques
├── Dockerfile.backend    # Image Docker backend
├── Dockerfile.frontend   # Image Docker frontend
├── server-secure.js      # Serveur Express sécurisé
├── seed-database.js      # Script de peuplement
└── docker-compose-prod.yml # Configuration production

## 🛠️ Technologies

- **Frontend** : React 19, Vite, Lucide Icons
- **Backend** : Node.js, Express, PostgreSQL
- **Sécurité** : JWT, bcrypt, Helmet, express-validator
- **Déploiement** : Docker, Traefik

## 📝 Licence

Propriété d'Alenia - Tous droits réservés

## 👨‍💻 Auteur

Michel Barnabot - michel.barnabot@alenia.io
```