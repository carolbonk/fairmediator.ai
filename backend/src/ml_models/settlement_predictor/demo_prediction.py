#!/usr/bin/env python3
"""
Quick demo script - Make a custom prediction
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'training'))
from train_model import SettlementPredictor

# Load model
predictor = SettlementPredictor()
model_dir = os.path.join(os.path.dirname(__file__), 'models')
predictor.load_model(
    f"{model_dir}/settlement_model_20260206_172536.joblib",
    f"{model_dir}/feature_scaler_20260206_172536.joblib"
)

# Make a custom prediction
print("\n" + "="*60)
print("🎯 CUSTOM PREDICTION - YOUR CASE")
print("="*60)
print("\nInput:")
print("  Fraud Type:       healthcare")
print("  Damages Claimed:  $100,000,000  ← Custom amount!")
print("  Industry:         pharmaceutical")
print("  Jurisdiction:     Central District of California")
print("  Whistleblower:    Yes")
print("  Year:             2024")
print()

prediction = predictor.predict_settlement_range(
    fraud_type='healthcare',
    damages_claimed=100_000_000,  # $100M - different from test cases
    industry='pharmaceutical',
    jurisdiction='Central District of California',
    whistleblower_present=True,
    settlement_year=2024
)

print("Predicted Settlement Range:")
print(f"  Low  (25th %):  ${prediction['predicted_low']:,.0f}")
print(f"  Mid  (50th %):  ${prediction['predicted_mid']:,.0f}")
print(f"  High (75th %):  ${prediction['predicted_high']:,.0f}")
print(f"  Confidence:     {prediction['confidence']:.0%}")
print("\n" + "="*60)
print("✅ Model dynamically calculated this prediction!")
print("   (Not hardcoded - try changing the values above)")
print("="*60 + "\n")
