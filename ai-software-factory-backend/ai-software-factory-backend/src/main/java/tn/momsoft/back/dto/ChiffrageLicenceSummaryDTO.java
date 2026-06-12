// ChiffrageLicenceSummaryDTO.java
package tn.momsoft.back.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class ChiffrageLicenceSummaryDTO {
    private String pricingMode;
    private double baseTotal;
    private double discountAmount;
    private double totalLicence;
    private List<LigneDetailDTO> lignes;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LigneDetailDTO {
        private Long id;
        private Long moduleId;
        private String moduleNom;
        private boolean obligatoire;
        private int nbUsers;
        private String pricingMode;
        private String pricingTierLabel;
        private double prixUnitaire;
        private double subtotal;
        private double remisePercent;
        private double remiseAmount;
        private double finalSubtotal;
    }
}