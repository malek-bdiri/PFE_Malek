package tn.momsoft.back.dto;


import lombok.Data;
import tn.momsoft.back.entity.Statut;

@Data
public class ClientDTO {

    private Long id;
    private String nom;
    private String clientCode;
    private String secteur;
    private String pays;

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getNom() {
        return nom;
    }

    private Statut statut;
}
