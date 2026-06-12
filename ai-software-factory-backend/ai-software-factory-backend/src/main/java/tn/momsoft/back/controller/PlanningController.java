//package tn.momsoft.back.controller;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import tn.momsoft.back.entity.Phase;
//import tn.momsoft.back.entity.Planning;
//import tn.momsoft.back.entity.Projet;
//
//import tn.momsoft.back.service.PlanningService;
//import tn.momsoft.back.service.ProjetService;
//import tn.momsoft.back.service.PlanningGenerationService;
//
//import tn.momsoft.back.dto.PlanningGenerationRequest;
//
//import java.util.List;
//import tn.momsoft.back.dto.PlanningPreviewDTO;
//import tn.momsoft.back.entity.PlanningStatus;
//@RestController
//@RequestMapping("/api/plannings")
//@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:4200")
//public class PlanningController {
//
//    private final PlanningService planningService;
//    private final ProjetService projetService;
//    private final PlanningGenerationService planningGenerationService;
//
//    // =========================================================
//    // GET ALL PLANNINGS
//    // =========================================================
//    @GetMapping
//    public ResponseEntity<List<Planning>> getAll() {
//
//        List<Planning> plannings = planningService.getAll();
//
//        return ResponseEntity.ok(plannings);
//    }
//
//    // =========================================================
//    // GET PLANNING BY ID
//    // =========================================================
//    @GetMapping("/{id}")
//    public ResponseEntity<Planning> getById(@PathVariable Long id) {
//
//        Planning planning = planningService.getById(id);
//
//        return ResponseEntity.ok(planning);
//    }
//
//    // =========================================================
//    // GET PHASES OF A PLANNING
//    // =========================================================
//    @GetMapping("/{id}/phases")
//    public ResponseEntity<List<Phase>> getPhases(@PathVariable Long id) {
//
//        Planning planning = planningService.getById(id);
//
//        if (planning.getPhases() == null) {
//            return ResponseEntity.ok(List.of());
//        }
//
//        return ResponseEntity.ok(planning.getPhases());
//    }
//
//    // =========================================================
//    // CREATE PLANNING MANUALLY
//    // =========================================================
//    @PostMapping
//    public ResponseEntity<?> create(@RequestBody Planning planning) {
//
//        try {
//
//            if (planning.getProjet() == null || planning.getProjet().getId() == null) {
//
//                return ResponseEntity
//                        .badRequest()
//                        .body("Projet ID manquant");
//
//            }
//
//            Long projetId = planning.getProjet().getId();
//
//            Projet projet = projetService.getProjetById(projetId);
//
//            planning.setProjet(projet);
//
//            Planning savedPlanning = planningService.save(planning);
//
//            return ResponseEntity.ok(savedPlanning);
//
//        } catch (Exception e) {
//
//            e.printStackTrace();
//
//            return ResponseEntity
//                    .badRequest()
//                    .body("Erreur création planning : " + e.getMessage());
//        }
//    }
//
//    // =========================================================
//    // GENERATE PLANNING AUTOMATIQUEMENT (IA / MOTEUR)
//    // UTILISE STEP2 + RESSOURCES + CALENDRIER
//    // =========================================================
//    @PostMapping("/generate/{projetId}")
//    public ResponseEntity<Planning> generatePlanning(
//            @PathVariable Long projetId,
//            @RequestBody PlanningGenerationRequest request
//    ) {
//
//        Planning planning = planningGenerationService.generatePlanning(
//                projetId,
//                request.getDateDebut(),
//                request.getDateFin(),
//                request.getRessources(),
//                request.getRiskBuffer(),
//                request.isSequentialPhases()
//        );
//
//        return ResponseEntity.ok(planning);
//    }
//    @PostMapping("/preview/{projetId}")
//    public PlanningPreviewDTO preview(@PathVariable Long projetId,
//                                      @RequestBody PlanningGenerationRequest request) {
//
//        return planningGenerationService.previewPlanning(
//                projetId,
//                request.getDateDebut(),
//                request.getDateFin(),
//                request.getRessources(),
//                request.getRiskBuffer(),
//                request.isSequentialPhases()
//        );
//    }
//
//    // =========================================================
//    // UPDATE PLANNING
//    // =========================================================
//    @PutMapping("/{id}")
//    public ResponseEntity<Planning> update(
//            @PathVariable Long id,
//            @RequestBody Planning planning
//    ) {
//
//        Planning existing = planningService.getById(id);
//
//        // 🔥 garder le status métier
//        planning.setStatusMetier(existing.getStatusMetier());
//
//        planning.setId(id);
//
//        Planning updated = planningService.save(planning);
//
//        return ResponseEntity.ok(updated);
//    }
//    // =========================================================
//// VALIDATE PLANNING
//// =========================================================
//    @PutMapping("/{id}/valider")
//    public ResponseEntity<Planning> valider(@PathVariable Long id) {
//
//        Planning planning = planningService.getById(id);
//
//        planning.setStatusMetier(PlanningStatus.VALIDE);
//
//        Planning updated = planningService.save(planning);
//
//        return ResponseEntity.ok(updated);
//    }
//    // =========================================================
//    // DELETE PLANNING
//    // =========================================================
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> delete(@PathVariable Long id) {
//
//        planningService.delete(id);
//
//        return ResponseEntity.noContent().build();
//    }
//    @PostMapping("/recalculate/{projetId}")
//    public ResponseEntity<Planning> recalculate(
//            @PathVariable Long projetId,
//            @RequestBody PlanningGenerationRequest request
//    ) {
//
//        Planning planning = planningGenerationService.generatePlanning(
//                projetId,
//                request.getDateDebut(),
//                request.getDateFin(),
//                request.getRessources(),
//                request.getRiskBuffer(),
//                request.isSequentialPhases()
//        );
//
//        return ResponseEntity.ok(planning);
//    }
//    // =========================================================
//// GET PLANNINGS BY PROJET (versions v1, v2, v3...)
//// =========================================================
//    @GetMapping("/projet/{projetId}")
//    public ResponseEntity<List<Planning>> getByProjet(@PathVariable Long projetId) {
//
//        List<Planning> plannings = planningService.getByProjetId(projetId);
//
//        return ResponseEntity.ok(plannings);
//    }
//
//}