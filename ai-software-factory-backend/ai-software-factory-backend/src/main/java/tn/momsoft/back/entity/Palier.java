package tn.momsoft.back.entity;

// Palier.java

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "paliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Palier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "min_utilisateurs", nullable = false)
    private int minUtilisateurs = 1;

    @Column(name = "max_utilisateurs", nullable = false)
    private int maxUtilisateurs = 10;

    @Column(nullable = false)
    private double prix;

    @Column(nullable = false, length = 10)
    private String devise = "EUR";

    // ONESHOT ou YEARLY
    @Column(nullable = false, length = 20)
    private String mode = "ONESHOT";

    @Column(name = "date_effective")
    private String dateEffective;

    @Column(nullable = false, length = 20)
    private String statut = "Actif";
}
