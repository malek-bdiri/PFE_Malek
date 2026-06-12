package tn.momsoft.back.entity;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "validation_requests")
public class ValidationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "projet_id")
    private Long projetId;

    @Column(name = "projet_nom")
    private String projetNom;

    @Column(name = "demandeur_id")
    private String demandeurId;            // Keycloak sub

    @Column(name = "demandeur_nom")
    private String demandeurNom;

    @Column(name = "demandeur_email")
    private String demandeurEmail;

    @Column(name = "validateur_id")
    private String validateurId;           // Keycloak sub du validateur choisi

    @Column(name = "validateur_nom")
    private String validateurNom;

    @Column(name = "validateur_email")
    private String validateurEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.EN_ATTENTE;

    @Column(name = "commentaire", length = 1000)
    private String commentaire;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    public enum Statut { EN_ATTENTE, VALIDE, REVISION, REFUSE }

    // Getters & Setters
    public Long getId() { return id; }
    public Long getProjetId() { return projetId; }
    public void setProjetId(Long projetId) { this.projetId = projetId; }
    public String getProjetNom() { return projetNom; }
    public void setProjetNom(String projetNom) { this.projetNom = projetNom; }
    public String getDemandeurId() { return demandeurId; }
    public void setDemandeurId(String d) { this.demandeurId = d; }
    public String getDemandeurNom() { return demandeurNom; }
    public void setDemandeurNom(String d) { this.demandeurNom = d; }
    public String getDemandeurEmail() { return demandeurEmail; }
    public void setDemandeurEmail(String d) { this.demandeurEmail = d; }
    public String getValidateurId() { return validateurId; }
    public void setValidateurId(String v) { this.validateurId = v; }
    public String getValidateurNom() { return validateurNom; }
    public void setValidateurNom(String v) { this.validateurNom = v; }
    public String getValidateurEmail() { return validateurEmail; }
    public void setValidateurEmail(String v) { this.validateurEmail = v; }
    public Statut getStatut() { return statut; }
    public void setStatut(Statut statut) { this.statut = statut; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String c) { this.commentaire = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime v) { this.validatedAt = v; }
}