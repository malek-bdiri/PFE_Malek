package tn.momsoft.back.service;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.momsoft.back.dto.HardwareGroupDTO;
import tn.momsoft.back.entity.HardwareGroup;
import tn.momsoft.back.entity.HardwareGroupItem;
import tn.momsoft.back.repository.HardwareComponentRepository;
import tn.momsoft.back.repository.HardwareGroupItemRepository;
import tn.momsoft.back.repository.HardwareGroupRepository;
import tn.momsoft.back.repository.HardwareTypeRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class HardwareGroupService {

    private final HardwareGroupRepository groupRepository;
    private final HardwareTypeRepository typeRepository;
    private final HardwareComponentRepository componentRepository;

    public HardwareGroupService(HardwareGroupRepository groupRepository,
                                HardwareGroupItemRepository itemRepository,
                                HardwareTypeRepository typeRepository,
                                HardwareComponentRepository componentRepository) {
        this.groupRepository = groupRepository;
        this.typeRepository = typeRepository;
        this.componentRepository = componentRepository;
    }

    public List<HardwareGroup> getAll() {
        return groupRepository.findAll();
    }

    public HardwareGroup getById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hardware group not found: " + id));
    }

    @Transactional
    public HardwareGroup create(HardwareGroupDTO dto) {
        HardwareGroup group = new HardwareGroup();
        group.setCode(dto.getCode());
        group.setLabel(dto.getLabel());
        group.setDescription(dto.getDescription());
        group.setLogisticCostPercent(dto.getLogisticCostPercent());
        group.setContingencyPercent(dto.getContingencyPercent());

        // Résoudre la référence type (accepte typeId ou type.id)
        Long typeId = dto.getTypeId();
        if (typeId != null) {
            group.setType(typeRepository.getReferenceById(typeId));
        }

        // Résoudre les items avec relation inverse CRITIQUE
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<HardwareGroupItem> items = dto.getItems().stream().map(itemDto -> {
                Long compId = itemDto.getComponentId();
                if (compId == null) {
                    throw new IllegalArgumentException("componentId est requis pour chaque item");
                }
                HardwareGroupItem item = new HardwareGroupItem();
                item.setComponent(componentRepository.getReferenceById(compId));
                item.setQuantity(itemDto.getQuantity() > 0 ? itemDto.getQuantity() : 1);
                item.setGroup(group); // CRITIQUE : relation inverse NOT NULL
                return item;
            }).collect(Collectors.toList());
            group.setItems(items);
        } else {
            group.setItems(new ArrayList<>());
        }

        return groupRepository.save(group);
    }

    @Transactional
    public HardwareGroup update(Long id, HardwareGroupDTO dto) {
        HardwareGroup group = getById(id);

        group.setCode(dto.getCode());
        group.setLabel(dto.getLabel());
        group.setDescription(dto.getDescription());
        group.setLogisticCostPercent(dto.getLogisticCostPercent());
        group.setContingencyPercent(dto.getContingencyPercent());

        Long typeId = dto.getTypeId();
        if (typeId != null) {
            group.setType(typeRepository.getReferenceById(typeId));
        } else {
            group.setType(null);
        }

        // Vider les anciens items et reconstruire
        group.getItems().clear();
        groupRepository.saveAndFlush(group); // flush avant d'ajouter les nouveaux items

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            List<HardwareGroupItem> items = dto.getItems().stream().map(itemDto -> {
                Long compId = itemDto.getComponentId();
                if (compId == null) {
                    throw new IllegalArgumentException("componentId est requis pour chaque item");
                }
                HardwareGroupItem item = new HardwareGroupItem();
                item.setComponent(componentRepository.getReferenceById(compId));
                item.setQuantity(itemDto.getQuantity() > 0 ? itemDto.getQuantity() : 1);
                item.setGroup(group);
                return item;
            }).collect(Collectors.toList());
            group.getItems().addAll(items);
        }

        return groupRepository.save(group);
    }

    @Transactional
    public void delete(Long id) {
        groupRepository.deleteById(id);
    }
}