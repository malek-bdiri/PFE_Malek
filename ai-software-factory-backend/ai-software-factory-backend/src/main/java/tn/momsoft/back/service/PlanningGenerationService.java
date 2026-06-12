//package tn.momsoft.back.service;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import tn.momsoft.back.dto.RessourceDTO;
//import tn.momsoft.back.dto.PlanningPreviewDTO;
//import tn.momsoft.back.entity.*;
//import tn.momsoft.back.repository.*;
//
//import java.time.LocalDate;
//import java.util.ArrayList;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class PlanningGenerationService {
//
//    private final ProjetRepository projetRepository;
//    private final PlanningRepository planningRepository;
//    private final CalendrierService calendrierService;
//
//    // =========================================================
//    // GENERATION PLANNING
//    // =========================================================
//    public Planning generatePlanning(Long projetId,
//                                     LocalDate startDate,
//                                     LocalDate dateFin,
//                                     List<RessourceDTO> ressources,
//                                     int riskBuffer,
//                                     boolean sequentialPhases) {
//
//        Projet projet = projetRepository.findById(projetId)
//                .orElseThrow(() -> new RuntimeException("Projet introuvable"));
//
//        double hoursPerDay = calendrierService.getHoursPerDay();
//
//        double totalDev = projet.getExigences().stream()
//                .mapToDouble(e -> e.getHjDev() == null ? 0 : e.getHjDev()).sum();
//        double totalTest = projet.getExigences().stream()
//                .mapToDouble(e -> e.getHjTest() == null ? 0 : e.getHjTest()).sum();
//        double totalFonc = projet.getExigences().stream()
//                .mapToDouble(e -> e.getHjFonc() == null ? 0 : e.getHjFonc()).sum();
//
//        double chargeTotale = totalDev + totalTest + totalFonc;
//
//        if (chargeTotale == 0) {
//            throw new RuntimeException("Charge projet = 0");
//        }
//
//        double dailyCapacity = ressources.stream()
//                .mapToDouble(r -> r.getNombre()
//                        * hoursPerDay
//                        * (r.getUtilisation() / 100.0)
//                        * (r.getCharge() / 100.0))
//                .sum();
//
//        if (dailyCapacity <= 0) {
//            throw new RuntimeException("Capacité équipe invalide");
//        }
//
//        double totalHours = chargeTotale * hoursPerDay * (1 + riskBuffer / 100.0);
//
//        LocalDate endDate = (dateFin != null)
//                ? dateFin
//                : calendrierService.calculateEndDate(startDate, totalHours, dailyCapacity);
//
//        Planning planning = Planning.builder()
//                .nom("Planning " + projet.getNom())
//                .version(getNextVersion(projet))
//                .phaseActuelle("Analyse")
//                .dateDebut(startDate)
//                .dateFin(endDate)
//                .progression(0.0)
//                .statut(Statut.ACTIF)
//                .statusMetier(PlanningStatus.GENERE)
//                .chargeTotale(chargeTotale)
//                .totalRessources(ressources.stream().mapToInt(RessourceDTO::getNombre).sum())
//                .tauxCharge(ressources.stream()
//                        .mapToDouble(RessourceDTO::getUtilisation)
//                        .average().orElse(0.0))
//                .projet(projet)
//                .build();
//
//        planning = planningRepository.save(planning);
//
//        List<Phase> phases = generatePhases(
//                planning, startDate,
//                totalDev, totalTest, totalFonc,
//                sequentialPhases, dailyCapacity, hoursPerDay
//        );
//
//        planning.setPhases(phases);
//        return planningRepository.save(planning);
//    }
//
//    // =========================================================
//    // PHASES
//    // =========================================================
//    private List<Phase> generatePhases(Planning planning,
//                                       LocalDate startDate,
//                                       double totalDev,
//                                       double totalTest,
//                                       double totalFonc,
//                                       boolean sequential,
//                                       double dailyCapacity,
//                                       double hoursPerDay) {
//
//        List<Phase> phases = new ArrayList<>();
//
//        LocalDate analyseEnd = calendrierService.calculateEndDate(
//                startDate, totalFonc * hoursPerDay, dailyCapacity);
//
//        phases.add(Phase.builder()
//                .nom("Analyse").ordre(1)
//                .dateDebut(startDate).dateFin(analyseEnd)
//                .progression(0.0).poids(25.0)
//                .statut("EN_COURS").responsable("").actionsLiees(0)
//                .planning(planning).build());
//
//        LocalDate devStart = sequential ? analyseEnd.plusDays(1) : startDate;
//        LocalDate devEnd = calendrierService.calculateEndDate(
//                devStart, totalDev * hoursPerDay, dailyCapacity);
//
//        phases.add(Phase.builder()
//                .nom("Développement").ordre(2)
//                .dateDebut(devStart).dateFin(devEnd)
//                .progression(0.0).poids(25.0)
//                .statut("EN_ATTENTE")
//                .planning(planning).build());
//
//        LocalDate testStart = sequential ? devEnd.plusDays(1) : startDate;
//        LocalDate testEnd = calendrierService.calculateEndDate(
//                testStart, totalTest * hoursPerDay, dailyCapacity);
//
//        phases.add(Phase.builder()
//                .nom("Tests").ordre(3)
//                .dateDebut(testStart).dateFin(testEnd)
//                .progression(0.0).poids(25.0)
//                .statut("EN_ATTENTE")
//                .planning(planning).build());
//
//        return phases;
//    }
//
//    // =========================================================
//    // PREVIEW
//    // =========================================================
//    public PlanningPreviewDTO previewPlanning(Long projetId,
//                                              LocalDate startDate,
//                                              LocalDate dateFin,
//                                              List<RessourceDTO> ressources,
//                                              int riskBuffer,
//                                              boolean sequentialPhases) {
//
//        Projet projet = projetRepository.findById(projetId).orElseThrow();
//
//        double hoursPerDay = calendrierService.getHoursPerDay();
//
//        double chargeTotale = projet.getExigences().stream()
//                .mapToDouble(e -> (e.getHjDev() == null ? 0 : e.getHjDev())
//                        + (e.getHjTest() == null ? 0 : e.getHjTest())
//                        + (e.getHjFonc() == null ? 0 : e.getHjFonc()))
//                .sum();
//
//        double dailyCapacity = ressources.stream()
//                .mapToDouble(r -> r.getNombre()
//                        * hoursPerDay
//                        * (r.getUtilisation() / 100.0)
//                        * (r.getCharge() / 100.0))
//                .sum();
//
//        double totalHours = chargeTotale * hoursPerDay * (1 + riskBuffer / 100.0);
//
//        LocalDate endDate = calendrierService.calculateEndDate(
//                startDate, totalHours, dailyCapacity);
//
//        // NOUVEAU - par ceci :
//        int workingDaysPerWeek = calendrierService.getWorkingDaysPerWeek();
//        double durationDays = totalHours / dailyCapacity;
//
//        return new PlanningPreviewDTO(
//                chargeTotale,
//                durationDays,
//                durationDays / workingDaysPerWeek,
//                endDate
//        );
//    }
//
//    // =========================================================
//    // VERSION
//    // =========================================================
//    private String getNextVersion(Projet projet) {
//        List<Planning> plannings =
//                planningRepository.findByProjetIdOrderByIdDesc(projet.getId());
//
//        if (plannings.isEmpty()) return "v1";
//
//        int max = plannings.stream()
//                .map(p -> p.getVersion().replace("v", ""))
//                .mapToInt(Integer::parseInt)
//                .max().orElse(0);
//
//        return "v" + (max + 1);
//    }
//}