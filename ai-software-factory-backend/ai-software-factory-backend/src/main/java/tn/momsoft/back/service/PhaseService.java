package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.Phase;
import tn.momsoft.back.repository.PhaseRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PhaseService {

    private final PhaseRepository phaseRepository;

    public List<Phase> getByPlanning(Long planningId) {
        return phaseRepository.findByPlanningIdOrderByOrdreAsc(planningId);
    }

    public void saveAll(List<Phase> phases) {
        phaseRepository.saveAll(phases);
    }
}