// PalierRepository.java — version corrigée
package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.Palier;
import java.util.List;
import java.util.Optional;

@Repository
public interface PalierRepository extends JpaRepository<Palier, Long> {

    // Paliers d'un module
    List<Palier> findByModuleId(Long moduleId);

    // Paliers d'un module par mode
    List<Palier> findByModuleIdAndMode(Long moduleId, String mode);

    // Paliers actifs d'un module par mode
    List<Palier> findByModuleIdAndModeAndStatut(
            Long moduleId, String mode, String statut);

    // Palier exact pour un nb d'utilisateurs
    @Query("""
        SELECT p FROM Palier p
        WHERE p.module.id = :moduleId
        AND p.mode = :mode
        AND p.statut = 'Actif'
        AND p.minUtilisateurs <= :nbUsers
        AND p.maxUtilisateurs >= :nbUsers
        ORDER BY p.minUtilisateurs ASC
    """)
    Optional<Palier> findMatchingPalier(
            @Param("moduleId") Long moduleId,
            @Param("mode") String mode,
            @Param("nbUsers") int nbUsers
    );

    // ✅ FIX — ManyToMany : Module ↔ Produit via "produits" (pas "produit")
    @Query("""
        SELECT p FROM Palier p
        WHERE :produitId IN (
            SELECT prod.id FROM p.module.produits prod
        )
        AND p.statut = 'Actif'
    """)
    List<Palier> findByProduitId(@Param("produitId") Long produitId);

    void deleteByModuleId(Long moduleId);
}