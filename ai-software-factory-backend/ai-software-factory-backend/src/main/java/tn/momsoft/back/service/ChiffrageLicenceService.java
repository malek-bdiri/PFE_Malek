package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.momsoft.back.dto.ChiffrageLicenceRequestDTO;
import tn.momsoft.back.dto.ChiffrageLicenceSummaryDTO;
import tn.momsoft.back.entity.ChiffrageLicenceLigne;
import tn.momsoft.back.entity.Module;
import tn.momsoft.back.entity.Palier;
import tn.momsoft.back.entity.ProjetChiffrage;
import tn.momsoft.back.repository.ModuleRepository;
import tn.momsoft.back.repository.PalierRepository;
import tn.momsoft.back.repository.ProjetChiffrageRepository;
import tn.momsoft.back.repository.ProjetRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChiffrageLicenceService {

    private final ProjetChiffrageRepository chiffrageRepo;
    private final ProjetRepository projetRepo;
    private final ModuleRepository moduleRepo;
    private final PalierRepository palierRepo;

    @Transactional
    public ChiffrageLicenceSummaryDTO save(Long projetId, ChiffrageLicenceRequestDTO req) {

        // Récupérer ou créer ProjetChiffrage
        ProjetChiffrage chiffrage = chiffrageRepo.findByProjetId(projetId)
                .orElseGet(() -> {
                    ProjetChiffrage c = new ProjetChiffrage();
                    c.setProjet(projetRepo.getReferenceById(projetId));
                    return chiffrageRepo.save(c);
                });

        // Vider les anciennes lignes
        chiffrage.getLicenceLignes().clear();
        chiffrageRepo.saveAndFlush(chiffrage);

        if (req.getLignes() == null || req.getLignes().isEmpty()) {
            chiffrageRepo.save(chiffrage);
            return buildSummary(chiffrage, req.getPricingMode() != null ? req.getPricingMode() : "ONESHOT");
        }

        // Construire les nouvelles lignes
        List<ChiffrageLicenceLigne> lignes = req.getLignes().stream().map(dto -> {

            if (dto.getModuleId() == null) return null;
            Module module = moduleRepo.findById(dto.getModuleId())
                    .orElseThrow(() -> new IllegalArgumentException("Module non trouvé: " + dto.getModuleId()));

            PrixResult prix = resolvePrix(module, dto.getNbUsers(), dto.getPricingMode());

            double subtotal    = prix.prix * dto.getNbUsers();
            double discountAmt = subtotal * dto.getRemisePercent() / 100;
            double finalSub    = subtotal - discountAmt;

            ChiffrageLicenceLigne ligne = new ChiffrageLicenceLigne();
            ligne.setChiffrage(chiffrage);
            ligne.setModuleId(module.getId());
            ligne.setModuleName(module.getNom());
            ligne.setObligatoire(Boolean.TRUE.equals(module.getObligatoire()));
            ligne.setNbUsers(dto.getNbUsers());
            ligne.setPricingMode(dto.getPricingMode());
            ligne.setPricingTier(prix.tierLabel);
            ligne.setPrixUnitaire(prix.prix);
            ligne.setDiscountPct(dto.getRemisePercent());
            ligne.setDiscountAmount(discountAmt);
            ligne.setFinalSubtotal(finalSub);
            return ligne;

        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());

        chiffrage.getLicenceLignes().addAll(lignes);
        chiffrageRepo.save(chiffrage);

        return buildSummary(chiffrage, req.getPricingMode());
    }

    @Transactional(readOnly = true)
    public ChiffrageLicenceSummaryDTO getSummary(Long projetId) {
        ProjetChiffrage chiffrage = chiffrageRepo.findByProjetId(projetId)
                .orElseGet(() -> {
                    ProjetChiffrage c = new ProjetChiffrage();
                    c.setProjet(projetRepo.getReferenceById(projetId));
                    return chiffrageRepo.save(c);
                });
        String mode = chiffrage.getLicenceLignes().isEmpty()
                ? "ONESHOT"
                : chiffrage.getLicenceLignes().get(0).getPricingMode();
        return buildSummary(chiffrage, mode);
    }

    // ── Résoudre le prix ───────────────────────────────────────────────────────

    private PrixResult resolvePrix(Module module, int nbUsers, String mode) {
        // 1. Chercher un Palier configuré
        var palierOpt = palierRepo.findByModuleIdAndMode(module.getId(), mode)
                .stream()
                .filter(p -> nbUsers >= p.getMinUtilisateurs()
                        && nbUsers <= p.getMaxUtilisateurs())
                .findFirst();

        if (palierOpt.isPresent()) {
            Palier p = palierOpt.get();
            String label = p.getMinUtilisateurs() + "–"
                    + p.getMaxUtilisateurs() + " utilisateurs";
            return new PrixResult(p.getPrix(), label);
        }

        // 2. Fallback sur les prix directs du Module
        double prix = switch (mode.toUpperCase()) {
            case "YEARLY"  -> module.getPrixYearly()  != null ? module.getPrixYearly()  : 0.0;
            case "MONTHLY" -> module.getPrixMonthly() != null ? module.getPrixMonthly() : 0.0;
            default        -> module.getPrixOneshot()  != null ? module.getPrixOneshot()  : 0.0;
        };
        return new PrixResult(prix, "Tarif " + mode.toLowerCase());
    }

    private record PrixResult(double prix, String tierLabel) {}

    // ── Construire le résumé ───────────────────────────────────────────────────

    private ChiffrageLicenceSummaryDTO buildSummary(ProjetChiffrage chiffrage, String mode) {
        List<ChiffrageLicenceLigne> lignes = chiffrage.getLicenceLignes();

        double baseTotal = lignes.stream()
                .mapToDouble(l -> l.getPrixUnitaire() * l.getNbUsers()).sum();
        double discount  = lignes.stream()
                .mapToDouble(ChiffrageLicenceLigne::getDiscountAmount).sum();
        double total     = lignes.stream()
                .mapToDouble(ChiffrageLicenceLigne::getFinalSubtotal).sum();

        List<ChiffrageLicenceSummaryDTO.LigneDetailDTO> details = lignes.stream()
                .map(l -> new ChiffrageLicenceSummaryDTO.LigneDetailDTO(
                        l.getId(),
                        l.getModuleId(),
                        l.getModuleName(),
                        l.isObligatoire(),
                        l.getNbUsers(),
                        l.getPricingMode(),
                        l.getPricingTier(),
                        l.getPrixUnitaire(),
                        l.getPrixUnitaire() * l.getNbUsers(),
                        l.getDiscountPct(),
                        l.getDiscountAmount(),
                        l.getFinalSubtotal()
                )).collect(Collectors.toList());

        return new ChiffrageLicenceSummaryDTO(mode, baseTotal, discount, total, details);
    }
}