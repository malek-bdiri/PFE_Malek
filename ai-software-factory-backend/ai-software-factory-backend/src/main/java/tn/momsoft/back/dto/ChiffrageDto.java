package tn.momsoft.back.dto;

import java.util.List;

public class ChiffrageDto {

    public HardwareDto hardware;
    public LicenceDto licence;
    public ServicesDto services;
    public ExigencesDto exigences;
    public TotalDto total;

    public static class HardwareDto {
        public Long id;
        public Double logistiquePct;
        public Double contingencePct;
        public Double taxeImportPct;
        public Double margePct;
        public List<HardwareLigneDto> lignes;
    }

    public static class HardwareLigneDto {
        public Long id;
        public Long hardwareGroupId;
        public String categorie;
        public String label;
        public Integer quantite;
        public Double prixUnitaire;
    }

    public static class LicenceDto {
        public Long id;
        public Long produitId;
        public String produitNom;
        public String modeFacturation;
        public Double remiseGlobalePct;
        public List<LicenceLigneDto> lignes;
    }

    public static class LicenceLigneDto {
        public Long id;
        public Long moduleId;
        public String moduleName;
        public Boolean obligatoire;
        public Integer nbUsers;
        public String pricingTier;
        public Double prixUnitaire;
        public Double discountPct;
    }

    public static class ServicesDto {
        public Long id;
        public String devise;
        public Double tjmEur;
        public Double tjmTnd;
        public Double totalHj;        // calculé
        public Double totalCoutEur;   // calculé
        public Double totalCoutTnd;   // calculé
        public List<ServicesLigneDto> lignes;
    }

    public static class ServicesLigneDto {
        public Long id;
        public Long composanteId;
        public String code;
        public String libelle;
        public Double hjEstimation;
        public String commentaire;
        public Double coutEur;   // hjEstimation * tjmEur (calculé)
        public Double coutTnd;   // hjEstimation * tjmTnd (calculé)
    }

    public static class ExigencesDto {
        public Long id;
        public List<ExigenceLigneDto> lignes;
    }

    public static class ExigenceLigneDto {
        public Long id;
        public Long exigenceId;
        public String exigenceIntitule;
        public String exigenceType;
        public Double hjEstimation;
        public Double hjValidation;
        public Double hjRecette;
    }

    public static class TotalDto {
        public Long id;
        public Double tauxChange;
        public Double remiseGlobalePct;
        public Double margePct;
        public Double tvaPct;
        public Double arrondi;
    }
}

