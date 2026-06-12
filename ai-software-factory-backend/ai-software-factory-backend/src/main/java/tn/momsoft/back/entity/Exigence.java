package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exigences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Exigence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String intitule;
    private String objectifClient;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String solutionProposee;

    @Column(columnDefinition = "TEXT")
    private String limitesHypotheses;

    private String statut = "En attente";
    private String sourceDocument;
    private String sourceSection;
    private String responsable;
    private String validateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    @JsonBackReference
    private Projet projet;
}