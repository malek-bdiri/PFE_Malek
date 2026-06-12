package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "phases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Phase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;
    private Integer ordre;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;       // début prévu

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;         // fin prévue

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate debutReel;       // début réel

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate finReelle;       // fin réelle

    private Double progression;
    private Double poids;              // % poids pour progression globale
    private String statut;
    private String responsable;
    private Integer actionsLiees;      // compteur actions liées

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_id")
    @JsonIgnore
    private Planning planning;
}