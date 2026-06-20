package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.momsoft.back.entity.TestScenario;
import tn.momsoft.back.service.TestScenarioService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test-scenarios")
@RequiredArgsConstructor
public class TestScenarioController {

    // ── Injection des dépendances ──────────────────────────────────────────
    private final TestScenarioService testService;
    private final RestTemplate        restTemplate;

    @Value("${rag.api.base-url:http://localhost:8000}")
    private String ragApiUrl;

    // ── POST : générer scénarios depuis AFD via IA ─────────────────────────
    @PostMapping("/generate")
    public ResponseEntity<?> generateFromAFD(@RequestBody GenerateTestRequest req) {

        // 1. Construire le payload pour FastAPI RAG
        Map<String, Object> payload = Map.of(
                "afd_titre",            req.getAfdTitre(),
                "exigence_description", req.getExigenceDescription(),
                "champs",               req.getChamps()   != null ? req.getChamps()   : "",
                "regles",               req.getRegles()   != null ? req.getRegles()   : "",
                "gaps",                 req.getGaps()     != null ? req.getGaps()     : ""
        );

        // 2. Appeler FastAPI RAG
        ResponseEntity<Map> ragResponse = restTemplate.postForEntity(
                ragApiUrl + "/generate/tests", payload, Map.class
        );

        if (ragResponse.getBody() == null) {
            return ResponseEntity.internalServerError().body("Pas de réponse du service IA");
        }

        // 3. Extraire les scénarios générés
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> scenarios =
                (List<Map<String, Object>>) ragResponse.getBody().get("scenarios");

        if (scenarios == null || scenarios.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        // 4. Sauvegarder en base
        List<TestScenario> saved = testService.saveGeneratedScenarios(scenarios, req);
        return ResponseEntity.ok(saved);
    }

    // ── GET : tous les scénarios d'un projet ──────────────────────────────
    @GetMapping("/projet/{projetId}")
    public ResponseEntity<List<TestScenario>> getByProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(testService.findByProjetId(projetId));
    }

    // ── GET : un scénario par ID ───────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TestScenario> getById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.findById(id));
    }

    // ── POST : créer un scénario manuellement ─────────────────────────────
    @PostMapping
    public ResponseEntity<TestScenario> create(@RequestBody TestScenario scenario) {
        return ResponseEntity.ok(testService.save(scenario));
    }

    // ── PUT : mettre à jour le statut d'un cas de test ────────────────────
    @PutMapping("/cas/{caseId}/statut")
    public ResponseEntity<?> updateCaseStatut(
            @PathVariable Long caseId,
            @RequestBody Map<String, String> body
    ) {
        testService.updateCaseStatut(
                caseId,
                body.get("statut"),
                body.get("resultatObtenu")
        );
        return ResponseEntity.ok().build();
    }

    // ── PUT : valider un scénario ──────────────────────────────────────────
    @PutMapping("/{id}/valider")
    public ResponseEntity<?> valider(@PathVariable Long id) {
        testService.validerScenario(id);
        return ResponseEntity.ok().build();
    }

    // ── DELETE : supprimer un scénario ────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        testService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ══════════════════════════════════════════════════════════════════════
    // DTO interne — GenerateTestRequest
    // Crée ce fichier dans : tn.momsoft.back.controller/GenerateTestRequest.java
    // ou déplace-le dans tn.momsoft.back.dto/
    // ══════════════════════════════════════════════════════════════════════
    public static class GenerateTestRequest {

        private Long   projetId;
        private Long   afdId;
        private String afdTitre;
        private String exigenceDescription;
        private String champs;
        private String regles;
        private String gaps;

        // Getters et Setters
        public Long   getProjetId()              { return projetId; }
        public void   setProjetId(Long v)        { this.projetId = v; }

        public Long   getAfdId()                 { return afdId; }
        public void   setAfdId(Long v)           { this.afdId = v; }

        public String getAfdTitre()              { return afdTitre; }
        public void   setAfdTitre(String v)      { this.afdTitre = v; }

        public String getExigenceDescription()   { return exigenceDescription; }
        public void   setExigenceDescription(String v) { this.exigenceDescription = v; }

        public String getChamps()                { return champs; }
        public void   setChamps(String v)        { this.champs = v; }

        public String getRegles()                { return regles; }
        public void   setRegles(String v)        { this.regles = v; }

        public String getGaps()                  { return gaps; }
        public void   setGaps(String v)          { this.gaps = v; }
    }
}