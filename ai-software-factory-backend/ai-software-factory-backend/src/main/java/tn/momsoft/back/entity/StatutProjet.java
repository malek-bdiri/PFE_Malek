//package tn.momsoft.back.entity;
//
//import jakarta.persistence.Column;
//import jakarta.persistence.EnumType;
//import jakarta.persistence.Enumerated;
//
//@Enumerated(EnumType.STRING)
//@Column(name = "statut", nullable = false)
//private StatutProjet statut = StatutProjet.EN_COURS;
//
//public enum StatutProjet {
//    EN_COURS,
//    EN_ATTENTE,   // demande de validation envoyée
//    VALIDE,
//    REVISION
//}
//
//// Getter & Setter
//public StatutProjet getStatut() { return statut; }
//public void setStatut(StatutProjet statut) { this.statut = statut; }