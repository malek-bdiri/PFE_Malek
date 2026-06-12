package tn.momsoft.back.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.HardwareGroupItem;

@Repository
public interface HardwareGroupItemRepository extends JpaRepository<HardwareGroupItem, Long> {
    void deleteByGroupId(Long groupId);
}