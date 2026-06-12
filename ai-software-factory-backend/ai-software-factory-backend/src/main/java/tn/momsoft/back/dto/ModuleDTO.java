package tn.momsoft.back.dto;

import java.util.List;

public class ModuleDTO {
    private Long id;
    private String code;
    private String nom;
    private String categorie;
    private String description;
    private String tags;
    private Boolean obligatoire;
    private Boolean actif;
    private Double prixOneshot;
    private Double prixYearly;
    private Double prixMonthly;
    private String dependances;
    private List<Long> dependanceIds; // IDs des modules dont celui-ci dépend
    private List<Long> produitIds;    // Produits auxquels ce module est affecté

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
    public List<Long> getDependanceIds() { return dependanceIds; }
    public void setDependanceIds(List<Long> dependanceIds) { this.dependanceIds = dependanceIds; }
    public List<Long> getProduitIds() { return produitIds; }
    public void setProduitIds(List<Long> produitIds) { this.produitIds = produitIds; }
}

