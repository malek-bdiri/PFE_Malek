package tn.momsoft.back.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;

    public SecurityConfig(KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter) {
        this.keycloakJwtAuthenticationConverter = keycloakJwtAuthenticationConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Public
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/test/public").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/api/admin/users/change-password").permitAll()  // ← AJOUTER ICI (avant admin/**)

                        .requestMatchers("/api/admin/users").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .requestMatchers("/api/ai/**").permitAll()

                        // Projets & chiffrage
                        .requestMatchers("/api/projets/**").permitAll()

                        // Hardware
                        .requestMatchers("/api/hardware-types/**").permitAll()
                        .requestMatchers("/api/hardware-components/**").permitAll()
                        .requestMatchers("/api/hardware-groups/**").permitAll()

                        // Composantes & TJM
                        .requestMatchers("/api/composantes/**").permitAll()

                        // Produits & modules
                        .requestMatchers("/api/produits/**").permitAll()
                        .requestMatchers("/api/modules/**").permitAll()

                        // Clients
                        .requestMatchers("/api/clients/**").permitAll()
                        .requestMatchers("/api/test-scenarios/**").permitAll()
                        // Rôles de test
                        .requestMatchers("/api/test/admin").hasRole("ADMIN")
                        .requestMatchers("/api/test/chef").hasRole("CHEF_DE_PROJET")
                        .requestMatchers("/api/test/editeur").hasAnyRole("EDITEUR", "ADMIN")
                        .requestMatchers("/api/test/lecteur").hasAnyRole("LECTEUR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/projets/validateurs")
                        .hasAnyRole("ADMIN", "CHEF_DE_PROJET", "EDITEUR", "LECTEUR")
                        .requestMatchers("/api/functional-blocks/**").permitAll()
                        .requestMatchers("/api/afds/**").permitAll()
                        .requestMatchers("/api/functional-analyses/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter))
                );
        return http.build();
    }
}