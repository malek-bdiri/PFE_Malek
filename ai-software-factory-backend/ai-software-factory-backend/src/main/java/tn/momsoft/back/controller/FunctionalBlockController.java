package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.FunctionalBlock;
import tn.momsoft.back.service.FunctionalBlockService;
import java.util.List;

@RestController
@RequestMapping("/api/functional-blocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FunctionalBlockController {

    private final FunctionalBlockService service;

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<List<FunctionalBlock>> getByAnalysis(
            @PathVariable Long analysisId) {
        return ResponseEntity.ok(service.getByAnalysis(analysisId));
    }

    @PostMapping("/analysis/{analysisId}")
    public ResponseEntity<FunctionalBlock> create(
            @PathVariable Long analysisId,
            @RequestBody FunctionalBlock block) {
        return ResponseEntity.ok(service.create(analysisId, block));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FunctionalBlock> update(
            @PathVariable Long id,
            @RequestBody FunctionalBlock block) {
        return ResponseEntity.ok(service.update(id, block));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}