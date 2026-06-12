// LicenceLigneDTO.java
package tn.momsoft.back.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class LicenceLigneDTO {
    private Long moduleId;
    private int nbUsers;
    private String pricingMode; // ONESHOT | YEARLY
    private double remisePercent;
}