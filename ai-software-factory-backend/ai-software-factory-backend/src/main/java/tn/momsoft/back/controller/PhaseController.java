package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.Phase;
import tn.momsoft.back.entity.Planning;
import tn.momsoft.back.repository.PhaseRepository;
import tn.momsoft.back.repository.PlanningRepository;

import java.util.List;

@RestController
@RequestMapping("/api/phases")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PhaseController {

    private final PhaseRepository phaseRepository;
    private final PlanningRepository planningRepository;

    // GET phases d'un planning
    @GetMapping("/planning/{planningId}")
    public ResponseEntity<List<Phase>> getByPlanning(@PathVariable Long planningId) {
        return ResponseEntity.ok(
                phaseRepository.findByPlanningIdOrderByOrdreAsc(planningId)
        );
    }

    // GET une phase
    @GetMapping("/{id}")
    public ResponseEntity<Phase> getById(@PathVariable Long id) {
        return phaseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST créer une phase
    @PostMapping("/planning/{planningId}")
    public ResponseEntity<?> create(
            @PathVariable Long planningId,
            @RequestBody Phase phase) {
        Planning planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning introuvable"));
        phase.setPlanning(planning);
        // ordre auto si non fourni
        if (phase.getOrdre() == null) {
            int count = phaseRepository.findByPlanningIdOrderByOrdreAsc(planningId).size();
            phase.setOrdre(count + 1);
        }
        return ResponseEntity.ok(phaseRepository.save(phase));
    }

    // PUT modifier une phase
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Phase updated) {
        return phaseRepository.findById(id).map(phase -> {
            phase.setNom(updated.getNom());
            phase.setDescription(updated.getDescription());
            phase.setDateDebut(updated.getDateDebut());
            phase.setDateFin(updated.getDateFin());
            phase.setDebutReel(updated.getDebutReel());
            phase.setFinReelle(updated.getFinReelle());
            phase.setProgression(updated.getProgression());
            phase.setPoids(updated.getPoids());
            phase.setStatut(updated.getStatut());
            phase.setResponsable(updated.getResponsable());
            phase.setActionsLiees(updated.getActionsLiees());
            return ResponseEntity.ok(phaseRepository.save(phase));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE une phase
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        phaseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}