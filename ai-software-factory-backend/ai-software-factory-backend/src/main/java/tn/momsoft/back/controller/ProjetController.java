package tn.momsoft.back.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.momsoft.back.entity.Exigence;
import tn.momsoft.back.dto.ExigenceDTO;
import tn.momsoft.back.entity.Projet;
import tn.momsoft.back.service.ProjetService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projets")
public class ProjetController {

    private final ProjetService projetService;

    public ProjetController(ProjetService projetService) {
        this.projetService = projetService;
    }

    @PostMapping
    public Projet createProjet(@RequestBody Projet projet) {
        System.out.println(projet.getExigences());
        return projetService.createProjet(projet);
    }
    @PostMapping("/{id}/exigences")
    public ResponseEntity<Projet> addExigence(@PathVariable Long id, @RequestBody Exigence exigence) {
        return ResponseEntity.ok(projetService.addExigence(id, exigence));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Projet> updateProjet(@PathVariable Long id, @RequestBody Projet payload) {
        return ResponseEntity.ok(projetService.updateProjet(id, payload));
    }
    @GetMapping
    public ResponseEntity<List<Projet>> getProjets() {
        return ResponseEntity.ok(projetService.getAllProjets());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProjet(@PathVariable Long id) {
        projetService.deleteProjet(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}")
    public ResponseEntity<Projet> getProjetById(@PathVariable Long id) {
        return projetService.getProjetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Ajout en masse d'exigences générées par l'IA.
     * POST /api/projets/{id}/exigences/bulk
     */
    @PostMapping("/{id}/exigences/bulk")
    public ResponseEntity<Projet> addExigencesBulk(
            @PathVariable Long id,
            @RequestBody List<Exigence> exigences) {
        return ResponseEntity.ok(projetService.addExigencesBulk(id, exigences));
    }
//    @PutMapping("/{id}/exigences/{exigenceId}")
//    public ResponseEntity<Projet> updateExigence(
//            @PathVariable Long id,
//            @PathVariable Long exigenceId,
//            @RequestBody ExigenceDTO dto) {
//        return ResponseEntity.ok(projetService.updateExigence(id, exigenceId, dto));
//    }

//    // ✅ DELETE /api/projets/{id}/exigences/{exigenceId} — supprimer une exigence
//    @DeleteMapping("/{id}/exigences/{exigenceId}")
//    public ResponseEntity<Projet> deleteExigence(
//            @PathVariable Long id,
//            @PathVariable Long exigenceId) {
//        return ResponseEntity.ok(projetService.deleteExigence(id, exigenceId));
//    }
//    @PatchMapping("/{id}/exigences/{exigenceId}/valider")
//    public ResponseEntity<Projet> validerExigence(
//            @PathVariable Long id,
//            @PathVariable Long exigenceId,
//            @RequestBody Map<String, String> body) {
//        return ResponseEntity.ok(projetService.validerExigence(
//                id, exigenceId,
//                body.get("validateurNom"),
//                body.get("commentaire")
//        ));
//    }


    /**
     * Enregistrement des noms de documents uploadés.
     * POST /api/projets/{id}/documents
     */
    @PostMapping("/{id}/documents")
    public ResponseEntity<Void> uploadDocuments(
            @PathVariable Long id,
            @RequestParam("cdc") MultipartFile cdcFile) {
        // On ne stocke pas le binaire, juste le nom
        projetService.addDocument(id, cdcFile.getOriginalFilename());
        return ResponseEntity.ok().build();
    }

}