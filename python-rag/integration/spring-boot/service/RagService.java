package com.momsoft.smartfactory.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Service proxy vers le backend Python FastAPI (port 8000).
 */
@Service
public class RagService {

    private final RestTemplate restTemplate;

    @Value("${rag.api.base-url:http://localhost:8000}")
    private String ragApiBaseUrl;

    public RagService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * GET /health — Vérifie que le backend Python est opérationnel.
     */
    public Map<String, Object> health() {
        ResponseEntity<Map> resp = restTemplate.getForEntity(ragApiBaseUrl + "/health", Map.class);
        return resp.getBody();
    }

    /**
     * POST /project/generate — Upload CdC + génération exigences en un seul appel.
     *
     * @param file        Fichier CdC (PDF/DOCX/TXT)
     * @param projectName Nom du projet
     * @param projectId   Identifiant du projet
     * @param clientName  Nom du client
     * @param productName Produit MOMsoft
     * @param language    Langue de génération
     * @param topK        Nombre de documents pour la recherche RAG
     * @return Réponse JSON contenant les exigences générées
     */
    public Map<String, Object> projectGenerate(MultipartFile file,
                                                String projectName,
                                                String projectId,
                                                String clientName,
                                                String productName,
                                                String language,
                                                int topK) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        body.add("project_name", projectName);
        body.add("project_id", projectId);
        body.add("client_name", clientName);
        body.add("product_name", productName);
        body.add("language", language);
        body.add("top_k", String.valueOf(topK));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                ragApiBaseUrl + "/project/generate",
                requestEntity,
                Map.class
        );
        return resp.getBody();
    }

    /**
     * POST /generate/exigences — Génération depuis texte brut.
     */
    public Map<String, Object> generateExigences(Map<String, Object> requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                ragApiBaseUrl + "/generate/exigences",
                requestEntity,
                Map.class
        );
        return resp.getBody();
    }
}
