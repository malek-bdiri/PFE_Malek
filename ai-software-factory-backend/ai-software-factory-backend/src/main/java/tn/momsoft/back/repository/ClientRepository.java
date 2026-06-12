package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.Client;
import tn.momsoft.back.entity.Statut;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByClientCode(String clientCode);

    Optional<Client> findByClientCode(String clientCode);

    List<Client> findByStatut(Statut statut);
}
