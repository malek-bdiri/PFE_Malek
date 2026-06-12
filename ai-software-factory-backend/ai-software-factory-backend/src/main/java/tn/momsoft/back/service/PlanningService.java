package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.momsoft.back.entity.Planning;
import tn.momsoft.back.entity.Phase;
import tn.momsoft.back.repository.PlanningRepository;
import tn.momsoft.back.repository.PhaseRepository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanningService {

    private final PlanningRepository planningRepository;
    private final PhaseRepository phaseRepository;

    // ==========================
    // GET ALL
    // ==========================
    public List<Planning> getAll() {
        return planningRepository.findAll();
    }

    // ==========================
    // GET BY ID
    // ==========================
    public Planning getById(Long id) {
        return planningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planning not found with id: " + id));
    }

    // ==========================
    // CREATE / UPDATE
    // ==========================
    @Transactional
    public Planning save(Planning planning) {

        boolean isNew = (planning.getId() == null);

        // 1️⃣ Sauvegarder le planning
        Planning savedPlanning = planningRepository.save(planning);

        // 2️⃣ Si update → supprimer anciennes phases
        if (!isNew) {
            phaseRepository.deleteByPlanningId(savedPlanning.getId());
        }

        // 3️⃣ Générer automatiquement les phases
        generatePhases(savedPlanning);

        return savedPlanning;
    }

    // ==========================
    // DELETE
    // ==========================
    public void delete(Long id) {
        if (!planningRepository.existsById(id)) {
            throw new RuntimeException("Planning not found with id: " + id);
        }
        phaseRepository.deleteByPlanningId(id);
        planningRepository.deleteById(id);
    }

    // ==========================
    // LOGIQUE METIER
    // ==========================

    private void generatePhases(Planning planning) {

        System.out.println(">>> GENERATING PHASES FOR PLANNING ID: " + planning.getId());

        if (planning.getDateDebut() == null || planning.getDateFin() == null) {
            System.out.println("Dates null → no phases generated");
            return;
        }

        LocalDate start = planning.getDateDebut();
        LocalDate end = planning.getDateFin();

        long totalDays = ChronoUnit.DAYS.between(start, end);

        if (totalDays <= 0) {
            System.out.println("Invalid duration → no phases generated");
            return;
        }

        long phaseDuration = totalDays / 4;

        List<Phase> phases = List.of(

                Phase.builder()
                        .nom("Analyse & Conception")
                        .ordre(1)
                        .dateDebut(start)
                        .dateFin(start.plusDays(phaseDuration))
                        .progression(0.0)
                        .statut("Non démarré")
                        .planning(planning)
                        .build(),

                Phase.builder()
                        .nom("Développement")
                        .ordre(2)
                        .dateDebut(start.plusDays(phaseDuration))
                        .dateFin(start.plusDays(phaseDuration * 2))
                        .progression(0.0)
                        .statut("Non démarré")
                        .planning(planning)
                        .build(),

                Phase.builder()
                        .nom("Tests & Validation")
                        .ordre(3)
                        .dateDebut(start.plusDays(phaseDuration * 2))
                        .dateFin(start.plusDays(phaseDuration * 3))
                        .progression(0.0)
                        .statut("Non démarré")
                        .planning(planning)
                        .build(),

                Phase.builder()
                        .nom("Déploiement")
                        .ordre(4)
                        .dateDebut(start.plusDays(phaseDuration * 3))
                        .dateFin(end)
                        .progression(0.0)
                        .statut("Non démarré")
                        .planning(planning)
                        .build()
        );

        phaseRepository.saveAll(phases);

        System.out.println(">>> " + phases.size() + " phases saved");
    }
    public List<Planning> getByProjetId(Long projetId) {
        return planningRepository.findByProjetIdOrderByIdDesc(projetId);
    }
}