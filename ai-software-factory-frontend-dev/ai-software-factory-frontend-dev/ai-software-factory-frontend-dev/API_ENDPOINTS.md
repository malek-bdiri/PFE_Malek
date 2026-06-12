# 🔗 Endpoints API - Frontend Angular

## 🌐 Configuration Proxy

Le frontend utilise un proxy pour rediriger `/api/*` vers le backend :
- Frontend : `http://localhost:4200`
- Backend : `http://localhost:8081`
- Keycloak : `http://localhost:8080`

Configuration dans [proxy.conf.json](proxy.conf.json)

---

## 🔐 Authentification

### Login
**Frontend** : `AuthService.login()`  
**Endpoint** : `POST /api/auth/login`  
**Backend** : `http://localhost:8081/api/auth/login`

**Requête** :
```json
{
  "email": "admin",
  "password": "admin123"
}
```

**Réponse** :
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJIUzUxMiIsInR5cCI...",
  "token_type": "Bearer",
  "session_state": "...",
  "scope": "profile email"
}
```

### Refresh Token
**Frontend** : `AuthService.refreshToken()`  
**Endpoint** : `POST /api/auth/refresh`  
**Backend** : `http://localhost:8081/api/auth/refresh`

**Requête** :
```json
{
  "refresh_token": "eyJhbGciOiJIUzUxMiIsInR5cCI..."
}
```

---

## 👥 Gestion des Utilisateurs

### Lister les utilisateurs
**Frontend** : `UserService.getUsers()`  
**Endpoint** : `GET /api/admin/users`  
**Backend** : `http://localhost:8081/api/admin/users`  
**Autorisation** : Rôle `ADMIN` requis

**Réponse** :
```json
[
  {
    "id": 1,
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malek@example.com",
    "role": "ADMIN",
    "keycloakId": "cee934eb-ca30-44d0-8570-00d9a0923fed"
  }
]
```

### Créer un utilisateur
**Frontend** : `UserService.createUser()`  
**Endpoint** : `POST /api/admin/users`  
**Backend** : `http://localhost:8081/api/admin/users`  
**Autorisation** : Rôle `ADMIN` requis

**Requête** :
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Test123!",
  "role": "LECTEUR"
}
```

**Réponse** :
```text
"User created successfully"
```

**Note** : L'utilisateur reçoit un email pour mettre à jour son mot de passe.

### Obtenir un utilisateur
**Frontend** : `UserService.getUserById(id)`  
**Endpoint** : `GET /api/admin/users/{id}`  
**Backend** : `http://localhost:8081/api/admin/users/{id}`

### Modifier un utilisateur
**Frontend** : `UserService.updateUser(id, user)`  
**Endpoint** : `PUT /api/admin/users/{id}`  
**Backend** : `http://localhost:8081/api/admin/users/{id}`

**Requête** :
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "role": "EDITEUR"
}
```

### Supprimer un utilisateur
**Frontend** : `UserService.deleteUser(id)`  
**Endpoint** : `DELETE /api/admin/users/{id}`  
**Backend** : `http://localhost:8081/api/admin/users/{id}`

### Changer le rôle d'un utilisateur
**Frontend** : `UserService.updateUserRole(id, role)`  
**Endpoint** : `PATCH /api/admin/users/{id}/role`  
**Backend** : `http://localhost:8081/api/admin/users/{id}/role`

**Requête** :
```json
{
  "role": "CHEF_DE_PROJET"
}
```

### Activer/Désactiver un utilisateur
**Frontend** : `UserService.toggleUserStatus(id)`  
**Endpoint** : `PATCH /api/admin/users/{id}/toggle-status`  
**Backend** : `http://localhost:8081/api/admin/users/{id}/toggle-status`

---

## 🎭 Rôles disponibles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `ADMIN` | Administrateur système | Tous les droits |
| `CHEF_DE_PROJET` | Chef de projet | Gestion des projets |
| `EDITEUR` | Éditeur de contenu | Modification des contenus |
| `LECTEUR` | Lecteur | Lecture seule |

---

## 🔒 Authentification des requêtes

Toutes les requêtes API (sauf `/auth/login` et `/auth/refresh`) doivent inclure le token Bearer dans l'en-tête :

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...
```

Ceci est géré automatiquement par [auth.interceptor.ts](src/app/interceptors/auth.interceptor.ts).

---

## 📝 Exemples avec cURL

### Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin",
    "password": "admin123"
  }'
```

### Créer un utilisateur
```bash
curl -X POST http://localhost:8081/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "Test123!",
    "role": "LECTEUR"
  }'
```

### Lister les utilisateurs
```bash
curl -X GET http://localhost:8081/api/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧪 Test avec Postman

### Collection Postman

1. **Variables d'environnement** :
   - `baseUrl`: `http://localhost:8081`
   - `token`: (sera rempli après le login)

2. **Requête Login** :
   ```
   POST {{baseUrl}}/api/auth/login
   Body (JSON):
   {
     "email": "admin",
     "password": "admin123"
   }
   
   Tests (JS):
   pm.environment.set("token", pm.response.json().access_token);
   ```

3. **Requêtes protégées** :
   ```
   Authorization: Bearer {{token}}
   ```

---

## ⚠️ Codes d'erreur HTTP

| Code | Description | Solution |
|------|-------------|----------|
| 200 | Succès | - |
| 201 | Créé | - |
| 400 | Requête invalide | Vérifier les données |
| 401 | Non authentifié | Se reconnecter |
| 403 | Accès refusé | Vérifier les rôles |
| 404 | Non trouvé | Vérifier l'ID |
| 500 | Erreur serveur | Vérifier les logs backend |

---

## 📊 Flux d'authentification

```
┌─────────────┐         ┌─────────────┐         ┌──────────┐
│   Angular   │         │  Spring Boot│         │ Keycloak │
│  Frontend   │         │   Backend   │         │          │
└──────┬──────┘         └──────┬──────┘         └────┬─────┘
       │                       │                      │
       │ POST /api/auth/login  │                      │
       ├──────────────────────>│                      │
       │                       │ POST /token          │
       │                       ├─────────────────────>│
       │                       │                      │
       │                       │ <─ access_token      │
       │                       │<─────────────────────┤
       │ <─ access_token       │                      │
       │<──────────────────────┤                      │
       │                       │                      │
       │ GET /api/admin/users  │                      │
       │ + Bearer token        │                      │
       ├──────────────────────>│                      │
       │                       │ Validate JWT         │
       │                       ├─────────────────────>│
       │                       │ <─ JWT valid         │
       │                       │<─────────────────────┤
       │ <─ users data         │                      │
       │<──────────────────────┤                      │
```

---

**Date** : Février 2026  
**Projet** : Momsoft Frontend  
**Framework** : Angular + Spring Boot + Keycloak
