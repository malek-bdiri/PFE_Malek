package tn.momsoft.back.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.JourFerie;
import tn.momsoft.back.repository.JourFerieRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jours-feries")
@CrossOrigin(origins = "http://localhost:4200")
public class JourFerieController {

    private final JourFerieRepository repository;

    public JourFerieController(JourFerieRepository repository) {
        this.repository = repository;
    }

    // ===============================
    // GET ALL
    // ===============================
    @GetMapping
    public List<JourFerie> getAll() {
        return repository.findAll();
    }

    // ===============================
    // CREATE
    // ===============================
    @PostMapping
    public ResponseEntity<JourFerie> create(@RequestBody JourFerie jourFerie) {
        JourFerie saved = repository.save(jourFerie);
        return ResponseEntity.ok(saved);
    }

    // ===============================
    // UPDATE
    // ===============================
    @PutMapping("/{id}")
    public ResponseEntity<JourFerie> update(
            @PathVariable Long id,
            @RequestBody JourFerie jourFerieDetails) {

        Optional<JourFerie> optional = repository.findById(id);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        JourFerie jourFerie = optional.get();

        jourFerie.setDate(jourFerieDetails.getDate());
        jourFerie.setNom(jourFerieDetails.getNom());
        jourFerie.setRecurrentAnnuel(jourFerieDetails.isRecurrentAnnuel());
        jourFerie.setDescription(jourFerieDetails.getDescription());

        JourFerie updated = repository.save(jourFerie);

        return ResponseEntity.ok(updated);
    }

    // ===============================
    // DELETE
    // ===============================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}