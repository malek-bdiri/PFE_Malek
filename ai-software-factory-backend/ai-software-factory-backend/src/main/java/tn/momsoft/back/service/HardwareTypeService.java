package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.HardwareType;
import tn.momsoft.back.repository.HardwareTypeRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareTypeService {

    private final HardwareTypeRepository repository;

    public List<HardwareType> getAll() {
        return repository.findAll();
    }

    public HardwareType create(HardwareType type) {
        return repository.save(type);
    }

    public HardwareType update(Long id, HardwareType newType) {
        HardwareType type = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Type introuvable"));

        type.setCode(newType.getCode());
        type.setLabel(newType.getLabel());
        type.setDescription(newType.getDescription());
        type.setStatut(newType.getStatut());

        return repository.save(type);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public HardwareType getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Type introuvable"));
    }
}