# Documentation - Paramètres et Gestion

## Vue d'ensemble

Cette documentation décrit les nouvelles interfaces de paramètres implémentées pour la gestion des clients, produits, modules et utilisateurs.

## Modules implémentés

### 1. Gestion des Clients (`/admin/parametres` - onglet Clients)

#### Fonctionnalités
- **Affichage de la liste des clients** avec leurs informations complètes
- **Recherche en temps réel** par nom, code client, secteur ou pays
- **Ajout de nouveaux clients** via un formulaire modal
- **Modification des clients existants**
- **Suppression de clients** avec confirmation
- **Gestion du statut** (Actif/Inactif)

#### Champs du formulaire
- Nom (requis)
- Code client (requis)
- Secteur (requis)
- Pays (requis)
- Statut (Actif/Inactif)

#### Note importante
Les clients marqués comme "Inactif" ne seront pas disponibles lors de la création d'un nouveau lot.

---

### 2. Gestion des Produits (`/admin/parametres` - onglet Produits)

#### Fonctionnalités
- **Affichage de la liste des produits**
- **Recherche** par nom, code produit ou description
- **Ajout de nouveaux produits**
- **Modification des produits existants**
- **Suppression de produits**
- **Gestion du statut** (Actif/Inactif)

#### Champs du formulaire
- Nom (requis)
- Code produit (requis)
- Description (requis)
- Langue par défaut (Français/Anglais/Espagnol/Allemand)
- Statut (Actif/Inactif)

#### Note importante
Les produits servent de contexte à l'IA lors de la génération des exigences.

---

### 3. Gestion des Modules par Produit (`/admin/parametres` - onglet Modules)

#### Fonctionnalités
- **Sélection d'un produit** pour afficher ses modules associés
- **Création de nouveaux modules** pour un produit spécifique
- **Affectation de modules existants** à un produit
- **Modification des modules**
- **Suppression de modules**
- **Gestion du statut** (Actif/Inactif)

#### Workflow d'utilisation
1. Sélectionnez un produit dans la liste déroulante
2. Les modules associés s'affichent automatiquement
3. Utilisez "Créer un module" pour ajouter un nouveau module
4. Utilisez "Affecter des modules" pour lier des modules existants au produit

#### Champs du formulaire de module
- Nom (requis)
- Code (requis)
- Description (optionnel)
- Statut (Actif/Inactif)

#### Note importante
La configuration fonctionnelle des modules est utilisée comme référence pour le chiffrage des licences.

---

### 4. Gestion des Utilisateurs (`/admin/parametres` - onglet Utilisateurs)

#### Fonctionnalités
- **Affichage de la liste des utilisateurs** de l'équipe
- **Recherche** par nom, email ou rôle
- **Invitation de nouveaux utilisateurs** par email
- **Modification des informations utilisateur**
- **Changement de rôle en ligne** via liste déroulante
- **Activation/Désactivation** des comptes utilisateurs

#### Rôles disponibles
- **Admin** : Accès complet à toutes les fonctionnalités
- **Éditeur** : Peut créer et modifier du contenu
- **Lecteur** : Accès en lecture seule

#### Formulaire d'invitation
- Email de l'utilisateur (requis)
- Rôle à attribuer (requis)

Un email d'invitation sera automatiquement envoyé à l'utilisateur avec un lien pour créer son compte.

---

## Architecture technique

### Models créés
- `client.model.ts` - Structure des données clients
- `produit.model.ts` - Structure des données produits
- `module.model.ts` - Structure des données modules
- `user.model.ts` - Structure des données utilisateurs (amélioré)

### Services créés
- `client.service.ts` - Appels API pour les clients
- `produit.service.ts` - Appels API pour les produits
- `module.service.ts` - Appels API pour les modules
- `user.service.ts` - Appels API pour les utilisateurs

### Composants créés
- `parametres.component` - Composant principal avec système d'onglets
- `clients.component` - Gestion des clients
- `produits.component` - Gestion des produits
- `modules.component` - Gestion des modules
- `utilisateurs.component` - Gestion des utilisateurs

### Routes configurées
- `/admin/parametres` - Page principale des paramètres (protégée par AuthGuard)

---

## Configuration API

Les services utilisent les endpoints suivants:

```typescript
// Clients
/api/clients
/api/clients/:id
/api/clients/active

// Produits
/api/produits
/api/produits/:id
/api/produits/active

// Modules
/api/modules
/api/modules/:id
/api/modules/produit/:produitId
/api/modules/assign

// Utilisateurs
/api/users
/api/users/:id
/api/users/invite
/api/users/:id/role
/api/users/:id/toggle-status
```

---

## Design et UX

### Système de navigation par onglets
- Navigation intuitive entre les différentes sections
- Animation fluide lors du changement d'onglet
- Indicateur visuel de l'onglet actif

### Modales
- Formulaires contextuels pour l'ajout et la modification
- Fermeture par clic extérieur ou bouton de fermeture
- Animations d'entrée/sortie

### Tables de données
- Headers fixes avec colonnes bien définies
- Effet de survol sur les lignes
- Badges de statut colorés (vert pour Actif, rouge pour Inactif)
- Boutons d'action avec icônes intuitives

### Barre de recherche
- Recherche en temps réel
- Filtrage sur plusieurs champs simultanément
- Placeholder informatif

### Design responsive
- Adaptation aux différentes tailles d'écran
- Tableaux avec défilement horizontal sur petits écrans
- Modales centrées et adaptatives

---

## Utilisation

1. **Accéder aux paramètres**: Naviguez vers `/admin/parametres` (requiert une authentification admin)

2. **Sélectionner une section**: Cliquez sur l'un des onglets (Clients, Produits, Modules, Utilisateurs)

3. **Ajouter un élément**: Cliquez sur le bouton "Ajouter" correspondant et remplissez le formulaire

4. **Modifier un élément**: Cliquez sur l'icône ✏️ dans la colonne Actions

5. **Supprimer un élément**: Cliquez sur l'icône 🗑️ et confirmez la suppression

6. **Rechercher**: Utilisez la barre de recherche pour filtrer les résultats

---

## Prochaines étapes recommandées

### Backend
Vous devrez implémenter les endpoints API côté backend pour :
- Gérer les opérations CRUD sur les clients
- Gérer les opérations CRUD sur les produits
- Gérer les opérations CRUD sur les modules
- Gérer l'affectation de modules aux produits
- Gérer les invitations utilisateurs
- Gérer les rôles et statuts des utilisateurs

### Améliorations possibles
- **Pagination** : Pour les grandes listes de données
- **Tri des colonnes** : Permettre de trier par différents critères
- **Export de données** : Export CSV/Excel des listes
- **Historique** : Suivi des modifications
- **Filtres avancés** : Filtres multiples et combinables
- **Notifications** : Toast messages pour confirmer les actions
- **Validation avancée** : Validation côté client plus robuste

---

## Support et maintenance

Pour toute question ou problème:
1. Vérifiez que les endpoints API sont correctement configurés dans le backend
2. Vérifiez que l'authentification fonctionne correctement
3. Consultez la console du navigateur pour les erreurs éventuelles
4. Vérifiez le fichier `proxy.conf.json` pour la configuration du proxy

---

**Date de création**: Février 2026
**Version**: 1.0
