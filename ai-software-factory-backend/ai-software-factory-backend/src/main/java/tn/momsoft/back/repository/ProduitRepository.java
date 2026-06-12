package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.Produit;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

    boolean existsByProduitCode(String produitCode);

}
