//package tn.momsoft.back.mapper;
//import org.mapstruct.Mapper;
//import org.mapstruct.Mapping;
//import tn.momsoft.back.entity.User;
//
//import tn.momsoft.back.dto.UserDTO;
//
//@Mapper(componentModel = "spring")
//public interface UserMapper {
//
//    UserDTO toDto(User user);
//
//    @Mapping(target = "firstName", source = "firstName")
//    @Mapping(target = "lastName", source = "lastName")
//    @Mapping(target = "email", source = "email")
//    @Mapping(target = "password", source = "password")
//        // @Mapping(target = "role", expression = "java(Role.valueOf(userDto.getRole()))") // si besoin de conversion String -> Enum
//    User toEntity(UserDTO userDto);
//}