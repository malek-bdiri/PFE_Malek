# Guide de Test - Module Clients

## 🎯 Modifications effectuées

### 1. **Liste déroulante des pays**
- ✅ Ajout d'une liste complète de 195 pays du monde
- ✅ Liste triée alphabétiquement en français
- ✅ Sélection par défaut : France

### 2. **Mapping Backend ↔ Frontend**
Le service a été adapté pour correspondre au DTO backend :

**Backend (DTO)**:
```java
clientCode  // Code du client
statut      // ACTIF ou INACTIF (enum)
```

**Frontend (Model)**:
```typescript
codeClient  // Code du client
statut      // 'Actif' ou 'Inactif' (string)
```

Le service fait automatiquement la conversion dans les deux sens.

### 3. **Validation améliorée**
- ✅ Vérification des champs requis avant l'envoi
- ✅ Messages d'erreur clairs
- ✅ Code client non modifiable en édition (désactivé)
- ✅ Messages de succès après création/modification

### 4. **Gestion des erreurs**
- ✅ Affichage des erreurs du backend (ex: "Client code already exists")
- ✅ Logs console pour le débogage
- ✅ Messages utilisateur compréhensibles

---

## 🧪 Comment tester

### Prérequis
1. ✅ Backend Spring Boot en cours d'exécution (port par défaut)
2. ✅ Base de données connectée
3. ✅ Frontend Angular démarré avec `ng serve`

### Test 1: Créer un nouveau client

1. Accédez à `/admin/parametres`
2. Cliquez sur l'onglet **"Clients"**
3. Cliquez sur **"+ Ajouter un client"**
4. Remplissez le formulaire :
   - **Nom**: ACME Corporation
   - **Code client**: ACME-001
   - **Secteur**: Industrie
   - **Pays**: France (sélectionnez dans la liste)
   - **Statut**: Actif
5. Cliquez sur **"Créer"**
6. ✅ Vérifiez que le client apparaît dans la liste
7. ✅ Vérifiez le message "Client créé avec succès"

### Test 2: Code client en double (test d'erreur)

1. Essayez de créer un client avec le même code : **ACME-001**
2. ✅ Vous devriez voir : "Erreur : Client code already exists"

### Test 3: Modifier un client

1. Cliquez sur **✏️** (Modifier) sur un client existant
2. ✅ Notez que le **Code client** est grisé et non modifiable
3. Modifiez d'autres champs (nom, secteur, pays)
4. Cliquez sur **"Mettre à jour"**
5. ✅ Vérifiez les modifications dans la liste

### Test 4: Recherche de clients

1. Utilisez la barre de recherche en haut
2. Tapez un nom, code, secteur ou pays
3. ✅ La liste se filtre en temps réel

### Test 5: Supprimer un client

1. Cliquez sur **🗑️** (Supprimer) sur un client
2. Confirmez la suppression
3. ✅ Le client disparaît de la liste

### Test 6: Sélection de pays

1. Ouvrez le formulaire d'ajout
2. Cliquez sur le champ **Pays**
3. ✅ Vérifiez que tous les pays sont disponibles
4. ✅ Testez avec : Tunisie, Allemagne, États-Unis, Japon, etc.

---

## 🔍 Endpoints testés

### GET /api/clients
Récupère tous les clients
```json
[
  {
    "id": 1,
    "nom": "ACME Corporation",
    "clientCode": "ACME-001",
    "secteur": "Industrie",
    "pays": "France",
    "statut": "ACTIF"
  }
]
```

### POST /api/clients
Crée un nouveau client
```json
{
  "nom": "ACME Corporation",
  "clientCode": "ACME-001",
  "secteur": "Industrie",
  "pays": "France",
  "statut": "ACTIF"
}
```

### PUT /api/clients/{id}
Met à jour un client existant
```json
{
  "nom": "ACME Corporation Updated",
  "clientCode": "ACME-001",
  "secteur": "Technologies",
  "pays": "Allemagne",
  "statut": "INACTIF"
}
```

### DELETE /api/clients/{id}
Supprime un client

---

## 🐛 Débogage

### Si le client n'apparaît pas après création :

1. **Vérifiez la console du navigateur** (F12)
   - Y a-t-il des erreurs ?
   - La requête POST a-t-elle réussi (code 200) ?

2. **Vérifiez la console du backend**
   - Le client a-t-il été enregistré en base ?
   - Y a-t-il des erreurs de validation ?

3. **Vérifiez le proxy** (`proxy.conf.json`)
   ```json
   {
     "/api": {
       "target": "http://localhost:8080",
       "secure": false
     }
   }
   ```

### Si vous avez l'erreur "Client code already exists" :

- C'est normal ! Le backend vérifie l'unicité du code client
- Utilisez un code différent (ex: ACME-002, ACME-003, etc.)

### Si les pays n'apparaissent pas :

- Rechargez la page (Ctrl+F5)
- Vérifiez qu'il n'y a pas d'erreurs dans la console

---

## 📊 Données de test suggérées

```typescript
// Client 1
{
  nom: "ACME Corporation",
  codeClient: "ACME-001",
  secteur: "Industrie",
  pays: "France",
  statut: "Actif"
}

// Client 2
{
  nom: "TechStart Industries",
  codeClient: "TECH-002",
  secteur: "Technologies",
  pays: "États-Unis",
  statut: "Actif"
}

// Client 3
{
  nom: "Innovate Solutions",
  codeClient: "INNO-003",
  secteur: "Services",
  pays: "Royaume-Uni",
  statut: "Actif"
}

// Client 4
{
  nom: "Global Systems",
  codeClient: "GLOB-004",
  secteur: "Finance",
  pays: "Allemagne",
  statut: "Inactif"
}
```

---

## ✅ Checklist de validation

- [ ] Création d'un client réussi
- [ ] Liste des clients affichée correctement
- [ ] Sélection d'un pays dans la liste déroulante
- [ ] Modification d'un client (code non modifiable)
- [ ] Suppression d'un client
- [ ] Recherche fonctionnelle
- [ ] Gestion d'erreur (code en double)
- [ ] Messages de succès affichés
- [ ] Badge de statut coloré (vert pour Actif, rouge pour Inactif)

---

## 🚀 Prochaines étapes

Après validation du module Clients, vous pouvez tester de la même manière :
- **Produits** (`/api/produits`)
- **Modules** (`/api/modules`)
- **Utilisateurs** (`/api/users`)

Bonne chance avec vos tests ! 🎉
