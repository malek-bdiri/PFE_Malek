import os, sys
sys.path.insert(0, '.')
os.environ['LLM_PROVIDER'] = 'groq'
os.environ['GROQ_API_KEY'] = os.getenv('GROQ_API_KEY', '')
os.environ['GROQ_MODEL'] = 'qwen/qwen3-32b'
os.environ['LLM_MAX_TOKENS'] = '1500'

from src.generation.llm import LLMConnector
llm = LLMConnector()

# Simule un prompt de taille proche du RAG réel
context = "A" * 10000  # ~2500 tokens de contexte
system = "Tu es un expert en exigences logicielles industrielles. Réponds en JSON."
user_msg = f"Voici un cahier des charges:\n\n{'B' * 5000}\n\nContexte RAG:\n{context}\n\nGénère 3 exigences en JSON."

result = llm.generate({'system': system, 'messages': [{'role': 'user', 'content': user_msg}]})
print('Provider:', result['provider'])
print('Success:', result['success'])
if result.get('error'):
    print('Erreur:', result['error'])
else:
    print('Reponse (200 chars):', result['raw_text'][:200])

