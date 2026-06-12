package tn.momsoft.back.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.ClientDTO;
import tn.momsoft.back.service.ClientService;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ClientController {

    private final ClientService clientService;

    @PostMapping
    public ClientDTO create(@RequestBody ClientDTO dto) {
        return clientService.create(dto);
    }

    @GetMapping
    public List<ClientDTO> getAll() {
        return clientService.getAll();
    }

    @PutMapping("/{id}")
    public ClientDTO update(@PathVariable Long id,
                            @RequestBody ClientDTO dto) {
        return clientService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        clientService.delete(id);
    }
}
