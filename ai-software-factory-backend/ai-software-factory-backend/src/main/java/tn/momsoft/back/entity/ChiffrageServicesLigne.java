package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "chiffrage_services_ligne")
public class ChiffrageServicesLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiffrage_id", nullable = false)
    @JsonIgnore
    private ProjetChiffrage chiffrage;

    private Long composanteId;
    private String code;
    private String libelle;
    private Double hjEstimation = 0.0;
    private String commentaire;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProjetChiffrage getChiffrage() { return chiffrage; }
    public void setChiffrage(ProjetChiffrage c) { this.chiffrage = c; }
    public Long getComposanteId() { return composanteId; }
    public void setComposanteId(Long v) { this.composanteId = v; }
    public String getCode() { return code; }
    public void setCode(String v) { this.code = v; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String v) { this.libelle = v; }
    public Double getHjEstimation() { return hjEstimation; }
    public void setHjEstimation(Double v) { this.hjEstimation = v; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String v) { this.commentaire = v; }
}

