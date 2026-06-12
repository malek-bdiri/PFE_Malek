package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "module")
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, length = 50)
    private String categorie; // Core, Analytics, IoT, IA, Reporting, Mobile, Security

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String tags; // séparés par virgules

    private Boolean obligatoire = false;
    private Boolean actif = true;

    // Prix par tier
    private Double prixOneshot = 0.0;
    private Double prixYearly = 0.0;
    private Double prixMonthly = 0.0;

    // Dépendances (IDs séparés par virgules)
    @Column(length = 500)
    private String dependances;

    // Relation M-M avec Produit via table de jointure
    @ManyToMany(mappedBy = "modules", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Produit> produits = new ArrayList<>();

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public Boolean getObligatoire() { return obligatoire; }
    public void setObligatoire(Boolean obligatoire) { this.obligatoire = obligatoire; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    public Double getPrixOneshot() { return prixOneshot; }
    public void setPrixOneshot(Double prixOneshot) { this.prixOneshot = prixOneshot; }
    public Double getPrixYearly() { return prixYearly; }
    public void setPrixYearly(Double prixYearly) { this.prixYearly = prixYearly; }
    public Double getPrixMonthly() { return prixMonthly; }
    public void setPrixMonthly(Double prixMonthly) { this.prixMonthly = prixMonthly; }
    public String getDependances() { return dependances; }
    public void setDependances(String dependances) { this.dependances = dependances; }
    public List<Produit> getProduits() { return produits; }
    public void setProduits(List<Produit> produits) { this.produits = produits; }
}

