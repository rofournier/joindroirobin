# 🔐 Mots de passe des salles protégées

## 📋 Liste des salles et leurs mots de passe

### 🟢 Salle publique (pas de mot de passe)
- **Général** - Discussion générale et accueil - Accès libre

### 🔒 Salles protégées (mot de passe requis)

#### 👨‍👩‍👧‍👦 **Cousins** - Salle des cousins
- **Mot de passe :** `xK9mP2qR`
- **Catégorie :** Famille
- **Capacité :** 30 utilisateurs

#### 🏠 **Lardo** - Salle Lardo  
- **Mot de passe :** `vN7hL4tY`
- **Catégorie :** Privée
- **Capacité :** 20 utilisateurs

#### 😄 **Les Gogols** - Salle des gogols
- **Mot de passe :** `wQ8jM5uZ`
- **Catégorie :** Fun
- **Capacité :** 40 utilisateurs

#### ⭐ **Keur** - Salle Keur - Discussions spéciales
- **Mot de passe :** `aB3cD6eF`
- **Catégorie :** Spéciale
- **Capacité :** 25 utilisateurs

#### 🐧 **Les pingouins** - Bqanquise
- **Mot de passe :** `aB3cGT5`
- **Catégorie :** Fun
- **Capacité :** 25 utilisateurs

---

## ⚠️ Problème résolu

Le problème de connexion aux salles a été corrigé. L'erreur "Mot de passe requis pour cette salle" était due à une logique incorrecte dans le service d'authentification.

**Solution appliquée :**
- Suppression de la logique de fallback incorrecte
- Utilisation exclusive de la vérification bcrypt des mots de passe hashés
- Toutes les salles protégées ont maintenant leurs mots de passe correctement configurés

## 🔧 Comment utiliser

1. Choisissez la salle que vous souhaitez rejoindre
2. Si la salle est protégée, entrez le mot de passe correspondant
3. Cliquez sur "Rejoindre la salle"

## 📝 Notes techniques

- Les mots de passe sont stockés de manière sécurisée avec bcrypt
- La salle "Général" est publique et ne nécessite pas de mot de passe
- Toutes les autres salles sont protégées et nécessitent le mot de passe approprié
