package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.dto.ProduitDTO;
import tn.momsoft.back.entity.Produit;
import tn.momsoft.back.entity.Statut;
import tn.momsoft.back.repository.ProduitRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;

    public ProduitDTO create(ProduitDTO dto) {

        if (produitRepository.existsByProduitCode(dto.getProduitCode())) {
            throw new RuntimeException("Produit code already exists");
        }

        Produit produit = Produit.builder()
                .nom(dto.getNom())
                .produitCode(dto.getProduitCode())
                .description(dto.getDescription())
                .statut(dto.getStatut() != null ? dto.getStatut() : Statut.ACTIF)
                .build();

        return mapToDTO(produitRepository.save(produit));
    }

    public List<ProduitDTO> getAll() {
        return produitRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public ProduitDTO update(Long id, ProduitDTO dto) {

        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit not found"));

        produit.setNom(dto.getNom());
        produit.setDescription(dto.getDescription());
        produit.setStatut(dto.getStatut());

        return mapToDTO(produitRepository.save(produit));
    }

    public void delete(Long id) {
        produitRepository.deleteById(id);
    }

    private ProduitDTO mapToDTO(Produit produit) {
        ProduitDTO dto = new ProduitDTO();
        dto.setId(produit.getId());
        dto.setNom(produit.getNom());
        dto.setProduitCode(produit.getProduitCode());
        dto.setDescription(produit.getDescription());
        dto.setStatut(produit.getStatut());
        return dto;
    }
}
