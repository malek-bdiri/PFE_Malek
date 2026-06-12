package tn.momsoft.back.dto;

import lombok.Data;
import tn.momsoft.back.entity.Statut;

@Data

public class ProduitDTO {

    private Long id;
    private String nom;
    private String produitCode;
    private String description;
    private Statut statut;

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setProduitCode(String produitCode) {
        this.produitCode = produitCode;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStatut(Statut statut) {
        this.statut = statut;
    }

    public Long getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getProduitCode() {
        return produitCode;
    }

    public String getDescription() {
        return description;
    }

    public Statut getStatut() {
        return statut;
    }
}
