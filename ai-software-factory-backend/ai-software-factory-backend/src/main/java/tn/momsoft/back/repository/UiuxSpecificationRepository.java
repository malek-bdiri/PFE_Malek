package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.UiuxSpecification;
import java.util.List;

@Repository
public interface UiuxSpecificationRepository
        extends JpaRepository<UiuxSpecification, Long> {
    List<UiuxSpecification> findByProjetId(Long projetId);
    List<UiuxSpecification> findByStatut(String statut);
}