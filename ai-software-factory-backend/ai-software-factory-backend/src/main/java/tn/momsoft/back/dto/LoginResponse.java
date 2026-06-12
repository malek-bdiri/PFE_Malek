package tn.momsoft.back.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class LoginResponse {
    private String accessToken;
    private String role;
    private String refreshToken;
    private List<String> roles;

    // Constructeur pour compatibilité arrière
    public LoginResponse(String accessToken, String role) {
        this.accessToken = accessToken;
        this.role = role;
        this.roles = List.of(role);
    }
}
