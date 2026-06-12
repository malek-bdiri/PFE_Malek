package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class HardwareComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String designation;

    private String manufacturer;
    private String manufacturerRef;
    private String supplier;
    private String supplierRef;

    @Column(nullable = false)
    private Double unitPrice;

    private Double discount = 0.0;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private HardwareType type;

    private String description;

    @Transient
    public Double getNetPrice() {
        if (unitPrice == null) return 0.0;
        return unitPrice * (1 - (discount != null ? discount : 0.0) / 100);
    }
}