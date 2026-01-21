"""
Affiliation Detector using FREE Hugging Face Inference API
100% free - no credit card required

Get your FREE API key: https://huggingface.co/settings/tokens
"""

import os
import requests
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

class AffiliationDetector:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not self.api_key:
            print("Warning: HUGGINGFACE_API_KEY not set. Get your FREE key at: https://huggingface.co/settings/tokens")
        
        self.base_url = "https://api-inference.huggingface.co/models"
        # Free model for text analysis
        self.model = "meta-llama/Meta-Llama-3-8B-Instruct"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def call_api(self, prompt: str, max_retries: int = 3) -> str:
        """Call Hugging Face API with retry logic for model loading"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.3,
                "top_p": 0.95,
                "return_full_text": False
            },
            "options": {
                "wait_for_model": True,
                "use_cache": False
            }
        }
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    f"{self.base_url}/{self.model}",
                    headers=self.headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 503:
                    print(f"Model loading... Retry {attempt + 1}/{max_retries}")
                    import time
                    time.sleep(2)
                    continue
                
                response.raise_for_status()
                
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get('generated_text', '')
                elif isinstance(result, dict):
                    return result.get('generated_text', '')
                
                return str(result)
            
            except requests.exceptions.RequestException as e:
                print(f"API error: {e}")
                if attempt == max_retries - 1:
                    raise
        
        return ""
    
    def detect_conflicts(self, mediator_info: Dict, case_parties: List[str]) -> Dict:
        """
        Detect potential conflicts of interest (FREE)
        
        Args:
            mediator_info: Dictionary with mediator details
            case_parties: List of party names in the case
        
        Returns:
            Dictionary with conflict analysis
        """
        if not self.api_key:
            return self._fallback_detection(mediator_info, case_parties)
        
        affiliations_str = ", ".join(mediator_info.get('affiliations', []))
        parties_str = ", ".join(case_parties)
        
        prompt = f"""Analyze for conflicts of interest:

Mediator: {mediator_info.get('name', 'Unknown')}
Affiliations: {affiliations_str}

Case Parties: {parties_str}

Identify any conflicts. Respond in this format:
CONFLICTS: [Yes/No]
DETAILS: [Brief description]
RISK: [Low/Medium/High]
"""
        
        try:
            response = self.call_api(prompt)
            return self._parse_conflict_response(response)
        except Exception as e:
            print(f"Error detecting conflicts: {e}")
            return self._fallback_detection(mediator_info, case_parties)
    
    def _parse_conflict_response(self, response: str) -> Dict:
        """Parse AI response into structured format"""
        has_conflict = 'yes' in response.lower() and 'conflicts: yes' in response.lower()
        
        # Extract risk level
        risk = 'low'
        if 'risk: high' in response.lower():
            risk = 'high'
        elif 'risk: medium' in response.lower():
            risk = 'medium'
        
        return {
            'has_conflict': has_conflict,
            'risk_level': risk,
            'analysis': response,
            'method': 'huggingface_ai'
        }
    
    def _fallback_detection(self, mediator_info: Dict, case_parties: List[str]) -> Dict:
        """Fallback to simple string matching if API unavailable"""
        conflicts = []
        affiliations = mediator_info.get('affiliations', [])
        
        for party in case_parties:
            for affiliation in affiliations:
                if party.lower() in affiliation.lower() or affiliation.lower() in party.lower():
                    conflicts.append({
                        'party': party,
                        'affiliation': affiliation,
                        'type': 'name_match'
                    })
        
        return {
            'has_conflict': len(conflicts) > 0,
            'conflicts': conflicts,
            'risk_level': 'medium' if conflicts else 'low',
            'method': 'fallback_string_match'
        }
    
    def batch_analyze(self, mediators: List[Dict], case_parties: List[str]) -> List[Dict]:
        """Analyze multiple mediators for conflicts"""
        results = []
        
        for mediator in mediators:
            try:
                analysis = self.detect_conflicts(mediator, case_parties)
                results.append({
                    'mediator_id': mediator.get('_id'),
                    'mediator_name': mediator.get('name'),
                    **analysis
                })
            except Exception as e:
                print(f"Error analyzing {mediator.get('name')}: {e}")
                results.append({
                    'mediator_id': mediator.get('_id'),
                    'mediator_name': mediator.get('name'),
                    'error': str(e),
                    'has_conflict': False,
                    'risk_level': 'unknown'
                })
        
        return results

if __name__ == "__main__":
    # Example usage
    detector = AffiliationDetector()
    
    # Test case
    mediator = {
        '_id': 'test123',
        'name': 'John Smith',
        'affiliations': ['ACME Corporation', 'Tech Industry Association']
    }
    
    parties = ['ACME Corporation', 'Widget Company']
    
    result = detector.detect_conflicts(mediator, parties)
    print("Conflict Detection Result:")
    print(result)
