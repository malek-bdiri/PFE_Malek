package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.ServiceProjet;

import java.util.List;

public interface ServiceProjetRepository extends JpaRepository<ServiceProjet, Long> {

    List<ServiceProjet> findByProjetId(Long projetId);
}