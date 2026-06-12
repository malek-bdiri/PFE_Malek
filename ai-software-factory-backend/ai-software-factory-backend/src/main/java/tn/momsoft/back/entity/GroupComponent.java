package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class GroupComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private HardwareGroup group;

    @ManyToOne
    @JoinColumn(name = "component_id", nullable = false)
    private HardwareComponent component;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Transient
    public Double getLineTotal() {
        if (component == null || component.getNetPrice() == null) {
            return 0.0;
        }
        return component.getNetPrice() * quantity;
    }
}