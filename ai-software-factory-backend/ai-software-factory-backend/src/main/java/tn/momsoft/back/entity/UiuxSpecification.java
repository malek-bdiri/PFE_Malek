package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "uiux_specifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UiuxSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code; // UIUX-001...
    private String nom;
    private String version;
    private String statut; // Brouillon, Généré, Validé

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "projet_id")
    @JsonIgnoreProperties({"exigences", "plannings", "services", "calendrier", "hibernate_lazy_initializer"})
    private Projet projet;

    // AFD liés
    @ElementCollection
    @CollectionTable(name = "uiux_afd_lies",
            joinColumns = @JoinColumn(name = "uiux_id"))
    @Column(name = "afd_code")
    private List<String> afdLies;

    // Plateformes cibles
    @ElementCollection
    @CollectionTable(name = "uiux_plateformes",
            joinColumns = @JoinColumn(name = "uiux_id"))
    @Column(name = "plateforme")
    private List<String> plateformes;

    // Contexte Design
    private String complexiteUx;
    private String styleDesign;
    private String couleurPrimaire;
    private String couleurSecondaire;
    private String couleurAccent;
    private String preferenceTypo;
    private String niveauAccessibilite;
    private Boolean supportMultiLangue;
    private Boolean darkMode;

    // Contenu généré
    @Column(columnDefinition = "TEXT")
    private String paletteCouleursJson;

    @Column(columnDefinition = "TEXT")
    private String systemeTypoJson;

    @Column(columnDefinition = "TEXT")
    private String systemeEspacementJson;

    @Column(columnDefinition = "TEXT")
    private String elevationJson;

    // ── Champs générés par RAG ──────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String overviewJson;

    @Column(columnDefinition = "TEXT")
    private String designRulesJson;

    @Column(columnDefinition = "TEXT")
    private String componentsJson;

    @Column(columnDefinition = "TEXT")
    private String layoutSystemJson;

    @Column(columnDefinition = "TEXT")
    private String interactionsJson;

    @Column(columnDefinition = "TEXT")
    private String accessibilityJson;

    @Column(columnDefinition = "TEXT")
    private String figmaPrompt;

    @Column(columnDefinition = "TEXT")
    private String uiSpecByAfdJson;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate derniereMaj;
}