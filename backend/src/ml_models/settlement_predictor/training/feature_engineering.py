"""
Feature Engineering for Settlement Prediction

Creates features for ML model training from cleaned FCA settlement data.
"""

import pandas as pd
import numpy as np
from typing import Tuple, List
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SettlementFeatureEngine:
    """Feature engineering for settlement prediction"""

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []

    def create_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Create all features for training

        Features created:
        1. fraud_type_code - Categorical fraud type (0-7)
        2. log_amount - Log-transformed amount (for distribution normalization)
        3. industry_code - Industry classification (0-7)
        4. jurisdiction_code - Court jurisdiction
        5. defendant_size - Estimated company size (0=small, 1=medium, 2=large)
        6. whistleblower - Binary indicator (0/1)
        7. settlement_year - Year of settlement (for temporal trends)
        8. fraud_severity - Composite severity score
        9. industry_fraud_interaction - Interaction term
        10. years_since_2010 - Time trend feature
        """
        logger.info("Creating features for ML training...")

        features = data.copy()

        # Ensure all base features exist
        required_features = [
            'fraud_type_code', 'industry_code', 'jurisdiction_code',
            'whistleblower', 'defendant_size', 'log_amount',
            'settlement_year', 'fraud_severity'
        ]

        missing = [f for f in required_features if f not in features.columns]
        if missing:
            raise ValueError(f"Missing required features: {missing}")

        # Create interaction features
        features['industry_fraud_interaction'] = (
            features['industry_code'] * features['fraud_type_code']
        )

        # Time trend feature (years since baseline)
        features['years_since_2010'] = features['settlement_year'] - 2010

        # Whistleblower + fraud type interaction (whistleblowers more common in certain types)
        features['whistleblower_fraud_interaction'] = (
            features['whistleblower'] * features['fraud_type_code']
        )

        # Jurisdiction risk score (some jurisdictions have historically higher settlements)
        # This would ideally be learned from data, but we'll use a simple heuristic
        features['jurisdiction_risk'] = features['jurisdiction_code'] % 3  # Simplified

        # Defendant size + fraud type interaction
        features['size_fraud_interaction'] = (
            features['defendant_size'] * features['fraud_type_code']
        )

        # Store feature columns for later use
        self.feature_columns = [
            'fraud_type_code',
            'industry_code',
            'jurisdiction_code',
            'whistleblower',
            'defendant_size',
            'settlement_year',
            'fraud_severity',
            'industry_fraud_interaction',
            'years_since_2010',
            'whistleblower_fraud_interaction',
            'jurisdiction_risk',
            'size_fraud_interaction'
        ]

        logger.info(f"Created {len(self.feature_columns)} features")
        return features

    def prepare_training_data(
        self,
        data: pd.DataFrame,
        target_column: str = 'log_amount'
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features and target for training

        Args:
            data: DataFrame with features
            target_column: Name of target variable

        Returns:
            X: Feature matrix
            y: Target vector
        """
        logger.info("Preparing training data...")

        # Create features if not already done
        if not self.feature_columns:
            data = self.create_features(data)

        # Extract feature matrix
        X = data[self.feature_columns].copy()

        # Extract target
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found in data")

        y = data[target_column].copy()

        # Handle missing values
        X = X.fillna(X.median())

        # Normalize features
        X_scaled = pd.DataFrame(
            self.scaler.fit_transform(X),
            columns=self.feature_columns,
            index=X.index
        )

        logger.info(f"Training data prepared: X shape {X_scaled.shape}, y shape {y.shape}")

        return X_scaled, y

    def transform_new_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Transform new data using fitted scaler

        Args:
            data: New data to transform

        Returns:
            Transformed features
        """
        # Create features
        data = self.create_features(data)

        # Extract features
        X = data[self.feature_columns].copy()

        # Handle missing values
        X = X.fillna(X.median())

        # Scale using fitted scaler
        X_scaled = pd.DataFrame(
            self.scaler.transform(X),
            columns=self.feature_columns,
            index=X.index
        )

        return X_scaled

    def get_feature_importance_names(self) -> List[str]:
        """Get human-readable feature names for importance plots"""
        name_mapping = {
            'fraud_type_code': 'Fraud Type',
            'industry_code': 'Industry',
            'jurisdiction_code': 'Jurisdiction',
            'whistleblower': 'Whistleblower Present',
            'defendant_size': 'Defendant Size',
            'settlement_year': 'Settlement Year',
            'fraud_severity': 'Fraud Severity Score',
            'industry_fraud_interaction': 'Industry × Fraud Type',
            'years_since_2010': 'Years Since 2010',
            'whistleblower_fraud_interaction': 'Whistleblower × Fraud Type',
            'jurisdiction_risk': 'Jurisdiction Risk',
            'size_fraud_interaction': 'Defendant Size × Fraud Type'
        }

        return [name_mapping.get(col, col) for col in self.feature_columns]

    def create_prediction_input(
        self,
        fraud_type: str,
        damages_claimed: float,
        industry: str,
        jurisdiction: str,
        whistleblower_present: bool = False,
        settlement_year: int = 2024
    ) -> pd.DataFrame:
        """
        Create feature input for prediction from raw parameters

        Args:
            fraud_type: Type of fraud (healthcare, defense, etc.)
            damages_claimed: Claimed damages amount
            industry: Industry code
            jurisdiction: Court jurisdiction
            whistleblower_present: Whether whistleblower is involved
            settlement_year: Year of settlement

        Returns:
            DataFrame with features ready for prediction
        """
        # Map categorical inputs to codes
        fraud_type_mapping = {
            'healthcare': 0, 'defense': 1, 'covid': 2, 'procurement': 3,
            'grant': 4, 'housing': 5, 'education': 6, 'other': 7
        }

        industry_mapping = {
            'healthcare': 0, 'defense_contractor': 1, 'pharmaceutical': 2,
            'technology': 3, 'construction': 4, 'education': 5,
            'financial': 6, 'other': 7
        }

        # Estimate defendant size from damages claimed
        if damages_claimed < 1_000_000:
            defendant_size = 0  # small
        elif damages_claimed < 10_000_000:
            defendant_size = 1  # medium
        else:
            defendant_size = 2  # large

        # Create base features
        data = pd.DataFrame([{
            'fraud_type_code': fraud_type_mapping.get(fraud_type.lower(), 7),
            'industry_code': industry_mapping.get(industry.lower(), 7),
            'jurisdiction_code': hash(jurisdiction) % 50,  # Simple hash for jurisdiction
            'whistleblower': 1 if whistleblower_present else 0,
            'defendant_size': defendant_size,
            'settlement_year': settlement_year,
            'log_amount': np.log1p(damages_claimed),  # Not used for prediction, just for feature engineering
        }])

        # Calculate fraud severity
        severity_weights = {
            'healthcare': 1.2, 'defense': 1.5, 'covid': 1.3, 'procurement': 1.0,
            'grant': 0.8, 'housing': 1.1, 'education': 0.9, 'other': 1.0
        }
        weight = severity_weights.get(fraud_type.lower(), 1.0)
        data['fraud_severity'] = np.log1p(damages_claimed) * weight

        # Create derived features
        data = self.create_features(data)

        # Transform using scaler
        X = self.transform_new_data(data)

        return X

    def save_scaler(self, filepath: str):
        """Save fitted scaler to file"""
        import joblib
        joblib.dump({
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }, filepath)
        logger.info(f"Saved scaler to {filepath}")

    def load_scaler(self, filepath: str):
        """Load fitted scaler from file"""
        import joblib
        data = joblib.load(filepath)
        self.scaler = data['scaler']
        self.feature_columns = data['feature_columns']
        logger.info(f"Loaded scaler from {filepath}")


if __name__ == "__main__":
    # Example usage
    logger.info("Testing feature engineering...")

    # Load cleaned data
    data = pd.read_csv('backend/src/ml_models/settlement_predictor/data/fca_settlements_clean.csv')

    # Initialize feature engine
    feature_engine = SettlementFeatureEngine()

    # Prepare training data
    X, y = feature_engine.prepare_training_data(data)

    print(f"\nFeature matrix shape: {X.shape}")
    print(f"Target vector shape: {y.shape}")
    print(f"\nFeatures:\n{feature_engine.feature_columns}")
    print(f"\nFeature statistics:\n{X.describe()}")

    # Test prediction input creation
    test_input = feature_engine.create_prediction_input(
        fraud_type='healthcare',
        damages_claimed=5_000_000,
        industry='pharmaceutical',
        jurisdiction='Southern District of New York',
        whistleblower_present=True,
        settlement_year=2024
    )

    print(f"\nTest prediction input:\n{test_input}")
