package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.HardwareComponent;

import java.util.List;

public interface HardwareComponentRepository extends JpaRepository<HardwareComponent, Long> {
    boolean existsByCode(String code);
    List<HardwareComponent> findByManufacturer(String manufacturer);

    List<HardwareComponent> findBySupplier(String supplier);

    List<HardwareComponent> findByTypeId(Long typeId);
}

