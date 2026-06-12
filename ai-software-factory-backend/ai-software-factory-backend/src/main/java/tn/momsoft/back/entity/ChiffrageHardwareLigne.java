package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "chiffrage_hardware_ligne")
public class ChiffrageHardwareLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiffrage_id", nullable = false)
    @JsonIgnore
    private ProjetChiffrage chiffrage;

    @Column(name = "hardware_group_id")
    private Long hardwareGroupId;

    private String categorie;
    private String label;
    private Integer quantite = 1;
    private Double prixUnitaire = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProjetChiffrage getChiffrage() { return chiffrage; }
    public void setChiffrage(ProjetChiffrage c) { this.chiffrage = c; }
    public Long getHardwareGroupId() { return hardwareGroupId; }
    public void setHardwareGroupId(Long v) { this.hardwareGroupId = v; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String v) { this.categorie = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { this.label = v; }
    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer v) { this.quantite = v; }
    public Double getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(Double v) { this.prixUnitaire = v; }
}