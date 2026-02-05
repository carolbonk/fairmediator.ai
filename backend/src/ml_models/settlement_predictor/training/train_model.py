"""
Settlement Prediction Model Training

Trains Random Forest Regressor to predict FCA settlement ranges.
Includes cross-validation, hyperparameter tuning, and model evaluation.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json
import logging
from datetime import datetime
from typing import Dict, Tuple
import matplotlib.pyplot as plt
import seaborn as sns

from feature_engineering import SettlementFeatureEngine

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SettlementPredictor:
    """Train and evaluate settlement prediction model"""

    def __init__(self, model_params: Dict = None):
        """
        Initialize predictor

        Args:
            model_params: Random Forest parameters (optional)
        """
        self.model_params = model_params or {
            'n_estimators': 100,
            'max_depth': 20,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'n_jobs': -1
        }

        self.model = RandomForestRegressor(**self.model_params)
        self.feature_engine = SettlementFeatureEngine()
        self.training_stats = {}

    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load cleaned settlement data"""
        logger.info(f"Loading data from {filepath}...")
        data = pd.read_csv(filepath)
        logger.info(f"Loaded {len(data)} records")
        return data

    def train_test_split_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
        stratify_by: str = None
    ) -> Tuple:
        """
        Split data into train and test sets

        Args:
            X: Feature matrix
            y: Target vector
            test_size: Fraction of data for testing
            stratify_by: Column name for stratification (optional)

        Returns:
            X_train, X_test, y_train, y_test
        """
        logger.info(f"Splitting data: {int((1-test_size)*100)}% train, {int(test_size*100)}% test")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=42
        )

        logger.info(f"Train set: {len(X_train)} samples")
        logger.info(f"Test set: {len(X_test)} samples")

        return X_train, X_test, y_train, y_test

    def train(self, X_train: pd.DataFrame, y_train: pd.Series):
        """Train the model"""
        logger.info("Training Random Forest Regressor...")
        logger.info(f"Model parameters: {self.model_params}")

        self.model.fit(X_train, y_train)

        logger.info("✅ Training complete")

    def cross_validate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        cv: int = 5
    ) -> Dict:
        """
        Perform k-fold cross-validation

        Args:
            X: Feature matrix
            y: Target vector
            cv: Number of folds

        Returns:
            Cross-validation scores
        """
        logger.info(f"Performing {cv}-fold cross-validation...")

        # Negative MSE (sklearn convention)
        cv_scores = cross_val_score(
            self.model, X, y,
            cv=cv,
            scoring='neg_mean_squared_error',
            n_jobs=-1
        )

        rmse_scores = np.sqrt(-cv_scores)

        results = {
            'cv_rmse_scores': rmse_scores.tolist(),
            'cv_rmse_mean': float(rmse_scores.mean()),
            'cv_rmse_std': float(rmse_scores.std())
        }

        logger.info(f"Cross-validation RMSE: {results['cv_rmse_mean']:.4f} (+/- {results['cv_rmse_std']:.4f})")

        return results

    def evaluate(
        self,
        X_test: pd.DataFrame,
        y_test: pd.Series
    ) -> Dict:
        """
        Evaluate model on test set

        Args:
            X_test: Test features
            y_test: Test target

        Returns:
            Evaluation metrics
        """
        logger.info("Evaluating model on test set...")

        # Make predictions
        y_pred = self.model.predict(X_test)

        # Calculate metrics
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)

        # Calculate percentage errors
        # Convert from log space to actual amounts for interpretation
        y_test_actual = np.expm1(y_test)
        y_pred_actual = np.expm1(y_pred)

        percentage_errors = np.abs((y_test_actual - y_pred_actual) / y_test_actual) * 100
        mape = percentage_errors.mean()

        metrics = {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2_score': float(r2),
            'mape': float(mape)
        }

        logger.info(f"Test Set Performance:")
        logger.info(f"  RMSE: {rmse:.4f}")
        logger.info(f"  MAE: {mae:.4f}")
        logger.info(f"  R² Score: {r2:.4f}")
        logger.info(f"  MAPE: {mape:.2f}%")

        return metrics

    def predict_settlement_range(
        self,
        fraud_type: str,
        damages_claimed: float,
        industry: str,
        jurisdiction: str,
        whistleblower_present: bool = False,
        settlement_year: int = 2024
    ) -> Dict:
        """
        Predict settlement range for a case

        Args:
            fraud_type: Type of fraud
            damages_claimed: Claimed damages amount
            industry: Industry
            jurisdiction: Court jurisdiction
            whistleblower_present: Whistleblower involvement
            settlement_year: Settlement year

        Returns:
            Predicted settlement range with confidence interval
        """
        # Create feature input
        X = self.feature_engine.create_prediction_input(
            fraud_type=fraud_type,
            damages_claimed=damages_claimed,
            industry=industry,
            jurisdiction=jurisdiction,
            whistleblower_present=whistleblower_present,
            settlement_year=settlement_year
        )

        # Get predictions from all trees
        tree_predictions = np.array([
            tree.predict(X)[0] for tree in self.model.estimators_
        ])

        # Calculate percentiles for confidence interval
        pred_25 = np.percentile(tree_predictions, 25)
        pred_50 = np.percentile(tree_predictions, 50)  # Median
        pred_75 = np.percentile(tree_predictions, 75)

        # Convert from log space to actual amounts
        predicted_low = np.expm1(pred_25)
        predicted_mid = np.expm1(pred_50)
        predicted_high = np.expm1(pred_75)

        # Calculate prediction confidence based on std deviation
        pred_std = np.std(tree_predictions)
        confidence = 1.0 - min(pred_std / 2.0, 0.5)  # Higher std = lower confidence

        return {
            'predicted_low': float(predicted_low),
            'predicted_mid': float(predicted_mid),
            'predicted_high': float(predicted_high),
            'confidence': float(confidence),
            'input_damages': float(damages_claimed)
        }

    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance from trained model"""
        if not hasattr(self.model, 'feature_importances_'):
            raise ValueError("Model must be trained first")

        importance_df = pd.DataFrame({
            'feature': self.feature_engine.get_feature_importance_names(),
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        return importance_df

    def hyperparameter_tuning(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series
    ) -> Dict:
        """
        Perform grid search for hyperparameter tuning

        Args:
            X_train: Training features
            y_train: Training target

        Returns:
            Best parameters
        """
        logger.info("Performing hyperparameter tuning...")

        param_grid = {
            'n_estimators': [50, 100, 200],
            'max_depth': [10, 20, 30],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }

        grid_search = GridSearchCV(
            RandomForestRegressor(random_state=42, n_jobs=-1),
            param_grid,
            cv=5,
            scoring='neg_mean_squared_error',
            n_jobs=-1,
            verbose=1
        )

        grid_search.fit(X_train, y_train)

        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best RMSE: {np.sqrt(-grid_search.best_score_):.4f}")

        return grid_search.best_params_

    def save_model(self, model_dir: str = 'backend/src/ml_models/settlement_predictor/models'):
        """Save trained model and feature engine"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Save model
        model_path = f"{model_dir}/settlement_model_{timestamp}.joblib"
        joblib.dump(self.model, model_path)
        logger.info(f"Saved model to {model_path}")

        # Save feature engine
        scaler_path = f"{model_dir}/feature_scaler_{timestamp}.joblib"
        self.feature_engine.save_scaler(scaler_path)

        # Save metadata
        metadata = {
            'timestamp': timestamp,
            'model_params': self.model_params,
            'training_stats': self.training_stats,
            'feature_columns': self.feature_engine.feature_columns,
            'model_path': model_path,
            'scaler_path': scaler_path
        }

        metadata_path = f"{model_dir}/model_metadata_{timestamp}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Saved metadata to {metadata_path}")

        return {
            'model_path': model_path,
            'scaler_path': scaler_path,
            'metadata_path': metadata_path
        }

    def load_model(self, model_path: str, scaler_path: str):
        """Load trained model and feature engine"""
        self.model = joblib.load(model_path)
        self.feature_engine.load_scaler(scaler_path)
        logger.info(f"Loaded model from {model_path}")


def main():
    """Main training pipeline"""
    logger.info("="*60)
    logger.info("FCA SETTLEMENT PREDICTION MODEL TRAINING")
    logger.info("="*60)

    # Initialize predictor
    predictor = SettlementPredictor()

    # Load data
    data_path = 'backend/src/ml_models/settlement_predictor/data/fca_settlements_clean.csv'
    data = predictor.load_data(data_path)

    # Prepare features
    X, y = predictor.feature_engine.prepare_training_data(data, target_column='log_amount')

    # Split data
    X_train, X_test, y_train, y_test = predictor.train_test_split_data(X, y, test_size=0.2)

    # Optional: Hyperparameter tuning (uncomment to run)
    # best_params = predictor.hyperparameter_tuning(X_train, y_train)
    # predictor.model_params.update(best_params)
    # predictor.model = RandomForestRegressor(**predictor.model_params)

    # Train model
    predictor.train(X_train, y_train)

    # Cross-validation
    cv_results = predictor.cross_validate(X, y, cv=5)
    predictor.training_stats['cross_validation'] = cv_results

    # Evaluate on test set
    test_metrics = predictor.evaluate(X_test, y_test)
    predictor.training_stats['test_metrics'] = test_metrics

    # Feature importance
    feature_importance = predictor.get_feature_importance()
    logger.info("\nTop 5 Most Important Features:")
    logger.info(feature_importance.head(5).to_string(index=False))

    # Save model
    saved_paths = predictor.save_model()
    logger.info(f"\n✅ Model training complete!")
    logger.info(f"Model saved to: {saved_paths['model_path']}")

    # Test prediction
    logger.info("\n" + "="*60)
    logger.info("TEST PREDICTION")
    logger.info("="*60)

    test_prediction = predictor.predict_settlement_range(
        fraud_type='healthcare',
        damages_claimed=10_000_000,
        industry='pharmaceutical',
        jurisdiction='Southern District of New York',
        whistleblower_present=True,
        settlement_year=2024
    )

    logger.info(f"Input: $10M healthcare fraud (pharmaceutical, whistleblower)")
    logger.info(f"Predicted Settlement Range:")
    logger.info(f"  Low (25th percentile):  ${test_prediction['predicted_low']:,.0f}")
    logger.info(f"  Mid (50th percentile):  ${test_prediction['predicted_mid']:,.0f}")
    logger.info(f"  High (75th percentile): ${test_prediction['predicted_high']:,.0f}")
    logger.info(f"  Confidence: {test_prediction['confidence']:.2%}")


if __name__ == "__main__":
    main()
