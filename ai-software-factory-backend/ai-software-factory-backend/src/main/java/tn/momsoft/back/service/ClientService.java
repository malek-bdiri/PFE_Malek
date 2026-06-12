package tn.momsoft.back.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.dto.ClientDTO;
import tn.momsoft.back.entity.Client;
import tn.momsoft.back.entity.Statut;
import tn.momsoft.back.repository.ClientRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientDTO create(ClientDTO dto) {

        if (clientRepository.existsByClientCode(dto.getClientCode())) {
            throw new RuntimeException("Client code already exists");
        }

        Client client = Client.builder()
                .nom(dto.getNom())
                .clientCode(dto.getClientCode())
                .secteur(dto.getSecteur())
                .pays(dto.getPays())
                .statut(dto.getStatut() != null ? dto.getStatut() : Statut.ACTIF)
                .build();

        return mapToDTO(clientRepository.save(client));
    }

    public List<ClientDTO> getAll() {
        return clientRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ClientDTO update(Long id, ClientDTO dto) {

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setNom(dto.getNom());
        client.setSecteur(dto.getSecteur());
        client.setPays(dto.getPays());
        client.setStatut(dto.getStatut());

        return mapToDTO(clientRepository.save(client));
    }

    public void delete(Long id) {
        clientRepository.deleteById(id);
    }

    private ClientDTO mapToDTO(Client client) {
        ClientDTO dto = new ClientDTO();
        dto.setId(client.getId());
        dto.setNom(client.getNom());
        dto.setClientCode(client.getClientCode());
        dto.setSecteur(client.getSecteur());
        dto.setPays(client.getPays());
        dto.setStatut(client.getStatut());
        return dto;
    }
}
