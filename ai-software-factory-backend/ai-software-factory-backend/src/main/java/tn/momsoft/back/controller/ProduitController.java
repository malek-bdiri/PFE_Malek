package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.ProduitDTO;
import tn.momsoft.back.entity.Produit;
import tn.momsoft.back.service.ProduitService;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProduitController {

    private final ProduitService produitService;

    @PostMapping
    public ProduitDTO create(@RequestBody ProduitDTO dto) {
        return produitService.create(dto);
    }

    @GetMapping
    public List<ProduitDTO> getAll() {
        return produitService.getAll();
    }

    @PutMapping("/{id}")
    public ProduitDTO update(@PathVariable Long id,
                             @RequestBody ProduitDTO dto) {
        return produitService.update(id, dto);
    }
    // ProduitController.java — ajouter
//    @GetMapping("/{id}/modules")
//    public ResponseEntity<List<Module>> getModules(@PathVariable Long id) {
//        Produit produit = produitRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
//        return ResponseEntity.ok(produit.getModules());
//    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        produitService.delete(id);
    }
}
