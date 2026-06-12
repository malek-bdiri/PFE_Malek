package tn.momsoft.back.repository;

import tn.momsoft.back.entity.Exigence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ExigenceRepository extends JpaRepository<Exigence, Long> {
    List<Exigence> findByProjetId(Long projetId);

    @Modifying
    @Query("DELETE FROM Exigence e WHERE e.projet.id = :projetId")
    void deleteByProjetId(Long projetId);
}