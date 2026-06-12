package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.momsoft.back.dto.RagGenerateResponse;
import tn.momsoft.back.service.AiService;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * POST /api/ai/generate-exigences
     * Reçoit le CdC PDF + infos projet, proxifie vers FastAPI, retourne les exigences.
     */
    @PostMapping("/generate-exigences")
    public ResponseEntity<RagGenerateResponse> generateExigences(
            @RequestParam("file")         MultipartFile file,
            @RequestParam("project_name") String projectName,
            @RequestParam("project_id")   String projectId,
            @RequestParam("client_name")  String clientName,
            @RequestParam(value = "product_name", defaultValue = "Smart Factory MOMsoft") String productName,
            @RequestParam(value = "language",     defaultValue = "Français")              String language,
            @RequestParam(value = "top_k",        defaultValue = "8")                     int topK
    ) {
        try {
            RagGenerateResponse result = aiService.generateExigences(
                    file, projectName, projectId, clientName, productName, language, topK
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            RagGenerateResponse err = new RagGenerateResponse();
            err.setSuccess(false);
            err.setError("Erreur communication serveur IA: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}