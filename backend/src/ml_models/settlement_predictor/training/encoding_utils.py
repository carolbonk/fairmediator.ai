"""
Shared deterministic encoders for settlement prediction.

These MUST be used identically at training time (clean_data.py) and at
inference time (feature_engineering.create_prediction_input).  Python's
built-in `hash()` is randomized per process (PYTHONHASHSEED), so using it
in either place yields encodings that change every run and never line up
between training and serving.
"""

import hashlib

JURISDICTION_BUCKETS = 50


def encode_jurisdiction(jurisdiction: str) -> int:
    """
    Deterministic jurisdiction encoder.

    Returns the same bucket for the same string across processes, runs,
    and Python versions.  Both the cleaner and the prediction-input
    builder must call this so a retrained model and a live request see
    the same code for "Southern District of New York".
    """
    if jurisdiction is None:
        jurisdiction = "Unknown"
    digest = hashlib.md5(str(jurisdiction).encode("utf-8")).hexdigest()
    return int(digest, 16) % JURISDICTION_BUCKETS
