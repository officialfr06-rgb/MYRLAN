# Guide de Déploiement - Myrlane Parapharmacie

Ce projet est entièrement configuré pour être hébergé sur un serveur Node.js (VPS Linux, Ubuntu, Debian, Docker, Render, Railway, etc.).

## 🚀 Étapes de déploiement sur votre serveur

### 1. Prérequis sur le serveur
- **Node.js** (version 18 ou supérieure recommandée)
- **npm** ou **yarn**

### 2. Installation et Build sur le serveur
Clonez ou transférez les fichiers du projet sur votre serveur, puis exécutez :

```bash
# Installer les dépendances
npm install

# Compiler l'application (Frontend React + Backend Node.js / Express)
npm run build
```

### 3. Configuration des variables d'environnement (.env)
Créez un fichier `.env` à la racine du serveur avec vos paramètres (optionnel, des valeurs par défaut sécurisées sont intégrées) :

```env
PORT=3000
NODE_ENV=production

# Configuration SMTP pour les emails de confirmation de commande
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-smtp-password
```

### 4. Lancement de l'application en production
Pour démarrer le serveur en mode production :

```bash
npm start
```

Le serveur écoutera sur le port configuré (par défaut `3000`) et gérera :
- La **base de données persistante** (`server-db.json`) créée automatiquement sur le serveur.
- Le **stockage des images** des produits dans le dossier `/uploads` sur le disque du serveur.
- L'**authentification** sécurisée des utilisateurs et de l'administrateur.
- L'envoi des e-mails via **SMTP**.
- Le service des fichiers statiques du site web.

### 5. Utilisation d'un gestionnaire de processus (ex: PM2)
Pour garder le serveur actif en arrière-plan en continu 24h/24 :

```bash
npm install -g pm2
pm2 start server.js --name "myrlane-server"
pm2 save
pm2 startup
```
