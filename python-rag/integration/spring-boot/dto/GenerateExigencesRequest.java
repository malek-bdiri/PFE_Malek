package com.momsoft.smartfactory.dto;

/**
 * DTO — Requête de génération d'exigences (appel direct JSON).
 */
public class GenerateExigencesRequest {
    private String cdcText;
    private String projectName = "";
    private String clientName = "";
    private String productName = "Smart Factory MOMsoft";
    private int topK = 8;

    public String getCdcText() { return cdcText; }
    public void setCdcText(String cdcText) { this.cdcText = cdcText; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
}
