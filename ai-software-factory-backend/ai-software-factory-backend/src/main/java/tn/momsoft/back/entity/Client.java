package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setClientCode(String clientCode) {
        this.clientCode = clientCode;
    }

    public void setSecteur(String secteur) {
        this.secteur = secteur;
    }

    public void setPays(String pays) {
        this.pays = pays;
    }

    public void setStatut(Statut statut) {
        this.statut = statut;
    }

    public String getNom() {
        return nom;
    }

    public String getSecteur() {
        return secteur;
    }

    public String getClientCode() {
        return clientCode;
    }

    public String getPays() {
        return pays;
    }

    public Statut getStatut() {
        return statut;
    }

    @Column(nullable = false, unique = true)
    private String clientCode;
    private String secteur;
    private String pays;
    @Enumerated(EnumType.STRING)
    private Statut statut;


}
