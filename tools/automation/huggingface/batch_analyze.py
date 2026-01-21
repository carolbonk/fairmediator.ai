"""
Batch Analysis Script using FREE Hugging Face
Analyzes all mediators in database for ideology and affiliations
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from affiliation_detector import AffiliationDetector
from ideology_classifier import IdeologyClassifier

load_dotenv()

class BatchAnalyzer:
    def __init__(self):
        # Connect to MongoDB
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/fairmediator')
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database()
        self.mediators = self.db.mediators
        
        # Initialize FREE AI services
        self.ideology_classifier = IdeologyClassifier()
        self.affiliation_detector = AffiliationDetector()
    
    def analyze_all_mediators(self):
        """Analyze all mediators using FREE Hugging Face"""
        print("=" * 60)
        print("FairMediator Batch Analysis (100% FREE)")
        print("=" * 60)
        
        # Get all mediators
        mediators = list(self.mediators.find())
        total = len(mediators)
        
        print(f"\nFound {total} mediators to analyze")
        print("\nAnalyzing ideologies...\n")
        
        # Classify ideologies
        for i, mediator in enumerate(mediators, 1):
            try:
                print(f"[{i}/{total}] Analyzing {mediator.get('name')}...")
                
                analysis = self.ideology_classifier.analyze_mediator(mediator)
                
                # Update database
                self.mediators.update_one(
                    {'_id': mediator['_id']},
                    {
                        '$set': {
                            'ideology.leaning': analysis['ideology'],
                            'ideology.score': analysis['score'],
                            'ideology.confidence': analysis['confidence'],
                            'ideology.reasoning': analysis['reasoning'],
                            'ideology.lastAnalyzed': analysis.get('timestamp')
                        }
                    }
                )
                
                print(f"   → Ideology: {analysis['ideology']} (score: {analysis['score']}, confidence: {analysis['confidence']}%)")
                print(f"   → Method: {analysis.get('method', 'unknown')}")
                
            except Exception as e:
                print(f"   ✗ Error: {e}")
        
        print("\n" + "=" * 60)
        print("Analysis complete!")
        print("=" * 60)
    
    def test_affiliation_detection(self):
        """Test affiliation detection with sample case"""
        print("\n" + "=" * 60)
        print("Testing Affiliation Detection (FREE)")
        print("=" * 60)
        
        # Get first mediator
        mediator = self.mediators.find_one()
        if not mediator:
            print("No mediators found in database")
            return
        
        # Test with sample parties
        test_parties = ['ACME Corporation', 'Tech Startup Inc', 'Global Industries']
        
        print(f"\nTesting mediator: {mediator.get('name')}")
        print(f"Against parties: {', '.join(test_parties)}\n")
        
        result = self.affiliation_detector.detect_conflicts(mediator, test_parties)
        
        print("Result:")
        print(f"  Has Conflict: {result['has_conflict']}")
        print(f"  Risk Level: {result['risk_level']}")
        print(f"  Method: {result['method']}")
        
        if result.get('conflicts'):
            print(f"  Conflicts Found: {len(result['conflicts'])}")
            for conflict in result['conflicts']:
                print(f"    - {conflict}")
        
        print("\n" + "=" * 60)
    
    def generate_report(self):
        """Generate summary report"""
        print("\n" + "=" * 60)
        print("FairMediator Analysis Report")
        print("=" * 60)
        
        # Count by ideology
        liberal = self.mediators.count_documents({'ideology.leaning': 'liberal'})
        conservative = self.mediators.count_documents({'ideology.leaning': 'conservative'})
        neutral = self.mediators.count_documents({'ideology.leaning': 'neutral'})
        unknown = self.mediators.count_documents({'ideology.leaning': {'$exists': False}})
        
        total = liberal + conservative + neutral + unknown
        
        print(f"\nTotal Mediators: {total}")
        print(f"\nIdeology Distribution:")
        print(f"  Liberal:       {liberal:3d} ({liberal/total*100:5.1f}%)")
        print(f"  Conservative:  {conservative:3d} ({conservative/total*100:5.1f}%)")
        print(f"  Neutral:       {neutral:3d} ({neutral/total*100:5.1f}%)")
        print(f"  Unknown:       {unknown:3d} ({unknown/total*100:5.1f}%)")
        
        # Average confidence
        pipeline = [
            {'$match': {'ideology.confidence': {'$exists': True}}},
            {'$group': {'_id': None, 'avgConfidence': {'$avg': '$ideology.confidence'}}}
        ]
        result = list(self.mediators.aggregate(pipeline))
        if result:
            print(f"\nAverage Confidence: {result[0]['avgConfidence']:.1f}%")
        
        print("\n" + "=" * 60)

def main():
    analyzer = BatchAnalyzer()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'analyze':
            analyzer.analyze_all_mediators()
        elif command == 'test':
            analyzer.test_affiliation_detection()
        elif command == 'report':
            analyzer.generate_report()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python batch_analyze.py [analyze|test|report]")
    else:
        # Run all by default
        analyzer.analyze_all_mediators()
        analyzer.test_affiliation_detection()
        analyzer.generate_report()

if __name__ == "__main__":
    main()
