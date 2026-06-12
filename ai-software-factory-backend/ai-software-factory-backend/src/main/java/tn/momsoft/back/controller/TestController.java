package tn.momsoft.back.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/admin/test")
    public String admin() {
        return "Access ADMIN OK";
    }

    @GetMapping("/chef/test")
    public String chef() {
        return "Access CHEF OK";
    }

    @GetMapping("/editor/test")
    public String editor() {
        return "Access EDITOR OK";
    }

    @GetMapping("/read/test")
    public String reader() {
        return "Access READER OK";
    }
}
