package tn.momsoft.back.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.HardwareGroupDTO;
import tn.momsoft.back.entity.HardwareGroup;
import tn.momsoft.back.service.HardwareGroupService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hardware-groups")
@CrossOrigin(origins = "*")
public class HardwareGroupController {

    private final HardwareGroupService service;

    public HardwareGroupController(HardwareGroupService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<HardwareGroup>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HardwareGroup> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody HardwareGroupDTO dto) {
        try {
            return ResponseEntity.ok(service.create(dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getClass().getSimpleName(), "message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HardwareGroupDTO dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getClass().getSimpleName(), "message", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}