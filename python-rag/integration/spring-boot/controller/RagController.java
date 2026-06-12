package com.momsoft.smartfactory.controller;

import com.momsoft.smartfactory.service.RagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Contrôleur REST — Proxy vers Python RAG.
 * Angular appelle Spring Boot (8081), qui forward vers FastAPI (8000).
 */
@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = {"http://localhost:4200"})
public class RagController {

    private final RagService ragService;

    public RagController(RagService ragService) {
        this.ragService = ragService;
    }

    /**
     * GET /api/rag/health — Santé du backend Python.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(ragService.health());
    }

    /**
     * POST /api/rag/project/generate
     *
     * Upload CdC + métadonnées projet → génération automatique des exigences.
     * Le fichier est transmis directement au backend Python.
     */
    @PostMapping("/project/generate")
    public ResponseEntity<Map<String, Object>> projectGenerate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "projectName", defaultValue = "") String projectName,
            @RequestParam(value = "projectId", defaultValue = "") String projectId,
            @RequestParam(value = "clientName", defaultValue = "") String clientName,
            @RequestParam(value = "productName", defaultValue = "Smart Factory MOMsoft") String productName,
            @RequestParam(value = "language", defaultValue = "Français") String language,
            @RequestParam(value = "topK", defaultValue = "8") int topK
    ) {
        try {
            Map<String, Object> result = ragService.projectGenerate(
                    file, projectName, projectId, clientName, productName, language, topK
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        }
    }

    /**
     * POST /api/rag/generate/exigences — Génération depuis texte brut (sans fichier).
     */
    @PostMapping("/generate/exigences")
    public ResponseEntity<Map<String, Object>> generateExigences(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> result = ragService.generateExigences(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "error", e.getMessage())
            );
        }
    }
}
