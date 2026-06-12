package tn.momsoft.back.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO — Réponse de FastAPI POST /uiux/generate
 *
 * Structure retournée :
 * {
 *   "success": true,
 *   "filename": null,
 *   "chunks_added": 0,
 *   "extracted_text_length": 0,
 *   "uiux_spec": {
 *     "overview": {...},
 *     "designRules": {...},
 *     "components": {...},
 *     "layoutSystem": {...},
 *     "interactions": {...},
 *     "accessibility": {...},
 *     "uiSpecByAfd": [...],
 *     "figmaPrompt": "..."
 *   },
 *   "provider": "gemini",
 *   "error": null
 * }
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UiuxRagResponse {

    private boolean success;

    private String filename;

    @JsonProperty("chunks_added")
    private int chunksAdded;

    @JsonProperty("extracted_text_length")
    private int extractedTextLength;

    /**
     * La spec UI/UX complète avec les 8 sections.
     * On la stocke comme Map<String, Object> pour la flexibilité
     * — Spring la sérialisera/désérialisera automatiquement.
     */
    @JsonProperty("uiux_spec")
    private Object uiuxSpec;

    @JsonProperty("raw_text")
    private String rawText;

    private String provider;

    private String error;

    @JsonProperty("pipeline_metadata")
    private Map<String, Object> pipelineMetadata;
}