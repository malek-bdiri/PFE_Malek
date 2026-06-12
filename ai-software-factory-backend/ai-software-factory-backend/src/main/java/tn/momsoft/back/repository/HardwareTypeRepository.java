package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.HardwareType;

import java.util.Optional;

public interface HardwareTypeRepository extends JpaRepository<HardwareType, Long> {
    boolean existsByCode(String code);
    Optional<HardwareType> findByCode(String code);
}

