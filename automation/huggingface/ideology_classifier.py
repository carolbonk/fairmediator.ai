"""
Ideology Classifier using FREE Hugging Face models
Analyzes political leanings without any paid services
"""

import os
import requests
import json
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

class IdeologyClassifier:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not self.api_key:
            print("Warning: HUGGINGFACE_API_KEY not set. Get FREE at: https://huggingface.co/settings/tokens")
        
        self.base_url = "https://api-inference.huggingface.co/models"
        # Free models for classification
        self.model = "meta-llama/Meta-Llama-3-8B-Instruct"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Keyword-based fallback
        self.liberal_keywords = [
            'progressive', 'equality', 'social justice', 'regulation',
            'welfare', 'rights', 'diversity', 'inclusion', 'climate',
            'healthcare', 'education', 'labor union'
        ]
        
        self.conservative_keywords = [
            'traditional', 'free market', 'individual responsibility',
            'limited government', 'conservative', 'liberty', 'freedom',
            'deregulation', 'privatization', 'family values'
        ]
    
    def call_api(self, prompt: str) -> str:
        """Call Hugging Face API"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 300,
                "temperature": 0.3,
                "top_p": 0.9,
                "return_full_text": False
            },
            "options": {
                "wait_for_model": True
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/{self.model}",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('generated_text', '')
            elif isinstance(result, dict):
                return result.get('generated_text', '')
            
            return str(result)
        except Exception as e:
            print(f"API error: {e}")
            raise
    
    def classify_ideology(self, text: str, context: str = '') -> Dict:
        """
        Classify political ideology from text (FREE)
        
        Returns:
            Dictionary with leaning, score, and reasoning
        """
        if not self.api_key:
            return self._keyword_based_classification(text)
        
        prompt = f"""Analyze the political ideology of this text. Classify as liberal, conservative, or neutral.

Context: {context}
Text: {text}

Respond in this format:
IDEOLOGY: [Liberal/Conservative/Neutral]
SCORE: [0-100, where 0=very liberal, 50=neutral, 100=very conservative]
REASONING: [Brief explanation]
"""
        
        try:
            response = self.call_api(prompt)
            return self._parse_ideology_response(response)
        except Exception as e:
            print(f"Error classifying ideology: {e}")
            return self._keyword_based_classification(text)
    
    def _parse_ideology_response(self, response: str) -> Dict:
        """Parse AI response"""
        ideology = 'neutral'
        score = 50
        reasoning = response
        
        response_lower = response.lower()
        
        if 'liberal' in response_lower and 'ideology: liberal' in response_lower:
            ideology = 'liberal'
            score = 25
        elif 'conservative' in response_lower and 'ideology: conservative' in response_lower:
            ideology = 'conservative'
            score = 75
        
        # Try to extract score
        import re
        score_match = re.search(r'score:\s*(\d+)', response_lower)
        if score_match:
            score = int(score_match.group(1))
        
        # Try to extract reasoning
        reasoning_match = re.search(r'reasoning:\s*(.+?)(?:\n|$)', response, re.IGNORECASE | re.DOTALL)
        if reasoning_match:
            reasoning = reasoning_match.group(1).strip()
        
        return {
            'ideology': ideology,
            'score': score,
            'confidence': abs(score - 50) * 2,  # 0-100 scale
            'reasoning': reasoning,
            'method': 'huggingface_ai'
        }
    
    def _keyword_based_classification(self, text: str) -> Dict:
        """Fallback keyword-based classification (completely free, no API needed)"""
        text_lower = text.lower()
        
        liberal_count = sum(1 for keyword in self.liberal_keywords if keyword in text_lower)
        conservative_count = sum(1 for keyword in self.conservative_keywords if keyword in text_lower)
        
        total = liberal_count + conservative_count
        
        if total == 0:
            return {
                'ideology': 'neutral',
                'score': 50,
                'confidence': 0,
                'reasoning': 'No ideological keywords found',
                'method': 'keyword_fallback'
            }
        
        # Calculate score
        if liberal_count > conservative_count:
            ideology = 'liberal'
            score = max(0, 50 - (liberal_count - conservative_count) * 10)
        elif conservative_count > liberal_count:
            ideology = 'conservative'
            score = min(100, 50 + (conservative_count - liberal_count) * 10)
        else:
            ideology = 'neutral'
            score = 50
        
        return {
            'ideology': ideology,
            'score': score,
            'confidence': min(100, abs(liberal_count - conservative_count) * 20),
            'reasoning': f'Found {liberal_count} liberal keywords, {conservative_count} conservative keywords',
            'keywords_found': {
                'liberal': liberal_count,
                'conservative': conservative_count
            },
            'method': 'keyword_fallback'
        }
    
    def analyze_mediator(self, mediator_data: Dict) -> Dict:
        """Analyze full mediator profile"""
        # Combine all text fields
        text_parts = []
        
        if mediator_data.get('bio'):
            text_parts.append(mediator_data['bio'])
        
        if mediator_data.get('expertise'):
            text_parts.append(' '.join(mediator_data['expertise']))
        
        if mediator_data.get('affiliations'):
            text_parts.append(' '.join(mediator_data['affiliations']))
        
        combined_text = ' '.join(text_parts)
        
        if not combined_text.strip():
            return {
                'ideology': 'neutral',
                'score': 50,
                'confidence': 0,
                'reasoning': 'Insufficient data',
                'method': 'no_data'
            }
        
        result = self.classify_ideology(combined_text, context=f"Mediator: {mediator_data.get('name')}")
        result['mediator_id'] = mediator_data.get('_id')
        result['mediator_name'] = mediator_data.get('name')
        
        return result
    
    def batch_classify(self, mediators: List[Dict]) -> List[Dict]:
        """Classify ideology for multiple mediators"""
        results = []
        
        for mediator in mediators:
            try:
                analysis = self.analyze_mediator(mediator)
                results.append(analysis)
            except Exception as e:
                print(f"Error analyzing {mediator.get('name')}: {e}")
                results.append({
                    'mediator_id': mediator.get('_id'),
                    'mediator_name': mediator.get('name'),
                    'error': str(e),
                    'ideology': 'unknown'
                })
        
        return results

if __name__ == "__main__":
    # Example usage
    classifier = IdeologyClassifier()
    
    # Test case
    text = """
    I believe in social justice, equality for all, and strong government regulation
    to protect workers and the environment. Healthcare and education should be
    accessible to everyone.
    """
    
    result = classifier.classify_ideology(text)
    print("Ideology Classification Result:")
    print(json.dumps(result, indent=2))
