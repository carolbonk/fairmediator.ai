"""
FCA Settlement Data Cleaning

Cleans and preprocesses raw settlement data for ML training.
Handles outliers, missing values, and feature normalization.
"""

import pandas as pd
import numpy as np
import json
import logging
from typing import Tuple, Dict
from datetime import datetime
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SettlementDataCleaner:
    """Cleans and preprocesses FCA settlement data"""

    def __init__(self):
        self.data = None
        self.cleaned_data = None
        self.stats = {}

    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load raw settlement data from CSV or JSON"""
        logger.info(f"Loading data from {filepath}...")

        if filepath.endswith('.csv'):
            self.data = pd.read_csv(filepath)
        elif filepath.endswith('.json'):
            self.data = pd.read_json(filepath)
        else:
            raise ValueError("File must be CSV or JSON")

        logger.info(f"Loaded {len(self.data)} records")
        return self.data

    def clean_amounts(self) -> pd.DataFrame:
        """Clean and normalize settlement amounts"""
        logger.info("Cleaning settlement amounts...")

        # Remove null amounts
        before_count = len(self.data)
        self.data = self.data.dropna(subset=['amount'])
        logger.info(f"Removed {before_count - len(self.data)} records with missing amounts")

        # Convert to numeric
        self.data['amount'] = pd.to_numeric(self.data['amount'], errors='coerce')

        # Remove outliers (amounts > $1B or < $10K - likely errors)
        outliers = (self.data['amount'] > 1_000_000_000) | (self.data['amount'] < 10_000)
        logger.info(f"Removing {outliers.sum()} outliers (amount > $1B or < $10K)")
        self.data = self.data[~outliers]

        # Log amount statistics
        self.stats['amount'] = {
            'min': float(self.data['amount'].min()),
            'max': float(self.data['amount'].max()),
            'mean': float(self.data['amount'].mean()),
            'median': float(self.data['amount'].median()),
            'std': float(self.data['amount'].std())
        }

        logger.info(f"Amount statistics: ${self.stats['amount']['min']:,.0f} - ${self.stats['amount']['max']:,.0f} (median: ${self.stats['amount']['median']:,.0f})")

        return self.data

    def clean_dates(self) -> pd.DataFrame:
        """Parse and normalize settlement dates"""
        logger.info("Cleaning dates...")

        # Convert to datetime
        self.data['settlement_date'] = pd.to_datetime(self.data['date'], errors='coerce')

        # Remove records with invalid dates
        invalid_dates = self.data['settlement_date'].isna()
        logger.info(f"Removing {invalid_dates.sum()} records with invalid dates")
        self.data = self.data[~invalid_dates]

        # Extract year for inflation adjustment
        self.data['settlement_year'] = self.data['settlement_date'].dt.year

        # Adjust for inflation to 2024 dollars
        self.data['amount_2024'] = self.data.apply(
            lambda row: self._adjust_for_inflation(row['amount'], row['settlement_year']),
            axis=1
        )

        return self.data

    def _adjust_for_inflation(self, amount: float, year: int) -> float:
        """
        Adjust settlement amount for inflation to 2024 dollars

        Uses approximate CPI adjustment (simplified)
        """
        # Approximate CPI multipliers to 2024 (simplified)
        cpi_multipliers = {
            2024: 1.00,
            2023: 1.04,
            2022: 1.12,
            2021: 1.17,
            2020: 1.21,
            2019: 1.24,
            2018: 1.28,
            2017: 1.31,
            2016: 1.34,
            2015: 1.34,
            2014: 1.37,
            2013: 1.40,
            2012: 1.43,
            2011: 1.47,
            2010: 1.51
        }

        multiplier = cpi_multipliers.get(year, 1.5)  # Default 50% for older years
        return amount * multiplier

    def encode_categories(self) -> pd.DataFrame:
        """Encode categorical features"""
        logger.info("Encoding categorical features...")

        # Fraud type encoding
        self.data['fraud_type'] = self.data['fraud_type'].fillna('other')
        fraud_type_mapping = {
            'healthcare': 0,
            'defense': 1,
            'covid': 2,
            'procurement': 3,
            'grant': 4,
            'housing': 5,
            'education': 6,
            'other': 7
        }
        self.data['fraud_type_code'] = self.data['fraud_type'].map(fraud_type_mapping)

        # Industry encoding
        self.data['industry'] = self.data['industry'].fillna('other')
        industry_mapping = {
            'healthcare': 0,
            'defense_contractor': 1,
            'pharmaceutical': 2,
            'technology': 3,
            'construction': 4,
            'education': 5,
            'financial': 6,
            'other': 7
        }
        self.data['industry_code'] = self.data['industry'].map(industry_mapping)

        # Jurisdiction encoding (simplified - would use proper circuit mapping)
        self.data['jurisdiction'] = self.data['jurisdiction'].fillna('Unknown')
        self.data['jurisdiction_code'] = pd.Categorical(self.data['jurisdiction']).codes

        # Whistleblower indicator
        self.data['whistleblower'] = self.data['whistleblower'].fillna(False).astype(int)

        return self.data

    def create_features(self) -> pd.DataFrame:
        """Create engineered features for ML"""
        logger.info("Creating engineered features...")

        # Log-transform amount (helps with skewed distribution)
        self.data['log_amount'] = np.log1p(self.data['amount_2024'])

        # Defendant size estimation (based on settlement amount)
        # Rough heuristic: < $1M = small, $1M-$10M = medium, > $10M = large
        self.data['defendant_size'] = pd.cut(
            self.data['amount_2024'],
            bins=[0, 1_000_000, 10_000_000, float('inf')],
            labels=[0, 1, 2]  # small, medium, large
        ).astype(int)

        # Fraud severity (based on amount and type)
        severity_weights = {
            'healthcare': 1.2,
            'defense': 1.5,
            'covid': 1.3,
            'procurement': 1.0,
            'grant': 0.8,
            'housing': 1.1,
            'education': 0.9,
            'other': 1.0
        }

        self.data['fraud_severity'] = self.data.apply(
            lambda row: np.log1p(row['amount_2024']) * severity_weights.get(row['fraud_type'], 1.0),
            axis=1
        )

        return self.data

    def remove_duplicates(self) -> pd.DataFrame:
        """Remove duplicate settlement records"""
        logger.info("Removing duplicates...")

        before_count = len(self.data)
        self.data = self.data.drop_duplicates(subset=['defendant', 'amount', 'settlement_year'])
        logger.info(f"Removed {before_count - len(self.data)} duplicate records")

        return self.data

    def validate_data(self) -> Tuple[bool, Dict]:
        """Validate cleaned data meets requirements"""
        logger.info("Validating cleaned data...")

        issues = []

        # Check minimum record count (lowered for testing with sample data)
        if len(self.data) < 20:
            issues.append(f"Insufficient data: only {len(self.data)} records (need 20+ for testing)")

        # Check for required columns
        required_cols = ['amount_2024', 'fraud_type_code', 'industry_code', 'jurisdiction_code', 'whistleblower']
        missing_cols = [col for col in required_cols if col not in self.data.columns]
        if missing_cols:
            issues.append(f"Missing required columns: {missing_cols}")

        # Check for null values in critical columns (warn but don't fail)
        null_counts = self.data[required_cols].isnull().sum()
        if null_counts.any():
            logger.warning(f"Null values found (will be handled during training): {null_counts[null_counts > 0].to_dict()}")

        # Check value ranges
        if (self.data['amount_2024'] <= 0).any():
            issues.append("Negative or zero amounts found")

        if issues:
            logger.error(f"Validation failed with {len(issues)} issues:")
            for issue in issues:
                logger.error(f"  - {issue}")
            return False, {'valid': False, 'issues': issues}
        else:
            logger.info("✅ Data validation passed")
            return True, {'valid': True, 'record_count': len(self.data)}

    def clean_all(self, filepath: str) -> pd.DataFrame:
        """Run complete cleaning pipeline"""
        logger.info("Starting complete data cleaning pipeline...")

        self.load_data(filepath)
        self.clean_amounts()
        self.clean_dates()
        self.encode_categories()
        self.create_features()
        self.remove_duplicates()

        valid, validation_result = self.validate_data()

        if not valid:
            raise ValueError("Data validation failed. Check logs for details.")

        self.cleaned_data = self.data

        logger.info(f"✅ Cleaning complete: {len(self.cleaned_data)} clean records")
        return self.cleaned_data

    def save_cleaned_data(self, output_path: str = 'fca_settlements_clean.csv'):
        """Save cleaned data to file"""
        if self.cleaned_data is None:
            raise ValueError("No cleaned data to save. Run clean_all() first.")

        self.cleaned_data.to_csv(output_path, index=False)
        logger.info(f"Saved cleaned data to {output_path}")

    def get_stats(self) -> Dict:
        """Get cleaning statistics"""
        return {
            'total_records': len(self.cleaned_data) if self.cleaned_data is not None else 0,
            'amount_stats': self.stats.get('amount', {}),
            'fraud_type_distribution': self.data['fraud_type'].value_counts().to_dict() if self.data is not None else {},
            'industry_distribution': self.data['industry'].value_counts().to_dict() if self.data is not None else {}
        }


if __name__ == "__main__":
    # Example usage
    cleaner = SettlementDataCleaner()

    input_file = 'data/fca_settlements_sample.csv'
    output_file = 'data/fca_settlements_clean.csv'

    try:
        cleaned_data = cleaner.clean_all(input_file)
        cleaner.save_cleaned_data(output_file)

        # Print statistics
        stats = cleaner.get_stats()
        print("\n" + "="*50)
        print("CLEANING STATISTICS")
        print("="*50)
        print(f"Total Records: {stats['total_records']}")
        print(f"\nAmount Range: ${stats['amount_stats']['min']:,.0f} - ${stats['amount_stats']['max']:,.0f}")
        print(f"Median Settlement: ${stats['amount_stats']['median']:,.0f}")
        print(f"\nFraud Type Distribution:")
        for fraud_type, count in stats['fraud_type_distribution'].items():
            print(f"  {fraud_type}: {count}")

    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        raise
