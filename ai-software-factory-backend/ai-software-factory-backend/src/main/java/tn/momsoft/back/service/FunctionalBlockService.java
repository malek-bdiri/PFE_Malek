package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.entity.FunctionalBlock;
import tn.momsoft.back.repository.FunctionalAnalysisRepository;
import tn.momsoft.back.repository.FunctionalBlockRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FunctionalBlockService {

    private final FunctionalBlockRepository repository;
    private final FunctionalAnalysisRepository analysisRepository;

    public List<FunctionalBlock> getByAnalysis(Long analysisId) {
        return repository.findByAnalysisIdOrderByIdAsc(analysisId);
    }

    public FunctionalBlock create(Long analysisId, FunctionalBlock block) {
        FunctionalAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));
        block.setAnalysis(analysis);
        block.setCode(generateCode(analysisId));
        return repository.save(block);
    }

    public FunctionalBlock update(Long id, FunctionalBlock updated) {
        FunctionalBlock existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Block not found"));
        existing.setNom(updated.getNom());
        existing.setDescription(updated.getDescription());
        existing.setExigences(updated.getExigences());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private String generateCode(Long analysisId) {
        List<FunctionalBlock> existing = repository.findByAnalysisIdOrderByIdAsc(analysisId);

        if (existing.isEmpty()) {
            return "BF-001";
        }

        int maxNum = existing.stream()
                .map(b -> b.getCode().replace("BF-", ""))
                .mapToInt(s -> {
                    try { return Integer.parseInt(s); }
                    catch (Exception e) { return 0; }
                })
                .max()
                .orElse(0);

        return String.format("BF-%03d", maxNum + 1);
    }
}