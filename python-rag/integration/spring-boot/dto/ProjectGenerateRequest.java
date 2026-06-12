package com.momsoft.smartfactory.dto;

/**
 * DTO — Requête de création projet + génération (métadonnées uniquement,
 * le fichier est envoyé en MultipartFile séparément).
 */
public class ProjectGenerateRequest {
    private String projectName;
    private String projectId;
    private String clientName;
    private String productName = "Smart Factory MOMsoft";
    private String language = "Français";
    private int topK = 8;

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
}
