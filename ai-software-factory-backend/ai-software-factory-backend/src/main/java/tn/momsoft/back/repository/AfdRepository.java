package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.Afd;
import java.util.List;

@Repository
public interface AfdRepository extends JpaRepository<Afd, Long> {
    List<Afd> findByAnalysisIdOrderByIdAsc(Long analysisId);
    List<Afd> findByAnalysisProjetId(Long projetId);
}