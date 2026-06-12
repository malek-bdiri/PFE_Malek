// ChiffrageLicenceRequestDTO.java
package tn.momsoft.back.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ChiffrageLicenceRequestDTO {
    private Long produitId;
    private int nbUsers;
    private String pricingMode; // ONESHOT | YEARLY
    private boolean applyGlobalDiscount;
    private double globalDiscountPercent;
    private List<LicenceLigneDTO> lignes;
}