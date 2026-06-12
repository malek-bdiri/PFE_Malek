package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "functional_blocks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FunctionalBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code; // BF-001, BF-002...
    private String nom;
    private String description;
    private String couleur; // blue, green, purple, orange, pink

    @ElementCollection
    @CollectionTable(name = "functional_block_exigences",
            joinColumns = @JoinColumn(name = "block_id"))
    @Column(name = "exigence_code")
    private List<String> exigences; // REQ-001, REQ-002...

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private FunctionalAnalysis analysis;
}