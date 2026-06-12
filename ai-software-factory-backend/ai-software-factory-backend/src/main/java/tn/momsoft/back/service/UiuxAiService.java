package tn.momsoft.back.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tn.momsoft.back.dto.UiuxRagResponse;
import tn.momsoft.back.entity.Afd;
import tn.momsoft.back.repository.AfdRepository;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UiuxAiService {

    @Value("${rag.api.base-url:http://localhost:8000}")
    private String ragBaseUrl;

    private final AfdRepository afdRepository;
    private final ObjectMapper objectMapper;

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);   // 10s connexion
        factory.setReadTimeout(300_000);     // 5 min pour Gemini
        return new RestTemplate(factory);
    }

    /**
     * Génère une spécification UI/UX complète via RAG.
     *
     * Deux modes :
     *  - Nouveau produit  : file PDF fourni (cahier des charges)
     *  - Produit existant : productExistingSpecs fourni + userPrompt optionnel
     *
     * Dans les deux cas, les AFDs du projet sont récupérés depuis la DB
     * et envoyés comme contexte à FastAPI.
     *
     * @param projetId              ID du projet (pour récupérer les AFDs)
     * @param projectName           Nom du projet
     * @param clientName            Nom du client
     * @param platforms             Plateformes cibles (ex: "Web,Mobile")
     * @param styleDesign           Style (ex: "Modern enterprise")
     * @param primaryColor          Couleur primaire (ex: "#1A73E8")
     * @param secondaryColor        Couleur secondaire
     * @param accentColor           Couleur accent
     * @param typoPreference        Typographie (ex: "Inter")
     * @param uxComplexity          Complexité UX (ex: "Enterprise")
     * @param accessibilityLevel    Niveau accessibilité (ex: "WCAG AA")
     * @param multiLanguage         Support multi-langue
     * @param darkMode              Dark mode requis
     * @param productId             ID produit existant (optionnel)
     * @param productName           Nom produit existant (optionnel)
     * @param productExistingSpecs  Specs JSON du produit existant (optionnel)
     * @param userPrompt            Instructions libres utilisateur (optionnel)
     * @param file                  Fichier PDF CdC (optionnel — nouveau produit)
     * @param language              Langue de génération
     * @param topK                  Nb chunks RAG
     * @return UiuxRagResponse avec uiux_spec contenant les 8 sections
     */
    public UiuxRagResponse generateUiuxSpec(
            Long projetId,
            String projectName,
            String clientName,
            String platforms,
            String styleDesign,
            String primaryColor,
            String secondaryColor,
            String accentColor,
            String typoPreference,
            String uxComplexity,
            String accessibilityLevel,
            boolean multiLanguage,
            boolean darkMode,
            String productId,
            String productName,
            String productExistingSpecs,
            String userPrompt,
            MultipartFile file,
            String language,
            int topK
    ) throws IOException {

        String url = ragBaseUrl + "/uiux/generate";

        // ── Récupérer les AFDs du projet depuis la DB ──────────────────────
        String afdsContext = buildAfdsContext(projetId);

        // ── Construire le body multipart ───────────────────────────────────
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        // Infos projet
        body.add("project_name",  projectName  != null ? projectName  : "");
        body.add("project_id",    projetId     != null ? projetId.toString() : "");
        body.add("client_name",   clientName   != null ? clientName   : "");

        // Style & plateformes
        body.add("platforms",           platforms           != null ? platforms           : "Web");
        body.add("style_design",        styleDesign         != null ? styleDesign         : "Modern enterprise");
        body.add("primary_color",       primaryColor        != null ? primaryColor        : "#1A73E8");
        body.add("secondary_color",     secondaryColor      != null ? secondaryColor      : "#FFFFFF");
        body.add("accent_color",        accentColor         != null ? accentColor         : "#FF6B35");
        body.add("typo_preference",     typoPreference      != null ? typoPreference      : "Inter");
        body.add("ux_complexity",       uxComplexity        != null ? uxComplexity        : "Enterprise");

        // Contraintes
        body.add("accessibility_level", accessibilityLevel  != null ? accessibilityLevel  : "WCAG AA");
        body.add("multi_language",      String.valueOf(multiLanguage));
        body.add("dark_mode",           String.valueOf(darkMode));

        // Produit existant (optionnel)
        body.add("product_id",              productId              != null ? productId              : "");
        body.add("product_name",            productName            != null ? productName            : "");
        body.add("product_existing_specs",  productExistingSpecs   != null ? productExistingSpecs   : "");

        // Instructions utilisateur (optionnel)
        body.add("user_prompt",     userPrompt  != null ? userPrompt  : "");

        // AFDs du projet (contexte fonctionnel)
        body.add("afds_context",    afdsContext);

        // Langue et top_k
        body.add("language",        language != null ? language : "Français");
        body.add("top_k",           String.valueOf(topK));

        // Fichier PDF (optionnel — nouveau produit uniquement)
        if (file != null && !file.isEmpty()) {
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", fileResource);
        }

        // ── Appel FastAPI ──────────────────────────────────────────────────
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        RestTemplate restTemplate = buildRestTemplate();
        ResponseEntity<UiuxRagResponse> response = restTemplate.postForEntity(
                url, request, UiuxRagResponse.class
        );

        return response.getBody();
    }

    /**
     * Récupère les AFDs du projet et les sérialise en JSON string
     * pour les envoyer comme contexte à FastAPI.
     */
    private String buildAfdsContext(Long projetId) {
        if (projetId == null) return "";

        try {
            List<Afd> afds = afdRepository.findByAnalysisProjetId(projetId);
            if (afds == null || afds.isEmpty()) return "";

            // Construire une liste simplifiée pour le contexte RAG
            List<java.util.Map<String, Object>> afdsSimplified = afds.stream()
                    .map(afd -> {
                        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                        map.put("id",                    afd.getId());
                        map.put("code",                  afd.getCode());
                        map.put("intitule",              afd.getIntitule());
                        map.put("objectif",              afd.getObjectif());
                        map.put("description",           afd.getDescription());
                        map.put("flux_nominal",          afd.getFluxNominal());
                        map.put("cas_alternatifs",       afd.getCasAlternatifs());
                        map.put("criteres_acceptation",  afd.getCriteresAcceptation());
                        map.put("complexite",            afd.getComplexiteFonctionnelle());
                        return map;
                    })
                    .collect(Collectors.toList());

            return objectMapper.writeValueAsString(afdsSimplified);

        } catch (Exception e) {
            System.err.println("[UiuxAiService] Erreur récupération AFDs: " + e.getMessage());
            return "";
        }
    }
}