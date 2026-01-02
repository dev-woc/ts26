from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime, timedelta

# Add lib to path for importing shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

from api.sam_client import SAMClient

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """
        Fetch opportunities from SAM.gov API

        Request body (JSON):
        {
            "limit": 50,
            "posted_days_ago": 60,
            "min_deadline_days": 14,
            "naics_code": "334519" (optional),
            "status": "active" (optional)
        }

        Response:
        {
            "status": "success",
            "count": 10,
            "opportunities": [...],
            "timestamp": "2024-01-02T..."
        }
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                params = json.loads(body.decode('utf-8'))
            else:
                params = {}

            # Extract parameters with defaults
            limit = params.get('limit', 50)
            posted_days_ago = params.get('posted_days_ago', 60)
            min_deadline_days = params.get('min_deadline_days', 14)
            naics_code = params.get('naics_code')
            status = params.get('status', 'active')

            # Calculate date range
            today = datetime.now()
            start_date = today - timedelta(days=posted_days_ago)
            min_deadline_date = today + timedelta(days=min_deadline_days)

            # Initialize SAM client
            sam_client = SAMClient()

            # Build search parameters
            search_params = {
                'limit': limit,
                'postedFrom': start_date.strftime('%m/%d/%Y'),
                'postedTo': today.strftime('%m/%d/%Y'),
                'ptype': 'o',  # Opportunities
            }

            if naics_code:
                search_params['ncode'] = naics_code

            # Fetch opportunities
            opportunities = sam_client.search_opportunities(search_params)

            # Filter by deadline (only keep opps with deadline >= min_deadline_days)
            filtered_opportunities = []
            for opp in opportunities:
                deadline_str = opp.get('responseDeadLine')

                if not deadline_str:
                    # No deadline, include it
                    filtered_opportunities.append(opp)
                    continue

                try:
                    # Parse deadline
                    deadline_date = datetime.strptime(deadline_str, '%Y-%m-%dT%H:%M:%SZ')

                    # Check if deadline is far enough away
                    if deadline_date >= min_deadline_date:
                        filtered_opportunities.append(opp)
                except ValueError:
                    # Can't parse date, include it anyway
                    filtered_opportunities.append(opp)

            # Return response
            response_data = {
                "status": "success",
                "count": len(filtered_opportunities),
                "total_fetched": len(opportunities),
                "filtered_count": len(opportunities) - len(filtered_opportunities),
                "opportunities": filtered_opportunities,
                "timestamp": datetime.now().isoformat(),
                "search_params": {
                    "posted_from": start_date.strftime('%Y-%m-%d'),
                    "posted_to": today.strftime('%Y-%m-%d'),
                    "min_deadline_date": min_deadline_date.strftime('%Y-%m-%d'),
                    "naics_code": naics_code
                }
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            # Error response
            error_response = {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
