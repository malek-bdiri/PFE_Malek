package tn.momsoft.back.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tn.momsoft.back.dto.RagGenerateResponse;

import java.io.IOException;

@Service
public class AiService {

    @Value("${rag.api.base-url:http://localhost:8000}")
    private String ragBaseUrl;

    private final RestTemplate restTemplate;
    public AiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);   // 10s pour se connecter à FastAPI
        factory.setReadTimeout(300_000);     // 5 min pour attendre la réponse Gemini
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Envoie le fichier CdC + infos projet à FastAPI /project/generate
     * et retourne la réponse brute (exigences générées).
     */
    public RagGenerateResponse generateExigences(
            MultipartFile file,
            String projectName,
            String projectId,
            String clientName,
            String productName,
            String language,
            int topK
    ) throws IOException {

        String url = ragBaseUrl + "/project/generate";

        // Construire le body multipart
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        // Fichier
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", fileResource);

        // Champs texte
        body.add("project_name", projectName != null ? projectName : "");
        body.add("project_id",   projectId   != null ? projectId   : "");
        body.add("client_name",  clientName  != null ? clientName  : "");
        body.add("product_name", productName != null ? productName : "Smart Factory MOMsoft");
        body.add("language",     language    != null ? language    : "Français");
        body.add("top_k",        String.valueOf(topK));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<RagGenerateResponse> response = restTemplate.postForEntity(
                url, request, RagGenerateResponse.class
        );

        return response.getBody();
    }
}