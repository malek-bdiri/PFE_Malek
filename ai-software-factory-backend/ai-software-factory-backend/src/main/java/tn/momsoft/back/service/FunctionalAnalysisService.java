package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.entity.Projet;
import tn.momsoft.back.repository.FunctionalAnalysisRepository;
import tn.momsoft.back.repository.ProjetRepository;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FunctionalAnalysisService {

    private final FunctionalAnalysisRepository repository;
    private final ProjetRepository projetRepository;

    public List<FunctionalAnalysis> getAll() {
        return repository.findAll();
    }

    public FunctionalAnalysis getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));
    }

    public FunctionalAnalysis create(Long projetId, FunctionalAnalysis analysis) {
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        analysis.setProjet(projet);
        analysis.setDate(LocalDate.now());
        analysis.setCode(generateCode());
        return repository.save(analysis);
    }

    public FunctionalAnalysis update(Long id, FunctionalAnalysis updated) {
        FunctionalAnalysis existing = getById(id);
        existing.setStatut(updated.getStatut());
        existing.setValidateur(updated.getValidateur());
        existing.setNbAfd(updated.getNbAfd());
        existing.setDescription(updated.getDescription());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private String generateCode() {
        long count = repository.count() + 1;
        return String.format("FA-%03d", count);
    }
}