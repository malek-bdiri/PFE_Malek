package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.Projet;

public interface ProjetRepository extends JpaRepository<Projet, Long> {
}
