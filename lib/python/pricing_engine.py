from typing import Dict, List

class PricingEngine:
    def __init__(self):
        # Industry average pricing data (fallback when APIs fail)
        self.industry_averages = {
            '561210': {  # Janitorial Services
                'small_business': {'min': 25000, 'max': 150000, 'avg': 65000},
                'medium_business': {'min': 50000, 'max': 500000, 'avg': 150000},
                'description': 'Commercial janitorial services per building'
            },
            '561210': {  # Facilities Support
                'small_business': {'min': 50000, 'max': 250000, 'avg': 120000},
                'medium_business': {'min': 100000, 'max': 1000000, 'avg': 350000},
                'description': 'Facilities management and support'
            },
            '541330': {  # Engineering Services
                'small_business': {'min': 75000, 'max': 500000, 'avg': 200000},
                'medium_business': {'min': 150000, 'max': 2000000, 'avg': 600000},
                'description': 'Engineering and technical services'
            }
        }

    def calculate_optimal_price(self, subcontractor_quotes: List[float], 
                              naics_code: str = None, 
                              business_size: str = 'small_business') -> Dict:
        """
        Calculate optimal bid price based on subcontractor quotes and industry data
        """
        if not subcontractor_quotes:
            # No quotes - use industry averages
            if naics_code and naics_code in self.industry_averages:
                industry_data = self.industry_averages[naics_code][business_size]
                return {
                    'recommended_price': industry_data['avg'],
                    'price_range': f"${industry_data['min']:,} - ${industry_data['max']:,}",
                    'confidence': 'low',
                    'source': 'industry_average',
                    'gross_margin': 25.0,  # Add margin for bid analysis
                    'notes': 'No subcontractor quotes available, using industry averages'
                }
            else:
                return {
                    'recommended_price': 75000,  # Higher default
                    'price_range': '$50,000 - $200,000',
                    'confidence': 'very_low',
                    'gross_margin': 30.0,  # Add margin
                    'source': 'default_fallback',
                    'notes': 'Using default pricing - gather subcontractor quotes for accuracy'
                }

        # Calculate based on subcontractor quotes
        min_quote = min(subcontractor_quotes)
        max_quote = max(subcontractor_quotes)

        # INCREASED MARGIN: 45% instead of 35%
        target_margin = 0.1  
        recommended_price = min_quote * (1 + target_margin)

        # Ensure we're competitive but profitable
        if recommended_price > max_quote:
            recommended_price = max_quote * 0.95  # Undercut highest quote slightly

        gross_margin = ((recommended_price - min_quote) / recommended_price) * 100

        return {
            'recommended_price': round(recommended_price, 2),
            'cost_basis': min_quote,
            'potential_profit': round(recommended_price - min_quote, 2),
            'gross_margin': round(gross_margin, 1),
            'price_range': f"${min_quote:,} - ${max_quote:,}",
            'subcontractor_quotes_count': len(subcontractor_quotes),
            'confidence': 'high',
            'source': 'subcontractor_quotes',
            'notes': f'Based on {len(subcontractor_quotes)} subcontractor quotes with {target_margin*100:.0f}% target margin'
        }

    def simulate_subcontractor_quotes(self, naics_code: str) -> List[float]:
        """
        Simulate subcontractor quotes for testing (replace with real quotes)
        """
        if naics_code in self.industry_averages:
            industry_data = self.industry_averages[naics_code]['small_business']
            # Simulate 3 quotes around the industry average
            import random
            quotes = []
            for _ in range(3):
                quote = industry_data['avg'] * random.uniform(0.7, 1.3)
                quotes.append(round(quote, 2))
            return quotes
        else:
            # Default quotes for unknown NAICS
            return [50000, 65000, 55000]  # Higher quotes for better margins

# Test the pricing engine
if __name__ == "__main__":
    engine = PricingEngine()

    # Test with simulated quotes
    simulated_quotes = engine.simulate_subcontractor_quotes('561210')
    result = engine.calculate_optimal_price(simulated_quotes, '561210')

    print("Pricing Engine Test:")
    print(f"Simulated quotes: ${[f'{q:,.0f}' for q in simulated_quotes]}")
    print(f"Recommended price: ${result['recommended_price']:,.2f}")
    print(f"Potential profit: ${result['potential_profit']:,.2f}")
    print(f"Gross margin: {result['gross_margin']}%")
    print(f"Confidence: {result['confidence']}")