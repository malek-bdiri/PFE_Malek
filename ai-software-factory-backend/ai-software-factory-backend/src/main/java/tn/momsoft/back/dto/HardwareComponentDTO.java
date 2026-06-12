package tn.momsoft.back.dto;

public class HardwareComponentDTO {
    private Long id;
    private String code;
    private String designation;
    private String manufacturer;
    private String manufacturerRef;
    private String supplier;
    private String supplierRef;
    private Double unitPrice;
    private Double discount;
    private Double netPrice;
    private Long typeId;
    private String typeCode;
    private String typeLabel;
    private String description;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getManufacturerRef() { return manufacturerRef; }
    public void setManufacturerRef(String manufacturerRef) { this.manufacturerRef = manufacturerRef; }
    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
    public String getSupplierRef() { return supplierRef; }
    public void setSupplierRef(String supplierRef) { this.supplierRef = supplierRef; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public Double getNetPrice() { return netPrice; }
    public void setNetPrice(Double netPrice) { this.netPrice = netPrice; }
    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public String getTypeLabel() { return typeLabel; }
    public void setTypeLabel(String typeLabel) { this.typeLabel = typeLabel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

