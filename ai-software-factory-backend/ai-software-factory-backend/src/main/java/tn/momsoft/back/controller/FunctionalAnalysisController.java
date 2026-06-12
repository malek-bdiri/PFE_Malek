package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.service.FunctionalAnalysisService;
import java.util.List;

@RestController
@RequestMapping("/api/functional-analyses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FunctionalAnalysisController {

    private final FunctionalAnalysisService service;

    @GetMapping
    public ResponseEntity<List<FunctionalAnalysis>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FunctionalAnalysis> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/projet/{projetId}")
    public ResponseEntity<FunctionalAnalysis> create(
            @PathVariable Long projetId,
            @RequestBody FunctionalAnalysis analysis) {
        return ResponseEntity.ok(service.create(projetId, analysis));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FunctionalAnalysis> update(
            @PathVariable Long id,
            @RequestBody FunctionalAnalysis analysis) {
        return ResponseEntity.ok(service.update(id, analysis));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}