package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.momsoft.back.dto.LoginRequest;
import tn.momsoft.back.service.KeycloakAuthService;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAuthService keycloakAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Map<String, Object> token = keycloakAuthService.login(
                request.getEmail(),
                request.getPassword()
        );

        return ResponseEntity.ok(token);
    }
}
