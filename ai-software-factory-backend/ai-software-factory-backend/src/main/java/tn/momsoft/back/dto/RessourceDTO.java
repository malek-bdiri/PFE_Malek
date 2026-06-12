package tn.momsoft.back.dto;

import lombok.Data;

@Data
public class RessourceDTO {

    private String role;
    private int nombre;
    private double utilisation; // %
    private double charge;      // %
}