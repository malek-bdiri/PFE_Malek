package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.ParametreCalendrier;
import tn.momsoft.back.service.CalendrierService;

@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ParametreCalendrierController {

    private final CalendrierService calendrierService;

    @GetMapping
    public ResponseEntity<ParametreCalendrier> get() {
        return ResponseEntity.ok(calendrierService.getCalendrier());
    }

    @PutMapping
    public ResponseEntity<ParametreCalendrier> update(
            @RequestBody ParametreCalendrier param) {
        return ResponseEntity.ok(calendrierService.updateCalendrier(param));
    }
}