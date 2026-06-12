// PalierController.java
package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.Palier;
import tn.momsoft.back.entity.Module;
import tn.momsoft.back.repository.PalierRepository;
import tn.momsoft.back.repository.ModuleRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paliers")
@RequiredArgsConstructor
public class PalierController {

    private final PalierRepository palierRepo;
    private final ModuleRepository moduleRepo;

    // GET tous les paliers d'un module
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<Palier>> getByModule(@PathVariable Long moduleId) {
        return ResponseEntity.ok(palierRepo.findByModuleId(moduleId));
    }

    // GET paliers d'un module par mode
    @GetMapping("/module/{moduleId}/mode/{mode}")
    public ResponseEntity<List<Palier>> getByModuleAndMode(
            @PathVariable Long moduleId,
            @PathVariable String mode) {
        return ResponseEntity.ok(palierRepo.findByModuleIdAndMode(moduleId, mode));
    }

    // GET paliers d'un produit entier
    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<Palier>> getByProduit(@PathVariable Long produitId) {
        return ResponseEntity.ok(palierRepo.findByProduitId(produitId));
    }

    // POST créer un palier
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Long moduleId = Long.valueOf(body.get("moduleId").toString());
            Module module = moduleRepo.findById(moduleId)
                    .orElseThrow(() -> new RuntimeException("Module non trouvé"));

            Palier palier = new Palier();
            palier.setModule(module);
            palier.setMinUtilisateurs(Integer.parseInt(body.get("minUtilisateurs").toString()));
            palier.setMaxUtilisateurs(Integer.parseInt(body.get("maxUtilisateurs").toString()));
            palier.setPrix(Double.parseDouble(body.get("prix").toString()));
            palier.setDevise(body.getOrDefault("devise", "EUR").toString());
            palier.setMode(body.getOrDefault("mode", "ONESHOT").toString());
            palier.setDateEffective(body.getOrDefault("dateEffective", "").toString());
            palier.setStatut(body.getOrDefault("statut", "Actif").toString());

            return ResponseEntity.ok(palierRepo.save(palier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT modifier un palier
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return palierRepo.findById(id).map(palier -> {
            if (body.containsKey("minUtilisateurs"))
                palier.setMinUtilisateurs(Integer.parseInt(body.get("minUtilisateurs").toString()));
            if (body.containsKey("maxUtilisateurs"))
                palier.setMaxUtilisateurs(Integer.parseInt(body.get("maxUtilisateurs").toString()));
            if (body.containsKey("prix"))
                palier.setPrix(Double.parseDouble(body.get("prix").toString()));
            if (body.containsKey("devise"))
                palier.setDevise(body.get("devise").toString());
            if (body.containsKey("mode"))
                palier.setMode(body.get("mode").toString());
            if (body.containsKey("statut"))
                palier.setStatut(body.get("statut").toString());
            return ResponseEntity.ok(palierRepo.save(palier));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE supprimer un palier
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        palierRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}