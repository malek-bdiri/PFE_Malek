// ChiffrageHardwareConfig.java — paramètres coûts additionnels par projet
package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "chiffrage_hardware_config")
@Data @NoArgsConstructor @AllArgsConstructor
public class ChiffrageHardwareConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false, unique = true)
    private Projet projet;

    @Column(name = "logistic_percent")
    private double logisticPercent = 5.0;

    @Column(name = "contingency_percent")
    private double contingencyPercent = 10.0;

    @Column(name = "import_tax_percent")
    private double importTaxPercent = 8.0;

    @Column(name = "margin_percent")
    private double marginPercent = 20.0;
}