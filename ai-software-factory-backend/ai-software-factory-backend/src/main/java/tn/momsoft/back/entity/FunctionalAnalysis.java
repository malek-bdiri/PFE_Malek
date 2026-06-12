package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "functional_analyses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FunctionalAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    @JsonIgnoreProperties({"exigences", "plannings", "services", "calendrier"})
    private Projet projet;

    private String validateur;
    private String statut;
    private Integer nbAfd;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private String description;
}