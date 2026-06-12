# 🔧 Code Backend Spring Boot - Keycloak

## Fichiers à modifier dans votre backend

### 1. `SecurityConfig.java`

```java
package tn.momsoft.back.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;

    public SecurityConfig(KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter) {
        this.keycloakJwtAuthenticationConverter = keycloakJwtAuthenticationConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // ✅ Endpoints publics
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/test/public").permitAll()
                
                // ✅ Endpoints protégés par rôle
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/test/admin").hasRole("ADMIN")
                .requestMatchers("/api/test/chef").hasRole("CHEF_DE_PROJET")
                .requestMatchers("/api/test/editeur").hasAnyRole("EDITEUR", "ADMIN")
                .requestMatchers("/api/test/lecteur").hasAnyRole("LECTEUR", "ADMIN")
                
                // ✅ Autres endpoints = authentification requise
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter))
            );

        return http.build();
    }
}
```

---

### 2. `UserController.java`

```java
package tn.momsoft.back.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.CreateUserRequest;
import tn.momsoft.back.service.KeycloakUserService;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final KeycloakUserService userService;

    public UserController(KeycloakUserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/admin/users - Liste tous les utilisateurs Keycloak
     */
    @GetMapping
    public ResponseEntity<?> getUsers() {
        try {
            log.info("📋 Début récupération des utilisateurs");
            List<Map<String, Object>> users = userService.getAllUsers();
            log.info("✅ {} utilisateurs récupérés", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/users - Créer un utilisateur dans Keycloak
     */
    @PostMapping
    public ResponseEntity<String> createUser(@RequestBody CreateUserRequest request) {
        try {
            log.info("🔵 Création utilisateur: {}", request.getEmail());
            userService.createUser(request);
            log.info("✅ Utilisateur créé: {}", request.getEmail());
            return ResponseEntity.ok("User created successfully");
        } catch (RuntimeException e) {
            log.error("❌ Erreur création utilisateur: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
```

---

### 3. `KeycloakUserService.java` - AJOUTER `getAllUsers()`

```java
package tn.momsoft.back.service;

import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.*;
import org.springframework.stereotype.Service;
import tn.momsoft.back.dto.CreateUserRequest;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KeycloakUserService {

    private final Keycloak keycloak;

    public KeycloakUserService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    /**
     * ✅ MÉTHODE À AJOUTER - Récupère tous les utilisateurs
     */
    public List<Map<String, Object>> getAllUsers() {
        List<String> appRoles = List.of("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR");
        
        List<UserRepresentation> users = keycloak.realm("momsoft")
            .users()
            .list();

        return users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("firstname", u.getFirstName());
            map.put("lastname", u.getLastName());
            map.put("email", u.getEmail() != null ? u.getEmail() : u.getUsername());
            map.put("enabled", u.isEnabled());

            // Récupérer le rôle applicatif principal
            String role = keycloak.realm("momsoft")
                .users().get(u.getId())
                .roles().realmLevel().listEffective()
                .stream()
                .map(RoleRepresentation::getName)
                .filter(appRoles::contains)
                .findFirst()
                .orElse("LECTEUR");

            map.put("role", role);
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * Crée un utilisateur dans Keycloak
     */
    public void createUser(CreateUserRequest request) {
        var realm = keycloak.realm("momsoft");
        var users = realm.users();

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(request.getEmail());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmailVerified(true);

        Response response = users.create(user);

        if (response.getStatus() != 201) {
            String body = response.readEntity(String.class);
            throw new RuntimeException("Erreur Keycloak " + response.getStatus() + ": " + body);
        }

        String userId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false); // ✅ false = pas de changement forcé

        users.get(userId).resetPassword(credential);

        // ✅ SUPPRIMER executeActionsEmail si pas de SMTP

        RoleRepresentation role = realm.roles()
                .get(request.getRole())
                .toRepresentation();

        users.get(userId).roles().realmLevel().add(List.of(role));
    }
}
```

---

## ⚠️ Points de vérification

### Dépendances Maven (pom.xml)

Assurez-vous d'avoir :

```xml
<dependency>
    <groupId>org.keycloak</groupId>
    <artifactId>keycloak-admin-client</artifactId>
    <version>23.0.0</version>
</dependency>
```

### Configuration Keycloak Bean

```java
@Configuration
public class KeycloakConfig {

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin-realm}")
    private String adminRealm;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Bean
    public Keycloak keycloak() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .username(adminUsername)
                .password(adminPassword)
                .clientId(adminClientId)
                .build();
    }
}
```

---

## 🧪 Test

Après avoir ajouté ces modifications :

1. **Redémarrez Spring Boot**
2. Dans le frontend, cliquez sur **"Réessayer"**
3. La liste des utilisateurs devrait apparaître

---

**Date** : 24 février 2026  
**Projet** : Momsoft Backend - Keycloak Integration
