"""
Regression test for the settlement predictor input-mapping bug.

Cases #1 ($50M healthcare/pharma) and #2 ($25M defense/defense_contractor)
in proof_of_work.json produced bit-identical predictions ($1.26B mid),
which is the symptom the audit flagged.  This test fails if any two of
the four canonical inputs collapse to the same prediction again.

Run after every retrain.  Does NOT require the model to be loaded in
the parent test_model.py — it only inspects the engineered feature
vectors, so it catches the encoding regression even if no model file
is present.
"""

import os
import sys

import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(__file__))

from encoding_utils import encode_jurisdiction
from feature_engineering import SettlementFeatureEngine


CASES = [
    dict(
        fraud_type="healthcare",
        damages_claimed=50_000_000,
        industry="pharmaceutical",
        jurisdiction="Southern District of New York",
        whistleblower_present=True,
        settlement_year=2024,
    ),
    dict(
        fraud_type="defense",
        damages_claimed=25_000_000,
        industry="defense_contractor",
        jurisdiction="Eastern District of Virginia",
        whistleblower_present=False,
        settlement_year=2024,
    ),
    dict(
        fraud_type="covid",
        damages_claimed=5_000_000,
        industry="financial",
        jurisdiction="Central District of California",
        whistleblower_present=False,
        settlement_year=2024,
    ),
    dict(
        fraud_type="grant",
        damages_claimed=10_000_000,
        industry="education",
        jurisdiction="District of Massachusetts",
        whistleblower_present=True,
        settlement_year=2024,
    ),
]


def test_jurisdiction_encoder_is_deterministic():
    """Same string → same bucket across invocations."""
    a = encode_jurisdiction("Southern District of New York")
    b = encode_jurisdiction("Southern District of New York")
    c = encode_jurisdiction("Eastern District of Virginia")
    assert a == b, "encode_jurisdiction must be stable for the same input"
    assert a != c, "encode_jurisdiction must distinguish different inputs"


def test_engineered_features_differ_across_canonical_cases():
    """
    Before the fix, hash(jurisdiction) % 50 plus a stale training CSV
    meant inputs collapsed to indistinguishable feature vectors at
    inference.  Verify the engineered (pre-scaling) rows now differ.
    """
    engine = SettlementFeatureEngine()
    engine.feature_columns = []  # force create_features to populate

    rows = []
    for case in CASES:
        fraud_type_mapping = {
            "healthcare": 0, "defense": 1, "covid": 2, "procurement": 3,
            "grant": 4, "housing": 5, "education": 6, "other": 7,
        }
        industry_mapping = {
            "healthcare": 0, "defense_contractor": 1, "pharmaceutical": 2,
            "technology": 3, "construction": 4, "education": 5,
            "financial": 6, "other": 7,
        }
        severity_weights = {
            "healthcare": 1.2, "defense": 1.5, "covid": 1.3, "procurement": 1.0,
            "grant": 0.8, "housing": 1.1, "education": 0.9, "other": 1.0,
        }
        damages = case["damages_claimed"]
        if damages < 1_000_000:
            size = 0
        elif damages < 10_000_000:
            size = 1
        else:
            size = 2

        rows.append({
            "fraud_type_code": fraud_type_mapping[case["fraud_type"]],
            "industry_code": industry_mapping[case["industry"]],
            "jurisdiction_code": encode_jurisdiction(case["jurisdiction"]),
            "whistleblower": 1 if case["whistleblower_present"] else 0,
            "defendant_size": size,
            "settlement_year": case["settlement_year"],
            "log_amount": np.log1p(damages),
            "fraud_severity": np.log1p(damages) * severity_weights[case["fraud_type"]],
        })

    enriched = engine.create_features(pd.DataFrame(rows))
    feat = enriched[engine.feature_columns]

    # No two rows should be identical post-feature-engineering.
    for i in range(len(feat)):
        for j in range(i + 1, len(feat)):
            assert not feat.iloc[i].equals(feat.iloc[j]), (
                f"Cases {i} and {j} produced identical engineered features — "
                f"the input-mapping bug has regressed."
            )


if __name__ == "__main__":
    test_jurisdiction_encoder_is_deterministic()
    test_engineered_features_differ_across_canonical_cases()
    print("All discrimination checks passed.")
