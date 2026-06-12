package tn.momsoft.back.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "composante")
public class Composante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Column(length = 500)
    private String description;

    private Boolean active = true;

    // TJM par défaut (optionnel)
    private Double tjmDefaut;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Double getTjmDefaut() { return tjmDefaut; }
    public void setTjmDefaut(Double tjmDefaut) { this.tjmDefaut = tjmDefaut; }
}

