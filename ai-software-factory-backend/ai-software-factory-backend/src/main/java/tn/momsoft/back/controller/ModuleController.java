package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.ModuleDTO;
import tn.momsoft.back.entity.Module;
import tn.momsoft.back.entity.Produit;
import tn.momsoft.back.repository.ModuleRepository;
import tn.momsoft.back.repository.ProduitRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleRepository moduleRepository;
    private final ProduitRepository produitRepository;

    // ─── GET tous les modules actifs ─────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<ModuleDTO>> getAll() {
        return ResponseEntity.ok(
                moduleRepository.findByActifTrue().stream()
                        .map(this::toDto).collect(Collectors.toList())
        );
    }

    // ─── GET modules par produit ──────────────────────────────────────────────

    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<ModuleDTO>> getByProduit(@PathVariable Long produitId) {
        return ResponseEntity.ok(
                moduleRepository.findByProduitId(produitId).stream()
                        .map(this::toDto).collect(Collectors.toList())
        );
    }

    // ─── GET modules NON affectés à un produit ────────────────────────────────

    @GetMapping("/produit/{produitId}/disponibles")
    public ResponseEntity<List<ModuleDTO>> getDisponibles(@PathVariable Long produitId) {
        return ResponseEntity.ok(
                moduleRepository.findNotAffectedToProduit(produitId).stream()
                        .map(this::toDto).collect(Collectors.toList())
        );
    }

    // ─── GET par catégorie ────────────────────────────────────────────────────

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<ModuleDTO>> getByCategorie(@PathVariable String categorie) {
        return ResponseEntity.ok(
                moduleRepository.findByCategorie(categorie).stream()
                        .map(this::toDto).collect(Collectors.toList())
        );
    }

    // ─── GET par ID ───────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ModuleDTO> getById(@PathVariable Long id) {
        return moduleRepository.findById(id)
                .map(m -> ResponseEntity.ok(toDto(m)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── POST créer un module ─────────────────────────────────────────────────

    @PostMapping
    @Transactional
    public ResponseEntity<ModuleDTO> create(@RequestBody ModuleDTO dto) {
        Module module = toEntity(dto);
        module = moduleRepository.save(module);
        return ResponseEntity.ok(toDto(module));
    }

    // ─── PUT modifier un module ───────────────────────────────────────────────

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ModuleDTO> update(@PathVariable Long id, @RequestBody ModuleDTO dto) {
        return moduleRepository.findById(id).map(module -> {
            module.setCode(dto.getCode());
            module.setNom(dto.getNom());
            module.setCategorie(dto.getCategorie());
            module.setDescription(dto.getDescription());
            module.setTags(dto.getTags());
            module.setObligatoire(dto.getObligatoire() != null ? dto.getObligatoire() : false);
            module.setActif(dto.getActif() != null ? dto.getActif() : true);
            module.setPrixOneshot(dto.getPrixOneshot() != null ? dto.getPrixOneshot() : 0.0);
            module.setPrixYearly(dto.getPrixYearly() != null ? dto.getPrixYearly() : 0.0);
            module.setPrixMonthly(dto.getPrixMonthly() != null ? dto.getPrixMonthly() : 0.0);
            module.setDependances(dto.getDependances());
            return ResponseEntity.ok(toDto(moduleRepository.save(module)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── DELETE module ────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        moduleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── POST affecter des modules à un produit ───────────────────────────────

    @PostMapping("/produit/{produitId}/affecter")
    @Transactional
    public ResponseEntity<List<ModuleDTO>> affecter(
            @PathVariable Long produitId,
            @RequestBody List<Long> moduleIds) {

        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable: " + produitId));

        List<Module> modules = moduleRepository.findAllById(moduleIds);
        for (Module m : modules) {
            if (!produit.getModules().contains(m)) {
                produit.getModules().add(m);
            }
        }
        produitRepository.save(produit);

        return ResponseEntity.ok(
                moduleRepository.findByProduitId(produitId).stream()
                        .map(this::toDto).collect(Collectors.toList())
        );
    }

    // ─── DELETE retirer un module d'un produit ────────────────────────────────

    @DeleteMapping("/produit/{produitId}/retirer/{moduleId}")
    @Transactional
    public ResponseEntity<Void> retirer(
            @PathVariable Long produitId,
            @PathVariable Long moduleId) {

        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable: " + produitId));

        produit.getModules().removeIf(m -> m.getId().equals(moduleId));
        produitRepository.save(produit);
        return ResponseEntity.noContent().build();
    }

    // ─── Mapping helpers ──────────────────────────────────────────────────────

    private ModuleDTO toDto(Module m) {
        ModuleDTO dto = new ModuleDTO();
        dto.setId(m.getId());
        dto.setCode(m.getCode());
        dto.setNom(m.getNom());
        dto.setCategorie(m.getCategorie());
        dto.setDescription(m.getDescription());
        dto.setTags(m.getTags());
        dto.setObligatoire(m.getObligatoire());
        dto.setActif(m.getActif());
        dto.setPrixOneshot(m.getPrixOneshot());
        dto.setPrixYearly(m.getPrixYearly());
        dto.setPrixMonthly(m.getPrixMonthly());
        dto.setDependances(m.getDependances());
        return dto;
    }

    private Module toEntity(ModuleDTO dto) {
        Module m = new Module();
        m.setCode(dto.getCode());
        m.setNom(dto.getNom());
        m.setCategorie(dto.getCategorie() != null ? dto.getCategorie() : "Core");
        m.setDescription(dto.getDescription());
        m.setTags(dto.getTags());
        m.setObligatoire(dto.getObligatoire() != null ? dto.getObligatoire() : false);
        m.setActif(dto.getActif() != null ? dto.getActif() : true);
        m.setPrixOneshot(dto.getPrixOneshot() != null ? dto.getPrixOneshot() : 0.0);
        m.setPrixYearly(dto.getPrixYearly() != null ? dto.getPrixYearly() : 0.0);
        m.setPrixMonthly(dto.getPrixMonthly() != null ? dto.getPrixMonthly() : 0.0);
        m.setDependances(dto.getDependances());
        return m;
    }
}

