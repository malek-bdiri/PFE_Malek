# 🔧 Fix - Erreur 500 sur GET /api/admin/users

## 🎯 Problème

```
UnrecognizedPropertyException: Unrecognized field "multivalued" 
(class org.keycloak.representations.idm.UserProfileAttributeMetadata)
```

**Cause** : Conflit de versions entre `keycloak-admin-client` (bibliothèque) et Keycloak Server.

---

## ✅ Solution 1 : Utiliser `search()` au lieu de `list()`

Dans `KeycloakUserService.java`, remplacez :

```java
// ❌ ANCIEN
List<UserRepresentation> users = keycloak.realm("momsoft").users().list();
```

Par :

```java
// ✅ NOUVEAU
List<UserRepresentation> users = keycloak.realm("momsoft")
    .users()
    .search("", 0, Integer.MAX_VALUE, false);
```

### Code complet de `getAllUsers()` :

```java
public List<Map<String, Object>> getAllUsers() {
    List<String> appRoles = List.of("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR");
    
    try {
        log.info("🔵 Récupération de tous les utilisateurs du realm momsoft");
        
        // ✅ search() évite les métadonnées userProfileMetadata
        List<UserRepresentation> users = keycloak.realm("momsoft")
            .users()
            .search("", 0, Integer.MAX_VALUE, false);
        
        log.info("✅ {} utilisateurs récupérés bruts", users.size());

        return users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("firstname", u.getFirstName() != null ? u.getFirstName() : "");
            map.put("lastname", u.getLastName() != null ? u.getLastName() : "");
            map.put("email", u.getEmail() != null ? u.getEmail() : u.getUsername());
            map.put("enabled", u.isEnabled() != null ? u.isEnabled() : true);

            // Récupérer le rôle principal
            try {
                String role = keycloak.realm("momsoft")
                    .users().get(u.getId())
                    .roles().realmLevel().listEffective()
                    .stream()
                    .map(RoleRepresentation::getName)
                    .filter(appRoles::contains)
                    .findFirst()
                    .orElse("LECTEUR");
                
                map.put("role", role);
            } catch (Exception roleEx) {
                log.warn("⚠️ Impossible de récupérer le rôle pour {}", u.getUsername());
                map.put("role", "LECTEUR");
            }
            
            return map;
        }).collect(Collectors.toList());
        
    } catch (Exception e) {
        log.error("❌ Erreur dans getAllUsers: {}", e.getMessage());
        throw new RuntimeException("Erreur lors de la récupération des utilisateurs: " + e.getMessage(), e);
    }
}
```

---

## ✅ Solution 2 : Mettre à jour keycloak-admin-client

### Dans `pom.xml` :

```xml
<properties>
    <keycloak.version>26.0.7</keycloak.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.keycloak</groupId>
        <artifactId>keycloak-admin-client</artifactId>
        <version>${keycloak.version}</version>
    </dependency>
</dependencies>
```

### Commandes :

1. **Maven → Clean**
2. **Maven → Reload Project**
3. **Redémarrer Spring Boot**

---

## ✅ Solution 3 : API REST directe (si les solutions 1 et 2 échouent)

Créez `KeycloakRestService.java` :

```java
package tn.momsoft.back.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class KeycloakRestService {

    @Value("${keycloak.server-url}")
    private String keycloakUrl;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Obtenir un token admin de Keycloak
     */
    private String getAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/master/protocol/openid-connect/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        String body = String.format(
            "grant_type=password&client_id=admin-cli&username=%s&password=%s",
            adminUsername, adminPassword
        );
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        
        return (String) response.getBody().get("access_token");
    }
    
    /**
     * Récupérer tous les utilisateurs via API REST
     */
    public List<Map<String, Object>> getAllUsers() {
        try {
            String token = getAdminToken();
            String usersUrl = keycloakUrl + "/admin/realms/momsoft/users?briefRepresentation=true";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<List> response = restTemplate.exchange(
                usersUrl, 
                HttpMethod.GET, 
                request, 
                List.class
            );
            
            List<Map<String, Object>> users = (List<Map<String, Object>>) response.getBody();
            
            log.info("✅ {} utilisateurs récupérés via REST", users.size());
            
            return users.stream().map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.get("id"));
                map.put("firstname", u.getOrDefault("firstName", ""));
                map.put("lastname", u.getOrDefault("lastName", ""));
                map.put("email", u.getOrDefault("email", u.get("username")));
                map.put("enabled", u.getOrDefault("enabled", true));
                map.put("role", extractRole((String) u.get("id"), token));
                return map;
            }).collect(java.util.stream.Collectors.toList());
            
        } catch (Exception e) {
            log.error("❌ Erreur REST getAllUsers: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur API Keycloak: " + e.getMessage());
        }
    }
    
    /**
     * Récupérer le rôle d'un utilisateur
     */
    private String extractRole(String userId, String token) {
        try {
            String rolesUrl = keycloakUrl + "/admin/realms/momsoft/users/" + userId + "/role-mappings/realm";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<List> response = restTemplate.exchange(
                rolesUrl, 
                HttpMethod.GET, 
                request, 
                List.class
            );
            
            List<Map<String, Object>> roles = (List<Map<String, Object>>) response.getBody();
            List<String> appRoles = List.of("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR");
            
            return roles.stream()
                .map(r -> (String) r.get("name"))
                .filter(appRoles::contains)
                .findFirst()
                .orElse("LECTEUR");
                
        } catch (Exception e) {
            log.warn("⚠️ Impossible de récupérer le rôle pour userId {}", userId);
            return "LECTEUR";
        }
    }
}
```

Puis dans `UserController.java`, injectez ce service :

```java
private final KeycloakRestService keycloakRestService;

@GetMapping
public ResponseEntity<?> getUsers() {
    try {
        List<Map<String, Object>> users = keycloakRestService.getAllUsers();
        return ResponseEntity.ok(users);
    } catch (Exception e) {
        log.error("❌ Erreur: {}", e.getMessage());
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}
```

---

## 🔄 Ordre de test

1. **Essayez Solution 1** (search au lieu de list) → **Redémarrez Spring Boot**
2. Si ça échoue, **Solution 2** (mettre à jour version) → **Maven Reload + Restart**
3. Si ça échoue encore, **Solution 3** (API REST directe)

---

## 🧪 Test final

Après modification :

1. **Redémarrez Spring Boot**
2. Dans Angular, cliquez **"Réessayer"**
3. Vérifiez la console backend :

```
✅ X utilisateurs récupérés
```

4. Le frontend devrait afficher la liste

---

**Date** : 24 février 2026  
**Projet** : Momsoft Backend - Fix Keycloak User List
