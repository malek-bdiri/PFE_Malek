package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.User;
import tn.momsoft.back.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User syncUser(Jwt jwt) {

        String keycloakId = jwt.getSubject();
        String email = jwt.getClaim("email");
        //String name = jwt.getClaim("name");

        return userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setKeycloakId(keycloakId);
                    user.setEmail(email);
                  //  user.setFullName(name);
                   // user.setFullName(name);
                    return userRepository.save(user);
                });
    }
}


//
//package tn.momsoft.back.service;
//
//import lombok.RequiredArgsConstructor;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import tn.momsoft.back.dto.UserDTO;
//import tn.momsoft.back.entity.Role;
//import tn.momsoft.back.entity.User;
//import tn.momsoft.back.repository.UserRepository;
//
//@Service
//@RequiredArgsConstructor
//public class UserService implements IUserService {
//    private static final Logger log = LoggerFactory.getLogger(UserService.class);
//
//    private final UserRepository userRepository;
//    //private final PasswordEncoder passwordEncoder;
//
//    @Value("${app.admin.email}")
//    private String adminMail;
//
//   // @Transactional
//    @Override
//    public UserDTO createUser(UserDTO userDto) {
//        try {
//            // Vérifier email
//            if(userDto.getEmail() == null || userDto.getEmail().isEmpty()){
//                throw new IllegalArgumentException("Email obligatoire");
//            }
//
//            // Vérifier si l'utilisateur existe déjà
//            if(userRepository.existsByEmail(userDto.getEmail())){
//                throw new IllegalArgumentException("Utilisateur déjà existant avec cet email");
//            }
//
//            // Vérifier mot de passe
//            if(userDto.getPassword() == null || userDto.getPassword().isEmpty()){
//                throw new IllegalArgumentException("Mot de passe obligatoire");
//            }
//
//            User user = new User();
//            user.setFirstname(userDto.getFirstName());
//            user.setLastname(userDto.getLastName());
//            user.setEmail(userDto.getEmail());
//            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
//
//            // Définir le rôle
//            if(userDto.getRole() != null){
//                user.setRole(Role.valueOf(userDto.getRole().toUpperCase()));
//            } else {
//                user.setRole(Role.ADMIN);
//            }
//
//            User savedUser = userRepository.save(user);
//
//            // Préparer la réponse
//            UserDTO response = new UserDTO();
//            response.setFirstName(savedUser.getFirstname());
//            response.setLastName(savedUser.getLastname());
//            response.setEmail(savedUser.getEmail());
//            response.setRole(savedUser.getRole().name());
//            return response;
//
//        } catch (Exception e) {
//            log.error("Erreur lors de la création de l'utilisateur", e);
//            throw e;
//        }
//    }
//}
