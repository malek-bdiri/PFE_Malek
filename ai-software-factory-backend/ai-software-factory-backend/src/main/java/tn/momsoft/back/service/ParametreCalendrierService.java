package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.ParametreCalendrier;
import tn.momsoft.back.repository.ParametreCalendrierRepository;

@Service
@RequiredArgsConstructor
public class ParametreCalendrierService {

    private final ParametreCalendrierRepository repository;

    public ParametreCalendrier get() {
        return repository.findAll()
                .stream()
                .findFirst()
                .orElse(null);
    }

    public ParametreCalendrier save(ParametreCalendrier param) {
        return repository.save(param);
    }
}