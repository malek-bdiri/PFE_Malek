package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hardware_groups")
public class HardwareGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id")
    private HardwareType type;

    @Column(name = "logistic_cost_percent")
    private double logisticCostPercent = 5.0;

    @Column(name = "contingency_percent")
    private double contingencyPercent = 10.0;

    @JsonManagedReference
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<HardwareGroupItem> items = new ArrayList<>();

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public HardwareType getType() { return type; }
    public void setType(HardwareType type) { this.type = type; }
    public double getLogisticCostPercent() { return logisticCostPercent; }
    public void setLogisticCostPercent(double logisticCostPercent) { this.logisticCostPercent = logisticCostPercent; }
    public double getContingencyPercent() { return contingencyPercent; }
    public void setContingencyPercent(double contingencyPercent) { this.contingencyPercent = contingencyPercent; }
    public List<HardwareGroupItem> getItems() { return items; }
    public void setItems(List<HardwareGroupItem> items) { this.items = items; }
}