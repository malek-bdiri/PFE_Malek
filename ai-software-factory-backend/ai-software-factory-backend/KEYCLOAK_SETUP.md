# Configuration Keycloak pour l'Application Backend

## 📋 Configuration Actuelle

### Serveur Keycloak
- **URL**: http://localhost:8080
- **Realm**: momsoft
- **Admin Realm**: master

### Clients Configurés
- **momsoft-client**: Client pour l'application frontend (Angular)
- **momsoft-rest-api**: Client pour l'API REST backend

### Utilisateurs Créés
1. **admin** (malekbdiri06@gmail.com)
2. **admin2** (malek.bdiri@esprit.tn)
3. **malek** (malekbdiri05@gmail.com)

---

## 🔧 Configuration Requise dans Keycloak

### 1. Créer les Rôles dans le Realm `momsoft`

Allez dans: **Realm Settings** → **Roles** → **Create Role**

Créez les rôles suivants:
- `ADMIN`
- `CHEF_DE_PROJET`
- `EDITEUR`
- `LECTEUR`

### 2. Assigner les Rôles aux Utilisateurs

Pour chaque utilisateur (admin, admin2, malek):

1. Allez dans **Users** → Sélectionnez un utilisateur
2. Cliquez sur l'onglet **Role Mapping**
3. Cliquez sur **Assign role**
4. Sélectionnez les rôles appropriés

**Exemple de configuration:**
- **admin**: ADMIN
- **admin2**: CHEF_DE_PROJET
- **malek**: EDITEUR, LECTEUR

### 3. Configurer le Client `momsoft-rest-api`

1. Allez dans **Clients** → `momsoft-rest-api`
2. Configurez les paramètres suivants:

```
Client ID: momsoft-rest-api
Client Protocol: openid-connect
Access Type: confidential (si vous utilisez un client secret)
Valid Redirect URIs: http://localhost:8081/*
Web Origins: http://localhost:8081
```

3. Dans l'onglet **Credentials**, notez le **Client Secret**
4. Copiez ce secret dans `application.properties`:

```properties
keycloak.client-secret=VOTRE_CLIENT_SECRET_ICI
```

### 4. Configurer le Client `momsoft-client` (Frontend)

1. Allez dans **Clients** → `momsoft-client`
2. Configurez:

```
Client ID: momsoft-client
Client Protocol: openid-connect
Access Type: public
Valid Redirect URIs: http://localhost:4200/*
Web Origins: http://localhost:4200
```

---

## 🚀 Endpoints Disponibles

### Endpoints Publics (sans authentification)

#### 1. **Login**
```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "malekbdiri06@gmail.com",
  "password": "votre_mot_de_passe"
}
```

**Réponse:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "ADMIN",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["ADMIN", "offline_access", "uma_authorization"]
}
```

#### 2. **Refresh Token**
```http
POST http://localhost:8081/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "votre_refresh_token"
}
```

#### 3. **Test Public**
```http
GET http://localhost:8081/api/test/public
```

### Endpoints Authentifiés

**Important:** Pour tous les endpoints suivants, ajoutez le header:
```
Authorization: Bearer {accessToken}
```

#### 4. **Test Authentifié**
```http
GET http://localhost:8081/api/test/authenticated
Authorization: Bearer {accessToken}
```

#### 5. **Test Admin** (Rôle ADMIN requis)
```http
GET http://localhost:8081/api/test/admin
Authorization: Bearer {accessToken}
```

#### 6. **Test Chef de Projet** (Rôle CHEF_DE_PROJET requis)
```http
GET http://localhost:8081/api/test/chef
Authorization: Bearer {accessToken}
```

#### 7. **Test Éditeur** (Rôle EDITEUR ou ADMIN requis)
```http
GET http://localhost:8081/api/test/editeur
Authorization: Bearer {accessToken}
```

#### 8. **Test Lecteur** (Rôle LECTEUR ou ADMIN requis)
```http
GET http://localhost:8081/api/test/lecteur
Authorization: Bearer {accessToken}
```

---

## 📝 Structure du Projet

### Services
- **AuthService**: Gère l'authentification avec Keycloak
  - `login()`: Authentifie l'utilisateur et retourne les tokens
  - `refreshToken()`: Rafraîchit l'access token
  - `extractRolesFromToken()`: Extrait les rôles du JWT

### Controllers
- **AuthController**: Endpoints d'authentification
- **RoleTestController**: Endpoints de test pour valider les rôles

### Configuration
- **SecurityConfig**: Configuration Spring Security avec OAuth2 Resource Server
- **KeycloakAdminConfig**: Configuration du client admin Keycloak

### DTOs
- **LoginRequest**: Email et mot de passe
- **LoginResponse**: Access token, rôle principal, refresh token, liste des rôles
- **RefreshTokenRequest**: Refresh token

---

## 🧪 Test avec Postman ou cURL

### Exemple 1: Login

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "malekbdiri06@gmail.com",
    "password": "votre_mot_de_passe"
  }'
```

### Exemple 2: Accéder à un endpoint protégé

```bash
curl -X GET http://localhost:8081/api/test/admin \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚠️ Dépannage

### Erreur: "Invalid credentials"
- Vérifiez que l'utilisateur existe dans Keycloak
- Vérifiez le mot de passe
- Vérifiez que le realm est bien `momsoft`

### Erreur: "403 Forbidden"
- Vérifiez que l'utilisateur a le rôle requis
- Vérifiez que le token est valide
- Vérifiez la configuration du `JwtAuthenticationConverter`

### Erreur: "401 Unauthorized"
- Vérifiez que le token est bien présent dans le header
- Vérifiez que le token n'est pas expiré
- Utilisez le refresh token pour obtenir un nouveau access token

### Le token ne contient pas les rôles
- Vérifiez que les rôles sont bien assignés dans Keycloak
- Vérifiez la configuration `realm_access.roles` dans `SecurityConfig`
- Décodez le JWT sur jwt.io pour voir son contenu

---

## 📚 Ressources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [JWT.io](https://jwt.io) - Pour décoder et inspecter les JWT

---

## 🔐 Sécurité

**Important pour la production:**

1. Changez les mots de passe par défaut
2. Utilisez HTTPS (pas HTTP)
3. Stockez le client secret de manière sécurisée (variables d'environnement)
4. Configurez des temps d'expiration appropriés pour les tokens
5. Activez la révocation de tokens
6. Utilisez des rôles et permissions granulaires

