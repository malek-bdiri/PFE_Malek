package tn.momsoft.back.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.CasDeTest;
import java.util.List;

@Repository
public interface CasDeTestRepository extends JpaRepository<CasDeTest, Long> {
    List<CasDeTest> findByTestScenarioId(Long scenarioId);
}