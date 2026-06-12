package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_scenarios")
@Data
public class TestScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String scenarioId;      // TS-001

    private String titre;
    private String type;            // Functional, Regression, Integration, UAT
    private String priorite;        // P1, P2, P3
    private String statut;          // Brouillon, Généré, Validé
    private String version;         // v1.0

    private Long projetId;
    private Long afdId;

    @OneToMany(mappedBy = "testScenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CasDeTest> casDeTest = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "scenario_criteres",
            joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "critere")
    private List<String> criteresAcceptation = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}