package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "chiffrage_exigence_ligne")
public class ChiffrageExigenceLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiffrage_id", nullable = false)
    @JsonIgnore
    private ProjetChiffrage chiffrage;

    private Long exigenceId;
    private String exigenceIntitule;
    private String exigenceType;
    private Double hjEstimation = 0.0;
    private Double hjValidation = 0.0;
    private Double hjRecette = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProjetChiffrage getChiffrage() { return chiffrage; }
    public void setChiffrage(ProjetChiffrage c) { this.chiffrage = c; }
    public Long getExigenceId() { return exigenceId; }
    public void setExigenceId(Long v) { this.exigenceId = v; }
    public String getExigenceIntitule() { return exigenceIntitule; }
    public void setExigenceIntitule(String v) { this.exigenceIntitule = v; }
    public String getExigenceType() { return exigenceType; }
    public void setExigenceType(String v) { this.exigenceType = v; }
    public Double getHjEstimation() { return hjEstimation; }
    public void setHjEstimation(Double v) { this.hjEstimation = v; }
    public Double getHjValidation() { return hjValidation; }
    public void setHjValidation(Double v) { this.hjValidation = v; }
    public Double getHjRecette() { return hjRecette; }
    public void setHjRecette(Double v) { this.hjRecette = v; }
}

