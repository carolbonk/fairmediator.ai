"""
FCA Settlement Data Collection

Scrapes historical False Claims Act settlement data from:
1. DOJ Press Releases (justice.gov/opa)
2. TRAC Database (tracfed.syr.edu)
3. PACER/RECAP (courtlistener.com)

Target: 500+ settlement records for training ML model
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Optional
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
DOJ_OPA_BASE = "https://www.justice.gov/opa"
RECAP_API_BASE = "https://www.courtlistener.com/api/rest/v3"
USER_AGENT = "FairMediator Research Bot/1.0 (https://fairmediator.ai; research@fairmediator.ai)"


class FCADataCollector:
    """Collects False Claims Act settlement data from multiple sources"""

    def __init__(self, api_keys: Dict[str, str] = None):
        self.api_keys = api_keys or {}
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': USER_AGENT
        })
        self.settlements = []

    def scrape_doj_press_releases(self, years: int = 5) -> List[Dict]:
        """
        Scrape DOJ press releases for FCA settlements

        Args:
            years: Number of years to scrape back from current date

        Returns:
            List of settlement records
        """
        logger.info(f"Scraping DOJ press releases for last {years} years...")

        settlements = []
        start_date = datetime.now() - timedelta(days=365 * years)

        # DOJ OPA search for "False Claims Act" settlements
        search_url = f"{DOJ_OPA_BASE}/pr"
        params = {
            'keys': 'False Claims Act settlement',
            'sort_by': 'created',
            'order': 'desc'
        }

        try:
            response = self.session.get(search_url, params=params, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find press release items
            press_releases = soup.find_all('div', class_='views-row')

            for pr in press_releases:
                try:
                    # Extract title and URL
                    title_elem = pr.find('h3')
                    if not title_elem:
                        continue

                    link = title_elem.find('a')
                    if not link:
                        continue

                    title = link.text.strip()
                    url = DOJ_OPA_BASE + link['href'] if link['href'].startswith('/') else link['href']

                    # Extract date
                    date_elem = pr.find('span', class_='date-display-single')
                    date_str = date_elem.text.strip() if date_elem else None

                    # Fetch full press release content
                    settlement_data = self._parse_press_release(url, title, date_str)

                    if settlement_data:
                        settlements.append(settlement_data)
                        logger.info(f"Extracted settlement: {settlement_data['defendant']} - ${settlement_data['amount']:,.0f}")

                    # Rate limiting
                    time.sleep(1)  # Be respectful to DOJ servers

                except Exception as e:
                    logger.error(f"Error parsing press release: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping DOJ press releases: {e}")

        logger.info(f"Collected {len(settlements)} settlements from DOJ")
        return settlements

    def _parse_press_release(self, url: str, title: str, date_str: Optional[str]) -> Optional[Dict]:
        """
        Parse individual press release for settlement details

        Extracts:
        - Defendant name
        - Settlement amount
        - Fraud type (healthcare, defense, covid, etc.)
        - Industry
        - Jurisdiction
        """
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            content = soup.find('div', class_='field-item')

            if not content:
                return None

            text = content.get_text()

            # Extract settlement amount using regex
            # Common patterns: "$X million", "$X.X million", "$X,XXX,XXX"
            amount_patterns = [
                r'\$(\d+(?:\.\d+)?)\s*million',
                r'\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)',
                r'(\d+(?:\.\d+)?)\s*million\s*dollars'
            ]

            amount = None
            for pattern in amount_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).replace(',', '')
                    amount = float(amount_str)

                    # Convert millions to actual value
                    if 'million' in match.group(0).lower():
                        amount *= 1_000_000

                    break

            if not amount:
                return None  # Skip if we can't find settlement amount

            # Extract defendant name from title
            # Common patterns: "Company Name to Pay", "Company Name Agrees", "Company Name Settles"
            defendant_match = re.search(r'^(.*?)\s+(?:to Pay|Agrees|Settles|Resolves)', title, re.IGNORECASE)
            defendant = defendant_match.group(1).strip() if defendant_match else "Unknown Defendant"

            # Determine fraud type
            fraud_type = self._classify_fraud_type(text)

            # Determine industry
            industry = self._classify_industry(text, defendant)

            # Extract jurisdiction (court district)
            jurisdiction = self._extract_jurisdiction(text)

            # Check for whistleblower
            whistleblower = 'whistleblower' in text.lower() or 'qui tam' in text.lower()

            return {
                'defendant': defendant,
                'amount': amount,
                'fraud_type': fraud_type,
                'industry': industry,
                'jurisdiction': jurisdiction,
                'whistleblower': whistleblower,
                'date': date_str,
                'source_url': url,
                'source': 'DOJ_OPA'
            }

        except Exception as e:
            logger.error(f"Error parsing press release {url}: {e}")
            return None

    def _classify_fraud_type(self, text: str) -> str:
        """Classify fraud type from press release text"""
        text_lower = text.lower()

        fraud_keywords = {
            'healthcare': ['healthcare', 'medicare', 'medicaid', 'hospital', 'medical', 'pharmaceutical'],
            'defense': ['defense', 'military', 'pentagon', 'army', 'navy', 'air force'],
            'covid': ['covid', 'pandemic', 'coronavirus', 'ppp', 'paycheck protection'],
            'procurement': ['procurement', 'contract', 'bid', 'rfp'],
            'grant': ['grant', 'research funding', 'sbir'],
            'housing': ['housing', 'fha', 'hud', 'mortgage'],
            'education': ['education', 'student loan', 'title iv']
        }

        for fraud_type, keywords in fraud_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return fraud_type

        return 'other'

    def _classify_industry(self, text: str, defendant: str) -> str:
        """Classify defendant industry"""
        text_combined = (text + ' ' + defendant).lower()

        industry_keywords = {
            'healthcare': ['hospital', 'health', 'medical', 'pharma', 'clinic'],
            'defense_contractor': ['defense', 'aerospace', 'lockheed', 'boeing', 'raytheon'],
            'pharmaceutical': ['pharma', 'drug', 'biotech', 'medical device'],
            'technology': ['tech', 'software', 'it services', 'cybersecurity'],
            'construction': ['construction', 'engineering', 'contractor'],
            'education': ['university', 'college', 'school', 'education'],
            'financial': ['bank', 'financial', 'mortgage', 'lending']
        }

        for industry, keywords in industry_keywords.items():
            if any(keyword in text_combined for keyword in keywords):
                return industry

        return 'other'

    def _extract_jurisdiction(self, text: str) -> str:
        """Extract court jurisdiction/district"""
        # Common patterns: "District of X", "Eastern District of X", "U.S. District Court for X"
        jurisdiction_match = re.search(
            r'(?:U\.S\. District Court for the |District of |(?:Eastern|Western|Northern|Southern) District of )([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)',
            text
        )

        if jurisdiction_match:
            return jurisdiction_match.group(1)

        return 'Unknown'

    def scrape_trac_database(self) -> List[Dict]:
        """
        Scrape TRAC Federal Database for FCA cases

        Note: TRAC may require subscription for full access.
        This is a placeholder for future implementation.
        """
        logger.info("TRAC database scraping not yet implemented (requires subscription)")
        return []

    def scrape_recap(self, keywords: str = "False Claims Act", limit: int = 100) -> List[Dict]:
        """
        Query RECAP/Court Listener API for FCA cases

        Args:
            keywords: Search keywords
            limit: Maximum number of results

        Returns:
            List of settlement records from RECAP
        """
        logger.info(f"Querying RECAP API for '{keywords}'...")

        api_key = self.api_keys.get('RECAP_API_KEY', '')
        headers = {}
        if api_key:
            headers['Authorization'] = f'Token {api_key}'

        settlements = []

        try:
            params = {
                'q': keywords,
                'type': 'r',  # RECAP documents
                'order_by': 'dateFiled desc',
                'page_size': min(limit, 100)
            }

            response = self.session.get(
                f"{RECAP_API_BASE}/search/",
                params=params,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()

            data = response.json()

            # Parse results (simplified - would need more sophisticated parsing)
            for result in data.get('results', []):
                # Extract settlement details from case data
                # This would require more sophisticated parsing of court documents
                pass

            logger.info(f"Collected {len(settlements)} settlements from RECAP")

        except Exception as e:
            logger.error(f"Error querying RECAP API: {e}")

        return settlements

    def save_to_csv(self, filename: str = 'fca_settlements.csv'):
        """Save collected settlements to CSV file"""
        if not self.settlements:
            logger.warning("No settlements to save")
            return

        df = pd.DataFrame(self.settlements)
        df.to_csv(filename, index=False)
        logger.info(f"Saved {len(self.settlements)} settlements to {filename}")

    def save_to_json(self, filename: str = 'fca_settlements.json'):
        """Save collected settlements to JSON file"""
        if not self.settlements:
            logger.warning("No settlements to save")
            return

        with open(filename, 'w') as f:
            json.dump(self.settlements, f, indent=2)

        logger.info(f"Saved {len(self.settlements)} settlements to {filename}")

    def collect_all(self, years: int = 5) -> List[Dict]:
        """
        Collect settlements from all sources

        Args:
            years: Number of years to scrape

        Returns:
            Combined list of settlements
        """
        logger.info("Starting comprehensive FCA settlement data collection...")

        # Collect from DOJ
        doj_settlements = self.scrape_doj_press_releases(years=years)
        self.settlements.extend(doj_settlements)

        # Could add TRAC and RECAP here when implemented
        # trac_settlements = self.scrape_trac_database()
        # recap_settlements = self.scrape_recap()

        logger.info(f"Total settlements collected: {len(self.settlements)}")
        return self.settlements


if __name__ == "__main__":
    # Example usage
    collector = FCADataCollector(api_keys={
        'RECAP_API_KEY': ''  # Add your API key here if available
    })

    # Collect 5 years of FCA settlements
    settlements = collector.collect_all(years=5)

    # Save to both CSV and JSON
    collector.save_to_csv('backend/src/ml_models/settlement_predictor/data/fca_settlements.csv')
    collector.save_to_json('backend/src/ml_models/settlement_predictor/data/fca_settlements.json')

    print(f"\nCollected {len(settlements)} FCA settlements")
    print(f"Sample record:\n{json.dumps(settlements[0], indent=2)}")
