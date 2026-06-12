package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "plannings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Planning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===============================
    // INFOS GENERALES
    // ===============================

    @Column(nullable = false)
    private String nom;

    private String version;

    private String phaseActuelle;

    private Double progression;

    // ===============================
    // METRICS CALCULÉES
    // ===============================

    private Integer totalRessources;

    private Double tauxCharge;

    private Double chargeTotale;

    // ===============================
    // DATES
    // ===============================

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;

    // ===============================
    // STATUT
    // ===============================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut;


    @Enumerated(EnumType.STRING)
    private PlanningStatus statusMetier;
    // ===============================
    // RELATION PROJET
    // ===============================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonIgnoreProperties({"exigences","plannings"})
    private Projet projet;

    // ===============================
    // RELATION PHASES
    // ===============================

    @OneToMany(mappedBy = "planning", cascade = CascadeType.ALL)
    private List<Phase> phases;
}