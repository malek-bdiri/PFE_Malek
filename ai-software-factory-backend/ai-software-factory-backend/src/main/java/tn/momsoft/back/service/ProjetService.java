package tn.momsoft.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.momsoft.back.entity.Exigence;
import tn.momsoft.back.dto.ExigenceDTO;
import tn.momsoft.back.entity.Projet;
import tn.momsoft.back.repository.ProjetRepository;
import tn.momsoft.back.repository.ExigenceRepository;


import java.util.ArrayList;
import java.util.List;

@Service
public class ProjetService {

    private final ProjetRepository projetRepository;
   // private final ExigenceRepository exigenceRepository;

    public ProjetService(ProjetRepository projetRepository) {
        this.projetRepository = projetRepository;
    }
//    public ProjetService(ExigenceRepository exigenceRepository) {
//        this.exigenceRepository = exigenceRepository;
//    }

    public List<Projet> getAllProjets() {
        return projetRepository.findAll();
    }

    @Transactional
    public Projet createProjet(Projet projet) {
        if (projet.getExigences() != null && !projet.getExigences().isEmpty()) {
            for (Exigence exigence : projet.getExigences()) {
                exigence.setProjet(projet);
            }
        }
        return projetRepository.save(projet);
    }
    public java.util.Optional<Projet> getProjetById(Long id) {
        return projetRepository.findById(id);
    }
    @Transactional
    public Projet addExigence(Long projetId, Exigence exigence) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouve: " + projetId));

        exigence.setId(null);
        exigence.setProjet(projet);

        if (projet.getExigences() == null) {
            projet.setExigences(new ArrayList<>());
        }
        projet.getExigences().add(exigence);

        return projetRepository.save(projet);
    }

    @Transactional
    public Projet updateProjet(Long id, Projet payload) {
        Projet existing = projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet non trouve: " + id));

        if (payload.getNom() != null) existing.setNom(payload.getNom());
        if (payload.getCodeProjet() != null) existing.setCodeProjet(payload.getCodeProjet());
        if (payload.getClient() != null) existing.setClient(payload.getClient());
        if (payload.getProduit() != null) existing.setProduit(payload.getProduit());
        if (payload.getDescription() != null) existing.setDescription(payload.getDescription());
        if (payload.getModeCreation() != null) existing.setModeCreation(payload.getModeCreation());
        return projetRepository.save(existing);
    }
    @Transactional
    public Projet addExigencesBulk(Long projetId, List<Exigence> exigences) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Projet non trouve: " + projetId));

        for (Exigence exigence : exigences) {
            exigence.setId(null);
            exigence.setProjet(projet);
            if (exigence.getStatut() == null || exigence.getStatut().isBlank()) {
                exigence.setStatut("En attente");
            }
        }

        projet.getExigences().addAll(exigences);
        return projetRepository.save(projet);
    }
//    @Transactional
//    public Projet updateExigence(Long projetId, Long exigenceId, ExigenceDTO dto) {
//        Projet projet = getProjetById(projetId);
//        Exigence exigence = projet.getExigences().stream()
//                .filter(e -> e.getId().equals(exigenceId))
//                .findFirst()
//                .orElseThrow(() -> new RuntimeException("Exigence introuvable: " + exigenceId));
//
//        exigence.setType(dto.getType());
//        exigence.setIntitule(dto.getIntitule());
//        exigence.setObjectifClient(dto.getObjectifClient());
//        exigence.setDescription(dto.getDescription());
//        exigence.setSolutionProposee(dto.getSolutionProposee());
//        exigence.setLimitesHypotheses(dto.getLimitesHypotheses());
//        exigence.setPriorite(dto.getPriorite());
//        if (dto.getStatut() != null) exigence.setStatut(dto.getStatut());
//        if (dto.getResponsable() != null) exigence.setResponsable(dto.getResponsable());
//        if (dto.getValidateur() != null) exigence.setValidateur(dto.getValidateur());
//        if (dto.getCommentaireValidation() != null)
//            exigence.setCommentaireValidation(dto.getCommentaireValidation());
//
//        return projetRepository.save(projet);
//    }

//    @Transactional
//    public Projet deleteExigence(Long projetId, Long exigenceId) {
//        Projet projet = getProjetById(projetId);
//        projet.getExigences().removeIf(e -> e.getId().equals(exigenceId));
//        return projetRepository.save(projet);
//    }
//
//    // ✅ Valider une exigence
//    @Transactional
//    public Projet validerExigence(Long projetId, Long exigenceId,
//                                  String validateurNom, String commentaire) {
//        Projet projet = getProjetById(projetId);
//        Exigence exigence = projet.getExigences().stream()
//                .filter(e -> e.getId().equals(exigenceId))
//                .findFirst()
//                .orElseThrow(() -> new RuntimeException("Exigence introuvable: " + exigenceId));
//
//        exigence.setStatut("Validee");
//        exigence.setValidateur(validateurNom);
//        exigence.setCommentaireValidation(commentaire);
//
//        return projetRepository.save(projet);
//    }

    public void addDocument(Long projetId, String filename) {
        // Pour l'instant on log uniquement — pas d'entité Document
        // Si vous ajoutez une entité Document plus tard, c'est ici
        System.out.println("[ProjetService] Document uploadé pour projet " + projetId + ": " + filename);
    }

    @Transactional
    public void deleteProjet(Long id) {
        projetRepository.deleteById(id);
    }
}