package tn.momsoft.back.dto;

import lombok.Data;

@Data
public class GenerateRequest {
    private String query;
    private String generation_type;  // "exigences"
    private String category;         // "CdC"
    private Integer top_k;
    private String project_name;
    private String project_id;
    private String client;
    private String language;
    private String product_context;
}