package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "jours_feries")
public class JourFerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private boolean recurrentAnnuel;

    @Column(length = 1000)
    private String description;

    // ============================
    // CONSTRUCTEURS
    // ============================

    public JourFerie() {}

    public JourFerie(LocalDate date, String nom, boolean recurrentAnnuel, String description) {
        this.date = date;
        this.nom = nom;
        this.recurrentAnnuel = recurrentAnnuel;
        this.description = description;
    }

    // ============================
    // GETTERS & SETTERS
    // ============================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public boolean isRecurrentAnnuel() {
        return recurrentAnnuel;
    }

    public void setRecurrentAnnuel(boolean recurrentAnnuel) {
        this.recurrentAnnuel = recurrentAnnuel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}