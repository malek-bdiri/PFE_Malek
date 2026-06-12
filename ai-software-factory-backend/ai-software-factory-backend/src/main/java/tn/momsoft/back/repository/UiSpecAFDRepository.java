package tn.momsoft.back.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import tn.momsoft.back.entity.UiSpecAFD;
public interface UiSpecAFDRepository extends JpaRepository<UiSpecAFD, Long> {

    List<UiSpecAFD> findByUiuxId(Long uiuxId);
    boolean existsByUiuxIdAndAfdId(Long uiuxId, Long afdId);
    List<UiSpecAFD> findByAfdId(Long afdId);
}