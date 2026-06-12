package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Entity
@Table(name = "projets")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String codeProjet;

    private String client;
    private String produit;

    @Column(columnDefinition = "TEXT")
    private String description;


    @Enumerated(EnumType.STRING)
    private ModeCreation modeCreation;


    private LocalDateTime dateCreation = LocalDateTime.now();


//    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Exigence> exigences = new ArrayList<>();

    //@OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OneToMany(mappedBy = "projet", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private List<Exigence> exigences = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
    // Méthode helper pour ajouter une exigence
    public void addExigence(Exigence exigence) {
        if (this.exigences == null) {
            this.exigences = new ArrayList<>();
        }
        exigence.setProjet(this);
        this.exigences.add(exigence);
    }
    public Projet() {}
    public List<Exigence> getExigences() {
        return exigences;
    }

    public void setExigences(List<Exigence> exigences) {
        this.exigences = exigences != null ? exigences : new ArrayList<>();
        for (Exigence e : this.exigences) {
            e.setProjet(this);
        }
    }
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation", nullable = false)
    private StatutValidation statutValidation = StatutValidation.EN_COURS;

    public enum StatutValidation {
        EN_COURS,
        EN_ATTENTE,
        VALIDE,
        REVISION
    }

    public StatutValidation getStatutValidation() { return statutValidation; }
    public void setStatutValidation(StatutValidation s) { this.statutValidation = s; }
    // getters & setters
}
