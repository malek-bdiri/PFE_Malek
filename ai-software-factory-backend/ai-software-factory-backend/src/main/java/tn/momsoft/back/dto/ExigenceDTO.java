package tn.momsoft.back.dto;


import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExigenceDTO {
    private Long id;
    private String type;
    private String intitule;
    private String objectifClient;
    private String description;
    private String solutionProposee;
    private String limitesHypotheses;
    private String priorite;
    private String statut;
    private String sourceDocument;
    private String sourceSection;
    private String responsable;
    private String validateur;
    private String commentaireValidation;
}