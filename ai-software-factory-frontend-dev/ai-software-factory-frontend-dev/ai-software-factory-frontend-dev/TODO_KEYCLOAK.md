# ✅ Checklist d'intégration Keycloak

## 🎯 Modifications effectuées sur le Frontend

- [x] Mise à jour du modèle `User` avec les champs Keycloak
- [x] Mise à jour de `LoginResponse` pour correspondre à la réponse Keycloak
- [x] Refactoring de `AuthService` pour gérer les tokens JWT Keycloak
- [x] Mise à jour de `UserService` pour utiliser `/api/admin/users`
- [x] Mise à jour de l'intercepteur HTTP
- [x] Mise à jour des rôles : `ADMIN`, `CHEF_DE_PROJET`, `EDITEUR`, `LECTEUR`
- [x] Documentation créée

## 🚀 Prochaines étapes

### 1. Backend - Endpoints manquants à implémenter
Le frontend attend ces endpoints qui ne sont pas encore implémentés dans votre backend :

#### ✅ Déjà implémenté :
- `POST /api/auth/login` - ✅ (via AuthController)
- `POST /api/admin/users` - ✅ (via UserController.createUser)

#### ⚠️ À implémenter :
- `GET /api/admin/users` - Liste tous les utilisateurs
- `GET /api/admin/users/{id}` - Obtenir un utilisateur par ID
- `PUT /api/admin/users/{id}` - Modifier un utilisateur
- `DELETE /api/admin/users/{id}` - Supprimer un utilisateur
- `PATCH /api/admin/users/{id}/role` - Changer le rôle
- `PATCH /api/admin/users/{id}/toggle-status` - Activer/Désactiver
- `POST /api/auth/refresh` - Rafraîchir le token

### 2. Backend - Exemple de code à ajouter

#### UserController.java - Méthodes à ajouter :
```java
@GetMapping
public List<UserRepresentation> getUsers() {
    return userService.getAllUsers();
}

@GetMapping("/{id}")
public UserRepresentation getUser(@PathVariable String id) {
    return userService.getUserById(id);
}

@PutMapping("/{id}")
public String updateUser(@PathVariable String id, @RequestBody UpdateUserRequest request) {
    userService.updateUser(id, request);
    return "User updated successfully";
}

@DeleteMapping("/{id}")
public String deleteUser(@PathVariable String id) {
    userService.deleteUser(id);
    return "User deleted successfully";
}

@PatchMapping("/{id}/role")
public String updateUserRole(@PathVariable String id, @RequestBody Map<String, String> body) {
    userService.updateUserRole(id, body.get("role"));
    return "Role updated successfully";
}

@PatchMapping("/{id}/toggle-status")
public String toggleUserStatus(@PathVariable String id) {
    userService.toggleUserStatus(id);
    return "Status updated successfully";
}
```

#### KeycloakUserService.java - Méthodes à ajouter :
```java
public List<UserRepresentation> getAllUsers() {
    return keycloak.realm("momsoft")
        .users()
        .list();
}

public UserRepresentation getUserById(String userId) {
    return keycloak.realm("momsoft")
        .users()
        .get(userId)
        .toRepresentation();
}

public void updateUser(String userId, UpdateUserRequest request) {
    var realm = keycloak.realm("momsoft");
    var userResource = realm.users().get(userId);
    
    UserRepresentation user = userResource.toRepresentation();
    user.setFirstName(request.getFirstName());
    user.setLastName(request.getLastName());
    user.setEmail(request.getEmail());
    
    userResource.update(user);
}

public void deleteUser(String userId) {
    keycloak.realm("momsoft")
        .users()
        .get(userId)
        .remove();
}

public void updateUserRole(String userId, String newRole) {
    var realm = keycloak.realm("momsoft");
    var userResource = realm.users().get(userId);
    
    // Supprimer tous les anciens rôles
    List<RoleRepresentation> currentRoles = userResource
        .roles()
        .realmLevel()
        .listEffective();
    userResource.roles().realmLevel().remove(currentRoles);
    
    // Ajouter le nouveau rôle
    RoleRepresentation role = realm.roles().get(newRole).toRepresentation();
    userResource.roles().realmLevel().add(List.of(role));
}

public void toggleUserStatus(String userId) {
    var userResource = keycloak.realm("momsoft")
        .users()
        .get(userId);
    
    UserRepresentation user = userResource.toRepresentation();
    user.setEnabled(!user.isEnabled());
    userResource.update(user);
}
```

#### AuthController.java - Ajouter refresh token :
```java
@PostMapping("/refresh")
public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
    String refreshToken = request.get("refresh_token");
    Map<String, Object> token = keycloakAuthService.refreshToken(refreshToken);
    return ResponseEntity.ok(token);
}
```

#### KeycloakAuthService.java - Ajouter méthode refresh :
```java
public Map<String, Object> refreshToken(String refreshToken) {
    RestTemplate restTemplate = new RestTemplate();
    
    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("grant_type", "refresh_token");
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("refresh_token", refreshToken);
    
    return restTemplate.postForObject(tokenUrl, params, Map.class);
}
```

### 3. Frontend - Tests à effectuer

#### Test 1 : Login
```bash
1. Ouvrir http://localhost:4200/login
2. Entrer : admin / admin123
3. Vérifier la redirection vers /admin/dashboard
4. Ouvrir DevTools > Application > Local Storage
5. Vérifier la présence de 'token', 'refresh_token', 'currentUser'
```

#### Test 2 : Création d'utilisateur
```bash
1. Aller sur /admin/parametres/utilisateurs
2. Cliquer sur "Ajouter un utilisateur"
3. Remplir :
   - Prénom : Test
   - Nom : User
   - Email : test@example.com
   - Mot de passe : Test123!
   - Rôle : LECTEUR
4. Cliquer sur "Créer"
5. Vérifier que l'utilisateur apparaît dans la liste
6. Vérifier dans Keycloak Admin (http://localhost:8080/admin)
```

#### Test 3 : Vérification du token
```bash
1. Ouvrir DevTools > Console
2. Taper :
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload);
3. Vérifier les champs : sub, email, realm_access.roles
```

### 4. Configuration Keycloak

#### Vérifier dans Keycloak Admin Console :
```bash
1. Ouvrir http://localhost:8080/admin
2. Login : admin / admin123
3. Sélectionner le realm "momsoft"
4. Clients > momsoft-rest-api :
   - Access Type : confidential
   - Valid Redirect URIs : http://localhost:4200/*
   - Web Origins : http://localhost:4200
5. Realm Roles :
   - Créer : ADMIN, CHEF_DE_PROJET, EDITEUR, LECTEUR
6. Users :
   - Vérifier que l'utilisateur admin a le rôle ADMIN
```

### 5. Débogage

#### Si le login ne fonctionne pas :
```bash
1. Vérifier que Keycloak est démarré (http://localhost:8080)
2. Vérifier que le backend est démarré (http://localhost:8081)
3. Vérifier les logs du backend :
   - L'endpoint /api/auth/login est-il appelé ?
   - Y a-t-il une erreur Keycloak ?
4. Vérifier dans DevTools > Network :
   - Status code de la requête POST /api/auth/login
   - Réponse reçue
5. Vérifier le client_secret dans application.properties
```

#### Si la création d'utilisateur échoue :
```bash
1. Vérifier le token dans la requête (DevTools > Network)
2. Vérifier que l'utilisateur actuel a le rôle ADMIN
3. Vérifier les logs backend
4. Vérifier que l'endpoint POST /api/admin/users est protégé par @PreAuthorize("hasRole('ADMIN')")
```

### 6. Améliorations futures

- [ ] Implémenter le refresh automatique du token avant expiration
- [ ] Ajouter une gestion d'erreur plus robuste (toast notifications)
- [ ] Implémenter la gestion des sessions Keycloak
- [ ] Ajouter la possibilité de se déconnecter de Keycloak
- [ ] Implémenter l'authentification SSO avec d'autres providers
- [ ] Ajouter la validation des rôles côté frontend (guards avancés)
- [ ] Implémenter la pagination pour la liste des utilisateurs
- [ ] Ajouter des filtres avancés pour la recherche d'utilisateurs

## 📚 Documentation

Toute la documentation a été créée dans :
- [KEYCLOAK_INTEGRATION.md](KEYCLOAK_INTEGRATION.md) - Guide d'intégration complet
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - Documentation des endpoints API

## 🎉 Conclusion

Votre frontend Angular est maintenant prêt pour l'intégration avec Keycloak ! 

Il ne reste plus qu'à :
1. ✅ Implémenter les endpoints manquants dans le backend
2. ✅ Tester l'authentification
3. ✅ Tester la création d'utilisateurs
4. ✅ Vérifier les rôles et permissions

Bon développement ! 🚀
