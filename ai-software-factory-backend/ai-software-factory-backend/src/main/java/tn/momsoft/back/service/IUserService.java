package tn.momsoft.back.service;

import tn.momsoft.back.dto.UserDTO;
import tn.momsoft.back.entity.User;

import java.util.List;

public interface IUserService {
    UserDTO createUser(UserDTO userDto);
    //User addUser (User user);



}