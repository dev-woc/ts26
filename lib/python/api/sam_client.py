import requests
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

class SAMClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('SAM_API_KEY')
        self.base_url = "https://api.sam.gov/opportunities/v2"
    
    def search_opportunities(self, params: Dict) -> Optional[Dict]:
        try:
            response = requests.get(
                f"{self.base_url}/search",
                params={'api_key': self.api_key, **params},
                timeout=60
            )
            return response.json() if response.status_code == 200 else None
        except Exception as e:
            print(f"SAM API error: {e}")
            return None
            
    def search_businesses_by_naics(self, naics_code: str, state: str = None, limit: int = 50) -> List[Dict]:
        """Search businesses by NAICS code and optional state filter"""
        try:
            # Note: This is a simplified version - actual SAM API may have different endpoints
            payload = {
                'api_key': self.api_key,
                'filters': {
                    'naicsCodes': [naics_code],
                    'registrationStatus': 'ACTIVE'
                },
                'limit': limit
            }
            
            response = requests.post(
                f"{self.base_url}/search",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                businesses = data.get('entities', [])
                
                # Filter by state if provided
                if state:
                    businesses = [
                        biz for biz in businesses 
                        if biz.get('physicalAddress', {}).get('state') == state
                    ]
                
                return businesses
                
        except Exception as e:
            print(f"Error searching SAM businesses: {e}")
        
        return []
    
    def get_opportunity_details(self, solicitation_number: str) -> Optional[Dict]:
        """Get details for a specific opportunity"""
        try:
            # SAM opportunities endpoint
            response = requests.get(
                f"https://api.sam.gov/opportunities/v2/search",
                params={
                    'api_key': self.api_key,
                    'solNumber': solicitation_number
                }
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error fetching opportunity details: {e}")
        return None