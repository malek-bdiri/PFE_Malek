package tn.momsoft.back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.momsoft.back.entity.HardwareGroup;

import org.springframework.stereotype.Repository;

@Repository
public interface HardwareGroupRepository extends JpaRepository<HardwareGroup, Long> {
}