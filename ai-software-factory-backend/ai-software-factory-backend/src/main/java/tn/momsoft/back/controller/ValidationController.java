package tn.momsoft.back.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.momsoft.back.entity.Projet;
import tn.momsoft.back.entity.ValidationRequest;
import tn.momsoft.back.repository.ProjetRepository;
import tn.momsoft.back.repository.ValidationRequestRepository;
import tn.momsoft.back.service.KeycloakUserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projets")
@CrossOrigin(origins = "*")
public class ValidationController {

    private final ValidationRequestRepository validationRepo;
    private final ProjetRepository projetRepository;
    private final KeycloakUserService keycloakUserService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${n8n.webhook-url:http://localhost:5678/webhook}")
    private String n8nUrl;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    public ValidationController(ValidationRequestRepository validationRepo,
                                ProjetRepository projetRepository,
                                KeycloakUserService keycloakUserService) {
        this.validationRepo = validationRepo;
        this.projetRepository = projetRepository;
        this.keycloakUserService = keycloakUserService;
    }

    // ── Liste des validateurs (accessible à tous les rôles authentifiés) ──
    @GetMapping("/validateurs")
    public ResponseEntity<List<Map<String, Object>>> getValidateurs() {
        List<Map<String, Object>> tous = keycloakUserService.getAllUsers();
        List<Map<String, Object>> validateurs = tous.stream()
                .filter(u -> "ADMIN".equals(u.get("role")) || "CHEF_DE_PROJET".equals(u.get("role")))
                .collect(Collectors.toList());
        return ResponseEntity.ok(validateurs);
    }

    // ── Admin/Editeur choisit validateur ──────────────────────────────────
    @PostMapping("/{projetId}/demande-validation")
    public ResponseEntity<?> demanderValidation(
            @PathVariable Long projetId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));

        String demandeurId    = jwt.getSubject();
        String demandeurNom   = jwt.getClaimAsString("name");
        String demandeurEmail = jwt.getClaimAsString("email");
        if (demandeurNom == null)
            demandeurNom = jwt.getClaimAsString("preferred_username");

        validationRepo.findByProjetIdAndStatut(
                projetId, ValidationRequest.Statut.EN_ATTENTE
        ).ifPresent(old -> {
            old.setStatut(ValidationRequest.Statut.REFUSE);
            validationRepo.save(old);
        });

        ValidationRequest req = new ValidationRequest();
        req.setProjetId(projetId);
        req.setProjetNom(projet.getNom());
        req.setDemandeurId(demandeurId);
        req.setDemandeurNom(demandeurNom);
        req.setDemandeurEmail(demandeurEmail);
        req.setValidateurId(body.get("validateurId"));
        req.setValidateurNom(body.get("validateurNom"));
        req.setValidateurEmail(body.get("validateurEmail"));
        validationRepo.save(req);

        projet.setStatutValidation(Projet.StatutValidation.EN_ATTENTE);
        projetRepository.save(projet);

        try {
            Map<String, Object> payload = Map.of(
                    "projetId",        projetId,
                    "projetNom",       projet.getNom(),
                    "demandeurNom",    demandeurNom,
                    "demandeurEmail",  demandeurEmail,
                    "validateurNom",   body.get("validateurNom"),
                    "validateurEmail", body.get("validateurEmail"),
                    "lienProjet",      frontendUrl + "/admin/projets/" + projetId
            );
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    n8nUrl + "/demande-validation",
                    new HttpEntity<>(payload, h), String.class
            );
        } catch (Exception e) {
            System.err.println("⚠️ n8n: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("statut", "EN_ATTENTE"));
    }

    // ── Validateur décide ─────────────────────────────────────────────────
    @PostMapping("/{projetId}/valider")
    public ResponseEntity<?> valider(
            @PathVariable Long projetId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();

        ValidationRequest req = validationRepo
                .findByProjetIdAndStatut(projetId, ValidationRequest.Statut.EN_ATTENTE)
                .orElse(null);

        if (req == null)
            return ResponseEntity.status(404).body("Aucune demande en attente");
        if (!req.getValidateurId().equals(userId))
            return ResponseEntity.status(403).body("Vous n'êtes pas le validateur désigné");

        String decision = body.getOrDefault("decision", "VALIDE");
        req.setStatut(ValidationRequest.Statut.valueOf(decision));
        req.setCommentaire(body.get("commentaire"));
        req.setValidatedAt(LocalDateTime.now());
        validationRepo.save(req);

        projetRepository.findById(projetId).ifPresent(p -> {
            p.setStatutValidation(
                    "VALIDE".equals(decision)
                            ? Projet.StatutValidation.VALIDE
                            : Projet.StatutValidation.REVISION
            );
            projetRepository.save(p);
        });

        try {
            Map<String, Object> payload = Map.of(
                    "projetId",       projetId,
                    "projetNom",      req.getProjetNom(),
                    "decision",       decision,
                    "validateurNom",  req.getValidateurNom(),
                    "demandeurEmail", req.getDemandeurEmail(),
                    "demandeurNom",   req.getDemandeurNom(),
                    "commentaire",    body.getOrDefault("commentaire", ""),
                    "lienProjet",     frontendUrl + "/admin/projets/" + projetId
            );
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    n8nUrl + "/validation-effectuee",
                    new HttpEntity<>(payload, h), String.class
            );
        } catch (Exception e) {
            System.err.println("⚠️ n8n: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("statut", decision));
    }

    // ── Angular vérifie le statut ─────────────────────────────────────────
    @GetMapping("/{projetId}/validation-status")
    public ResponseEntity<?> getStatus(
            @PathVariable Long projetId,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();

        return validationRepo
                .findByProjetIdAndStatut(projetId, ValidationRequest.Statut.EN_ATTENTE)
                .map(req -> ResponseEntity.ok(Map.of(
                        "statut",        req.getStatut().name(),
                        "isValidateur",  req.getValidateurId().equals(userId),
                        "validateurNom", req.getValidateurNom(),
                        "demandeurNom",  req.getDemandeurNom()
                )))
                .orElseGet(() ->
                        projetRepository.findById(projetId)
                                .map(p -> ResponseEntity.ok(Map.of(
                                        "statut",       p.getStatutValidation().name(),
                                        "isValidateur", false
                                )))
                                .orElse(ResponseEntity.ok(Map.of(
                                        "statut", "AUCUNE", "isValidateur", false
                                )))
                );
    }
}