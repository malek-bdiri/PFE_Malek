package tn.momsoft.back.dto;

import lombok.Data;

@Data
public class CreateUserRequest {

    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String role;
//    public String getEmail() {
//        return email;
//    }
//
//    public String getFirstName() {
//        return firstName;
//    }
//
//    public String getLastName() {
//        return lastName;
//    }
//
//    public String getPassword() {
//        return password;
//    }
//
//    public String getRole() {
//        return role;
//    }
}