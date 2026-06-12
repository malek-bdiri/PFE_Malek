package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.controller.TestScenarioController.GenerateTestRequest;
import tn.momsoft.back.entity.CasDeTest;
import tn.momsoft.back.entity.TestScenario;
import tn.momsoft.back.repository.CasDeTestRepository;
import tn.momsoft.back.repository.TestScenarioRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TestScenarioServiceImpl implements TestScenarioService {

    private final TestScenarioRepository scenarioRepo;
    private final CasDeTestRepository    casRepo;

    @Override
    @SuppressWarnings("unchecked")
    public List<TestScenario> saveGeneratedScenarios(
            List<Map<String, Object>> scenarios,
            GenerateTestRequest req
    ) {
        // Offset = nb scénarios existants pour ce projet → évite les doublons
        int offset = scenarioRepo.findByProjetId(req.getProjetId()).size();

        List<TestScenario> result = new ArrayList<>();
        int scenarioIndex = offset + 1;

        for (Map<String, Object> sc : scenarios) {

            // ID unique par projet : P{projetId}-TS-{N}
            String scenarioId = String.format("P%d-TS-%03d", req.getProjetId(), scenarioIndex++);

            TestScenario scenario = new TestScenario();
            scenario.setScenarioId(scenarioId);
            scenario.setTitre((String) sc.get("titre"));
            scenario.setType((String) sc.getOrDefault("type", "Functional"));
            scenario.setPriorite((String) sc.getOrDefault("priorite", "P1"));
            scenario.setStatut("Généré");
            scenario.setVersion("v1.0");
            scenario.setProjetId(req.getProjetId());
            scenario.setAfdId(req.getAfdId());
            scenario.setCreatedAt(LocalDateTime.now());

            List<String> criteres = (List<String>) sc.get("criteres_acceptation");
            if (criteres != null) scenario.setCriteresAcceptation(criteres);

            TestScenario savedScenario = scenarioRepo.save(scenario);

            // Cas de test
            List<Map<String, Object>> casDeTest =
                    (List<Map<String, Object>>) sc.get("cas_de_test");

            if (casDeTest != null) {
                int caseIndex = 1;
                for (Map<String, Object> ct : casDeTest) {
                    CasDeTest cas = new CasDeTest();
                    cas.setCaseId(savedScenario.getScenarioId() + "-"
                            + String.format("%02d", caseIndex++));
                    cas.setGroupe((String) ct.get("groupe"));
                    cas.setPriorite((String) ct.getOrDefault("priorite", "P1"));
                    cas.setStatut("Non exécuté");
                    cas.setResultatAttendu((String) ct.get("resultat_attendu"));
                    cas.setTestScenario(savedScenario);

                    List<String> precond = (List<String>) ct.get("preconditions");
                    if (precond != null) cas.setPreconditions(precond);

                    List<String> etapes = (List<String>) ct.get("etapes");
                    if (etapes != null) cas.setEtapes(etapes);

                    casRepo.save(cas);
                }
            }

            result.add(savedScenario);
        }

        return result;
    }

    @Override
    public List<TestScenario> findByProjetId(Long projetId) {
        return scenarioRepo.findByProjetId(projetId);
    }

    @Override
    public TestScenario findById(Long id) {
        return scenarioRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Scénario non trouvé: " + id));
    }

    @Override
    public TestScenario save(TestScenario scenario) {
        if (scenario.getCreatedAt() == null)
            scenario.setCreatedAt(LocalDateTime.now());
        scenario.setStatut("Brouillon");
        return scenarioRepo.save(scenario);
    }

    @Override
    public void updateCaseStatut(Long caseId, String statut, String resultatObtenu) {
        CasDeTest cas = casRepo.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Cas de test non trouvé: " + caseId));
        cas.setStatut(statut);
        if (resultatObtenu != null) cas.setResultatObtenu(resultatObtenu);
        casRepo.save(cas);
    }

    @Override
    public void validerScenario(Long id) {
        TestScenario scenario = findById(id);
        scenario.setStatut("Validé");
        scenarioRepo.save(scenario);
    }

    @Override
    public void delete(Long id) {
        scenarioRepo.deleteById(id);
    }
}