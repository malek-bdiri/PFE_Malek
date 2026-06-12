package tn.momsoft.back.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.TestScenario;
import java.util.List;

@Repository
public interface TestScenarioRepository extends JpaRepository<TestScenario, Long> {
    List<TestScenario> findByProjetId(Long projetId);
    List<TestScenario> findByAfdId(Long afdId);
    List<TestScenario> findByProjetIdAndStatut(Long projetId, String statut);
}