package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.ChiffrageDto;
import tn.momsoft.back.dto.ChiffrageLicenceRequestDTO;
import tn.momsoft.back.dto.ChiffrageLicenceSummaryDTO;
import tn.momsoft.back.entity.*;
import tn.momsoft.back.entity.Module;
import tn.momsoft.back.repository.ModuleRepository;
import tn.momsoft.back.repository.ProduitRepository;
import tn.momsoft.back.repository.ProjetChiffrageRepository;
import tn.momsoft.back.repository.ProjetRepository;
import tn.momsoft.back.service.ChiffrageLicenceService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projets/{projetId}/chiffrage")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChiffrageController {

    private final ProjetChiffrageRepository chiffrageRepo;
    private final ProjetRepository projetRepo;
    private final ProduitRepository produitRepository;
    private final ModuleRepository moduleRepository;


    // Ajouter dans les dépendances du ChiffrageController
    private final ChiffrageLicenceService licenceService;

    // ─── GET complet ──────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ChiffrageDto> getChiffrage(@PathVariable Long projetId) {
        ProjetChiffrage c = chiffrageRepo.findByProjetId(projetId)
                .orElseGet(() -> {
                    ProjetChiffrage nouveau = new ProjetChiffrage();
                    nouveau.setProjet(projetRepo.getReferenceById(projetId));
                    return chiffrageRepo.save(nouveau);
                });
        return ResponseEntity.ok(toDto(c));
    }

    // ─── PUT hardware ─────────────────────────────────────────────────────────

    @PutMapping("/hardware")
    @Transactional
    public ResponseEntity<ChiffrageDto.HardwareDto> saveHardware(
            @PathVariable Long projetId,
            @RequestBody ChiffrageDto.HardwareDto dto) {
        ProjetChiffrage c = getOrCreate(projetId);
        c.setLogistiquePct(dto.logistiquePct);
        c.setContingencePct(dto.contingencePct);
        c.setTaxeImportPct(dto.taxeImportPct);
        c.setMargePct(dto.margePct);

        c.getHardwareLignes().clear();
        if (dto.lignes != null) {
            for (ChiffrageDto.HardwareLigneDto ligneDto : dto.lignes) {
                ChiffrageHardwareLigne l = new ChiffrageHardwareLigne();
                l.setChiffrage(c);
                l.setHardwareGroupId(ligneDto.hardwareGroupId);
                l.setCategorie(ligneDto.categorie);
                l.setLabel(ligneDto.label);
                l.setQuantite(ligneDto.quantite);
                l.setPrixUnitaire(ligneDto.prixUnitaire);
                c.getHardwareLignes().add(l);
            }
        }
        chiffrageRepo.save(c);
        return ResponseEntity.ok(toHardwareDto(c));
    }

    // ─── PUT licence ──────────────────────────────────────────────────────────
//
//    @PutMapping("/licence")
//    @Transactional
//    public ResponseEntity<ChiffrageDto.LicenceDto> saveLicence(
//            @PathVariable Long projetId,
//            @RequestBody ChiffrageDto.LicenceDto dto) {
//        ProjetChiffrage c = getOrCreate(projetId);
//        c.setProduitId(dto.produitId);
//        c.setProduitNom(dto.produitNom);
//        c.setModeFacturation(dto.modeFacturation);
//        c.setRemiseGlobalePct(dto.remiseGlobalePct);
//
//        c.getLicenceLignes().clear();
//        if (dto.lignes != null) {
//            for (ChiffrageDto.LicenceLigneDto ld : dto.lignes) {
//                ChiffrageLicenceLigne l = new ChiffrageLicenceLigne();
//                l.setChiffrage(c);
//                l.setModuleId(ld.moduleId);
//                l.setModuleName(ld.moduleName);
//                l.setObligatoire(ld.obligatoire);
//                l.setNbUsers(ld.nbUsers);
//                l.setPricingTier(ld.pricingTier);
//                l.setPrixUnitaire(ld.prixUnitaire);
//                l.setDiscountPct(ld.discountPct);
//                c.getLicenceLignes().add(l);
//            }
//        }
//        chiffrageRepo.save(c);
//        return ResponseEntity.ok(toLicenceDto(c));
//    }

    // ─── GET services (avec TJM et coûts calculés) ────────────────────────────

    @GetMapping("/services")
    public ResponseEntity<ChiffrageDto.ServicesDto> getServices(@PathVariable Long projetId) {
        ProjetChiffrage c = getOrCreate(projetId);
        return ResponseEntity.ok(toServicesDto(c));
    }

    // ─── PATCH TJM projet ────────────────────────────────────────────────────

    @PatchMapping("/services/tjm")
    @Transactional
    public ResponseEntity<ChiffrageDto.ServicesDto> updateTjm(
            @PathVariable Long projetId,
            @RequestBody ChiffrageDto.ServicesDto dto) {
        ProjetChiffrage c = getOrCreate(projetId);
        if (dto.devise  != null) c.setDevise(dto.devise);
        if (dto.tjmEur  != null) c.setTjmEur(dto.tjmEur);
        if (dto.tjmTnd  != null) c.setTjmTnd(dto.tjmTnd);
        chiffrageRepo.save(c);
        return ResponseEntity.ok(toServicesDto(c));
    }

    // ─── PUT services ─────────────────────────────────────────────────────────

    @PutMapping("/services")
    @Transactional
    public ResponseEntity<ChiffrageDto.ServicesDto> saveServices(
            @PathVariable Long projetId,
            @RequestBody ChiffrageDto.ServicesDto dto) {
        ProjetChiffrage c = getOrCreate(projetId);
        c.setDevise(dto.devise);
        c.setTjmEur(dto.tjmEur);
        c.setTjmTnd(dto.tjmTnd);

        c.getServicesLignes().clear();
        if (dto.lignes != null) {
            for (ChiffrageDto.ServicesLigneDto sd : dto.lignes) {
                ChiffrageServicesLigne l = new ChiffrageServicesLigne();
                l.setChiffrage(c);
                l.setComposanteId(sd.composanteId);
                l.setCode(sd.code);
                l.setLibelle(sd.libelle);
                l.setHjEstimation(sd.hjEstimation);
                l.setCommentaire(sd.commentaire);
                c.getServicesLignes().add(l);
            }
        }
        chiffrageRepo.save(c);
        return ResponseEntity.ok(toServicesDto(c));
    }

    // ─── PUT exigences ────────────────────────────────────────────────────────

    @PutMapping("/exigences")
    @Transactional
    public ResponseEntity<ChiffrageDto.ExigencesDto> saveExigences(
            @PathVariable Long projetId,
            @RequestBody ChiffrageDto.ExigencesDto dto) {
        ProjetChiffrage c = getOrCreate(projetId);
        c.getExigenceLignes().clear();
        if (dto.lignes != null) {
            for (ChiffrageDto.ExigenceLigneDto ed : dto.lignes) {
                ChiffrageExigenceLigne l = new ChiffrageExigenceLigne();
                l.setChiffrage(c);
                l.setExigenceId(ed.exigenceId);
                l.setExigenceIntitule(ed.exigenceIntitule);
                l.setExigenceType(ed.exigenceType);
                l.setHjEstimation(ed.hjEstimation);
                l.setHjValidation(ed.hjValidation);
                l.setHjRecette(ed.hjRecette);
                c.getExigenceLignes().add(l);
            }
        }
        chiffrageRepo.save(c);
        return ResponseEntity.ok(toExigencesDto(c));
    }
    // ModuleController.java — ajouter cet endpoint
    @PostMapping("/produits/{produitId}/modules")
    @Transactional
    public ResponseEntity<?> createAndAffect(
            @PathVariable Long produitId,
            @RequestBody Module module) {
        try {
            // 1. Sauvegarder le module
            Module saved = moduleRepository.save(module);

            // 2. L'affecter au produit
            Produit produit = produitRepository.findById(produitId)
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
            produit.getModules().add(saved);
            produitRepository.save(produit);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint pour affecter un module existant à un produit
    @PostMapping("/produits/{produitId}/modules/{moduleId}/affecter")
    @Transactional
    public ResponseEntity<?> affecter(
            @PathVariable Long produitId,
            @PathVariable Long moduleId) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module non trouvé"));

        boolean dejaAffecte = produit.getModules().stream()
                .anyMatch(m -> m.getId().equals(moduleId));
        if (!dejaAffecte) {
            produit.getModules().add(module);
            produitRepository.save(produit);
        }
        return ResponseEntity.ok(Map.of("message", "Module affecté avec succès"));
    }

    // GET modules d'un produit
    @GetMapping("/produits/{produitId}/modules")
    public ResponseEntity<List<Module>> getModulesByProduit(@PathVariable Long produitId) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
        return ResponseEntity.ok(produit.getModules());
    }
    // ─── PUT total ────────────────────────────────────────────────────────────

    @PutMapping("/total")
    @Transactional
    public ResponseEntity<ChiffrageDto.TotalDto> saveTotal(
            @PathVariable Long projetId,
            @RequestBody ChiffrageDto.TotalDto dto) {
        ProjetChiffrage c = getOrCreate(projetId);
        c.setTauxChange(dto.tauxChange);
        c.setRemiseTotalPct(dto.remiseGlobalePct);
        c.setMargeTotalPct(dto.margePct);
        c.setTvaPct(dto.tvaPct);
        c.setArrondi(dto.arrondi);
        chiffrageRepo.save(c);
        return ResponseEntity.ok(toTotalDto(c));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ProjetChiffrage getOrCreate(Long projetId) {
        return chiffrageRepo.findByProjetId(projetId)
                .orElseGet(() -> {
                    ProjetChiffrage c = new ProjetChiffrage();
                    c.setProjet(projetRepo.getReferenceById(projetId));
                    return chiffrageRepo.save(c);
                });
    }

    private ChiffrageDto toDto(ProjetChiffrage c) {
        ChiffrageDto dto = new ChiffrageDto();
        dto.hardware  = toHardwareDto(c);
        //dto.licence   = toLicenceDto(c);
        dto.services  = toServicesDto(c);
        dto.exigences = toExigencesDto(c);
        dto.total     = toTotalDto(c);
        return dto;
    }

    private ChiffrageDto.HardwareDto toHardwareDto(ProjetChiffrage c) {
        ChiffrageDto.HardwareDto d = new ChiffrageDto.HardwareDto();
        d.id = c.getId();
        d.logistiquePct = c.getLogistiquePct();
        d.contingencePct = c.getContingencePct();
        d.taxeImportPct = c.getTaxeImportPct();
        d.margePct = c.getMargePct();
        d.lignes = c.getHardwareLignes().stream().map(l -> {
            ChiffrageDto.HardwareLigneDto ld = new ChiffrageDto.HardwareLigneDto();
            ld.id = l.getId();
            ld.hardwareGroupId = l.getHardwareGroupId();
            ld.categorie = l.getCategorie();
            ld.label = l.getLabel();
            ld.quantite = l.getQuantite();
            ld.prixUnitaire = l.getPrixUnitaire();
            return ld;
        }).collect(Collectors.toList());
        return d;
    }

    // ChiffrageController.java — remplacer la section licence commentée

    @PutMapping("/licence")
    @Transactional
    public ResponseEntity<ChiffrageLicenceSummaryDTO> saveLicence(
            @PathVariable Long projetId,
            @RequestBody ChiffrageLicenceRequestDTO dto) {
        return ResponseEntity.ok(licenceService.save(projetId, dto));
    }

    @GetMapping("/licence")
    public ResponseEntity<ChiffrageLicenceSummaryDTO> getLicence(
            @PathVariable Long projetId) {
        return ResponseEntity.ok(licenceService.getSummary(projetId));
    }
//    private ChiffrageDto.LicenceDto toLicenceDto(ProjetChiffrage c) {
//        ChiffrageDto.LicenceDto d = new ChiffrageDto.LicenceDto();
//        d.id = c.getId();
//        d.produitId = c.getProduitId();
//        d.produitNom = c.getProduitNom();
//        d.modeFacturation = c.getModeFacturation();
//        d.remiseGlobalePct = c.getRemiseGlobalePct();
//        d.lignes = c.getLicenceLignes().stream().map(l -> {
//            ChiffrageDto.LicenceLigneDto ld = new ChiffrageDto.LicenceLigneDto();
//            ld.id = l.getId();
//            ld.moduleId = l.getModuleId();
//            ld.moduleName = l.getModuleName();
//            ld.obligatoire = l.getObligatoire();
//            ld.nbUsers = l.getNbUsers();
//            ld.pricingTier = l.getPricingTier();
//            ld.prixUnitaire = l.getPrixUnitaire();
//            ld.discountPct = l.getDiscountPct();
//            return ld;
//        }).collect(Collectors.toList());
//        return d;
//    }

    private ChiffrageDto.ServicesDto toServicesDto(ProjetChiffrage c) {
        ChiffrageDto.ServicesDto d = new ChiffrageDto.ServicesDto();
        d.id = c.getId();
        d.devise = c.getDevise() != null ? c.getDevise() : "EUR";
        d.tjmEur = c.getTjmEur() != null ? c.getTjmEur() : 600.0;
        d.tjmTnd = c.getTjmTnd() != null ? c.getTjmTnd() : 2000.0;

        d.lignes = c.getServicesLignes().stream().map(l -> {
            ChiffrageDto.ServicesLigneDto ld = new ChiffrageDto.ServicesLigneDto();
            ld.id = l.getId();
            ld.composanteId = l.getComposanteId();
            ld.code = l.getCode();
            ld.libelle = l.getLibelle();
            ld.hjEstimation = l.getHjEstimation() != null ? l.getHjEstimation() : 0.0;
            ld.commentaire = l.getCommentaire();
            // Calcul des coûts
            ld.coutEur = ld.hjEstimation * d.tjmEur;
            ld.coutTnd = ld.hjEstimation * d.tjmTnd;
            return ld;
        }).collect(Collectors.toList());

        // Totaux
        d.totalHj = d.lignes.stream().mapToDouble(l -> l.hjEstimation).sum();
        d.totalCoutEur = d.lignes.stream().mapToDouble(l -> l.coutEur).sum();
        d.totalCoutTnd = d.lignes.stream().mapToDouble(l -> l.coutTnd).sum();

        return d;
    }

    private ChiffrageDto.ExigencesDto toExigencesDto(ProjetChiffrage c) {
        ChiffrageDto.ExigencesDto d = new ChiffrageDto.ExigencesDto();
        d.id = c.getId();
        d.lignes = c.getExigenceLignes().stream().map(l -> {
            ChiffrageDto.ExigenceLigneDto ld = new ChiffrageDto.ExigenceLigneDto();
            ld.id = l.getId();
            ld.exigenceId = l.getExigenceId();
            ld.exigenceIntitule = l.getExigenceIntitule();
            ld.exigenceType = l.getExigenceType();
            ld.hjEstimation = l.getHjEstimation();
            ld.hjValidation = l.getHjValidation();
            ld.hjRecette = l.getHjRecette();
            return ld;
        }).collect(Collectors.toList());
        return d;
    }

    private ChiffrageDto.TotalDto toTotalDto(ProjetChiffrage c) {
        ChiffrageDto.TotalDto d = new ChiffrageDto.TotalDto();
        d.id = c.getId();
        d.tauxChange = c.getTauxChange();
        d.remiseGlobalePct = c.getRemiseTotalPct();
        d.margePct = c.getMargeTotalPct();
        d.tvaPct = c.getTvaPct();
        d.arrondi = c.getArrondi();
        return d;
    }
}

