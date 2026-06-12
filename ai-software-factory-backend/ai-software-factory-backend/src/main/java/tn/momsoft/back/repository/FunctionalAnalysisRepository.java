package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.FunctionalAnalysis;
import java.util.List;

@Repository
public interface FunctionalAnalysisRepository
        extends JpaRepository<FunctionalAnalysis, Long> {
    List<FunctionalAnalysis> findByProjetId(Long projetId);
    List<FunctionalAnalysis> findByStatut(String statut);

}