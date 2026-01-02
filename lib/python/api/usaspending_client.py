import requests
import pandas as pd
from typing import Dict, List, Optional

class USASpendingClient:
    def __init__(self):
        self.base_url = "https://api.usaspending.gov"
    
    def get_historical_awards(self, naics_code: str, agency: str = None, 
                            state: str = None, years_back: int = 3) -> Optional[Dict]:
        """Get historical contract awards for pricing intelligence"""
        try:
            # CORRECT FORMAT: naics_codes as array
            filters = {
                "award_type_codes": ["A", "B", "C", "D"],
                "naics_codes": [naics_code],
                "time_period": [
                    {
                        "start_date": "2023-01-01",
                        "end_date": "2024-01-01"
                    }
                ]
            }
            
            # Add optional filters
            if state:
                filters["place_of_performance_locations"] = [{
                    "country": "USA", 
                    "state": state
                }]
            
            if agency:
                filters["awarding_agencies"] = [{
                    "tier": "toptier", 
                    "name": agency
                }]
            
            payload = {
                "filters": filters,
                "fields": [
                    "Award ID", "Recipient Name", "Award Amount", 
                    "Start Date", "End Date", "Awarding Agency",
                    "naics_code", "NAICS", "Place of Performance"
                ],
                "limit": 50,
                "page": 1,
                "sort": "Award Amount",
                "order": "desc"
            }
            
            response = requests.post(
                f"{self.base_url}/api/v2/search/spending_by_award/",
                json=payload,
                timeout=30
            )
            
            print(f"USASpending API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                return self._analyze_award_data(data, naics_code)
            else:
                print(f"USASpending API Error: {response.text}")
                
        except Exception as e:
            print(f"Error fetching USASpending data: {e}")
        
        return None
    
    def _analyze_award_data(self, data: Dict, expected_naics: str) -> Dict:
        """Analyze award data for pricing insights"""
        if not data.get('results'):
            return {
                "total_awards": 0, 
                "error": f"No awards found for NAICS {expected_naics}",
                "naics_code": expected_naics
            }
            
        awards = data['results']
        
        if not awards:
            return {
                "total_awards": 0, 
                "error": "Empty results",
                "naics_code": expected_naics
            }
        
        print(f"Analyzing {len(awards)} awards from API for NAICS {expected_naics}...")
        
        df = pd.DataFrame(awards)
        
        analysis = {
            'naics_code': expected_naics,
            'total_awards': len(awards),
            'average_award': df['Award Amount'].mean(),
            'median_award': df['Award Amount'].median(),
            'min_award': df['Award Amount'].min(),
            'max_award': df['Award Amount'].max(),
            'award_range': f"${df['Award Amount'].min():,.0f} - ${df['Award Amount'].max():,.0f}",
            'top_competitors': df['Recipient Name'].value_counts().head(5).to_dict(),
            'sample_awards': awards[:3]
        }
        
        return analysis

# Test the fixed client
if __name__ == "__main__":
    client = USASpendingClient()
    print("Testing FIXED USASpending client...")
    results = client.get_historical_awards(naics_code='561720')
    print("Results:", results)
