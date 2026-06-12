package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.ProjetChiffrage;
import java.util.Optional;

public interface ProjetChiffrageRepository extends JpaRepository<ProjetChiffrage, Long> {
    Optional<ProjetChiffrage> findByProjetId(Long projetId);
}

