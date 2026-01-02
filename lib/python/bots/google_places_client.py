import os
from dotenv import load_dotenv
from google_places_client import GooglePlacesClient

load_dotenv()

class EnhancedSubcontractorLookupSystem:
    def __init__(self):
        self.google_places_client = GooglePlacesClient()
    
    def find_subcontractors_for_rfp(self, rfp_data):
        """Find REAL subcontractors using Google Places API"""
        naics_code = rfp_data.get('naics_code', 'Unknown')
        print(f"🔍 Finding subcontractors for NAICS {naics_code}...")

        naics_descriptions = {
            '561210': 'facilities support services company',
            '562111': 'solid waste collection services',
            '334519': 'measuring instruments manufacturer',
            '541620': 'environmental consulting firm',
            '237990': 'heavy construction contractor',
            '336413': 'aircraft parts manufacturer',
            '513210': 'software development company',
            '315250': 'apparel manufacturer',
            '332722': 'bolt nut screw manufacturing',
            '561720': 'janitorial services',
            '541330': 'engineering services',
            '541511': 'custom computer programming',
            '541512': 'computer systems design',
            '541513': 'computer facilities management',
            '541519': 'other computer related services',
            '561110': 'office administrative services',
            '561311': 'employment placement agencies',
            '561320': 'temporary help services',
            '561330': 'employee leasing services',
            '561499': 'other business support services'
        }

        search_term = naics_descriptions.get(naics_code, 'business services')
        location = rfp_data.get('state', 'United States')

        print(f"   🔍 Searching for: {search_term} in {location}")
        
        # Use Google Places API for real data
        real_businesses = self.google_places_client.search_businesses(search_term, location)
        
        if real_businesses:
            print(f"   ✅ Found {len(real_businesses)} real businesses from Google Places API")
            
            # Format the results for our system
            formatted_businesses = []
            for business in real_businesses:
                formatted_business = {
                    'name': business['name'],
                    'phone': business.get('phone', 'Not available'),
                    'website': business.get('website', 'Not available'),
                    'address': business.get('address', ''),
                    'service': search_term,
                    'location': location,
                    'naics': naics_code,
                    'source': 'google_places_api',
                    'rating': business.get('rating', 'N/A')
                }
                
                # Only include if we have at least some contact info
                if (formatted_business['phone'] != 'Not available' or 
                    formatted_business['website'] != 'Not available'):
                    formatted_businesses.append(formatted_business)
            
            if formatted_businesses:
                return formatted_businesses
        
        # Fallback to simulated data
        print(f"   ⚠️  Using simulated data (no real businesses found or API not configured)")
        return self.get_simulated_subcontractors(search_term, location, naics_code)
    
    def get_simulated_subcontractors(self, service, location, naics_code):
        """Fallback simulated data"""
        return [
            {
                'name': f'Expert {service.title()} Inc',
                'phone': '555-0100',
                'email': f'contact@expert{service.replace(" ", "").lower()}.com',
                'service': service,
                'location': location,
                'naics': naics_code,
                'source': 'simulated'
            },
            {
                'name': f'Quality {service.title()} Services',
                'phone': '555-0200', 
                'email': f'info@quality{service.replace(" ", "").lower()}.com',
                'service': service,
                'location': location,
                'naics': naics_code,
                'source': 'simulated'
            }
        ]
    
    def close(self):
        """No browser to close"""
        pass
