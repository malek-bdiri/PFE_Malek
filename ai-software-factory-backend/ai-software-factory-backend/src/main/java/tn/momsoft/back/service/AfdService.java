package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.Afd;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.entity.FunctionalBlock;
import tn.momsoft.back.repository.AfdRepository;
import tn.momsoft.back.repository.FunctionalAnalysisRepository;
import tn.momsoft.back.repository.FunctionalBlockRepository;
import java.time.LocalDate;
import java.util.List;
import tn.momsoft.back.entity.UiSpecAFD;
import tn.momsoft.back.repository.UiSpecAFDRepository;

@Service
@RequiredArgsConstructor
public class AfdService {

    private final AfdRepository afdRepository;
    private final FunctionalAnalysisRepository analysisRepository;
    private final FunctionalBlockRepository blockRepository;
    private final UiSpecAFDRepository uiSpecAFDRepository;

    public List<Afd> getByAnalysis(Long analysisId) {
        return afdRepository.findByAnalysisIdOrderByIdAsc(analysisId);
    }

    public Afd getById(Long id) {
        return afdRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AFD not found"));
    }

    public Afd create(Long analysisId, Long blockId, Afd afd) {
        FunctionalAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        afd.setAnalysis(analysis);
        afd.setCode(generateCode(analysisId));
        afd.setDerniereMaj(LocalDate.now());

        if (blockId != null) {
            FunctionalBlock block = blockRepository.findById(blockId)
                    .orElse(null);
            afd.setBlock(block);
        }

        Afd saved = afdRepository.save(afd);

        // 👇 Incrémenter nbAfd
        analysis.setNbAfd(analysis.getNbAfd() != null ? analysis.getNbAfd() + 1 : 1);
        analysisRepository.save(analysis);

        return saved;
    }

    public Afd update(Long id, Afd updated) {
        Afd existing = getById(id);
        existing.setIntitule(updated.getIntitule());
        existing.setObjectif(updated.getObjectif());
        existing.setDescription(updated.getDescription());
        existing.setReglesGestion(updated.getReglesGestion());
        existing.setFluxNominal(updated.getFluxNominal());
        existing.setCasAlternatifs(updated.getCasAlternatifs());
        existing.setDonneesManipulees(updated.getDonneesManipulees());
        existing.setCriteresAcceptation(updated.getCriteresAcceptation());
        existing.setStatut(updated.getStatut());
        existing.setValidateur(updated.getValidateur());
        existing.setComplexiteFonctionnelle(updated.getComplexiteFonctionnelle());
        existing.setDerniereMaj(LocalDate.now());

        Afd saved = afdRepository.save(existing);

        // 👇 Passer les UI Specs liées en "Obsolète"
        List<UiSpecAFD> uiSpecs = uiSpecAFDRepository.findByAfdId(existing.getId());
        for (UiSpecAFD spec : uiSpecs) {
            if ("Généré".equals(spec.getStatutUx()) || "Validé".equals(spec.getStatutUx())) {
                spec.setStatutUx("Obsolète");
                uiSpecAFDRepository.save(spec);
            }
        }

        return saved;
    }

    public void delete(Long id) {
        afdRepository.deleteById(id);
    }

    private String generateCode(Long analysisId) {
        FunctionalAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        List<Afd> allProjectAfds = afdRepository.findByAnalysisProjetId(
                analysis.getProjet().getId()
        );

        if (allProjectAfds.isEmpty()) {
            return "AFD-001";
        }

        int maxNum = allProjectAfds.stream()
                .map(a -> a.getCode().replace("AFD-", ""))
                .mapToInt(s -> {
                    try { return Integer.parseInt(s); }
                    catch (Exception e) { return 0; }
                })
                .max()
                .orElse(0);

        return String.format("AFD-%03d", maxNum + 1);
    }
}