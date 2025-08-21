# JoindreRobin Chat 🚀

Une application de chat moderne et élégante conçue spécialement pour JoindreRobin, avec des salles protégées par mot de passe et une interface utilisateur professionnelle.

## ✨ Fonctionnalités

- **Lobby élégant** avec affichage des salles de chat depuis la base de données
- **Gestion des pseudos** avec stockage local et modales interactives
- **Thèmes clair/sombre** avec persistance des préférences
- **Drawer de profil** avec options de personnalisation
- **Interface responsive** et animations fluides
- **Salles protégées** avec authentification par mot de passe
- **Chat en temps réel** avec Socket.IO et communication instantanée
- **Gestion des utilisateurs** en ligne avec rôles et permissions
- **Design moderne** avec Tailwind CSS et animations CSS
- **📸 Upload d'images** avec prévisualisation et stockage sécurisé
- **🎥 Support YouTube** automatique avec iframe intégré

## 🛠️ Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Styling** : Tailwind CSS avec animations personnalisées
- **Backend** : Node.js + Express avec API REST
- **Base de données** : PostgreSQL avec Sequelize ORM
- **Build** : Webpack pour le JavaScript
- **Icons** : Font Awesome 6
- **Fonts** : Inter (Google Fonts)

## 🚀 Installation et démarrage

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd joindrerobin

# Installer les dépendances
npm install

# Construire les assets CSS et JS
npm run build

# Démarrer le serveur de développement
npm run dev
```

### Scripts disponibles
```bash
npm start          # Démarrer le serveur de production
npm run dev        # Démarrer le serveur de développement avec nodemon
npm run build      # Construire les assets en mode développement
npm run build:prod # Construire les assets en mode production
```

## 📁 Structure du projet

```
joindrerobin/
├── public/                 # Fichiers statiques servis
│   ├── index.html         # Page principale
│   ├── css/               # CSS compilé
│   └── js/                # JavaScript compilé
├── src/                   # Code source
│   ├── css/               # CSS source (Tailwind)
│   └── js/                # JavaScript source
├── server.js              # Serveur Express
├── package.json           # Dépendances et scripts
├── tailwind.config.js     # Configuration Tailwind
├── webpack.config.js      # Configuration Webpack
└── README.md              # Documentation
```

## 🎨 Interface utilisateur

### Lobby principal
- Affichage des salles disponibles avec informations détaillées
- Indicateurs visuels pour les salles protégées
- Compteurs d'utilisateurs en temps réel
- Design responsive avec grille adaptative

### Gestion du profil
- **Drawer latéral** accessible depuis l'icône profil
- **Changement de pseudo** avec validation
- **Basculement de thème** clair/sombre
- **Persistance des préférences** dans le localStorage

### Modales interactives
- **Modal de bienvenue** pour les nouveaux utilisateurs
- **Modal de changement de pseudo** avec validation
- **Animations fluides** et transitions CSS
- **Gestion des touches clavier** (Echap pour fermer)

## 🔒 Sécurité et authentification

### État actuel
- Vérification du pseudo dans le localStorage
- Authentification des salles protégées par mot de passe
- Salles marquées comme protégées ou publiques
- Gestion des sessions utilisateur

### Évolutions futures
- Chiffrement des mots de passe des salles
- Système de permissions avancé (admin, modérateur)
- Authentification utilisateur avec comptes persistants

## 💬 Chat en temps réel

### Fonctionnalités Socket.IO
- **Connexion automatique** aux salles de chat
- **Messages instantanés** avec persistance en base de données
- **Indicateur de frappe** en temps réel
- **Gestion des utilisateurs** en ligne
- **Notifications** d'arrivée/départ d'utilisateurs
- **Synchronisation** des messages entre tous les clients

### Architecture du chat
- **Socket.IO** pour la communication bidirectionnelle
- **Sequelize ORM** pour la persistance des données
- **Services modulaires** pour la logique métier
- **Gestion des erreurs** et reconnexion automatique
- **Système de rôles** préparé pour les permissions

### Salles de chat
- **Salle Général** : Accès libre, discussion générale
- **Salle Développement** : Protégée, discussions techniques
- **Salle Gaming** : Protégée, jeux vidéo et esport
- **Salle Musique** : Protégée, partage musical
- Intégration de Socket.IO pour le chat en temps réel
- Authentification par mot de passe pour les salles protégées
- Gestion des sessions utilisateur
- Chiffrement des communications

## 🎯 Roadmap

### Phase 1 (Actuelle) ✅
- [x] Interface du lobby
- [x] Gestion des pseudos
- [x] Système de thèmes
- [x] Design responsive

### Phase 2 (Prochaine)
- [ ] Intégration Socket.IO
- [ ] Chat en temps réel
- [ ] Authentification des salles
- [ ] Gestion des messages

### Phase 3 (Future)
- [ ] Notifications push
- [ ] Historique des conversations
- [ ] Gestion des fichiers
- [ ] Administration des salles

## 🎨 Personnalisation

### Thèmes
L'application supporte deux thèmes :
- **Clair** : Interface lumineuse et moderne
- **Sombre** : Interface sombre et élégante

### Couleurs
Les couleurs sont personnalisables via `tailwind.config.js` :
- Palette primaire (bleus)
- Palette secondaire (gris)
- Accents et états

## 🐛 Dépannage

### Problèmes courants
1. **Assets non chargés** : Vérifiez que `npm run build` a été exécuté
2. **Serveur ne démarre pas** : Vérifiez le port 3000 et les dépendances
3. **Styles manquants** : Vérifiez la compilation Tailwind CSS

### Logs et débogage
- Ouvrez la console du navigateur pour les erreurs JavaScript
- Vérifiez les logs du serveur Node.js
- Utilisez les outils de développement du navigateur

## 🤝 Contribution

Ce projet est conçu pour JoindreRobin. Les contributions sont les bienvenues pour :
- Améliorer l'interface utilisateur
- Ajouter de nouvelles fonctionnalités
- Optimiser les performances
- Corriger les bugs

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

---

**Développé avec ❤️ pour JoindreRobin**
