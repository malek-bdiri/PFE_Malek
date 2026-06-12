//package tn.momsoft.back.security;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//import tn.momsoft.back.entity.User;
//import tn.momsoft.back.repository.UserRepository;
//
//import java.io.IOException;
//import java.util.List;
//
//@Component
//@RequiredArgsConstructor
//public class JwtFilter extends OncePerRequestFilter {
//
//    private final JwtProvider jwtProvider;
//    private final UserRepository userRepository;
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request,
//                                    HttpServletResponse response,
//                                    FilterChain chain)
//            throws ServletException, IOException {
//
//        // Skip JWT validation for auth endpoints
//        String requestPath = request.getRequestURI();
//        if (requestPath.startsWith("/api/auth/")) {
//            chain.doFilter(request, response);
//            return;
//        }
//
//        String header = request.getHeader("Authorization");
//
//        if (header != null && header.startsWith("Bearer ")) {
//            String token = header.substring(7);
//            try {
//                String email = jwtProvider.extractEmail(token);
//
//                User user = userRepository.findByEmail(email).orElse(null);
//
//                if (user != null) {
//                    UsernamePasswordAuthenticationToken auth =
//                            new UsernamePasswordAuthenticationToken(
//                                    email, null,
//                                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
//                            );
//                    SecurityContextHolder.getContext().setAuthentication(auth);
//                }
//            } catch (Exception e) {
//                System.err.println("JWT validation error: " + e.getMessage());
//            }
//        }
//
//        chain.doFilter(request, response);
//    }
//}
