package tn.momsoft.back.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.dto.RagExigenceDTO;
import tn.momsoft.back.dto.RagGenerateResponse;
import tn.momsoft.back.entity.*;
import tn.momsoft.back.repository.*;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RagProcessingService {

    private final ExigenceRepository exigenceRepository;
    private final FunctionalAnalysisRepository analysisRepository;
    private final FunctionalBlockRepository blockRepository;
    private final AfdRepository afdRepository;
    private final ProjetRepository projetRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> processRagResponse(
            RagGenerateResponse ragResponse,
            Long projetId,
            Long analysisId) {

        if (!ragResponse.isSuccess() || ragResponse.getExigences() == null) {
            throw new RuntimeException("RAG response invalide");
        }

        List<RagExigenceDTO> exigences = extractExigences(ragResponse);
        if (exigences.isEmpty()) {
            throw new RuntimeException("Aucune exigence générée");
        }

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet not found"));

        FunctionalAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        List<Exigence> savedExigences = saveExigences(exigences, projet);
        List<FunctionalBlock> blocks = generateBlocks(exigences, analysis);
        List<Afd> afds = generateAfds(exigences, blocks, analysis);

        Map<String, Object> result = new HashMap<>();
        result.put("exigences", savedExigences.size());
        result.put("blocs", blocks.size());
        result.put("afds", afds.size());
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<RagExigenceDTO> extractExigences(RagGenerateResponse ragResponse) {
        try {
            Map<String, Object> exigencesMap = ragResponse.getExigences();
            Object exigencesList = exigencesMap.get("exigences");
            List<Map<String, Object>> rawList = (List<Map<String, Object>>) exigencesList;
            List<RagExigenceDTO> result = new ArrayList<>();
            for (Map<String, Object> raw : rawList) {
                RagExigenceDTO dto = objectMapper.convertValue(raw, RagExigenceDTO.class);
                result.add(dto);
            }
            return result;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Exigence> saveExigences(List<RagExigenceDTO> dtos, Projet projet) {
        List<Exigence> saved = new ArrayList<>();
        for (RagExigenceDTO dto : dtos) {
            Exigence exigence = new Exigence();
            exigence.setIntitule(dto.getIntitule());
            exigence.setDescription(dto.getDescription());
            exigence.setType(dto.getType());
            exigence.setObjectifClient(dto.getObjectifClient());
            exigence.setSolutionProposee(dto.getSolutionProposee());
            exigence.setLimitesHypotheses(dto.getLimitesHypotheses());
            exigence.setProjet(projet);
            saved.add(exigenceRepository.save(exigence));
        }
        return saved;
    }

    private List<FunctionalBlock> generateBlocks(
            List<RagExigenceDTO> exigences,
            FunctionalAnalysis analysis) {

        Map<String, List<RagExigenceDTO>> grouped = new LinkedHashMap<>();
        for (RagExigenceDTO ex : exigences) {
            String blockName = inferBlockName(ex);
            grouped.computeIfAbsent(blockName, k -> new ArrayList<>()).add(ex);
        }

        List<FunctionalBlock> blocks = new ArrayList<>();
        String[] colors = {"blue", "green", "purple", "orange", "pink"};
        int colorIndex = 0;

        for (Map.Entry<String, List<RagExigenceDTO>> entry : grouped.entrySet()) {
            long count = blockRepository.count() + 1 + colorIndex;
            String code = String.format("BF-%03d", count);

            List<String> exigencesCodes = new ArrayList<>();
            for (RagExigenceDTO ex : entry.getValue()) {
                exigencesCodes.add(ex.getId());
            }

            FunctionalBlock block = new FunctionalBlock();
            block.setCode(code);
            block.setNom(entry.getKey());
            block.setDescription(buildBlockDescription(entry.getValue()));
            block.setCouleur(colors[colorIndex % colors.length]);
            block.setExigences(exigencesCodes);
            block.setAnalysis(analysis);

            blocks.add(blockRepository.save(block));
            colorIndex++;
        }

        return blocks;
    }

    private List<Afd> generateAfds(
            List<RagExigenceDTO> exigences,
            List<FunctionalBlock> blocks,
            FunctionalAnalysis analysis) {

        List<Afd> afds = new ArrayList<>();
        int afdIndex = 1;

        for (RagExigenceDTO ex : exigences) {
            FunctionalBlock block = findBlockForExigence(ex, blocks);
            long count = afdRepository.findByAnalysisIdOrderByIdAsc(analysis.getId()).size() + afdIndex;
            String code = String.format("AFD-%03d", count);

            Afd afd = new Afd();
            afd.setCode(code);
            afd.setIntitule(ex.getIntitule());
            afd.setObjectif(ex.getObjectifClient());
            afd.setDescription(ex.getDescription());
            afd.setReglesGestion(ex.getLimitesHypotheses());
            afd.setFluxNominal(ex.getSolutionProposee());
            afd.setStatut("En cours");
            afd.setDerniereMaj(LocalDate.now());
            afd.setAnalysis(analysis);
            afd.setBlock(block);

            afds.add(afdRepository.save(afd));
            afdIndex++;
        }

        return afds;
    }

    private String inferBlockName(RagExigenceDTO ex) {
        String title = ex.getIntitule().toLowerCase();
        if (title.contains("auth") || title.contains("sécurité") || title.contains("accès")) {
            return "Authentification & Sécurité";
        } else if (title.contains("supervision") || title.contains("tableau") || title.contains("dashboard")) {
            return "Supervision & Tableaux de bord";
        } else if (title.contains("production") || title.contains("fabrication") || title.contains("ordre")) {
            return "Gestion de la Production";
        } else if (title.contains("qualité") || title.contains("non-conformité") || title.contains("contrôle")) {
            return "Gestion de la Qualité";
        } else if (title.contains("maintenance") || title.contains("gmao")) {
            return "Maintenance & GMAO";
        } else if (title.contains("intégration") || title.contains("erp") || title.contains("synchronisation")) {
            return "Intégration SI";
        } else if (title.contains("reporting") || title.contains("kpi") || title.contains("indicateur")) {
            return "Reporting & KPI";
        } else if (title.contains("collecte") || title.contains("données") || title.contains("machine")) {
            return "Collecte de Données";
        } else {
            return "Fonctionnalités Générales";
        }
    }

    private String buildBlockDescription(List<RagExigenceDTO> exigences) {
        StringBuilder sb = new StringBuilder();
        for (RagExigenceDTO ex : exigences) {
            sb.append("- ").append(ex.getIntitule()).append("\n");
        }
        return sb.toString().trim();
    }

    private FunctionalBlock findBlockForExigence(
            RagExigenceDTO ex,
            List<FunctionalBlock> blocks) {
        String blockName = inferBlockName(ex);
        return blocks.stream()
                .filter(b -> b.getNom().equals(blockName))
                .findFirst()
                .orElse(blocks.isEmpty() ? null : blocks.get(0));
    }
}