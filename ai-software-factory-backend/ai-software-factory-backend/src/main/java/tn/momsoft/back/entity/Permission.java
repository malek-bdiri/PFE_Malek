package tn.momsoft.back.entity;

import jakarta.persistence.*;
import jakarta.persistence.GeneratedValue;
//import org.springframework.data.annotation.Id;

@Entity
public class Permission {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
}
