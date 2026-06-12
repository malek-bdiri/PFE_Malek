package tn.momsoft.back.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;

import tn.momsoft.back.entity.*;
import tn.momsoft.back.repository.*;

@Service
@RequiredArgsConstructor
public class UiSpecAFDService {

    private final UiSpecAFDRepository repository;
    private final AfdRepository afdRepository;
    private final FunctionalAnalysisRepository analysisRepository;

    public List<UiSpecAFD> getByUiux(Long uiuxId) {
        return repository.findByUiuxId(uiuxId);
    }

    public void generateForUiux(UiuxSpecification uiux) {
        if (uiux.getProjet() == null) return;

        // Trouver toutes les analyses du projet
        List<FunctionalAnalysis> analyses = analysisRepository
                .findByProjetId(uiux.getProjet().getId());

        for (FunctionalAnalysis analysis : analyses) {
            // Trouver tous les AFDs de chaque analyse
            List<Afd> afds = afdRepository
                    .findByAnalysisIdOrderByIdAsc(analysis.getId());

            for (Afd afd : afds) {
                // Vérifier si déjà existant
                boolean exists = repository
                        .existsByUiuxIdAndAfdId(uiux.getId(), afd.getId());

                if (!exists) {
                    UiSpecAFD uiSpecAFD = UiSpecAFD.builder()
                            .uiux(uiux)
                            .afd(afd)
                            .statutUx("Non généré")
                            .version("v1.0")
                            .build();
                    repository.save(uiSpecAFD);
                }
            }
        }
    }
    public UiSpecAFD getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("UiSpecAFD not found"));
    }

    public UiSpecAFD update(Long id, UiSpecAFD body) {
        UiSpecAFD existing = getById(id);
        existing.setResumeFonctionnel(body.getResumeFonctionnel());
        existing.setFluxUtilisateur(body.getFluxUtilisateur());
        existing.setDefinitionsEcrans(body.getDefinitionsEcrans());
        existing.setMappingComposants(body.getMappingComposants());
        existing.setReglesInteraction(body.getReglesInteraction());
        existing.setAccessibilite(body.getAccessibilite());
        existing.setComportementResponsive(body.getComportementResponsive());
        existing.setFigmaPrompt(body.getFigmaPrompt());
        existing.setStatutUx("Généré");
        return repository.save(existing);
    }

    public UiSpecAFD valider(Long id) {
        UiSpecAFD existing = getById(id);
        existing.setStatutUx("Validé");
        return repository.save(existing);
    }
    public UiSpecAFD generer(Long id) {
        UiSpecAFD existing = getById(id);
        Afd afd = existing.getAfd();

        // Générer le contenu depuis l'AFD
        existing.setResumeFonctionnel(
                afd.getDescription() != null && !afd.getDescription().isEmpty()
                        ? afd.getDescription()
                        : "Ce module permet " + (afd.getIntitule() != null ? afd.getIntitule().toLowerCase() : "") + "."
        );
        existing.setFluxUtilisateur(
                afd.getFluxNominal() != null && !afd.getFluxNominal().isEmpty()
                        ? afd.getFluxNominal()
                        : "1. L'utilisateur accède à la fonctionnalité\n2. L'utilisateur effectue l'action\n3. Le système confirme"
        );
        existing.setDefinitionsEcrans(
                "Écran principal: " + afd.getIntitule() + "\nObjectif: " +
                        (afd.getObjectif() != null ? afd.getObjectif() : "Voir description AFD")
        );
        existing.setMappingComposants(
                "Formulaires: FormGroup avec validation\nBoutons: Primary + Secondary\nAlerts: Toast success/error"
        );
        existing.setReglesInteraction(
                "Loading States: Spinner pendant l'enregistrement\nValidation: Temps réel sur blur\nConfirmations: Toast après action"
        );
        existing.setAccessibilite(
                "Niveau: WCAG AA\nNavigation clavier: Tab, Enter, Escape\nARIA: Labels et descriptions"
        );
        existing.setComportementResponsive(
                "Desktop: Layout full\nMobile: 1 colonne, boutons full-width\nTablet: Adapté"
        );
        existing.setFigmaPrompt(
                "Create a " + afd.getIntitule() + " interface with:\n- Clean, professional layout\n- Form validation\n- Responsive design\n- WCAG AA accessibility"
        );
        existing.setStatutUx("Généré");

        return repository.save(existing);
    }

    public UiSpecAFD regenerer(Long id) {
        return generer(id); // même logique
    }
}