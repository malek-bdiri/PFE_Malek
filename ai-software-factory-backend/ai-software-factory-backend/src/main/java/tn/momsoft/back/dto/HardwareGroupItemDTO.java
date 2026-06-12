package tn.momsoft.back.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

public class HardwareGroupItemDTO {
    private Long id;
    private Long componentId;
    private int quantity;

    /** Accepte { "component": { "id": 1, ... } } envoyé par le frontend Angular */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ComponentRef {
        private Long id;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }

    private ComponentRef component;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    /** Retourne componentId si présent, sinon component.id (format frontend) */
    public Long getComponentId() {
        if (componentId != null) return componentId;
        if (component != null) return component.getId();
        return null;
    }
    public void setComponentId(Long componentId) { this.componentId = componentId; }

    public ComponentRef getComponent() { return component; }
    public void setComponent(ComponentRef component) { this.component = component; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}