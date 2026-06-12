package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cas_de_test")
@Data
public class CasDeTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String caseId;
    private String groupe;
    private String priorite;
    private String statut;

    @ElementCollection
    @CollectionTable(name = "cas_preconditions",
            joinColumns = @JoinColumn(name = "cas_id"))
    @Column(name = "precondition", columnDefinition = "TEXT")
    private List<String> preconditions = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "cas_etapes",
            joinColumns = @JoinColumn(name = "cas_id"))
    @Column(name = "etape", columnDefinition = "TEXT")
    private List<String> etapes = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String resultatAttendu;

    @Column(columnDefinition = "TEXT")
    private String resultatObtenu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id")
    @JsonIgnore   // ← casse la boucle CasDeTest → TestScenario → CasDeTest → ...
    private TestScenario testScenario;
}