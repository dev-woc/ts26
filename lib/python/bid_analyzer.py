from datetime import datetime

class BidAnalyzer:
    def analyze_profitability(self, opportunity, pricing_data):
        """Analyze profitability instead of making binary decisions"""
        naics_code = (opportunity.get('naicsCode') or 
                     opportunity.get('naics_code') or 
                     opportunity.get('naics'))
        
        analysis = {
            'naics_code': naics_code,
            'recommended_price': pricing_data['recommended_price'],
            'cost_basis': pricing_data.get('cost_basis', 0),
            'potential_profit': pricing_data.get('potential_profit', 0),
            'gross_margin': pricing_data.get('gross_margin', 0),
            'profitability_rating': self.calculate_profitability_rating(pricing_data),
            'within_capabilities': self.check_capabilities(naics_code),
            'opportunity_size': self.get_opportunity_size(pricing_data['recommended_price']),
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        print(f"  📊 Profit Analysis:")
        print(f"     Recommended Price: ${analysis['recommended_price']:,.2f}")
        print(f"     Potential Profit: ${analysis['potential_profit']:,.2f}")
        print(f"     Gross Margin: {analysis['gross_margin']}%")
        print(f"     Profitability: {analysis['profitability_rating']}")
        
        return analysis
    
    def calculate_profitability_rating(self, pricing_data):
        """Calculate profitability rating instead of binary decision"""
        margin = pricing_data.get('gross_margin', 0)
        
        if margin > 40:
            return "Excellent"
        elif margin > 30:
            return "Good" 
        elif margin > 20:
            return "Moderate"
        elif margin > 10:
            return "Low"
        else:
            return "Marginal"
    
    def get_opportunity_size(self, price):
        """Categorize opportunity size"""
        if price > 500000:
            return "Large"
        elif price > 100000:
            return "Medium"
        elif price > 25000:
            return "Small"
        else:
            return "Micro"
    
    def check_capabilities(self, naics_code):
        """Check if this matches our business capabilities"""
        our_naics_codes = ['561210', '561720', '541611', '562111', '541620']
        return naics_code in our_naics_codes if naics_code else False