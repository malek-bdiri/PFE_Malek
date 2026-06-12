# 🚀 Guide de Démarrage Rapide - Authentification Keycloak

## ✅ Ce qui a été mis en place

### 1. Service d'authentification avec Keycloak
- **AuthService**: Service qui communique avec Keycloak pour l'authentification
- Endpoints de login et refresh token
- Extraction automatique des rôles depuis le JWT Keycloak

### 2. Gestion des rôles
Les rôles suivants sont configurés dans l'application:
- `ADMIN`
- `CHEF_DE_PROJET`
- `EDITEUR`
- `LECTEUR`

### 3. Controllers
- **AuthController**: `/api/auth/login`, `/api/auth/refresh`
- **RoleTestController**: Endpoints de test pour chaque rôle

### 4. Configuration Spring Security
- OAuth2 Resource Server configuré
- Extraction des rôles depuis `realm_access.roles` du JWT
- Endpoints publics et protégés

---

## 📋 Étapes de Configuration Keycloak

### Étape 1: Créer les rôles dans Keycloak

1. Ouvrez Keycloak: http://localhost:8080
2. Connectez-vous avec admin/admin123
3. Sélectionnez le realm **momsoft**
4. Allez dans **Realm roles** → **Create role**
5. Créez ces rôles:
   - ADMIN
   - CHEF_DE_PROJET
   - EDITEUR
   - LECTEUR

### Étape 2: Assigner les rôles aux utilisateurs

Pour **admin** (malekbdiri06@gmail.com):
1. **Users** → Cherchez "admin"
2. **Role mapping** → **Assign role**
3. Sélectionnez **ADMIN**

Pour **admin2** (malek.bdiri@esprit.tn):
1. **Users** → Cherchez "admin2"
2. **Role mapping** → **Assign role**
3. Sélectionnez **CHEF_DE_PROJET**

Pour **malek** (malekbdiri05@gmail.com):
1. **Users** → Cherchez "malek"
2. **Role mapping** → **Assign role**
3. Sélectionnez **EDITEUR** et **LECTEUR**

### Étape 3: Configurer le client momsoft-rest-api

1. **Clients** → Sélectionnez **momsoft-rest-api**
2. Si le client n'existe pas, créez-le:
   - Client ID: `momsoft-rest-api`
   - Client Protocol: `openid-connect`
   - Access Type: `public` (ou `confidential` si vous voulez un secret)
3. Configurez:
   ```
   Valid Redirect URIs: http://localhost:8081/*
   Web Origins: http://localhost:8081
   ```
4. Si Access Type = confidential:
   - Allez dans **Credentials**
   - Copiez le **Client Secret**
   - Ajoutez-le dans `application.properties`:
     ```properties
     keycloak.client-secret=VOTRE_SECRET_ICI
     ```

---

## 🧪 Test de l'application

### 1. Démarrer l'application

```bash
cd C:\Users\malek\OneDrive\Bureau\pfeback
.\mvnw.cmd spring-boot:run
```

### 2. Tester le login

**Endpoint**: `POST http://localhost:8081/api/auth/login`

**Body**:
```json
{
  "email": "malekbdiri06@gmail.com",
  "password": "votre_mot_de_passe"
}
```

**Réponse attendue**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["ADMIN", "offline_access", "uma_authorization"]
}
```

### 3. Tester un endpoint protégé

**Endpoint**: `GET http://localhost:8081/api/test/admin`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Réponse attendue**:
```
This is an ADMIN only endpoint
```

### 4. Tous les endpoints de test disponibles

| Endpoint | Rôle requis | Description |
|----------|-------------|-------------|
| `GET /api/test/public` | Aucun | Endpoint public |
| `GET /api/test/authenticated` | Authentifié | Affiche les infos utilisateur |
| `GET /api/test/admin` | ADMIN | Test rôle ADMIN |
| `GET /api/test/chef` | CHEF_DE_PROJET | Test rôle CHEF |
| `GET /api/test/editeur` | EDITEUR ou ADMIN | Test rôle EDITEUR |
| `GET /api/test/lecteur` | LECTEUR ou ADMIN | Test rôle LECTEUR |

---

## 📝 Exemple avec Postman

### Collection Postman

#### 1. Login
```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "malekbdiri06@gmail.com",
  "password": "votre_mot_de_passe"
}
```

#### 2. Sauvegarder le token
Après le login, copiez le `accessToken` de la réponse.

#### 3. Tester un endpoint protégé
```
GET http://localhost:8081/api/test/admin
Authorization: Bearer {accessToken}
```

---

## 🐛 Résolution des problèmes

### Erreur: "Invalid credentials"
- ✅ Vérifiez que Keycloak est démarré sur http://localhost:8080
- ✅ Vérifiez que le realm `momsoft` existe
- ✅ Vérifiez que l'utilisateur existe dans Keycloak
- ✅ Vérifiez le mot de passe

### Erreur: "403 Forbidden"
- ✅ Vérifiez que l'utilisateur a le rôle requis dans Keycloak
- ✅ Vérifiez que le nom du rôle est exact (ADMIN, pas admin)

### Erreur: "401 Unauthorized"
- ✅ Vérifiez que le token est dans le header `Authorization: Bearer {token}`
- ✅ Vérifiez que le token n'est pas expiré
- ✅ Utilisez le refresh token si nécessaire

### Le token ne contient pas les rôles
1. Décodez le token sur https://jwt.io
2. Vérifiez qu'il y a une section `realm_access.roles`
3. Si elle n'existe pas, vérifiez que les rôles sont bien assignés dans Keycloak

---

## 📦 Structure des fichiers modifiés

```
pfeback/
├── src/main/java/tn/momsoft/back/
│   ├── controller/
│   │   ├── AuthController.java ✅ (mis à jour)
│   │   └── RoleTestController.java ✨ (nouveau)
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java ✅ (mis à jour)
│   │   └── RefreshTokenRequest.java ✨ (nouveau)
│   ├── security/
│   │   ├── SecurityConfig.java ✅ (mis à jour)
│   │   └── KeycloakAdminConfig.java ✅ (mis à jour)
│   └── service/
│       └── AuthService.java ✅ (mis à jour)
├── src/main/resources/
│   └── application.properties ✅ (mis à jour)
├── KEYCLOAK_SETUP.md ✨ (nouveau)
└── QUICK_START.md ✨ (ce fichier)
```

---

## 🔐 Prochaines étapes

1. **Tester tous les endpoints** avec différents utilisateurs et rôles
2. **Configurer le client secret** si nécessaire
3. **Ajouter la gestion des erreurs** personnalisée
4. **Implémenter le logout** (révocation de token)
5. **Ajouter des permissions granulaires** si nécessaire

---

## 📚 Documentation complète

Pour plus de détails, consultez le fichier `KEYCLOAK_SETUP.md` qui contient:
- Configuration complète de Keycloak
- Tous les endpoints disponibles
- Exemples avec cURL
- Guide de dépannage complet
- Considérations de sécurité pour la production

---

**✨ Votre application est maintenant prête à utiliser Keycloak pour l'authentification et la gestion des rôles !**

