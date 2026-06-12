package tn.momsoft.back.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.CreateUserRequest;
import tn.momsoft.back.service.EmailService;
import tn.momsoft.back.service.KeycloakUserService;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final KeycloakUserService userService;
    private final EmailService emailService;


    public UserController(KeycloakUserService userService,
                          EmailService emailService) {
        this.userService  = userService;
        this.emailService = emailService;
    }
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        try {
            List<Map<String, Object>> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ Erreur getUsers: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        try {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                request.setPassword(generateTempPassword());
            }
            String tempPassword = request.getPassword();

            String userId = userService.createUser(request);

            // Email direct via JavaMailSender — sans N8N
            emailService.sendWelcomeEmail(
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    tempPassword,
                    request.getRole()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Utilisateur créé. Email envoyé à " + request.getEmail(),
                    "userId",  userId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    private String generateTempPassword() {
        String chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt((int)(Math.random() * chars.length())));
        }
        return sb.toString();
    }
    @PutMapping("/{userId}")
    public ResponseEntity<String> updateUser(
            @PathVariable String userId,
            @RequestBody CreateUserRequest request) {
        try {
            System.out.println("🔵 PUT /api/admin/users/" + userId);
            userService.updateUser(userId, request);
            return ResponseEntity.ok("Utilisateur mis à jour avec succès");
        } catch (RuntimeException e) {
            System.err.println(" Erreur updateUser: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    // Dans UserController.java — ajouter
    // UserController.java — remplacer la méthode changePassword
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            String email       = body.get("email");
            String newPassword = body.get("newPassword");

            if (email == null || newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email et nouveau mot de passe requis (min 6 chars)"));
            }

            // Trouver l'userId par email
            String userId = userService.getUserIdByEmail(email);

            // Changer le mdp et supprimer UPDATE_PASSWORD
            userService.forceChangePassword(userId, newPassword);

            return ResponseEntity.ok(Map.of(
                    "message", "Mot de passe changé avec succès"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable String userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok("Utilisateur supprimé");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}