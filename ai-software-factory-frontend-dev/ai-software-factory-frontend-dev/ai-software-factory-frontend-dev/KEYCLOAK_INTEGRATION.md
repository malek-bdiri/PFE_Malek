# 🔐 Intégration Keycloak - Guide Frontend

## 📋 Vue d'ensemble

Ce frontend Angular est maintenant intégré avec Keycloak pour l'authentification et la gestion des utilisateurs.

## 🔄 Modifications effectuées

### 1. **Modèle de données** (`user.model.ts`)
- ✅ Ajout de l'interface `LoginResponse` compatible avec Keycloak (access_token, refresh_token, etc.)
- ✅ Ajout de l'interface `CreateUserRequest` pour la création d'utilisateurs
- ✅ Ajout du champ `keycloakId` dans l'interface `User`
- ✅ Mise à jour des rôles : `ADMIN`, `CHEF_DE_PROJET`, `EDITEUR`, `LECTEUR`

### 2. **Service d'authentification** (`auth.service.ts`)
- ✅ Utilise l'endpoint `/api/auth/login` qui communique avec Keycloak
- ✅ Décodage du JWT pour extraire les informations utilisateur
- ✅ Extraction automatique du rôle principal depuis `realm_access.roles`
- ✅ Gestion du refresh token
- ✅ Vérification de l'expiration du token dans `isAuthenticated()`

### 3. **Service utilisateur** (`user.service.ts`)
- ✅ Utilise l'endpoint `/api/admin/users` pour créer des utilisateurs dans Keycloak
- ✅ Format de requête compatible avec le backend Keycloak

### 4. **Intercepteur HTTP** (`auth.interceptor.ts`)
- ✅ Ajoute automatiquement le token Bearer aux requêtes API
- ✅ Exclut les endpoints d'authentification (`/auth/login`, `/auth/refresh`)

## 🚀 Comment tester

### 1. **Démarrer le backend**
Assurez-vous que :
- Keycloak est démarré sur `http://localhost:8080`
- Le backend Spring Boot est démarré sur `http://localhost:8081`
- Le realm `momsoft` est configuré dans Keycloak
- Le client `momsoft-rest-api` est créé avec le bon secret

### 2. **Démarrer le frontend**
```bash
npm start
# ou
ng serve
```

Le frontend sera disponible sur `http://localhost:4200`

### 3. **Test de connexion**

#### Depuis Postman (test backend direct) :
```
POST http://localhost:8080/realms/momsoft/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

Body (x-www-form-urlencoded):
- grant_type: password
- client_id: momsoft-rest-api
- client_secret: 0wlVf0sdR598XHW4HRNS8ILpE9MtU6Cl
- username: admin
- password: admin123
```

#### Depuis l'application Angular :
1. Ouvrir `http://localhost:4200/login`
2. Entrer les identifiants :
   - **Email** : `admin` (ou l'email configuré dans Keycloak)
   - **Password** : `admin123`
3. Cliquer sur "Se connecter"

**Résultat attendu** :
- Redirection vers `/admin/dashboard`
- Token stocké dans `localStorage` sous la clé `token`
- Informations utilisateur dans `localStorage` sous la clé `currentUser`

### 4. **Test de création d'utilisateur**

1. Aller sur `/admin/parametres/utilisateurs`
2. Cliquer sur "Ajouter un utilisateur"
3. Remplir le formulaire :
   - Prénom : `John`
   - Nom : `Doe`
   - Email : `john.doe@example.com`
   - Mot de passe : `Test123!`
   - Rôle : `LECTEUR`
4. Cliquer sur "Créer"

**Résultat attendu** :
- L'utilisateur est créé dans Keycloak
- Un email de vérification est envoyé (si configuré)
- L'utilisateur apparaît dans la liste

## 📝 Structure de la réponse d'authentification

### Réponse de Keycloak :
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJIUzUxMiIsInR5cCI...",
  "token_type": "Bearer",
  "not-before-policy": 0,
  "session_state": "txwU0USzydLCOMEaIfupitiJ",
  "scope": "profile email"
}
```

### Informations extraites du JWT :
```json
{
  "sub": "cee934eb-ca30-44d0-8570-00d9a0923fed",
  "email": "malekbdiri05@gmail.com",
  "given_name": "Malek",
  "family_name": "Bdiri",
  "realm_access": {
    "roles": ["ADMIN", "offline_access", "uma_authorization"]
  }
}
```

### Objet User stocké :
```json
{
  "email": "malekbdiri05@gmail.com",
  "role": "ADMIN",
  "firstname": "Malek",
  "lastname": "Bdiri",
  "keycloakId": "cee934eb-ca30-44d0-8570-00d9a0923fed"
}
```

## 🔧 Configuration Backend requise

### En-têtes de sécurité Spring Boot :
```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter))
            );
        return http.build();
    }
}
```

### Fichier application.properties :
```properties
# Keycloak Configuration
keycloak.server-url=http://localhost:8080
keycloak.realm=momsoft
keycloak.client-id=momsoft-rest-api
keycloak.client-secret=0wlVf0sdR598XHW4HRNS8ILpE9MtU6Cl

# Spring Security OAuth2
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/momsoft
```

## 🎯 Points importants

### Rôles Keycloak
Les rôles doivent être définis dans Keycloak au niveau du realm :
- `ADMIN` - Administrateur système
- `CHEF_DE_PROJET` - Chef de projet
- `EDITEUR` - Éditeur de contenu
- `LECTEUR` - Lecteur (rôle par défaut)

### Gestion des tokens
- **Access Token** : Valide pendant 5 minutes (300s)
- **Refresh Token** : Valide pendant 30 minutes (1800s)
- Le frontend vérifie automatiquement l'expiration du token
- Implémenter un refresh automatique si nécessaire

### Sécurité
- Les tokens sont stockés dans `localStorage` (considérer `sessionStorage` pour plus de sécurité)
- L'intercepteur ajoute automatiquement le token aux requêtes API
- Le guard d'authentification vérifie le token avant d'accéder aux routes protégées

## 🐛 Débogage

### Console du navigateur
Ouvrir la console (F12) pour voir les logs :
- `✅ Utilisateur connecté:` - Connexion réussie
- `🔐 Token ajouté à la requête:` - Token ajouté à une requête
- `📤 Création utilisateur Keycloak:` - Requête de création d'utilisateur

### Vérifier le token
Dans la console du navigateur :
```javascript
// Récupérer le token
const token = localStorage.getItem('token');

// Décoder le token
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Erreurs courantes

1. **401 Unauthorized** : Token invalide ou expiré
   - Solution : Se reconnecter

2. **403 Forbidden** : Pas les droits d'accès
   - Solution : Vérifier les rôles dans Keycloak

3. **CORS Error** : Problème de configuration CORS
   - Solution : Vérifier la configuration CORS dans Spring Boot

4. **Connection refused** : Backend ou Keycloak non démarré
   - Solution : Démarrer les services

## 📚 Ressources

- [Documentation Keycloak](https://www.keycloak.org/documentation)
- [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Angular HttpClient](https://angular.io/guide/http)

---

**Auteur** : Malek Bdiri  
**Date** : Février 2026  
**Version** : 1.0
