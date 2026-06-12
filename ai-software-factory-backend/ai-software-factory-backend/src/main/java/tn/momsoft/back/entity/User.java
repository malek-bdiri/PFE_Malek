//package tn.momsoft.back.entity;
//
//import jakarta.persistence.*;
//
//@Entity
//@Table(name = "users")
//public class User {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @Column(unique = true)
//    private String keycloakId;
//
//    private String email;
//
//    public void setId(Long id) {
//        this.id = id;
//    }
//
//    public void setKeycloakId(String keycloakId) {
//        this.keycloakId = keycloakId;
//    }
//
//    public void setEmail(String email) {
//        this.email = email;
//    }
//
//    public void setFullName(String fullName) {
//        this.fullName = fullName;
//    }
//
//    private String fullName;
//
//    public Long getId() {
//        return id;
//    }
//
//    public String getKeycloakId() {
//        return keycloakId;
//    }
//
//    public String getEmail() {
//        return email;
//    }
//
//    public String getFullName() {
//        return fullName;
//    }
//}




package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(name = "users") // ⚠️ Important: ne pas utiliser "user" car c'est un mot réservé SQL
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public void setKeycloakId(String keycloakId) {
        this.keycloakId = keycloakId;
    }

    private String keycloakId;
    @Column(unique = true)
    private String email;


    private String firstname;
    private String lastname;

    @Column(nullable = false)
    private String password;

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    @Enumerated(EnumType.STRING)
   // @Column(nullable = false)
    private Role role;

    public Long getId() {
        return id;
    }

    public String getFirstname() {
        return firstname;
    }

//    public void setRole(String role) {
//        this.role = role;
//    }
    public String getLastname() {
        return lastname;
    }


    public void setId(Long id) {
        this.id = id;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}

