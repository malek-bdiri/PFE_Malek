package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "services_projet")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private Double hjDev;
    private Double hjTest;
    private Double hjFonc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    private Projet projet;
}