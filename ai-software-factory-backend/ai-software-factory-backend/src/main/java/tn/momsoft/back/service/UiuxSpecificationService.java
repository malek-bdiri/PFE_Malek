package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.Afd;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.entity.Projet;
import tn.momsoft.back.entity.UiSpecAFD;
import tn.momsoft.back.entity.UiuxSpecification;
import tn.momsoft.back.repository.AfdRepository;
import tn.momsoft.back.repository.FunctionalAnalysisRepository;
import tn.momsoft.back.repository.ProjetRepository;
import tn.momsoft.back.repository.UiSpecAFDRepository;
import tn.momsoft.back.repository.UiuxSpecificationRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UiuxSpecificationService {

    private final UiuxSpecificationRepository repository;
    private final ProjetRepository projetRepository;
    private final FunctionalAnalysisRepository analysisRepository;
    private final AfdRepository afdRepository;
    private final UiSpecAFDRepository uiSpecAFDRepository;
    private final UiSpecAFDService uiSpecAFDService;

    public List<UiuxSpecification> getAll() {
        return repository.findAll();
    }

    public UiuxSpecification getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Specification not found"));
    }

    public UiuxSpecification create(Long projetId, UiuxSpecification spec) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet not found"));

        spec.setProjet(projet);
        spec.setCode(generateCode());
        spec.setVersion("v1.0");
        spec.setStatut("Généré");
        spec.setDerniereMaj(LocalDate.now());

        UiuxSpecification saved = repository.save(spec);

        // Auto-link AFDs
        List<FunctionalAnalysis> analyses = analysisRepository.findByProjetId(projetId);

        for (FunctionalAnalysis analysis : analyses) {
            List<Afd> afds = afdRepository.findByAnalysisIdOrderByIdAsc(analysis.getId());
            for (Afd afd : afds) {
                boolean exists = uiSpecAFDRepository
                        .existsByUiuxIdAndAfdId(saved.getId(), afd.getId());

                if (!exists) {
                    UiSpecAFD link = UiSpecAFD.builder()
                            .uiux(saved)
                            .afd(afd)
                            .statutUx("Non généré")
                            .version("v1.0")
                            .build();
                    uiSpecAFDRepository.save(link);
                }
            }
        }

        return saved;
    }

    public UiuxSpecification update(Long id, UiuxSpecification updated) {
        UiuxSpecification existing = getById(id);
        existing.setNom(updated.getNom());
        existing.setStatut(updated.getStatut());
        existing.setVersion(updated.getVersion());
        existing.setPlateformes(updated.getPlateformes());
        existing.setComplexiteUx(updated.getComplexiteUx());
        existing.setStyleDesign(updated.getStyleDesign());
        existing.setCouleurPrimaire(updated.getCouleurPrimaire());
        existing.setCouleurSecondaire(updated.getCouleurSecondaire());
        existing.setCouleurAccent(updated.getCouleurAccent());
        existing.setPreferenceTypo(updated.getPreferenceTypo());
        existing.setNiveauAccessibilite(updated.getNiveauAccessibilite());
        existing.setSupportMultiLangue(updated.getSupportMultiLangue());
        existing.setDarkMode(updated.getDarkMode());
        existing.setDerniereMaj(LocalDate.now());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public UiuxSpecification valider(Long id) {
        UiuxSpecification spec = getById(id);
        spec.setStatut("Validé");
        spec.setDerniereMaj(LocalDate.now());
        return repository.save(spec);
    }

    private String generateCode() {
        long count = repository.count() + 1;
        return String.format("UIUX-%03d", count);
    }
}