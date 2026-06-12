package tn.momsoft.back.service;

import tn.momsoft.back.controller.TestScenarioController.GenerateTestRequest;
import tn.momsoft.back.entity.TestScenario;

import java.util.List;
import java.util.Map;

public interface TestScenarioService {

    List<TestScenario> saveGeneratedScenarios(
            List<Map<String, Object>> scenarios,
            GenerateTestRequest req
    );

    List<TestScenario> findByProjetId(Long projetId);

    TestScenario findById(Long id);

    TestScenario save(TestScenario scenario);

    void updateCaseStatut(Long caseId, String statut, String resultatObtenu);

    void validerScenario(Long id);

    void delete(Long id);
}