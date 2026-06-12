package tn.momsoft.back.dto;

public class HardwareGroupComponentDTO {
    private Long id;
    private Long componentId;
    private String componentCode;
    private String componentDesignation;
    private Double componentNetPrice;
    private int quantity;
    private Double totalPrice;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getComponentId() { return componentId; }
    public void setComponentId(Long componentId) { this.componentId = componentId; }
    public String getComponentCode() { return componentCode; }
    public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
    public String getComponentDesignation() { return componentDesignation; }
    public void setComponentDesignation(String componentDesignation) { this.componentDesignation = componentDesignation; }
    public Double getComponentNetPrice() { return componentNetPrice; }
    public void setComponentNetPrice(Double componentNetPrice) { this.componentNetPrice = componentNetPrice; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
}

