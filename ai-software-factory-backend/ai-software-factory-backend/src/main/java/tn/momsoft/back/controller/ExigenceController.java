package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.Exigence;
import tn.momsoft.back.repository.ExigenceRepository;
import java.util.List;

@RestController
@RequestMapping("/api/exigences")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ExigenceController {

    private final ExigenceRepository exigenceRepository;

    @GetMapping("/projet/{projetId}")
    public ResponseEntity<List<Exigence>> getByProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(exigenceRepository.findByProjetId(projetId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exigence> getById(@PathVariable Long id) {
        return exigenceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}