package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.ChiffrageLicenceLigne;

import java.util.List;

// Peut être supprimé complètement
// ou gardé vide si d'autres classes le référencent
@Repository
public interface ChiffrageLicenceLigneRepository
        extends JpaRepository<ChiffrageLicenceLigne, Long> {
}