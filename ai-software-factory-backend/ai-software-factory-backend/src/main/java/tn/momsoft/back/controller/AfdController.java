package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.Afd;
import tn.momsoft.back.service.AfdService;
import java.util.List;
import tn.momsoft.back.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import tn.momsoft.back.entity.FunctionalAnalysis;
import tn.momsoft.back.repository.FunctionalAnalysisRepository;

@RestController
@RequestMapping("/api/afds")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AfdController {

    private final AfdService afdService;

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<List<Afd>> getByAnalysis(@PathVariable Long analysisId) {
        return ResponseEntity.ok(afdService.getByAnalysis(analysisId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Afd> getById(@PathVariable Long id) {
        return ResponseEntity.ok(afdService.getById(id));
    }

    @PostMapping("/analysis/{analysisId}")
    public ResponseEntity<Afd> create(
            @PathVariable Long analysisId,
            @RequestParam(required = false) Long blockId,
            @RequestBody Afd afd) {
        return ResponseEntity.ok(afdService.create(analysisId, blockId, afd));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Afd> update(
            @PathVariable Long id,
            @RequestBody Afd afd) {
        return ResponseEntity.ok(afdService.update(id, afd));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        afdService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private final PdfService pdfService;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        try {
            Afd afd = afdService.getById(id);
            byte[] pdf = pdfService.generateAfdPdf(afd);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    afd.getCode() + "-" + afd.getIntitule() + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    private final FunctionalAnalysisRepository analysisRepository;

    @GetMapping("/analysis/{analysisId}/cahier-pdf")
    public ResponseEntity<byte[]> downloadCahierPdf(@PathVariable Long analysisId) {
        try {
            FunctionalAnalysis analysis = analysisRepository.findById(analysisId)
                    .orElseThrow(() -> new RuntimeException("Analysis not found"));

            List<Afd> afds = afdService.getByAnalysis(analysisId);

            byte[] pdf = pdfService.generateCahierAfdsPdf(analysis, afds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    analysis.getCode() + "-cahier-afds.pdf");

            return ResponseEntity.ok().headers(headers).body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}