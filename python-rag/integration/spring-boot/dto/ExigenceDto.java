package com.momsoft.smartfactory.dto;

/**
 * DTO — Une exigence individuelle (générée par l'IA ou ajoutée manuellement).
 */
public class ExigenceDto {
    private String id;
    private String type;           // Fonctionnelle | Non-fonctionnelle | Sécurité | Performance
    private String intitule;
    private String objectifClient;
    private String description;
    private String solutionProposee;
    private String limitesHypotheses;

    public ExigenceDto() {}

    public ExigenceDto(String id, String type, String intitule, String objectifClient,
                       String description, String solutionProposee, String limitesHypotheses) {
        this.id = id;
        this.type = type;
        this.intitule = intitule;
        this.objectifClient = objectifClient;
        this.description = description;
        this.solutionProposee = solutionProposee;
        this.limitesHypotheses = limitesHypotheses;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getIntitule() { return intitule; }
    public void setIntitule(String intitule) { this.intitule = intitule; }

    public String getObjectifClient() { return objectifClient; }
    public void setObjectifClient(String objectifClient) { this.objectifClient = objectifClient; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSolutionProposee() { return solutionProposee; }
    public void setSolutionProposee(String solutionProposee) { this.solutionProposee = solutionProposee; }

    public String getLimitesHypotheses() { return limitesHypotheses; }
    public void setLimitesHypotheses(String limitesHypotheses) { this.limitesHypotheses = limitesHypotheses; }
}
