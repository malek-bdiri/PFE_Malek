package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import tn.momsoft.back.dto.LoginRequest;
import tn.momsoft.back.dto.LoginResponse;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public LoginResponse login(LoginRequest request) {
        try {
            String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token",
                    keycloakServerUrl, realm);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "password");
            body.add("client_id", clientId);
            if (clientSecret != null && !clientSecret.isEmpty()) {
                body.add("client_secret", clientSecret);
            }
            body.add("username", request.getEmail());
            body.add("password", request.getPassword());

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, requestEntity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String accessToken = (String) responseBody.get("access_token");
                String refreshToken = (String) responseBody.get("refresh_token");

                // Extraire les rôles du token
                List<String> roles = extractRolesFromToken(accessToken);
                String primaryRole = roles.isEmpty() ? "USER" : roles.get(0);

                log.info("Login successful for user: {} with roles: {}", request.getEmail(), roles);

                return new LoginResponse(accessToken, primaryRole, refreshToken, roles);
            }

            throw new RuntimeException("Authentication failed");

        } catch (Exception e) {
            log.error("Login error for user {}: {}", request.getEmail(), e.getMessage());
            throw new RuntimeException("Invalid credentials: " + e.getMessage());
        }
    }

    private List<String> extractRolesFromToken(String token) {
        try {
            // Décoder le JWT pour extraire les rôles
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return List.of();
            }

            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));

            // Parser le JSON pour extraire realm_access.roles
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> claims = mapper.readValue(payload, Map.class);

            if (claims.containsKey("realm_access")) {
                Map<String, Object> realmAccess = (Map<String, Object>) claims.get("realm_access");
                if (realmAccess.containsKey("roles")) {
                    return (List<String>) realmAccess.get("roles");
                }
            }

            return List.of();
        } catch (Exception e) {
            log.error("Error extracting roles from token: {}", e.getMessage());
            return List.of();
        }
    }

    public LoginResponse refreshToken(String refreshToken) {
        try {
            String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token",
                    keycloakServerUrl, realm);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("client_id", clientId);
            if (clientSecret != null && !clientSecret.isEmpty()) {
                body.add("client_secret", clientSecret);
            }
            body.add("refresh_token", refreshToken);

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, requestEntity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String accessToken = (String) responseBody.get("access_token");
                String newRefreshToken = (String) responseBody.get("refresh_token");

                List<String> roles = extractRolesFromToken(accessToken);
                String primaryRole = roles.isEmpty() ? "USER" : roles.get(0);

                return new LoginResponse(accessToken, primaryRole, newRefreshToken, roles);
            }

            throw new RuntimeException("Token refresh failed");

        } catch (Exception e) {
            log.error("Token refresh error: {}", e.getMessage());
            throw new RuntimeException("Invalid refresh token: " + e.getMessage());
        }
    }
}
