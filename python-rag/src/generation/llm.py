"""
PHASE 2 — ÉTAPE 2.4 : LLM CONNECTOR (Groq + Gemini fallback)
=============================================================
Rôle : Envoyer le prompt au LLM et récupérer la réponse.

Variables d'environnement (.env) :
  LLM_PROVIDER=groq          # ou gemini
  GROQ_API_KEY=gsk_...
  GROQ_MODEL=qwen3-32b
  GOOGLE_API_KEY=AIza...
  GOOGLE_API_KEY_2=AIza...
  GEMINI_MODEL=gemini-2.5-flash
  LLM_MAX_TOKENS=16384
  LLM_TEMPERATURE=0.2
"""

from __future__ import annotations

import json
import os
import re
import time

from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen3-32b").strip()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
GOOGLE_API_KEY_2 = os.getenv("GOOGLE_API_KEY_2", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "16384"))
TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))


class LLMConnector:
    """
    Connecteur LLM multi-provider : Groq (Qwen3-32b) ou Gemini.
    Expose une méthode unique generate(prompt_dict) → dict.
    """

    def __init__(self):
        self._provider = LLM_PROVIDER
        self._gemini_keys: list[str] = [k for k in [GOOGLE_API_KEY, GOOGLE_API_KEY_2] if k]
        self._gemini_key_idx = 0
        self._groq_client = None
        self._init_client()

    def _init_client(self):
        """Initialise le client selon le provider configuré."""
        if self._provider == "groq":
            if not GROQ_API_KEY:
                print("[LLM] GROQ_API_KEY manquante — mode MOCK actif.")
                return
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=GROQ_API_KEY)
                print(f"LLM Groq prêt : {GROQ_MODEL}")
            except ImportError:
                print("[LLM] Package 'groq' non installé. Lance: pip install groq>=0.9.0")
        else:
            if not self._gemini_keys:
                print("[LLM] Aucune GOOGLE_API_KEY configurée — mode MOCK actif.")
                return
            import google.generativeai as genai
            genai.configure(api_key=self._gemini_keys[0])
            print(f"LLM Gemini prêt : {GEMINI_MODEL} ({len(self._gemini_keys)} clé(s))")

    def generate(self, prompt_dict: dict) -> dict:
        """
        Envoie le prompt au LLM et retourne la réponse parsée.

        Args:
            prompt_dict: Dict avec clés 'system', 'messages' (issu de PromptBuilder).

        Returns:
            Dict avec raw_text, parsed_json, provider, model, success.
        """
        system = prompt_dict.get("system", "")
        messages = prompt_dict.get("messages", [])

        if self._provider == "groq":
            if self._groq_client is None:
                return self._mock_response(prompt_dict)
            return self._call_groq(system, messages)
        else:
            if not self._gemini_keys:
                return self._mock_response(prompt_dict)
            return self._call_gemini(system, messages)

    def _call_groq(self, system: str, messages: list) -> dict:
        """Appel à l'API Groq (Qwen3-32b)."""
        groq_messages = [{"role": "system", "content": system}]
        for msg in messages:
            groq_messages.append({"role": msg["role"], "content": msg["content"]})

        try:
            completion = self._groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=groq_messages,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
            )
            raw_text = completion.choices[0].message.content

            usage = {}
            if completion.usage:
                usage = {
                    "input_tokens": completion.usage.prompt_tokens,
                    "output_tokens": completion.usage.completion_tokens,
                }
                print(f"  [Groq] Tokens: in={usage['input_tokens']} out={usage['output_tokens']}")

            return {
                "raw_text": raw_text,
                "parsed_json": self._try_parse_json(raw_text),
                "provider": "groq",
                "model": GROQ_MODEL,
                "success": True,
                "usage": usage,
            }
        except Exception as e:
            print(f"  [Groq] ERREUR: {e}")
            return self._error_response(str(e))

    def _call_gemini(self, system: str, messages: list) -> dict:
        """Appel à l'API Google Gemini avec failover entre clés et retry automatique."""
        import google.generativeai as genai

        full_prompt = f"{system}\n\n"
        for msg in messages:
            role_label = "Utilisateur" if msg["role"] == "user" else "Assistant"
            full_prompt += f"{role_label}: {msg['content']}\n\n"

        max_retries = 2
        last_error = None

        for retry in range(max_retries):
            for attempt in range(len(self._gemini_keys)):
                key_idx = (self._gemini_key_idx + attempt) % len(self._gemini_keys)
                try:
                    genai.configure(api_key=self._gemini_keys[key_idx])
                    model = genai.GenerativeModel(GEMINI_MODEL)

                    response = model.generate_content(
                        full_prompt,
                        generation_config={
                            "max_output_tokens": MAX_TOKENS,
                            "temperature": TEMPERATURE,
                        },
                    )
                    # Extraire uniquement les parts non-thinking (Gemini 2.5 Flash thinking mode)
                    raw_text = ""
                    try:
                        for part in response.candidates[0].content.parts:
                            if not getattr(part, 'thought', False):
                                raw_text += getattr(part, 'text', '')
                        raw_text = raw_text.strip()
                        if not raw_text:
                            raw_text = response.text  # fallback
                    except Exception:
                        raw_text = response.text
                    print(f"  [Gemini] raw_text extrait: {len(raw_text)} chars")

                    # Log token usage si disponible
                    usage = {}
                    if hasattr(response, 'usage_metadata') and response.usage_metadata:
                        um = response.usage_metadata
                        usage = {
                            "input_tokens": getattr(um, 'prompt_token_count', 0),
                            "output_tokens": getattr(um, 'candidates_token_count', 0),
                        }
                        print(f"  [Gemini] Tokens: in={usage.get('input_tokens', '?')} out={usage.get('output_tokens', '?')}")

                    # Basculer sur cette clé pour les prochains appels
                    self._gemini_key_idx = key_idx
                    return {
                        "raw_text": raw_text,
                        "parsed_json": self._try_parse_json(raw_text),
                        "provider": "gemini",
                        "model": GEMINI_MODEL,
                        "success": True,
                        "usage": usage,
                    }
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    err_type = type(e).__name__.lower()
                    print(f"  [Gemini] ERREUR cle {key_idx + 1}: {type(e).__name__}")
                    # Erreurs retryables : quota, timeout, deadline
                    is_retryable = (
                        "quota" in err_str or "429" in err_str or "resource" in err_str
                        or "deadline" in err_str or "timeout" in err_str
                        or "deadline" in err_type or "timeout" in err_type
                    )
                    if is_retryable:
                        print(f"  [Gemini] Cle {key_idx + 1} erreur retryable, bascule...")
                        continue
                    # Erreur non-retryable : pas la peine de reessayer
                    print(f"  [Gemini] ECHEC FINAL (non-retryable): {e}")
                    return self._error_response(str(e))

            # Toutes les clés en quota exceeded — attendre et réessayer
            if retry < max_retries - 1:
                wait = 60 * (retry + 1)
                print(f"  [Gemini] Toutes les cles en quota — attente {wait}s avant retry {retry + 2}/{max_retries}...")
                time.sleep(wait)

        print(f"  [Gemini] ECHEC FINAL apres {max_retries} tentatives: {last_error}")
        return self._error_response(str(last_error))

    def _mock_response(self, prompt_dict: dict) -> dict:
        """Réponse mock pour tester sans clé API."""
        print("  [MOCK] Aucune clé API configurée — réponse simulée")
        mock = {
            "exigences": [
                {
                    "id": "EX-001",
                    "type": "Fonctionnelle",
                    "intitule": "Saisie des non-conformités [MOCK]",
                    "objectifClient": "Permettre la saisie rapide des NC en production",
                    "description": "L'application doit permettre la saisie des non-conformités en temps réel depuis les postes de travail.",
                    "solutionProposee": "Module Qualité MOMsoft Smart Factory",
                    "limitesHypotheses": "Nécessite un accès réseau aux postes de travail",
                }
            ],
            "nb_exigences": 1,
            "resume": "Exigences générées en mode MOCK (sans clé API)",
        }
        return {
            "raw_text": json.dumps(mock, ensure_ascii=False, indent=2),
            "parsed_json": mock,
            "provider": "mock",
            "model": "mock",
            "success": True,
        }

    def _try_parse_json(self, text: str):
        """
        Extrait un JSON valide depuis le texte brut du LLM.
        Gère : blocs <think>, markdown ```, JSON tronqué (max_tokens).
        """
        if not text:
            print("  [JSON Parser] Texte vide")
            return None

        print(f"  [JSON Parser] Longueur raw_text: {len(text)} chars")
        print(f"  [JSON Parser] Début: {text[:150]!r}")
        print(f"  [JSON Parser] Fin:   {text[-150:]!r}")

        # Étape 0 : supprimer les blocs <think>...</think>
        text_clean = re.sub(r"<think>[\s\S]*?</think>", "", text).strip()
        if len(text_clean) != len(text):
            print(f"  [JSON Parser] Après suppression <think>: {len(text_clean)} chars")

        # Cas : <think> sans </think> (réponse tronquée pendant la réflexion)
        if "<think>" in text_clean:
            last_close = text.rfind("</think>")
            if last_close != -1:
                text_clean = text[last_close + 8:].strip()
                print(f"  [JSON Parser] </think> trouvé à pos {last_close}")
            else:
                print(f"  [JSON Parser] <think> sans </think> — réponse tronquée")
                return None

        # Étape 1 : extraire depuis un bloc markdown ```json ... ```
        fence_match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text_clean)
        if fence_match:
            candidate = fence_match.group(1).strip()
            print(f"  [JSON Parser] Fence JSON: {len(candidate)} chars")
            try:
                return json.loads(candidate)
            except (json.JSONDecodeError, ValueError) as e:
                print(f"  [JSON Parser] Fence invalide: {e} — tentative réparation...")
                result = self._repair_truncated_json(candidate)
                if result is not None:
                    return result

        # Étape 2 : localiser { ... } par comptage d'accolades
        debut = text_clean.find('{')
        if debut != -1:
            compteur = 0
            fin = -1
            for i, char in enumerate(text_clean[debut:], debut):
                if char == '{':
                    compteur += 1
                elif char == '}':
                    compteur -= 1
                    if compteur == 0:
                        fin = i + 1
                        break

            if fin != -1:
                candidate = text_clean[debut:fin]
                print(f"  [JSON Parser] Bloc JSON complet: {len(candidate)} chars")
                try:
                    result = json.loads(candidate)
                    print(f"  [JSON Parser] OK via comptage accolades")
                    return result
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"  [JSON Parser] Invalide: {e}")
            else:
                # JSON tronqué (max_tokens atteint) : réparer
                print(f"  [JSON Parser] JSON tronqué — tentative réparation")
                candidate = text_clean[debut:]
                result = self._repair_truncated_json(candidate)
                if result is not None:
                    return result

        # Étape 3 : essai parse direct
        try:
            result = json.loads(text_clean)
            print(f"  [JSON Parser] OK via parse direct")
            return result
        except (json.JSONDecodeError, ValueError):
            print(f"  [JSON Parser] ECHEC — aucun JSON exploitable")
            return None

    def _repair_truncated_json(self, text: str):
        """Tente de réparer un JSON tronqué en fermant les accolades/tableaux manquants."""
        # Stratégie 1 : couper à la dernière exigence complète puis fermer
        last_complete = text.rfind('  }')
        if last_complete > 0:
            # Couper après la dernière } d'objet et fermer le tableau + objet racine
            candidate = text[:last_complete + 3] + '\n  ]\n}'
            try:
                result = json.loads(candidate)
                print(f"  [JSON Parser] OK via réparation (last complete object)")
                return result
            except (json.JSONDecodeError, ValueError):
                pass

        # Stratégie 2 : ajouter les accolades/crochets manquants
        ouvertes_acc = text.count('{') - text.count('}')
        ouverts_cro = text.count('[') - text.count(']')
        if ouvertes_acc > 0 or ouverts_cro > 0:
            repaired = text.rstrip().rstrip(',') + ']' * ouverts_cro + '}' * ouvertes_acc
            try:
                result = json.loads(repaired)
                print(f"  [JSON Parser] OK via ajout accolades manquantes")
                return result
            except (json.JSONDecodeError, ValueError):
                pass

        return None

    def _error_response(self, error_msg: str) -> dict:
        return {
            "raw_text": "",
            "parsed_json": None,
            "provider": "error",
            "model": "",
            "success": False,
            "error": error_msg,
        }


# ---------------------------------------------------------------------------
# Tests — à lancer avec : python src/generation/llm.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  TEST 2.4 — LLM CONNECTOR")
    print("=" * 60)

    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from src.generation.prompt_builder import PromptBuilder

    llm = LLMConnector()

    mock_docs = [
        {
            "text": "Exigence EX-001 : L'application doit permettre la saisie des non-conformités en temps réel.",
            "source": "Exigences_APEM_V2.xlsx",
            "category": "Exigences",
            "rerank_score": 92.0,
        },
        {
            "text": "Exigence EX-002 : Le système doit générer des alertes automatiques à chaque dépassement de seuil.",
            "source": "Exigences_APEM_V2.xlsx",
            "category": "Exigences",
            "rerank_score": 88.0,
        },
    ]

    builder = PromptBuilder(generation_type="exigences")
    prompt = builder.build(
        query="Extrais les exigences liées au suivi qualité de l'usine APEM",
        documents=mock_docs,
    )

    print(f"\nProvider actif : {llm._provider}")
    print(f"Cles Gemini    : {len(llm._gemini_keys)}")
    print("Envoi du prompt au LLM...")
    result = llm.generate(prompt)

    print(f"\n  Provider utilise : {result['provider']}")
    print(f"  Modele           : {result['model']}")
    print(f"  Succes           : {result['success']}")
    print(f"  JSON parse       : {'Oui' if result['parsed_json'] else 'Non (texte brut)'}")

    if result["parsed_json"]:
        nb = len(result["parsed_json"].get("exigences", []))
        print(f"  Nb exigences     : {nb}")

    print(f"\n  Extrait reponse :\n  {result['raw_text'][:300]}...")

    # Sauvegarde
    out_path = "./scripts/test_2_4_llm_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nResultats sauvegardes : {out_path}")
    print(f"{'[PASS] TEST PASSED' if result['success'] else '[FAIL] TEST FAILED'}")
