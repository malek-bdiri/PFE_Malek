package tn.momsoft.back.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RagGenerateResponse {

    private boolean success;
    private String filename;
    private Integer chunks_added;
    private Integer extracted_text_length;

    // FastAPI retourne: { "exigences": { "exigences": [...], "nb_exigences": 15 } }
    private Map<String, Object> exigences;

    private String raw_text;
    private String provider;
    private String error;
}