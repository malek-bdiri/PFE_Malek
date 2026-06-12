package tn.momsoft.back.service;

import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import tn.momsoft.back.dto.CreateUserRequest;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KeycloakUserService {

    private final Keycloak keycloak;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin-realm:master}")
    private String adminRealm;

    @Value("${keycloak.admin-client-secret:}")
    private String adminClientSecret;
    @Value("${n8n.webhook.base-url:http://localhost:5678}")
    private String n8nBaseUrl;

    public KeycloakUserService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    public String getAdminToken() {
        String url = serverUrl + "/realms/" + adminRealm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", adminClientId);
        body.add("grant_type", "password");
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        if (adminClientSecret != null && !adminClientSecret.isBlank()) {
            body.add("client_secret", adminClientSecret);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, request,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || responseBody.get("access_token") == null) {
                throw new RuntimeException("Token Keycloak absent dans la reponse");
            }
            return responseBody.get("access_token").toString();
        } catch (HttpStatusCodeException e) {
            String details = e.getResponseBodyAsString();
            System.err.println("❌ Erreur token Keycloak: HTTP " + e.getStatusCode() + " - " + details);
            throw new RuntimeException("Erreur token Keycloak: HTTP " + e.getStatusCode() + " - " + details, e);
        }
    }

    public List<Map<String, Object>> getAllUsers() {
        System.out.println("🔵 Récupération users via REST direct");
        try {
            String token = getAdminToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            String usersUrl = serverUrl + "/admin/realms/" + realm + "/users?max=1000&briefRepresentation=true";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    usersUrl, HttpMethod.GET, request,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            List<Map<String, Object>> users = response.getBody();
            if (users == null) return List.of();

            System.out.println("✅ " + users.size() + " utilisateurs récupérés");

            List<String> businessRoles = List.of("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR");

            for (Map<String, Object> user : users) {
                String userId = (String) user.get("id");

                user.put("firstname", user.getOrDefault("firstName", ""));
                user.put("lastname",  user.getOrDefault("lastName",  ""));

                try {
                    String rolesUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
                    ResponseEntity<List<Map<String, Object>>> rolesResp = restTemplate.exchange(
                            rolesUrl, HttpMethod.GET, request,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );
                    List<Map<String, Object>> roles = rolesResp.getBody();

                    String primaryRole = "Aucun rôle";
                    if (roles != null) {
                        primaryRole = businessRoles.stream()
                                .filter(br -> roles.stream().anyMatch(r -> br.equals(r.get("name"))))
                                .findFirst()
                                .orElse("Aucun rôle");
                    }
                    user.put("role", primaryRole);

                } catch (Exception e) {
                    user.put("role", "Aucun rôle");
                    System.err.println("⚠️ Erreur rôle pour " + userId + ": " + e.getMessage());
                }
            }

            return users;

        } catch (Exception e) {
            System.err.println("❌ Erreur getAllUsers: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur récupération users: " + e.getMessage());
        }
    }

    public String createUser(CreateUserRequest request) {
        System.out.println("🔵 Création user: " + request.getEmail());

        var realmResource = keycloak.realm(realm);
        var users = realmResource.users();

        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(request.getEmail());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmailVerified(true);
        user.setRequiredActions(List.of("UPDATE_PASSWORD")); // ← forcer changement mdp

        Response response = users.create(user);
        String responseBody = response.readEntity(String.class);
        System.out.println("🔴 Keycloak status: " + response.getStatus());

        if (response.getStatus() == 409)
            throw new RuntimeException("Email déjà utilisé");
        if (response.getStatus() != 201)
            throw new RuntimeException("Erreur Keycloak " + response.getStatus() + ": " + responseBody);

        String userId = response.getLocation().getPath()
                .replaceAll(".*/([^/]+)$", "$1");

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(true); // ← temporaire = Keycloak force le changement

        users.get(userId).resetPassword(credential);

        RoleRepresentation role = realmResource.roles()
                .get(request.getRole()).toRepresentation();
        users.get(userId).roles().realmLevel().add(List.of(role));

        System.out.println("✅ User créé: " + userId + " avec rôle: " + request.getRole());
        return userId; // ← retourner l'ID
    }
    public void updateUser(String userId, CreateUserRequest request) {
        System.out.println("🔵 Mise à jour user: " + userId);
        try {
            String token = getAdminToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construire le body de mise à jour
            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("firstName", request.getFirstName());
            userUpdate.put("lastName", request.getLastName());
            userUpdate.put("email", request.getEmail());
            userUpdate.put("username", request.getEmail());
            userUpdate.put("enabled", true);

            HttpEntity<Map<String, Object>> updateRequest = new HttpEntity<>(userUpdate, headers);

            // PUT /admin/realms/momsoft/users/{userId}
            String userUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId;
            restTemplate.exchange(userUrl, HttpMethod.PUT, updateRequest, Void.class);
            System.out.println("✅ Infos user mises à jour");

            // Mettre à jour le rôle si fourni
            if (request.getRole() != null && !request.getRole().isEmpty()) {
                updateUserRole(userId, request.getRole(), token);
            }

            // Mettre à jour le mot de passe si fourni
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                updateUserPassword(userId, request.getPassword(), token);
            }

            System.out.println("✅ User mis à jour: " + userId);

        } catch (Exception e) {
            System.err.println("❌ Erreur updateUser: " + e.getMessage());
            throw new RuntimeException("Erreur mise à jour: " + e.getMessage());
        }
    }
    // KeycloakUserService.java — ajouter ces 3 méthodes

    // Vérifier le mdp temporaire via token
    public boolean verifyPassword(String email, String password) {
        try {
            String url = serverUrl + "/realms/" + realm
                    + "/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id",     "momsoft-app"); // ton client public Angular
            body.add("grant_type",    "password");
            body.add("username",      email);
            body.add("password",      password);

            HttpEntity<MultiValueMap<String, String>> request =
                    new HttpEntity<>(body, headers);

            restTemplate.postForObject(url, request, Map.class);
            return true; // pas d'exception = mdp correct
        } catch (Exception e) {
            return false;
        }
    }

    // getUserIdByEmail — doit être dans KeycloakUserService
    public String getUserIdByEmail(String email) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        String url = serverUrl + "/admin/realms/" + realm
                + "/users?email=" + email + "&exact=true";

        ResponseEntity<List<Map<String, Object>>> resp =
                restTemplate.exchange(url, HttpMethod.GET,
                        new HttpEntity<>(headers),
                        new ParameterizedTypeReference<>() {});

        List<Map<String, Object>> users = resp.getBody();
        if (users == null || users.isEmpty())
            throw new RuntimeException("Utilisateur non trouvé: " + email);

        return (String) users.get(0).get("id");
    }

    // forceChangePassword — doit être dans KeycloakUserService
    public void forceChangePassword(String userId, String newPassword) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 1. Nouveau mdp permanent
        Map<String, Object> credential = new HashMap<>();
        credential.put("type",      "password");
        credential.put("value",     newPassword);
        credential.put("temporary", false);

        restTemplate.exchange(
                serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/reset-password",
                HttpMethod.PUT,
                new HttpEntity<>(credential, headers),
                Void.class
        );

        // 2. Supprimer UPDATE_PASSWORD
        Map<String, Object> userUpdate = new HashMap<>();
        userUpdate.put("requiredActions", List.of());

        restTemplate.exchange(
                serverUrl + "/admin/realms/" + realm + "/users/" + userId,
                HttpMethod.PUT,
                new HttpEntity<>(userUpdate, headers),
                Void.class
        );

        System.out.println("✅ Mdp changé pour userId: " + userId);
    }

//    public void sendWelcomeEmail(String email, String firstName,
//                                 String lastName, String password, String role) {
//        System.out.println("📧 sendWelcomeEmail appelé pour: " + email);
//        try {
//            String webhookUrl = n8nBaseUrl + "/webhook/welcome-user";
//            System.out.println("📧 URL N8N: " + webhookUrl);
//
//            Map<String, Object> payload = new HashMap<>();
//            payload.put("email",     email);
//            payload.put("firstName", firstName);
//            payload.put("lastName",  lastName);
//            payload.put("password",  password);
//            payload.put("role",      role);
//            payload.put("loginUrl",  "http://localhost:4200/login");
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            restTemplate.postForObject(
//                    webhookUrl,
//                    new HttpEntity<>(payload, headers),
//                    String.class
//            );
//            System.out.println("✅ Email bienvenue envoyé à " + email);
//        } catch (Exception e) {
//            System.err.println("⚠️ Email non envoyé: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }

    private void updateUserRole(String userId, String newRole, String token) {
        System.out.println("🔵 Mise à jour rôle: " + newRole);
        List<String> businessRoles = List.of("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> getRequest = new HttpEntity<>(headers);

        String rolesUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        ResponseEntity<List<Map<String, Object>>> currentRolesResp = restTemplate.exchange(
                rolesUrl, HttpMethod.GET, getRequest,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        List<Map<String, Object>> currentRoles = currentRolesResp.getBody();
        if (currentRoles != null) {
            List<Map<String, Object>> rolesToRemove = currentRoles.stream()
                    .filter(r -> businessRoles.contains(r.get("name")))
                    .collect(Collectors.toList());

            if (!rolesToRemove.isEmpty()) {
                HttpEntity<List<Map<String, Object>>> deleteRequest = new HttpEntity<>(rolesToRemove, headers);
                restTemplate.exchange(rolesUrl, HttpMethod.DELETE, deleteRequest, Void.class);
            }
        }

        String roleUrl = serverUrl + "/admin/realms/" + realm + "/roles/" + newRole;
        ResponseEntity<Map<String, Object>> roleResp = restTemplate.exchange(
                roleUrl, HttpMethod.GET, getRequest,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        Map<String, Object> roleBody = roleResp.getBody();
        if (roleBody == null) {
            throw new RuntimeException("Rôle introuvable dans Keycloak: " + newRole);
        }

        List<Map<String, Object>> rolesToAdd = List.of(roleBody);
        HttpEntity<List<Map<String, Object>>> addRequest = new HttpEntity<>(rolesToAdd, headers);
        restTemplate.exchange(rolesUrl, HttpMethod.POST, addRequest, Void.class);
        System.out.println("✅ Rôle mis à jour: " + newRole);
    }

    private void updateUserPassword(String userId, String newPassword, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", newPassword);
        credential.put("temporary", true);

        String passwordUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/reset-password";
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(credential, headers);
        restTemplate.exchange(passwordUrl, HttpMethod.PUT, request, Void.class);
        System.out.println("✅ Mot de passe mis à jour");
    }
    public void deleteUser(String userId) {
        System.out.println("🔵 Suppression user: " + userId);
        try {
            String token = getAdminToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            String userUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId;
            restTemplate.exchange(userUrl, HttpMethod.DELETE, request, Void.class);

            System.out.println("✅ User supprimé: " + userId);
        } catch (Exception e) {
            System.err.println(" Erreur deleteUser: " + e.getMessage());
            throw new RuntimeException("Erreur suppression: " + e.getMessage());
        }
    }
}

