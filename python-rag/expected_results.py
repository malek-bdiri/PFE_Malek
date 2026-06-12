#!/usr/bin/env python
"""
RÉSULTATS ATTENDUS - Phase 2 Validation
Ce script montre EXACTEMENT ce que vous devez voir dans chaque test
"""

import json
import sys
import io
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def print_expected_output(title, content):
    """Format output nicely"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")
    print(content)
    print("\n" + "="*80)


expected_test_2_1 = """
TEST 2.1 - RETRIEVER EXPECTED OUTPUT
═════════════════════════════════════════════════════════════════════════════

TERMINAL OUTPUT:
────────────────

================================================================================
TEST 2.1 - RETRIEVER
================================================================================

[Initialisation]
✓ Retriever initialisé

[Test 1] Recherche simple (tous categories)
  Query: exigences de sécurité authentication
  Documents trouvés: 3

  [1] Score: 95.5%
      Source: Exigences_V1.docx
      Type: Exigences
      Text preview: Les exigences de sécurité incluent OAuth2, HTTPS, et...

  [2] Score: 89.2%
      Source: Guide_Architecture.pdf
      Type: Guide
      Text preview: Authentification OAuth2 implémentée selon RFC 6749...

  [3] Score: 78.3%
      Source: CdC_V2.docx
      Type: CdC
      Text preview: La sécurité est une exigence critique du projet...

[Test 2] Recherche avec filtre catégorie: Exigences
  Query: gestion des utilisateurs
  Category: Exigences
  Documents trouvés: 3

  [1] Score: 92.1%
      Source: Exigences_V1.docx
      Type: Exigences

  [2] Score: 87.5%
      Source: Exigences_Modules.docx
      Type: Exigences

  [3] Score: 81.3%
      Source: Exigences_Integration.docx
      Type: Exigences

[Test 3] Recherche avec filtre: CdC
  Query: architecture système
  Category: CdC
  Documents trouvés: 3

  [1] Score: 94.8%
      Source: CdC_Architecture.docx
      Type: CdC

  [2] Score: 88.2%
      Source: CdC_V2.docx
      Type: CdC

  [3] Score: 79.1%
      Source: CdC_Technical.docx
      Type: CdC

[Test 4] Recherche avec top_k=10
  Documents trouvés: 10

================================================================================
RÉSUMÉ TEST 2.1 - RETRIEVER
================================================================================
[1] Recherche simple: ✓ PASS
[2] Filtre catégorie Exigences: ✓ PASS
[3] Filtre catégorie CdC: ✓ PASS
[4] Top-k configurable: ✓ PASS

✓ TOUS LES TESTS PASSED
================================================================================

Résultats sauvegardés: test_2_1_retriever_results.json


JSON FILE OUTPUT (test_2_1_retriever_results.json):
──────────────────────────────────────────────────

{
  "status": "PASS",
  "test_1_simple": {
    "query": "exigences de sécurité authentication",
    "category_filter": null,
    "documents": [
      {
        "text": "Les exigences de sécurité incluent OAuth2, HTTPS...",
        "score": 95.5,
        "source": "Exigences_V1.docx",
        "type": "Exigences",
        "metadata": {
          "category": "Exigences",
          "chunk_id": 0,
          "date_ajout": "2026-03-30T23:25:12.520380",
          ...
        }
      },
      {
        "text": "Authentification OAuth2 implémentée...",
        "score": 89.2,
        "source": "Guide_Architecture.pdf",
        "type": "Guide",
        ...
      },
      ...
    ]
  },
  "test_2_category_exigences": {
    "query": "gestion des utilisateurs",
    "category_filter": "Exigences",
    "documents": [
      {
        "text": "...",
        "score": 92.1,
        "source": "Exigences_V1.docx",
        ...
      },
      ...
    ]
  },
  "test_3_category_cdc": {
    "query": "architecture système",
    "category_filter": "CdC",
    "documents": [
      ...
    ]
  },
  "test_4_top_k": {
    "documents": [... 10 documents ...]
  }
}


VALIDATIONS À VÉRIFIER:
──────────────────────
✓ Status: "PASS"
✓ Documents trouvés: >= 3 par test
✓ Scores: 50-100% (jamais < 50%)
✓ Source: Nom du fichier document
✓ Type: "Exigences", "CdC", "AFD", ou "Guide"
✓ Metadata: Dict avec clé 'category'
✓ JSON file exists: test_2_1_retriever_results.json

PROBLÈMES POSSIBLES:
───────────────────
❌ "Documents trouvés: 0" → ChromaDB vide ou catégorie invalide
❌ Status: "FAIL" → Vector DB corrompu
❌ Score < 50% → Documents non pertinents (normal parfois)
"""


expected_test_2_2 = """
TEST 2.2 - PROMPT BUILDER EXPECTED OUTPUT
═════════════════════════════════════════════════════════════════════════════

TERMINAL OUTPUT:
────────────────

================================================================================
TEST 2.2 - PROMPT BUILDER
================================================================================

[Initialisation]
✓ PromptBuilder initialisé

[Test] Template: exigences
  Query: Quelles sont les exigences de sécurité?
  ✓ System prompt: 287 chars
  ✓ User prompt: 1852 chars
  ✓ Context: 2341 chars
  ✓ Metadata: avg_score=88.3%
  Status: ✓ PASS

[Test] Template: cdc
  Query: Décrire le périmètre du projet
  ✓ System prompt: 256 chars
  ✓ User prompt: 1923 chars
  ✓ Context: 2341 chars
  ✓ Metadata: avg_score=88.3%
  Status: ✓ PASS

[Test] Template: afd
  Query: Quelles actions correctives proposer?
  ✓ System prompt: 298 chars
  ✓ User prompt: 1834 chars
  ✓ Context: 2341 chars
  ✓ Metadata: avg_score=88.3%
  Status: ✓ PASS

[Test] Template: guide
  Query: Quelle architecture recommander?
  ✓ System prompt: 264 chars
  ✓ User prompt: 1756 chars
  ✓ Context: 2341 chars
  ✓ Metadata: avg_score=88.3%
  Status: ✓ PASS

[Test] Template: general
  Query: Question générale sur le projet
  ✓ System prompt: 203 chars
  ✓ User prompt: 1612 chars
  ✓ Context: 2341 chars
  ✓ Metadata: avg_score=88.3%
  Status: ✓ PASS

================================================================================
RÉSUMÉ TEST 2.2 - PROMPT BUILDER
================================================================================
  ✓ exigences: PASS
  ✓ cdc: PASS
  ✓ afd: PASS
  ✓ guide: PASS
  ✓ general: PASS

✓ TOUS LES TESTS PASSED
================================================================================

Résultats sauvegardés: test_2_2_prompt_builder_results.json


JSON FILE OUTPUT (test_2_2_prompt_builder_results.json):
────────────────────────────────────────────────────────

{
  "exigences": {
    "status": "PASS",
    "checks": {
      "has_system_prompt": true,
      "has_user_prompt": true,
      "has_context": true,
      "has_metadata": true,
      "correct_doc_count": true,
      "has_avg_score": true
    },
    "prompt_data": {
      "system_prompt": "Tu es un expert en gestion de projet et en exigences...",
      "user_prompt": "Contexte - Exigences du projet:\\n\\n[DOC 1] (...",
      "metadata": {
        "template_type": "exigences",
        "num_documents": 3,
        "avg_score": 88.3
      }
    }
  },
  "cdc": {
    "status": "PASS",
    ...
  },
  "afd": {
    "status": "PASS",
    ...
  },
  "guide": {
    "status": "PASS",
    ...
  },
  "general": {
    "status": "PASS",
    ...
  }
}


VALIDATIONS À VÉRIFIER:
──────────────────────
✓ 5 templates: exigences, cdc, afd, guide, general
✓ Tous les status: "PASS"
✓ Tous les checks: true
✓ system_prompt: Non vide, >200 chars
✓ user_prompt: Non vide, >1000 chars
✓ context: Non vide, documents formatés
✓ avg_score: 50-100%
✓ Métadonnées: template_type, num_documents, avg_score

EXEMPLE PROMPT:
───────────────

System prompt:
  "Tu es un expert en gestion de projet et en exigences.
   Tu dois fournir une réponse structurée, claire et précise..."

User prompt:
  "Contexte - Exigences du projet:

   [DOC 1] (Exigences_V1.docx - Score: 95.5%)
   Les exigences de sécurité incluent OAuth2, HTTPS, et encryption...

   [DOC 2] (Guide_Architecture.pdf - Score: 89.2%)
   Authentification OAuth2 implémentée selon RFC 6749...

   [DOC 3] (CdC_V2.docx - Score: 87.3%)
   La sécurité est une exigence critique...

   ---

   Question de l'utilisateur: Quelles sont les exigences de sécurité?

   Réponds avec une structure JSON contenant:
   1. 'exigences_identifiees': liste des exigences pertinentes
   2. 'descriptions': descriptions détaillées
   3. 'priorite': niveau de priorité
   4. 'sources': documents sources utilisés"

PROBLÈMES POSSIBLES:
───────────────────
❌ Status: "FAIL" → Prompt builder a pas généré correctement
❌ has_metadata: false → Métadonnées manquantes
❌ avg_score manquante → Problème calcul score moyen
"""


expected_test_2_3 = """
TEST 2.3 - LLM CLIENT (Gemini) EXPECTED OUTPUT
═════════════════════════════════════════════════════════════════════════════

TERMINAL OUTPUT:
────────────────

Failed to send telemetry event ClientStartEvent: capture() takes 1 positional
argument but 3 were given
(Ce message peut s'afficher - c'est normal, c'est juste un warning Chroma)

================================================================================
TEST 2.3 - LLM CLIENT (Gemini)
================================================================================

[Initialisation]
✓ Gemini client initialized with model: gemini-2.5-flash

[Test 1] Génération texte simple
  System: Tu es un expert en gestion de projet.
  User: Qu'est-ce qu'une exigence fonctionnelle? Réponds en 1-2 phrases.
  ✓ Réponse reçue: 287 chars
  Preview: Une exigence fonctionnelle est une description détaillée de ce qu'un...

[Test 2] Génération JSON structurée
  System: Tu es un expert. Réponds en JSON valide.
  User: Donne 2 exigences pour une application web...
  ✓ Réponse JSON parsée
  Keys: ['exigences']

[Test 3] Température=0.7 (créatif)
  ✓ Réponse reçue: 156 chars
  Preview: L'Application Web Collaborative "WebForge" serait un excellent nom...

================================================================================
RÉSUMÉ TEST 2.3 - LLM CLIENT
================================================================================
[1] Génération texte simple: ✓ PASS
[2] Génération JSON: ✓ PASS
[3] Température configurable: ✓ PASS

✓ TOUS LES TESTS PASSED
================================================================================

Résultats sauvegardés: test_2_3_llm_client_results.json


JSON FILE OUTPUT (test_2_3_llm_client_results.json):
────────────────────────────────────────────────────

{
  "status": "PASS",
  "test_1_simple_text": {
    "status": "✓ PASS",
    "response_length": 287,
    "preview": "Une exigence fonctionnelle est une description détaillée de ce
qu'un système ou une application doit faire pour satisfaire les besoins de
l'utilisateur. Elle spécifie les actions, les fonctionnalités et les
comportements attendus."
  },
  "test_2_json": {
    "status": "✓ PASS",
    "json_keys": [
      "exigences"
    ],
    "response": {
      "exigences": [
        {
          "nom": "Authentification sécurisée",
          "description": "L'application doit fournir un système d'authentification
robuste avec OAuth2 ou similaire"
        },
        {
          "nom": "Interface utilisateur responsive",
          "description": "L'interface doit s'adapter à tous les appareils
(desktop, tablet, mobile)"
        }
      ]
    }
  },
  "test_3_temperature": {
    "status": "✓ PASS",
    "response_length": 156,
    "preview": "L'Application Web Collaborative 'WebForge' serait un excellent nom
pour un projet de digitalisation. Il combine l'idée d'un outil collaboratif
avec la forge d'outils..."
  }
}


VALIDATIONS À VÉRIFIER:
──────────────────────
✓ Status global: "PASS"
✓ Tous les tests: "PASS"
✓ response_length: > 50 chars
✓ Test 1: Texte naturel, compréhensible
✓ Test 2: JSON valide avec key "exigences"
✓ Test 3: Réponse créative, différente de test 1
✓ Pas d'erreur API Gemini

EXEMPLE RÉPONSES:
────────────────

Test 1 - Texte simple:
  "Une exigence fonctionnelle est une description détaillée de ce qu'un
   système ou une application doit faire pour satisfaire les besoins de
   l'utilisateur. Elle spécifie les actions, les fonctionnalités et les
   comportements attendus."

Test 2 - JSON structuré:
  {
    "exigences": [
      {
        "nom": "Authentification sécurisée",
        "description": "L'application doit fournir un système d'authentification robuste"
      },
      {
        "nom": "Interface responsive",
        "description": "L'interface doit s'adapter à tous les appareils"
      }
    ]
  }

Test 3 - Créatif (temperature=0.7):
  "L'Application Web Collaborative 'WebForge' serait un excellent nom pour
   un projet de digitalisation..."

PROBLÈMES POSSIBLES:
───────────────────
❌ GOOGLE_API_KEY not found → Vérifiez .env
❌ "Failed to generate" → Quota API dépassé
❌ JSON parsing error → Gemini n'a pas répondu en JSON
❌ Empty response → Gemini timeout

DÉPANNAGE:
──────────
• Vérifiez .env: cat .env | grep GOOGLE_API_KEY
• Vérifiez clé: https://console.cloud.google.com/
• Attendez 1 min si rate limit
• Relancez le test
"""


expected_test_2_4 = """
TEST 2.4 - COMPLETE RAG PIPELINE EXPECTED OUTPUT
═════════════════════════════════════════════════════════════════════════════

TERMINAL OUTPUT:
────────────────

================================================================================
PHASE 2 - RAG PIPELINE TEST
================================================================================

================================================================================
TEST 1: EXIGENCES
================================================================================

⏳ ÉTAPE 1: Retrieval...
✓ 5 documents trouvés

[Doc 1] Score: 95.2% | Source: Exigences_V1.docx
  Preview: Les exigences principales incluent gestion des utilisateurs...

[Doc 2] Score: 89.8% | Source: Exigences_Modules.docx
  Preview: Module d'authentification: OAuth2 avec 2FA...

[Doc 3] Score: 87.3% | Source: Guide_Architecture.pdf
  Preview: Architecture OAuth2 conforme RFC 6749...

[Doc 4] Score: 82.1% | Source: CdC_V2.docx
  Preview: La sécurité est une exigence critique...

[Doc 5] Score: 78.5% | Source: Exigences_Integration.docx
  Preview: Intégration LDAP pour gestion des utilisateurs...

⏳ ÉTAPE 2: Construction du prompt...
✓ Prompt construit (5 docs, avg score: 86.6%)

⏳ ÉTAPE 3: Génération de la réponse via Gemini...
✓ Réponse générée

RÉSUMÉ:
  • Documents trouvés: 5
  • Score moyen: 86.6%

RÉPONSE:
Voici les exigences identifiées pour la gestion des utilisateurs:

1. **Authentification sécurisée (CRITIQUE)**
   - Implémentation OAuth2 avec support 2FA
   - Conformité RFC 6749
   - Chiffrement des mots de passe (bcrypt minimum)

2. **Gestion des rôles et permissions (HAUTE)**
   - Système RBAC (Role-Based Access Control)
   - Intégration LDAP pour import utilisateurs
   - Audit trail de tous les accès

3. **API de gestion (MOYENNE)**
   - CRUD Utilisateurs
   - Gestion des sessions
   - Rate limiting

Sources: Exigences_V1.docx, Exigences_Modules.docx, Guide_Architecture.pdf


================================================================================
TEST 2: CAHIER DES CHARGES
================================================================================

⏳ ÉTAPE 1: Retrieval...
✓ 5 documents trouvés

[Doc 1] Score: 96.1% | Source: CdC_Architecture.docx
  Preview: Architecture microservices avec 4 services principaux...

[Doc 2] Score: 91.2% | Source: CdC_V2.docx
  Preview: Périmètre: Système de digitalisation d'usine...

[Doc 3] Score: 88.5% | Source: CdC_Technical.docx
  Preview: Stack technique: Python, FastAPI, PostgreSQL, Kubernetes...

[Doc 4] Score: 85.3% | Source: Guide_Architecture.pdf
  Preview: SmartFactory architecture overview...

[Doc 5] Score: 79.7% | Source: Exigences_V1.docx
  Preview: Infrastructure sur AWS avec 99.9% uptime SLA...

⏳ ÉTAPE 2: Construction du prompt...
✓ Prompt construit (5 docs, avg score: 88.2%)

⏳ ÉTAPE 3: Génération de la réponse via Gemini...
✓ Réponse générée

RÉSUMÉ:
  • Documents trouvés: 5
  • Score moyen: 88.2%

RÉPONSE:
Architecture complète du projet SmartFactory:

**Périmètre:**
- Digitalisation du processus de manufacturing
- Gestion de l'usine IoT
- Tableau de bord temps réel

**Architecture:**
- Microservices: API Gateway, Auth Service, Factory Service, Analytics Service
- Déploiement: Kubernetes sur AWS
- Database: PostgreSQL + Redis cache

**Contraintes:**
- Uptime SLA: 99.9%
- Latence API: < 500ms
- Concurrent users: 10,000

Sources: CdC_Architecture.docx, CdC_V2.docx, CdC_Technical.docx


================================================================================
TEST 3: ACTIONS DE CORRECTION (AFD)
================================================================================

⏳ ÉTAPE 1: Retrieval...
✓ 5 documents trouvés

[Doc 1] Score: 93.8% | Source: AFD_Actions_Urgentes.png
  Preview: Action corrective: Implémenter HTTPS mandatory...

[Doc 2] Score: 88.2% | Source: AFD_Cognitive.docx
  Preview: NC interne: Performance API dégradée > 1000ms...

[Doc 3] Score: 84.5% | Source: AFD_Liste_NCs.png
  Preview: Liste 15 Non-Conformités identifiées...

[Doc 4] Score: 79.3% | Source: Exigences_V1.docx
  Preview: Sécurité critique: Audit login nécessaire...

[Doc 5] Score: 76.1% | Source: Guide_Architecture.pdf
  Preview: Recommandations architecture pour remédier...

⏳ ÉTAPE 2: Construction du prompt...
✓ Prompt construit (5 docs, avg score: 84.4%)

⏳ ÉTAPE 3: Génération de la réponse via Gemini...
✓ Réponse générée

RÉSUMÉ:
  • Documents trouvés: 5
  • Score moyen: 84.4%

RÉPONSE:
Actions correctives identifiées:

1. **HTTPS Mandatory (URGENT - 1 semaine)**
   - Cause: Communication non sécurisée
   - Action: Migrer toutes APIs en HTTPS
   - Responsable: Dev Team
   - Délai: 7 jours

2. **Optimiser performance API (2 semaines)**
   - Cause: Requêtes lentes > 1000ms
   - Action: Implémenter caching Redis + indexing DB
   - Responsable: Infra Team
   - Délai: 14 jours

3. **Audit trail complet (3 semaines)**
   - Cause: Non-conformité audit
   - Action: Logger tous les logins + modifications
   - Responsable: Security Team
   - Délai: 21 jours

Sources: AFD_Actions_Urgentes.png, AFD_Cognitive.docx, Guide_Architecture.pdf


================================================================================
TEST 4: REQUÊTE GÉNÉRALE
================================================================================

⏳ ÉTAPE 1: Retrieval...
✓ 5 documents trouvés

[Doc 1] Score: 91.5% | Source: Guide_Architecture.pdf
  Preview: SmartFactory est une plateforme IoT intelligente...

[Doc 2] Score: 87.2% | Source: CdC_V2.docx
  Preview: Vue globale du projet: Digitalisation manufacturière...

[Doc 3] Score: 83.8% | Source: Exigences_V1.docx
  Preview: Objectif: Moderniser l'usine avec IoT et ML...

[Doc 4] Score: 79.4% | Source: CdC_Architecture.docx
  Preview: Microservices architecture pour scalabilité...

[Doc 5] Score: 75.6% | Source: AFD_Actions_Urgentes.png
  Preview: Points d'améliorations identifiés...

⏳ ÉTAPE 2: Construction du prompt...
✓ Prompt construit (5 docs, avg score: 83.5%)

⏳ ÉTAPE 3: Génération de la réponse via Gemini...
✓ Réponse générée

RÉSUMÉ:
  • Documents trouvés: 5
  • Score moyen: 83.5%

RÉPONSE:
SmartFactory est une plateforme complète de digitalisation manufacturière
qui combine:

- **Collecte de données**: Capteurs IoT en temps réel
- **Analysis**: Machine Learning pour prédictions
- **Visualisation**: Dashboard moderne et intuitif
- **Automatisation**: Workflow automatisés

L'objectif est de moderniser l'usine avec technologie IoT et machine learning
pour améliorer efficacité et réduire coûts.


================================================================================
RÉSUMÉ FINAL
================================================================================
  Test 1 - Exigences: ✓ PASS
  Test 2 - CdC: ✓ PASS
  Test 3 - AFD: ✓ PASS
  Test 4 - General: ✓ PASS

✓ PHASE 2 COMPLÈTEMENT VALIDÉE!
================================================================================

Résultats sauvegardés: test_2_4_pipeline_results.json


JSON FILE OUTPUT (test_2_4_pipeline_results.json) - STRUCTURE:
──────────────────────────────────────────────────────────────

{
  "overall_status": "PASS",
  "tests": {
    "test_1_exigences": {
      "status": "✓ PASS",
      "query": "Quelles sont les exigences de sécurité?",
      "summary": {
        "status": "success",
        "num_documents_retrieved": 5,
        "avg_relevance_score": 86.6,
        "template_used": "exigences"
      },
      "response_preview": "Voici les exigences identifiées..."
    },
    "test_2_cdc": {
      "status": "✓ PASS",
      "query": "Décrire l'architecture du système",
      "summary": {
        "status": "success",
        "num_documents_retrieved": 5,
        "avg_relevance_score": 88.2,
        "template_used": "cdc"
      },
      "response_preview": "Architecture complète du projet SmartFactory..."
    },
    "test_3_afd": {
      "status": "✓ PASS",
      "query": "Identifier les actions correctives...",
      "summary": {
        "status": "success",
        "num_documents_retrieved": 5,
        "avg_relevance_score": 84.4,
        "template_used": "afd"
      },
      "response_preview": "Actions correctives identifiées..."
    },
    "test_4_general": {
      "status": "✓ PASS",
      "query": "Comment fonctionne SmartFactory?",
      "summary": {
        "status": "success",
        "num_documents_retrieved": 5,
        "avg_relevance_score": 83.5,
        "template_used": "general"
      },
      "response_preview": "SmartFactory est une plateforme complète..."
    }
  }
}


VALIDATIONS À VÉRIFIER POUR CHAQUE TEST:
─────────────────────────────────────────
✓ Status: "✓ PASS"
✓ Documents retrived: 5
✓ Avg score: 80-95%
✓ Response: > 200 chars
✓ Response: Structuré et pertinent
✓ Pipeline_summary.status: "success"

PROBLÈMES POSSIBLES:
───────────────────
❌ Status: "✗ FAIL" → Vérifiez TEST 2.1, 2.2, 2.3
❌ no_documents_retrieved → Pas de doc pour cette catégorie
❌ Response vide → Gemini failed, vérifiez API key
❌ Low avg_score (< 50%) → Query non pertinent pour DB
"""


def main():
    print("\n" + "█"*80)
    print("  RÉSULTATS ATTENDUS - PHASE 2 VALIDATION")
    print("█"*80)

    print("""
Ce document affiche les RÉSULTATS EXACTS que vous devez voir
dans le terminal et les fichiers JSON pour chaque test.

Utilisez ceci pour vérifier que vos tests passent correctement.
    """)

    # Menu
    while True:
        print("\n" + "─"*80)
        print("Quel test voulez-vous voir?")
        print("─"*80)
        print("[1] TEST 2.1 - RETRIEVER")
        print("[2] TEST 2.2 - PROMPT BUILDER")
        print("[3] TEST 2.3 - LLM CLIENT (Gemini)")
        print("[4] TEST 2.4 - PIPELINE COMPLET")
        print("[5] VOIR TOUS LES RÉSULTATS ATTENDUS")
        print("[q] Quit")

        choice = input("\nVotre choix (1-5, q): ").strip().lower()

        if choice == "1":
            print_expected_output("TEST 2.1 - RETRIEVER EXPECTED RESULTS", expected_test_2_1)
        elif choice == "2":
            print_expected_output("TEST 2.2 - PROMPT BUILDER EXPECTED RESULTS", expected_test_2_2)
        elif choice == "3":
            print_expected_output("TEST 2.3 - LLM CLIENT EXPECTED RESULTS", expected_test_2_3)
        elif choice == "4":
            print_expected_output("TEST 2.4 - PIPELINE EXPECTED RESULTS", expected_test_2_4)
        elif choice == "5":
            print_expected_output("TEST 2.1 - RETRIEVER", expected_test_2_1)
            print_expected_output("TEST 2.2 - PROMPT BUILDER", expected_test_2_2)
            print_expected_output("TEST 2.3 - LLM CLIENT", expected_test_2_3)
            print_expected_output("TEST 2.4 - PIPELINE", expected_test_2_4)
        elif choice == "q":
            print("\nAu revoir!")
            break
        else:
            print("❌ Choix invalide")

        input("\nAppuyez ENTRÉE pour continuer...")


if __name__ == "__main__":
    main()
