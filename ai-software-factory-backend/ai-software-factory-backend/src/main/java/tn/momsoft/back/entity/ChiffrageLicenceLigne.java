package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chiffrage_licence_lignes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChiffrageLicenceLigne {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiffrage_id", nullable = false)
    private ProjetChiffrage chiffrage;

    // Stockage direct — pas de FK vers Module
    @Column(name = "module_id")
    private Long moduleId;

    @Column(name = "module_name")
    private String moduleName;

    @Column(name = "obligatoire")
    private boolean obligatoire = false;

    @Column(name = "nb_users")
    private int nbUsers = 1;

    @Column(name = "pricing_mode", length = 20)
    private String pricingMode = "ONESHOT";

    @Column(name = "pricing_tier")
    private String pricingTier;

    @Column(name = "prix_unitaire")
    private double prixUnitaire = 0.0;

    @Column(name = "discount_pct")
    private double discountPct = 0.0;

    @Column(name = "discount_amount")
    private double discountAmount = 0.0;

    @Column(name = "final_subtotal")
    private double finalSubtotal = 0.0;
}