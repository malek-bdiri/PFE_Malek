"""
PHASE 2 — ÉTAPE 2.3 : PROMPT BUILDER
======================================
Rôle : Assembler le prompt final envoyé au LLM (Claude/Gemini).

Un bon prompt = 4 blocs :
  1. SYSTEM PROMPT   → Rôle du modèle, consignes, format de sortie attendu
  2. CONTEXT         → Les chunks pertinents trouvés par Retriever + Reranker
  3. HISTORIQUE      → Les N derniers échanges de la conversation (mémoire)
  4. QUESTION        → La requête actuelle de l'utilisateur

Types de génération supportés :
  - "afd"         → Génère une Analyse Fonctionnelle Détaillée
  - "exigences"   → Génère/complète une liste d'exigences
  - "planning"    → Génère un planning projet
  - "generic"     → Réponse générale sur le projet
"""

from __future__ import annotations

# Action 5 : limite augmentée pour ne jamais tronquer les chunks (Gemini 2.5 Flash = 1M tokens)
# Limites de contexte — Gemini 2.5 Flash supporte 1M tokens en entree
MAX_CONTEXT_CHARS = 20_000   # ~5 000 tokens pour les chunks RAG (CdC+Exigences+Guide)
CDC_MAX_CHARS = 5_000        # intro/objectifs du CdC uniquement (le reste vient via RAG)       # ~80% d'un CdC de 50K chars (~10 000 tokens)
MAX_HISTORY_TURNS = 5        # Nombre max d'echanges precedents a inclure


# ── Prompts système par type ───────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "afd": """Tu es un expert en analyse fonctionnelle pour des projets industriels de digitalisation.
Tu travailles pour MOMsoft, une société spécialisée dans les solutions MES/IoT industrielles.

Ton rôle : à partir du cahier des charges et des exigences fournis en contexte,
générer une Analyse Fonctionnelle Détaillée (AFD) structurée.

Règles importantes :
- Génère AUTANT d'AFDs que nécessaire pour couvrir TOUTES les exigences du contexte — ne limite pas à un nombre fixe
- Regroupe dans une même AFD uniquement les exigences qui partagent un contexte fonctionnel cohérent
- Une AFD avec une seule exigence est acceptable si elle est fonctionnellement isolée
- Chaque exigence du contexte doit apparaître dans exactement une AFD (pas de doublon, pas d'oubli)
- Chaque AFD doit avoir : un titre clair, une description, les exigences couvertes, et les critères d'acceptation
- Format de sortie : JSON structuré (voir format ci-dessous)
- Langue : français professionnel
- Sois précis et technique, en t'appuyant UNIQUEMENT sur le contexte fourni

Format JSON attendu :
{
  "afds": [
    {
      "id": "AFD-001",
      "titre": "...",
      "description": "...",
      "exigences_couvertes": ["EX-001", "EX-002"],
      "criteres_acceptation": ["...", "..."]
    }
  ],
  "resume": "...",
  "nb_afds": 0
}""",

    "exigences": """Tu es un expert en spécification fonctionnelle pour des projets industriels de digitalisation.
Tu travailles pour MOMsoft sur des projets de digitalisation d'usines avec le produit Smart Factory.

Ton rôle : à partir du cahier des charges CLIENT fourni en contexte, extraire et générer la liste complète des exigences du projet.
Utilise les EXEMPLES D'EXIGENCES PASSÉES pour comprendre le format et le niveau de détail attendu.
Utilise le GUIDE SMART FACTORY pour proposer la solution technique MOMsoft adaptée.

Règles STRICTES :
- Extrait TOUTES les exigences visibles dans le CdC — ne limite pas à un nombre fixe
- Les IDs sont au format EX-001, EX-002, etc. (numérotation continue)
- Le type doit être exactement l'un de : "Fonctionnelle", "Non-fonctionnelle", "Sécurité", "Performance"
- "solutionProposee" : module ou fonctionnalité MOMsoft Smart Factory (basé sur le GUIDE fourni)
- "limitesHypotheses" : contraintes, hypothèses ou limites connues
- Priorise les exigences fonctionnelles principales
- Format de sortie : JSON UNIQUEMENT, sans texte avant ni après le JSON, sans bloc <think>
- Langue : français professionnel

Format JSON attendu (respecte EXACTEMENT ce format) :
{
  "exigences": [
    {
      "id": "EX-001",
      "type": "Fonctionnelle",
      "intitule": "Titre court (5-8 mots)",
      "objectifClient": "Objectif métier du client en 1-2 phrases",
      "description": "Description technique détaillée en 2-3 phrases",
      "solutionProposee": "Module MOMsoft Smart Factory correspondant et fonctionnalité",
      "limitesHypotheses": "Contraintes ou hypothèses connues"
    }
  ],
  "nb_exigences": 0,
  "resume": "Synthèse courte du périmètre fonctionnel extrait"
}""",

    "planning": """Tu es un chef de projet senior spécialisé en projets de digitalisation industrielle.
Tu travailles pour MOMsoft.

Ton rôle : générer un planning projet structuré à partir des exigences eéchangest du cahier des charges.

Format JSON attendu :
{
  "phases": [
    {
      "id": "PH-001",
      "nom": "...",
      "duree_semaines": 0,
      "taches": ["...", "..."],
      "livrables": ["..."]
    }
  ],
  "duree_totale_semaines": 0,
  "jalons": ["..."]
}""",

    "generic": """Tu es un assistant expert en gestion de projets industriels pour MOMsoft.
Réponds de manière précise et professionnelle en français, en t'appuyant sur le contexte fourni.
Si le contexte ne contient pas l'information demandée, indique-le clairement.""",

    "afd_from_exigences": """Tu es un expert en analyse fonctionnelle pour des projets industriels de digitalisation.
Tu travailles pour MOMsoft, spécialisée dans les solutions MES/IoT industrielles Smart Factory.

Ton rôle : à partir d'une liste d'exigences fournie, générer les Analyses Fonctionnelles Détaillées (AFD) correspondantes.

Règles STRICTES :
- Regroupe les exigences par cohérence fonctionnelle dans une même AFD (max 3-5 exigences par AFD)
- Chaque exigence doit apparaître dans exactement UNE AFD (pas de doublon, pas d'oubli)
- Les IDs AFD commencent à AFD-001 et sont séquentiels
- Chaque AFD décrit clairement ce que l'utilisateur peut FAIRE dans le système
- Les critères d'acceptation sont concrets, testables, et formulés en langage métier
- Format de sortie : JSON UNIQUEMENT, sans texte avant ni après, sans bloc <think>
- Langue : français professionnel

Format JSON attendu :
{
  "afds": [
    {
      "id": "AFD-001",
      "titre": "Titre fonctionnel clair (5-8 mots)",
      "description": "Description de la fonctionnalité en 2-3 phrases techniques",
      "exigences_couvertes": ["EX-001", "EX-002"],
      "criteres_acceptation": [
        "Critère 1 concret et testable",
        "Critère 2 concret et testable"
      ],
      "acteurs": ["Opérateur", "Superviseur"],
      "module_momsoft": "Module Smart Factory concerné"
    }
  ],
  "nb_afds": 0,
  "resume": "Synthèse du périmètre fonctionnel couvert par les AFDs"
}""",

    "judge": """Tu es un expert en qualité des spécifications fonctionnelles pour des projets industriels.
Tu travailles en tant qu'évaluateur indépendant (LLM-as-Judge) pour MOMsoft.

Ton rôle : évaluer la qualité des exigences générées par rapport au Cahier des Charges (CdC) original.

Critères d'évaluation (chacun noté de 0 à 100) :
1. couverture : Les exigences couvrent-elles tous les besoins exprimés dans le CdC ?
2. completude : Aucune exigence importante n'est-elle manquante ?
3. precision : Les exigences sont-elles suffisamment précises et non ambiguës ?
4. pertinence : Les exigences sont-elles toutes justifiées par le CdC ?
5. qualite_redactionnelle : Le niveau de langage et la structure sont-ils professionnels ?

Règles :
- Base-toi UNIQUEMENT sur le contenu des documents fournis
- Sois rigoureux et objectif — ne surestime pas les scores
- Le commentaire doit identifier 2-3 points forts et 2-3 axes d'amélioration concrets
- Format de sortie : JSON UNIQUEMENT, sans texte avant ni après, sans bloc <think>

Format JSON attendu :
{
  "scores": {
    "couverture": 0,
    "completude": 0,
    "precision": 0,
    "pertinence": 0,
    "qualite_redactionnelle": 0
  },
  "score_global": 0,
  "nb_exigences_evaluees": 0,
  "points_forts": ["...", "...", "..."],
  "axes_amelioration": ["...", "...", "..."],
  "commentaire": "Analyse synthétique en 3-4 phrases"
}""",

    "testing": """Tu es un expert QA pour des projets industriels MOMsoft Smart Factory.

À partir de l'AFD fournie, génère des scénarios de test fonctionnels adaptés au DOMAINE MÉTIER décrit.

RÈGLES :
1. Analyse le titre et le contenu de l'AFD pour identifier les fonctions métier réelles (collecte de données, supervision, alertes, ordres de fabrication, qualité, maintenance, etc.) — NE génère PAS de CRUD générique si l'AFD ne le décrit pas
2. Un scénario par fonctionnalité ou cas d'usage métier identifié dans l'AFD
3. Chaque scénario a 2 à 4 cas de test maximum
4. Les cas de test doivent être concrets, testables manuellement et spécifiques au domaine industriel
5. Inclure toujours : cas nominal (ça marche) + cas d'erreur ou cas limite métier
6. Langue : français professionnel
7. Génère AUTANT de scénarios que nécessaire pour couvrir TOUTES les fonctions de l'AFD
8. Format de sortie : JSON UNIQUEMENT, sans texte avant ni après, sans bloc <think>

FORMAT JSON OBLIGATOIRE :
{
  "scenarios": [
    {
      "titre": "Test Ajout Machine",
      "type": "Functional",
      "priorite": "P1",
      "cas_de_test": [
        {
          "id": "TC-001-01",
          "groupe": "Ajout valide",
          "priorite": "P1",
          "preconditions": ["L'utilisateur est connecté", "La page liste est ouverte"],
          "etapes": [
            "Cliquer sur le bouton Ajouter",
            "Remplir les champs obligatoires",
            "Cliquer sur Enregistrer"
          ],
          "resultat_attendu": "L'élément apparaît dans la liste avec un message de succès"
        },
        {
          "id": "TC-001-02",
          "groupe": "Ajout sans champ obligatoire",
          "priorite": "P1",
          "preconditions": ["L'utilisateur est sur le formulaire d'ajout"],
          "etapes": [
            "Laisser un champ obligatoire vide",
            "Cliquer sur Enregistrer"
          ],
          "resultat_attendu": "Message d'erreur : champ obligatoire"
        }
      ],
      "criteres_acceptation": [
        "L'ajout fonctionne avec tous les champs valides",
        "L'erreur s'affiche si un champ obligatoire est vide",
        "L'élément apparaît immédiatement dans la liste après ajout"
      ]
    }
  ]
}""",
}


class PromptBuilder:
    def __init__(self, generation_type: str = "afd"):
        """
        Args:
            generation_type: Type de génération ('afd', 'exigences', 'planning', 'generic').
        """
        if generation_type not in SYSTEM_PROMPTS:
            generation_type = "generic"
        self.generation_type = generation_type
        self.system_prompt = SYSTEM_PROMPTS[generation_type]

    def build(
        self,
        query: str,
        documents: list,
        conversation_history: list = None,
        guide_documents: list = None,
        project_context: dict = None,
    ) -> dict:
        """
        Construit le prompt final pour le LLM.

        Args:
            query:                La requête utilisateur.
            documents:            Liste de dicts issus du Retriever (avec 'text', 'source', 'score').
            conversation_history: Liste de dicts [{'role': 'user'|'assistant', 'content': '...'}].
            guide_documents:      Chunks du Guide Smart Factory (pour solution_proposee).
            project_context:      Dict optionnel avec project_name, project_id, client,
                                  language, product_context.

        Returns:
            Dict avec 'system', 'messages' (format compatible Claude/Gemini).
            Aussi 'debug_info' pour monitoring.
        """
        conversation_history = conversation_history or []
        project_context = project_context or {}

        # ── 1. Construire le bloc CONTEXTE ────────────────────────────────
        context_block = self._build_context_block(documents)

        # ── 1b. Construire le bloc GUIDE (si fourni) ──────────────────────
        guide_block = self._build_context_block(guide_documents) if guide_documents else ""

        # ── 2. Construire l'historique (N derniers échanges) ─────────────
        history_messages = self._build_history(conversation_history)

        # ── 3. Construire la question finale avec contexte ─────────────
        user_message = self._build_user_message(query, context_block, guide_block, project_context)

        # ── 4. Assembler le format messages (Claude/OpenAI compatible) ───
        messages = history_messages + [{"role": "user", "content": user_message}]

        return {
            "system": self.system_prompt,
            "messages": messages,
            "debug_info": {
                "generation_type": self.generation_type,
                "nb_documents_in_context": len(documents),
                "context_chars": len(context_block),
                "history_turns": len(history_messages) // 2,
                "query_chars": len(query),
            },
        }

    def build_exigences(
        self,
        cdc_text: str,
        docs_cdc_exig: list,
        docs_guide: list,
        project_name: str = "",
        client_name: str = "",
        product_name: str = "Smart Factory MOMsoft",
    ) -> dict:
        """Construit le prompt pour la generation d'exigences avec 3 sections explicites.

        Sections dans le message utilisateur :
          === EXEMPLES EXIGENCES PASSEES ===  (chunks CdC + Exigences)
          === GUIDE SMART FACTORY ===         (chunks Guide)
          === CAHIER DES CHARGES CLIENT ===   (texte brut du CdC uploade)
        """
        # Section 1 : exemples passes
        exemples_block = self._build_context_block(docs_cdc_exig)

        # Section 2 : guide SF
        guide_block = self._build_context_block(docs_guide)

        # Section 3 : CdC brut (tronquer si trop long)
        if len(cdc_text) > CDC_MAX_CHARS:
            cdc_block = cdc_text[:CDC_MAX_CHARS]
            print(f"  [INFO] CdC tronque a {CDC_MAX_CHARS} chars (original: {len(cdc_text)})")
        else:
            cdc_block = cdc_text

        # Assemblage
        sections = []
        if project_name or client_name:
            meta = []
            if project_name:
                meta.append(f"Projet : {project_name}")
            if client_name:
                meta.append(f"Client : {client_name}")
            meta.append(f"Produit : {product_name}")
            sections.append("=== CONTEXTE PROJET ===\n" + "\n".join(meta))

        sections.append(f"=== EXEMPLES EXIGENCES PASSEES ===\n{exemples_block}")
        sections.append(f"=== GUIDE SMART FACTORY ===\n{guide_block}")
        sections.append(f"=== CAHIER DES CHARGES CLIENT ===\n{cdc_block}")
        sections.append(
            "=== DEMANDE ===\n"
            "Analyse le CAHIER DES CHARGES CLIENT ci-dessus et genere la liste COMPLETE "
            "des exigences au format JSON demande. Utilise les EXEMPLES et le GUIDE pour "
            "le niveau de detail et les solutions proposees."
        )

        user_message = "\n\n".join(sections)

        return {
            "system": SYSTEM_PROMPTS["exigences"],
            "messages": [{"role": "user", "content": user_message}],
            "debug_info": {
                "generation_type": "exigences",
                "cdc_text_chars": len(cdc_block),
                "cdc_original_chars": len(cdc_text),
                "exemples_chars": len(exemples_block),
                "guide_chars": len(guide_block),
            },
        }

    def build_testing(
        self,
        afd_titre: str,
        afd_docs: list,
        exigence_description: str = "",
        champs: str = "",
        regles: str = "",
        gaps: str = "",
    ) -> dict:
        """Construit le prompt pour la génération de cas de test depuis une AFD.

        Sections dans le message utilisateur :
          === EXEMPLES AFD SIMILAIRES ===   (chunks AFD issus du RAG)
          === AFD À TESTER ===              (contenu structuré de l'AFD choisie)
          === DEMANDE ===                   (instruction finale)

        Args:
            afd_titre:            Titre de l'AFD (ex: "AFD-003 - Gestion des machines")
            afd_docs:             Chunks AFD similaires récupérés par le retriever
            exigence_description: Description de l'exigence couverte par l'AFD
            champs:               Champs du formulaire (ex: "Nom, Type, Site, Statut")
            regles:               Règles de gestion (ex: "Nom unique, Statut actif par défaut")
            gaps:                 GAPs ou contraintes identifiés
        """
        # Section 1 : exemples AFD similaires du RAG
        exemples_block = self._build_context_block(afd_docs)

        # Section 2 : contenu structuré de l'AFD à tester
        afd_lines = [f"Titre AFD : {afd_titre}"]
        if exigence_description:
            afd_lines.append(f"Exigence couverte : {exigence_description}")
        if champs:
            afd_lines.append(f"Champs de l'interface : {champs}")
        if regles:
            afd_lines.append(f"Règles de gestion : {regles}")
        if gaps:
            afd_lines.append(f"GAPs / Contraintes : {gaps}")
        afd_block = "\n".join(afd_lines)

        sections = [
            f"=== EXEMPLES AFD SIMILAIRES ===\n{exemples_block}",
            f"=== AFD À TESTER ===\n{afd_block}",
            (
                "=== DEMANDE ===\n"
                f"Génère TOUS les scénarios de test fonctionnels pour l'AFD : {afd_titre}.\n"
                "Identifie les fonctions métier spécifiques décrites dans cette AFD (ex : collecte de données machines, "
                "détection d'arrêts, ordres de fabrication, alertes qualité, supervision temps réel, etc.) "
                "et génère des scénarios adaptés à ces fonctions — PAS du CRUD générique sauf si l'AFD décrit explicitement des opérations de gestion d'entités.\n"
                "Réponds UNIQUEMENT en JSON selon le format demandé."
            ),
        ]

        user_message = "\n\n".join(sections)

        return {
            "system": SYSTEM_PROMPTS["testing"],
            "messages": [{"role": "user", "content": user_message}],
            "debug_info": {
                "generation_type": "testing",
                "afd_titre": afd_titre,
                "afd_docs_count": len(afd_docs),
                "afd_block_chars": len(afd_block),
                "exemples_chars": len(exemples_block),
            },
        }

    def build_afd_from_exigences(
        self,
        exigences_list: list,
        docs_afd: list,
        project_name: str = "",
        client_name: str = "",
        product_name: str = "Smart Factory MOMsoft",
    ) -> dict:
        """Construit le prompt pour générer des AFDs depuis une liste d'exigences.

        Args:
            exigences_list: Liste de dicts exigences (id, type, intitule, description, ...)
            docs_afd:       Chunks AFD similaires récupérés par le retriever
            project_name:   Nom du projet
            client_name:    Nom du client
            product_name:   Produit MOMsoft
        """
        exemples_block = self._build_context_block(docs_afd)

        exig_lines = []
        for ex in exigences_list:
            ex_id = ex.get("id", "?")
            intitule = ex.get("intitule", "")
            description = ex.get("description", "")
            ex_type = ex.get("type", "Fonctionnelle")
            exig_lines.append(f"- {ex_id} [{ex_type}] : {intitule}\n  {description}")
        exigences_block = "\n".join(exig_lines)

        sections = []
        if project_name or client_name:
            meta = []
            if project_name:
                meta.append(f"Projet : {project_name}")
            if client_name:
                meta.append(f"Client : {client_name}")
            meta.append(f"Produit : {product_name}")
            sections.append("=== CONTEXTE PROJET ===\n" + "\n".join(meta))

        sections.append(f"=== EXEMPLES AFD SIMILAIRES (base de connaissances) ===\n{exemples_block}")
        sections.append(f"=== LISTE DES EXIGENCES À COUVRIR ({len(exigences_list)}) ===\n{exigences_block}")
        sections.append(
            "=== DEMANDE ===\n"
            "Génère les Analyses Fonctionnelles Détaillées (AFDs) pour TOUTES les exigences listées.\n"
            "Regroupe les exigences fonctionnellement cohérentes dans une même AFD.\n"
            "Chaque exigence doit figurer dans exactement une AFD.\n"
            "Réponds UNIQUEMENT en JSON selon le format demandé."
        )

        user_message = "\n\n".join(sections)

        return {
            "system": SYSTEM_PROMPTS["afd_from_exigences"],
            "messages": [{"role": "user", "content": user_message}],
            "debug_info": {
                "generation_type": "afd_from_exigences",
                "nb_exigences": len(exigences_list),
                "exigences_block_chars": len(exigences_block),
                "exemples_chars": len(exemples_block),
            },
        }

    def build_judge(
        self,
        cdc_text: str,
        exigences_list: list,
        project_name: str = "",
    ) -> dict:
        """Construit le prompt d'évaluation LLM-as-Judge.

        Args:
            cdc_text:       Texte brut du CdC original (tronqué à 4000 chars)
            exigences_list: Liste de dicts exigences générées
            project_name:   Nom du projet (optionnel)
        """
        exig_lines = []
        for ex in exigences_list:
            ex_id = ex.get("id", "?")
            intitule = ex.get("intitule", "")
            description = ex.get("description", "")
            ex_type = ex.get("type", "Fonctionnelle")
            sol = ex.get("solutionProposee", "")
            exig_lines.append(
                f"- {ex_id} [{ex_type}] : {intitule}\n"
                f"  Description : {description}\n"
                f"  Solution proposée : {sol}"
            )
        exigences_block = "\n".join(exig_lines)

        cdc_block = cdc_text[:4000] if len(cdc_text) > 4000 else cdc_text

        sections = []
        if project_name:
            sections.append(f"=== CONTEXTE ===\nProjet : {project_name}")
        sections.append(f"=== CAHIER DES CHARGES (extrait) ===\n{cdc_block}")
        sections.append(f"=== EXIGENCES GÉNÉRÉES ({len(exigences_list)}) ===\n{exigences_block}")
        sections.append(
            "=== DEMANDE ===\n"
            "Évalue la qualité des exigences générées par rapport au Cahier des Charges.\n"
            "Réponds UNIQUEMENT en JSON selon le format demandé."
        )

        user_message = "\n\n".join(sections)

        return {
            "system": SYSTEM_PROMPTS["judge"],
            "messages": [{"role": "user", "content": user_message}],
            "debug_info": {
                "generation_type": "judge",
                "nb_exigences": len(exigences_list),
                "cdc_chars": len(cdc_block),
            },
        }

    def _build_context_block(self, documents: list) -> str:
        """
        Formate les documents en un bloc texte lisible pour le LLM.
        Tronque si le total dépasse MAX_CONTEXT_CHARS.
        """
        if not documents:
            return "Aucun document pertinent trouvé dans la base de connaissances."

        parts = []
        total_chars = 0

        for i, doc in enumerate(documents, 1):
            source = doc.get("source", "inconnu")
            category = doc.get("category", "?")
            score = doc.get("rerank_score", doc.get("score", 0))
            text = doc.get("text", "").strip()

            header = f"[Document {i}] Source: {source} | Catégorie: {category} | Score: {score}%"
            block = f"{header}\n{text}\n"

            if total_chars + len(block) > MAX_CONTEXT_CHARS:
                # Tronquer le dernier document pour respecter la limite
                remaining = MAX_CONTEXT_CHARS - total_chars - len(header) - 20
                if remaining > 100:
                    block = f"{header}\n{text[:remaining]}...[tronqué]\n"
                    parts.append(block)
                break

            parts.append(block)
            total_chars += len(block)

        return "\n---\n".join(parts)

    def _build_history(self, conversation_history: list) -> list:
        """
        Retourne les MAX_HISTORY_TURNS derniers échanges (user + assistant).
        """
        if not conversation_history:
            return []

        # Prendre les N derniers échanges complets (user + assistant = 2 messages)
        recent = conversation_history[-(MAX_HISTORY_TURNS * 2):]
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in recent
            if msg.get("role") in ("user", "assistant") and msg.get("content")
        ]

    def _build_user_message(self, query: str, context_block: str, guide_block: str = "", project_context: dict = None) -> str:
        """
        Construit le message utilisateur avec sections labellisées.

        [0/4] CONTEXTE PROJET      → métadonnées du projet (nom, client, langue...)
        [1/4] CAHIER DES CHARGES   → chunks issus de la base de connaissances
        [2/4] GUIDE TECHNIQUE      → documentation Smart Factory MOMsoft (si fournie)
        [3/4] DEMANDE              → question de l'utilisateur
        """
        sections = []
        project_context = project_context or {}

        # ── Section 0 : contexte projet (si fourni) ─────────────────────
        if project_context:
            lines = []
            if project_context.get("project_name"):
                lines.append(f"Nom du projet : {project_context['project_name']}")
            if project_context.get("project_id"):
                lines.append(f"Identifiant   : {project_context['project_id']}")
            if project_context.get("client"):
                lines.append(f"Client        : {project_context['client']}")
            if project_context.get("language"):
                lines.append(f"Langue        : {project_context['language']}")
            if project_context.get("product_context"):
                lines.append(f"Produit       : {project_context['product_context']}")
            if lines:
                sections.append("[0/4] CONTEXTE PROJET\n" + "\n".join(lines))

        # ── Section 1 : documents récupérés (CdC, exigences, AFD...) ────
        label = "[1/4]" if project_context else "[1/3]"
        sections.append(f"{label} CAHIER DES CHARGES & EXIGENCES\n{context_block}")

        # ── Section 2 : documentation technique (optionnelle) ───────────
        label2 = "[2/4]" if project_context else "[2/3]"
        if guide_block:
            sections.append(f"{label2} GUIDE SOLUTION (documentation Smart Factory MOMsoft)\n{guide_block}")
        else:
            sections.append(f"{label2} GUIDE SOLUTION\nAucun extrait du guide technique disponible pour cette requête.")

        # ── Section 3 : demande utilisateur ─────────────────────────────
        label3 = "[3/4]" if project_context else "[3/3]"
        sections.append(f"{label3} DEMANDE\n{query}")

        return "\n\n".join(sections)


# ---------------------------------------------------------------------------
# Tests — à lancer avec : python src/generation/prompt_builder.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    print("\n" + "=" * 60)
    print("  TEST 2.3 — PROMPT BUILDER")
    print("=" * 60)

    # Documents simulés (comme si venant du Reranker)
    mock_docs = [
        {
            "text": "L'application doit permettre la saisie et le suivi des non-conformités en temps réel depuis les postes de travail.",
            "source": "Exigences_APEM_V2.xlsx",
            "category": "Exigences",
            "rerank_score": 92.3,
        },
        {
            "text": "Le système doit générer des alertes automatiques lorsqu'un seuil de défaut est dépassé sur la ligne de production.",
            "source": "Exigences_APEM_V2.xlsx",
            "category": "Exigences",
            "rerank_score": 87.1,
        },
        {
            "text": "Cahier des charges : digitalisation du processus qualité - Périmètre : usine APEM, 3 lignes de production.",
            "source": "CDC_Digitalisation.pdf",
            "category": "CdC",
            "rerank_score": 78.5,
        },
    ]

    mock_history = [
        {"role": "user", "content": "Quel est le périmètre du projet APEM ?"},
        {"role": "assistant", "content": "Le projet couvre 3 lignes de production dans l'usine APEM."},
    ]

    all_pass = True

    # ── Test 1 : AFD ───────────────────────────────────────────────────────
    print("\n[Test 1] Type 'afd'")
    builder_afd = PromptBuilder(generation_type="afd")
    prompt_afd = builder_afd.build(
        query="Génère les AFDs pour les exigences liées au suivi qualité",
        documents=mock_docs,
        conversation_history=mock_history,
    )
    assert "system" in prompt_afd
    assert "messages" in prompt_afd
    assert len(prompt_afd["messages"]) >= 1
    assert "CONTEXTE" in prompt_afd["messages"][-1]["content"]
    print(f"  Système: {len(prompt_afd['system'])} chars")
    print(f"  Messages: {len(prompt_afd['messages'])} (dont {prompt_afd['debug_info']['history_turns']} tours d'historique)")
    print(f"  Contexte: {prompt_afd['debug_info']['context_chars']} chars | {prompt_afd['debug_info']['nb_documents_in_context']} docs")
    print("  ✓ PASS")

    # ── Test 2 : Exigences ────────────────────────────────────────────────
    print("\n[Test 2] Type 'exigences'")
    builder_ex = PromptBuilder(generation_type="exigences")
    prompt_ex = builder_ex.build(
        query="Liste toutes les exigences du cahier des charges",
        documents=mock_docs,
    )
    assert "exigences" in prompt_ex["system"].lower()
    print("  ✓ PASS")

    # ── Test 3 : Sans historique ni documents ────────────────────────────
    print("\n[Test 3] Sans documents (contexte vide)")
    builder_g = PromptBuilder(generation_type="generic")
    prompt_g = builder_g.build(query="Résume le projet", documents=[])
    assert "Aucun document" in prompt_g["messages"][-1]["content"]
    print("  ✓ PASS")

    # Sauvegarde
    out_path = "./scripts/test_2_3_prompt_builder_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "status": "PASS",
                "afd_prompt_preview": {
                    "system_excerpt": prompt_afd["system"][:200],
                    "user_message_excerpt": prompt_afd["messages"][-1]["content"][:300],
                    "debug_info": prompt_afd["debug_info"],
                },
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\n✓ TOUS LES TESTS PASSED")
    print(f"Résultats sauvegardés : {out_path}")
