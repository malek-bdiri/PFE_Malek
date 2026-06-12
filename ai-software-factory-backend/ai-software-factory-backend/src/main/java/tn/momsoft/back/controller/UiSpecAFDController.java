package tn.momsoft.back.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import lombok.RequiredArgsConstructor;

import java.util.List;

import tn.momsoft.back.entity.UiSpecAFD;
import tn.momsoft.back.service.UiSpecAFDService;

@RestController
@RequestMapping("/api/ui-spec-afd")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class UiSpecAFDController {

    private final UiSpecAFDService service;

    // Existant
    @GetMapping("/uiux/{uiuxId}")
    public List<UiSpecAFD> getByUiux(@PathVariable Long uiuxId) {
        return service.getByUiux(uiuxId);
    }

    // 👇 Nouveau — récupérer une spec par son id
    @GetMapping("/{id}")
    public ResponseEntity<UiSpecAFD> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // 👇 Nouveau — sauvegarder le contenu édité
    @PutMapping("/{id}")
    public ResponseEntity<UiSpecAFD> update(
            @PathVariable Long id,
            @RequestBody UiSpecAFD body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    // 👇 Nouveau — valider
    @PutMapping("/{id}/valider")
    public ResponseEntity<UiSpecAFD> valider(@PathVariable Long id) {
        return ResponseEntity.ok(service.valider(id));
    }
    // Générer le contenu
    @PutMapping("/{id}/generer")
    public ResponseEntity<UiSpecAFD> generer(@PathVariable Long id) {
        return ResponseEntity.ok(service.generer(id));
    }

    // Régénérer (même chose)
    @PutMapping("/{id}/regenerer")
    public ResponseEntity<UiSpecAFD> regenerer(@PathVariable Long id) {
        return ResponseEntity.ok(service.regenerer(id));
    }
}