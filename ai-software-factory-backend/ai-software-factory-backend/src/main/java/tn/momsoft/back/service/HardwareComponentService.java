package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.dto.HardwareComponentDTO;
import tn.momsoft.back.entity.HardwareComponent;
import tn.momsoft.back.entity.HardwareType;
import tn.momsoft.back.repository.HardwareComponentRepository;
import tn.momsoft.back.repository.HardwareTypeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HardwareComponentService {

    private final HardwareComponentRepository componentRepository;
    private final HardwareTypeRepository typeRepository;

    public List<HardwareComponentDTO> getAll() {
        return componentRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public HardwareComponentDTO getById(Long id) {
        return toDto(componentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Composant introuvable")));
    }

    public HardwareComponentDTO create(HardwareComponentDTO dto) {
        validateManufacturer(dto.getManufacturer());
        validateSupplier(dto.getSupplier());

        HardwareComponent component = toEntity(dto);
        return toDto(componentRepository.save(component));
    }

    public HardwareComponentDTO update(Long id, HardwareComponentDTO dto) {
        HardwareComponent component = componentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Composant introuvable"));

        validateManufacturer(dto.getManufacturer());
        validateSupplier(dto.getSupplier());

        component.setCode(dto.getCode());
        component.setDesignation(dto.getDesignation());
        component.setManufacturer(dto.getManufacturer());
        component.setManufacturerRef(dto.getManufacturerRef());
        component.setSupplier(dto.getSupplier());
        component.setSupplierRef(dto.getSupplierRef());
        component.setUnitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : 0.0);
        component.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : 0.0);
        component.setDescription(dto.getDescription());

        if (dto.getTypeId() != null) {
            HardwareType type = typeRepository.findById(dto.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Type introuvable"));
            component.setType(type);
        } else {
            component.setType(null);
        }

        return toDto(componentRepository.save(component));
    }

    public void delete(Long id) {
        componentRepository.deleteById(id);
    }

    public List<HardwareComponentDTO> getByManufacturer(String manufacturer) {
        return componentRepository.findByManufacturer(manufacturer).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<HardwareComponentDTO> getBySupplier(String supplier) {
        return componentRepository.findBySupplier(supplier).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<HardwareComponentDTO> getByType(Long typeId) {
        return componentRepository.findByTypeId(typeId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    // ── Mapping helpers ────────────────────────────────────────────────────────

    private HardwareComponentDTO toDto(HardwareComponent c) {
        HardwareComponentDTO dto = new HardwareComponentDTO();
        dto.setId(c.getId());
        dto.setCode(c.getCode());
        dto.setDesignation(c.getDesignation());
        dto.setManufacturer(c.getManufacturer());
        dto.setManufacturerRef(c.getManufacturerRef());
        dto.setSupplier(c.getSupplier());
        dto.setSupplierRef(c.getSupplierRef());
        dto.setUnitPrice(c.getUnitPrice());
        dto.setDiscount(c.getDiscount());
        dto.setDescription(c.getDescription());

        // Calcul net price
        if (c.getUnitPrice() != null && c.getDiscount() != null) {
            dto.setNetPrice(c.getUnitPrice() * (1 - c.getDiscount() / 100.0));
        }

        if (c.getType() != null) {
            dto.setTypeId(c.getType().getId());
            dto.setTypeCode(c.getType().getCode());
            dto.setTypeLabel(c.getType().getLabel());
        }
        return dto;
    }

    private HardwareComponent toEntity(HardwareComponentDTO dto) {
        HardwareComponent c = new HardwareComponent();
        c.setCode(dto.getCode());
        c.setDesignation(dto.getDesignation());
        c.setManufacturer(dto.getManufacturer());
        c.setManufacturerRef(dto.getManufacturerRef());
        c.setSupplier(dto.getSupplier());
        c.setSupplierRef(dto.getSupplierRef());
        c.setUnitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : 0.0);
        c.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : 0.0);
        c.setDescription(dto.getDescription());

        if (dto.getTypeId() != null) {
            HardwareType type = typeRepository.findById(dto.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Type introuvable: " + dto.getTypeId()));
            c.setType(type);
        }
        return c;
    }

    private void validateManufacturer(String manufacturer) {
        List<String> allowed = List.of("Intel", "Samsung", "Cisco", "Dell", "HP", "Seagate");
        if (manufacturer != null && !allowed.contains(manufacturer)) {
            throw new RuntimeException("Manufacturer invalide: " + manufacturer);
        }
    }

    private void validateSupplier(String supplier) {
        List<String> allowed = List.of("Dell Technologies", "Cisco France", "HP France", "Autre");
        if (supplier != null && !allowed.contains(supplier)) {
            throw new RuntimeException("Supplier invalide: " + supplier);
        }
    }
}