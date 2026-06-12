package tn.momsoft.back.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.momsoft.back.entity.Role;
import tn.momsoft.back.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
//    Optional<Role> findByName(RoleName name);
//    Optional<User> findByRole_Name(RoleName name);
Optional<User> findByKeycloakId(String keycloakId);



}
