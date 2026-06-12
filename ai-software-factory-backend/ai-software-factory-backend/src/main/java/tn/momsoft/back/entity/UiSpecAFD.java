package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "ui_spec_afd")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UiSpecAFD {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relation to UIUX
    @ManyToOne
    @JoinColumn(name = "uiux_id")
    private UiuxSpecification uiux;

    // Relation to AFD
    @ManyToOne
    @JoinColumn(name = "afd_id")
    private Afd afd;

    // UX status (IMPORTANT)
    private String statutUx;
    // "Non généré" | "Généré" | "Validé" | "Obsolète"

    private String version;

    private String complexite; // copy from AFD if needed

    @Column(columnDefinition = "TEXT")
    private String resumeFonctionnel;

    @Column(columnDefinition = "TEXT")
    private String fluxUtilisateur;

    @Column(columnDefinition = "TEXT")
    private String definitionsEcrans;

    @Column(columnDefinition = "TEXT")
    private String mappingComposants;

    @Column(columnDefinition = "TEXT")
    private String reglesInteraction;

    @Column(columnDefinition = "TEXT")
    private String accessibilite;

    @Column(columnDefinition = "TEXT")
    private String comportementResponsive;

    @Column(columnDefinition = "TEXT")
    private String figmaPrompt;

}