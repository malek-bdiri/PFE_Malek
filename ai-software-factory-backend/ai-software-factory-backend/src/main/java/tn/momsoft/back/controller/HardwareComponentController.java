package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.HardwareComponentDTO;
import tn.momsoft.back.service.HardwareComponentService;

import java.util.List;

@RestController
@RequestMapping("/api/hardware-components")
@RequiredArgsConstructor
@CrossOrigin("*")
public class HardwareComponentController {

    private final HardwareComponentService hardwareComponentService;

    @PostMapping
    public HardwareComponentDTO create(@RequestBody HardwareComponentDTO dto) {
        return hardwareComponentService.create(dto);
    }

    @GetMapping
    public List<HardwareComponentDTO> getAll() {
        return hardwareComponentService.getAll();
    }

    @PutMapping("/{id}")
    public HardwareComponentDTO update(@PathVariable Long id, @RequestBody HardwareComponentDTO dto) {
        return hardwareComponentService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        hardwareComponentService.delete(id);
    }
}

