package tn.momsoft.back.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class PlanningGenerationRequest {

    // date de début du planning
    private LocalDate dateDebut;
    private LocalDate dateFin;

    // ressources envoyées depuis Step2
    private List<RessourceDTO> ressources;

    // buffer de risque
    private int riskBuffer;

    // phases séquentielles ou parallèles
    private boolean sequentialPhases;

}