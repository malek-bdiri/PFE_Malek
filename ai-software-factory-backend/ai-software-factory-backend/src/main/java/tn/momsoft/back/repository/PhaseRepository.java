package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.Phase;

import java.util.List;

@Repository
public interface PhaseRepository extends JpaRepository<Phase, Long> {

    List<Phase> findByPlanningIdOrderByOrdreAsc(Long planningId);

    void deleteByPlanningId(Long planningId); //
}

