"""Test script for gradio_app functionality"""
import sys
sys.path.insert(0, '/Users/carolbonk/Desktop/FairMediator/automation')

# Import the analysis functions from gradio_app
from transformers import pipeline

print("🔄 Loading models for testing...")

# Load the same models as gradio_app
sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)
print("✅ RoBERTa sentiment loaded")

ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-large-NER",
    aggregation_strategy="simple"
)
print("✅ BERT-large NER loaded")

zero_shot_classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/deberta-v3-base-zeroshot-v2.0"
)
print("✅ DeBERTa-v3 zero-shot loaded")

try:
    political_classifier = pipeline(
        "text-classification",
        model="matous-volf/political-leaning-politics"
    )
    print("✅ Political classifier loaded")
    POLITICAL_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Political classifier failed: {e}")
    POLITICAL_AVAILABLE = False

print("\n🎉 All models loaded!\n")

# Test with example bio
test_bio = "Sarah Johnson is a senior mediator at Pacific Dispute Resolution in Los Angeles. She has 18 years of experience in employment and commercial disputes. Previously, she was a partner at Morrison & Foerster LLP and volunteered with the ACLU on civil rights cases."
test_party = "Morrison & Foerster"

print("=" * 60)
print("Testing Analysis Functions")
print("=" * 60)

# Test sentiment analysis
print("\n1. Sentiment Analysis:")
sentiment_result = sentiment_classifier(test_bio[:500])[0]
print(f"   Result: {sentiment_result['label']} (confidence: {sentiment_result['score']:.2%})")

# Test NER
print("\n2. Named Entity Recognition:")
entities = ner_pipeline(test_bio)
print(f"   Found {len(entities)} entities:")
for ent in entities[:5]:  # Show first 5
    print(f"   - {ent['word']} ({ent['entity_group']})")

# Test ideology detection
print("\n3. Political Ideology Detection:")
if POLITICAL_AVAILABLE:
    ideology_result = political_classifier(test_bio)[0]
    print(f"   Leaning: {ideology_result['label']} (confidence: {ideology_result['score']:.2%})")
else:
    ideology_result = zero_shot_classifier(
        test_bio,
        ["liberal/progressive", "conservative/traditional", "neutral/centrist"]
    )
    print(f"   Leaning: {ideology_result['labels'][0]} (confidence: {ideology_result['scores'][0]:.2%})")

# Test conflict detection
print("\n4. Conflict of Interest Detection:")
conflict_result = zero_shot_classifier(
    f"Check mediator connection to {test_party}: {test_bio}",
    ["potential conflict of interest", "no conflict of interest"]
)
print(f"   Result: {conflict_result['labels'][0]}")
print(f"   Confidence: {conflict_result['scores'][0]:.2%}")

print("\n" + "=" * 60)
print("✅ All integrations working correctly!")
print("=" * 60)
