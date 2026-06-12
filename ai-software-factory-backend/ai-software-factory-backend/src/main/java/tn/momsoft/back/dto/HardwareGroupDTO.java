package tn.momsoft.back.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

public class HardwareGroupDTO {
    private Long id;
    private String code;
    private String label;
    private String description;
    private Long typeId;
    private double logisticCostPercent;
    private double contingencyPercent;
    private List<HardwareGroupItemDTO> items;

    // Support nested type object: { "type": { "id": 1 } }
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TypeRef {
        private Long id;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }
    private TypeRef type;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    /** Returns typeId if set explicitly, otherwise falls back to nested type.id */
    public Long getTypeId() {
        if (typeId != null) return typeId;
        if (type != null) return type.getId();
        return null;
    }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public TypeRef getType() { return type; }
    public void setType(TypeRef type) { this.type = type; }

    public double getLogisticCostPercent() { return logisticCostPercent; }
    public void setLogisticCostPercent(double v) { this.logisticCostPercent = v; }
    public double getContingencyPercent() { return contingencyPercent; }
    public void setContingencyPercent(double v) { this.contingencyPercent = v; }
    public List<HardwareGroupItemDTO> getItems() { return items; }
    public void setItems(List<HardwareGroupItemDTO> items) { this.items = items; }
}
