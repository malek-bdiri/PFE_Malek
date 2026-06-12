package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.Composante;
import tn.momsoft.back.repository.ComposanteRepository;

import java.util.List;

@RestController
@RequestMapping("/api/composantes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ComposanteController {

    private final ComposanteRepository composanteRepository;

    @GetMapping
    public ResponseEntity<List<Composante>> getAll() {
        return ResponseEntity.ok(composanteRepository.findByActiveTrue());
    }

    @GetMapping("/tjm")
    public ResponseEntity<List<Composante>> getAllWithTjm() {
        return ResponseEntity.ok(composanteRepository.findByActiveTrue());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Composante> getById(@PathVariable Long id) {
        return composanteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Composante> create(@RequestBody Composante composante) {
        composante.setActive(true);
        return ResponseEntity.ok(composanteRepository.save(composante));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Composante> update(@PathVariable Long id, @RequestBody Composante dto) {
        return composanteRepository.findById(id).map(c -> {
            c.setCode(dto.getCode());
            c.setLibelle(dto.getLibelle());
            c.setDescription(dto.getDescription());
            c.setActive(dto.getActive());
            c.setTjmDefaut(dto.getTjmDefaut());
            return ResponseEntity.ok(composanteRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        composanteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

