package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.momsoft.back.entity.Module;
import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {

    List<Module> findByActifTrue();

    List<Module> findByCategorie(String categorie);

    // Modules affectés à un produit donné
    @Query("SELECT m FROM Module m JOIN m.produits p WHERE p.id = :produitId")
    List<Module> findByProduitId(@Param("produitId") Long produitId);

    // Modules NON encore affectés à un produit
    @Query("SELECT m FROM Module m WHERE m.actif = true AND m NOT IN (SELECT mo FROM Module mo JOIN mo.produits p WHERE p.id = :produitId)")
    List<Module> findNotAffectedToProduit(@Param("produitId") Long produitId);
}

