package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.FunctionalBlock;
import java.util.List;

@Repository
public interface FunctionalBlockRepository
        extends JpaRepository<FunctionalBlock, Long> {
    List<FunctionalBlock> findByAnalysisIdOrderByIdAsc(Long analysisId);
    void deleteByAnalysisId(Long analysisId);
}