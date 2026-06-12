package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.Planning;
import java.util.List;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Long> {
    List<Planning> findByProjetIdOrderByIdDesc(Long projetId);
}
