package tn.momsoft.back.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.ValidationRequest;
import java.util.Optional;

public interface ValidationRequestRepository
        extends JpaRepository<ValidationRequest, Long> {

    Optional<ValidationRequest> findByProjetIdAndStatut(
            Long projetId,
            ValidationRequest.Statut statut
    );

 //   Optional<ValidationRequest> findTopByAfdIdOrderByCreatedAtDesc(String afdId);
}