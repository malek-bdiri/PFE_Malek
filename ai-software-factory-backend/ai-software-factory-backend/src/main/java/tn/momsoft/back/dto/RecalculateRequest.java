package tn.momsoft.back.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RecalculateRequest {

    private LocalDate startDate;
    private int riskBuffer;
    private boolean sequentialPhases;

    private List<RessourceDTO> ressources;
}