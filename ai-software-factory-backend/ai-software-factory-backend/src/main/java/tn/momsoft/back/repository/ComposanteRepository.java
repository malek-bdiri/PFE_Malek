package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.Composante;
import java.util.List;

public interface ComposanteRepository extends JpaRepository<Composante, Long> {
    List<Composante> findByActiveTrue();
}

