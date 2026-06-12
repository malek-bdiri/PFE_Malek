package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.entity.HardwareType;
import tn.momsoft.back.service.HardwareTypeService;

import java.util.List;

@RestController
@RequestMapping("/api/hardware-types")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class HardwareTypeController {

    private final HardwareTypeService service;

    @GetMapping
    public List<HardwareType> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public HardwareType getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public HardwareType create(@RequestBody HardwareType type) {
        return service.create(type);
    }

    @PutMapping("/{id}")
    public HardwareType update(
            @PathVariable Long id,
            @RequestBody HardwareType type
    ) {
        return service.update(id, type);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}