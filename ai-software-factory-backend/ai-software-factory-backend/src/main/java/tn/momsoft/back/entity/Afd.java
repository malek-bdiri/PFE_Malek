package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@Entity
@Table(name = "afds")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Afd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code; // AFD-001...

    private String intitule;
    private String objectif;
    private String description;
    private String reglesGestion;
    private String fluxNominal;
    private String casAlternatifs;
    private String donneesManipulees;
    private String criteresAcceptation;

    private String statut;
    private String validateur;

    private String complexiteFonctionnelle; // "Élevée", "Moyenne", "Faible"

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate derniereMaj;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")
    @JsonIgnoreProperties({"afds", "analysis", "hibernateLazyInitializer"})
    private FunctionalBlock block;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id")
    @JsonIgnoreProperties({"afds", "blocks", "projet", "hibernateLazyInitializer"})
    private FunctionalAnalysis analysis;
}