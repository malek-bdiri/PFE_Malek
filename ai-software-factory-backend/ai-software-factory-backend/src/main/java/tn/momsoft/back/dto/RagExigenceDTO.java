package tn.momsoft.back.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RagExigenceDTO {
    private String id;
    private String type;
    private String intitule;
    private String objectifClient;
    private String description;
    private String solutionProposee;
    private String limitesHypotheses;
}