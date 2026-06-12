package tn.momsoft.back.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RoleTestController {

    @GetMapping("/public")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("This is a public endpoint - no authentication required");
    }

    @GetMapping("/authenticated")
    public ResponseEntity<Map<String, Object>> authenticatedEndpoint() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "This endpoint requires authentication");

        if (authentication != null) {
            response.put("username", authentication.getName());
            response.put("authorities", authentication.getAuthorities());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> adminEndpoint() {
        return ResponseEntity.ok("This is an ADMIN only endpoint");
    }

    @GetMapping("/chef")
    @PreAuthorize("hasRole('CHEF_DE_PROJET')")
    public ResponseEntity<String> chefEndpoint() {
        return ResponseEntity.ok("This is a CHEF_DE_PROJET only endpoint");
    }

    @GetMapping("/editeur")
    @PreAuthorize("hasAnyRole('EDITEUR', 'ADMIN')")
    public ResponseEntity<String> editeurEndpoint() {
        return ResponseEntity.ok("This is an EDITEUR or ADMIN endpoint");
    }

    @GetMapping("/lecteur")
    @PreAuthorize("hasAnyRole('LECTEUR', 'ADMIN')")
    public ResponseEntity<String> lecteurEndpoint() {
        return ResponseEntity.ok("This is a LECTEUR or ADMIN endpoint");
    }
}


