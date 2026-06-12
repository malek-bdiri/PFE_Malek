package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "produit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;
    @Column(nullable = false, unique = true)
    private String produitCode;
    private String description;
    @Enumerated(EnumType.STRING)
    private Statut statut;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "produit_module",
        joinColumns = @JoinColumn(name = "produit_id"),
        inverseJoinColumns = @JoinColumn(name = "module_id")
    )
    @Builder.Default
    private List<Module> modules = new ArrayList<>();

    public void setId(Long id) { this.id = id; }
    public void setNom(String nom) { this.nom = nom; }
    public void setDescription(String description) { this.description = description; }
    public void setProduitCode(String produitCode) { this.produitCode = produitCode; }
    public void setStatut(Statut statut) { this.statut = statut; }
    public Long getId() { return id; }
    public String getNom() { return nom; }
    public String getProduitCode() { return produitCode; }
    public String getDescription() { return description; }
    public Statut getStatut() { return statut; }
    public List<Module> getModules() { return modules; }
    public void setModules(List<Module> modules) { this.modules = modules; }
}

