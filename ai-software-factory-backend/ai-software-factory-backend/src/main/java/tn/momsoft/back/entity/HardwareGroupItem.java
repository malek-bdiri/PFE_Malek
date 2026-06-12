package tn.momsoft.back.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "hardware_group_items")
public class HardwareGroupItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private HardwareGroup group;

//    @ManyToOne(fetch = FetchType.EAGER)
//    @JoinColumn(name = "component_id", nullable = false)
//    private HardwareComponent component;

    @ManyToOne
    @JoinColumn(name = "component_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private HardwareComponent component;

    @Column(nullable = false)
    private int quantity = 1;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public HardwareGroup getGroup() { return group; }
    public void setGroup(HardwareGroup group) { this.group = group; }
    public HardwareComponent getComponent() { return component; }
    public void setComponent(HardwareComponent component) { this.component = component; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}