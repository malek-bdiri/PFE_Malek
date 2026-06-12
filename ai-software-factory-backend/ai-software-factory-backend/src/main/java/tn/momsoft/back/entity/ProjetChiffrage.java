package tn.momsoft.back.entity;

import jakarta.persistence.*;
import tn.momsoft.back.entity.ChiffrageHardwareLigne;
import tn.momsoft.back.entity.ChiffrageLicenceLigne;
import tn.momsoft.back.entity.ChiffrageServicesLigne;
import tn.momsoft.back.entity.ChiffrageExigenceLigne;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projet_chiffrage")
public class ProjetChiffrage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", unique = true, nullable = false)
    private Projet projet;

    // Hardware
    private Double logistiquePct = 5.0;
    private Double contingencePct = 10.0;
    private Double taxeImportPct = 8.0;
    private Double margePct = 20.0;

    // Licence
    private Long produitId;
    private String produitNom;
    private String modeFacturation = "Oneshot";
    private Double remiseGlobalePct = 0.0;

    // Services
    private String devise = "EUR";
    private Double tjmEur = 600.0;
    private Double tjmTnd = 2000.0;

    // Total
    private Double tauxChange = 3.33;
    private Double remiseTotalPct = 5.0;
    private Double margeTotalPct = 20.0;
    private Double tvaPct = 20.0;
    private Double arrondi = 0.01;

    @OneToMany(mappedBy = "chiffrage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChiffrageHardwareLigne> hardwareLignes = new ArrayList<>();

    @OneToMany(mappedBy = "chiffrage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChiffrageLicenceLigne> licenceLignes = new ArrayList<>();

    @OneToMany(mappedBy = "chiffrage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChiffrageServicesLigne> servicesLignes = new ArrayList<>();

    @OneToMany(mappedBy = "chiffrage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChiffrageExigenceLigne> exigenceLignes = new ArrayList<>();

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Projet getProjet() { return projet; }
    public void setProjet(Projet projet) { this.projet = projet; }
    public Double getLogistiquePct() { return logistiquePct; }
    public void setLogistiquePct(Double v) { this.logistiquePct = v; }
    public Double getContingencePct() { return contingencePct; }
    public void setContingencePct(Double v) { this.contingencePct = v; }
    public Double getTaxeImportPct() { return taxeImportPct; }
    public void setTaxeImportPct(Double v) { this.taxeImportPct = v; }
    public Double getMargePct() { return margePct; }
    public void setMargePct(Double v) { this.margePct = v; }
    public Long getProduitId() { return produitId; }
    public void setProduitId(Long v) { this.produitId = v; }
    public String getProduitNom() { return produitNom; }
    public void setProduitNom(String v) { this.produitNom = v; }
    public String getModeFacturation() { return modeFacturation; }
    public void setModeFacturation(String v) { this.modeFacturation = v; }
    public Double getRemiseGlobalePct() { return remiseGlobalePct; }
    public void setRemiseGlobalePct(Double v) { this.remiseGlobalePct = v; }
    public String getDevise() { return devise; }
    public void setDevise(String v) { this.devise = v; }
    public Double getTjmEur() { return tjmEur; }
    public void setTjmEur(Double v) { this.tjmEur = v; }
    public Double getTjmTnd() { return tjmTnd; }
    public void setTjmTnd(Double v) { this.tjmTnd = v; }
    public Double getTauxChange() { return tauxChange; }
    public void setTauxChange(Double v) { this.tauxChange = v; }
    public Double getRemiseTotalPct() { return remiseTotalPct; }
    public void setRemiseTotalPct(Double v) { this.remiseTotalPct = v; }
    public Double getMargeTotalPct() { return margeTotalPct; }
    public void setMargeTotalPct(Double v) { this.margeTotalPct = v; }
    public Double getTvaPct() { return tvaPct; }
    public void setTvaPct(Double v) { this.tvaPct = v; }
    public Double getArrondi() { return arrondi; }
    public void setArrondi(Double v) { this.arrondi = v; }
    public List<ChiffrageHardwareLigne> getHardwareLignes() { return hardwareLignes; }
    public void setHardwareLignes(List<ChiffrageHardwareLigne> v) { this.hardwareLignes = v; }
    public List<ChiffrageLicenceLigne> getLicenceLignes() { return licenceLignes; }
    public void setLicenceLignes(List<ChiffrageLicenceLigne> v) { this.licenceLignes = v; }
    public List<ChiffrageServicesLigne> getServicesLignes() { return servicesLignes; }
    public void setServicesLignes(List<ChiffrageServicesLigne> v) { this.servicesLignes = v; }
    public List<ChiffrageExigenceLigne> getExigenceLignes() { return exigenceLignes; }
    public void setExigenceLignes(List<ChiffrageExigenceLigne> v) { this.exigenceLignes = v; }
}


