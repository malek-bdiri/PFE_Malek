package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.UiuxSpecification;
import tn.momsoft.back.service.UiuxSpecificationService;
import java.util.List;

@RestController
@RequestMapping("/api/uiux")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class UiuxSpecificationController {

    private final UiuxSpecificationService service;

    @GetMapping
    public ResponseEntity<List<UiuxSpecification>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UiuxSpecification> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/projet/{projetId}")
    public ResponseEntity<UiuxSpecification> create(
            @PathVariable Long projetId,
            @RequestBody UiuxSpecification spec) {
        return ResponseEntity.ok(service.create(projetId, spec));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UiuxSpecification> update(
            @PathVariable Long id,
            @RequestBody UiuxSpecification spec) {
        return ResponseEntity.ok(service.update(id, spec));
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<UiuxSpecification> valider(@PathVariable Long id) {
        return ResponseEntity.ok(service.valider(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}