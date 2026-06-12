package tn.momsoft.back.dto;

import tn.momsoft.back.entity.Statut;

public class HardwareTypeDTO {
    private Long id;
    private String code;
    private String label;
    private String description;
    private Statut statut;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Statut getStatut() { return statut; }
    public void setStatut(Statut statut) { this.statut = statut; }
}

