from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import sys

# Add lib/python to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

from sow_generator_pdf import SOWGeneratorPDF

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST request to generate SOW PDF"""
        try:
            # Read and parse request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data)

            # Extract required data
            rfp_data = request_data.get('rfp_data', {})
            subcontractor = request_data.get('subcontractor', {'name': 'Subcontractor'})
            sow_id = request_data.get('sow_id', 'SOW-' + str(os.urandom(8).hex()))

            # Validate required fields
            if not rfp_data.get('title'):
                raise ValueError('rfp_data.title is required')
            if not rfp_data.get('solicitation_number'):
                raise ValueError('rfp_data.solicitation_number is required')
            if not rfp_data.get('naics_code'):
                raise ValueError('rfp_data.naics_code is required')

            # Generate PDF using existing generator
            generator = SOWGeneratorPDF()
            pdf_path = generator.generate_pdf_sow(rfp_data, subcontractor, sow_id)

            # Read PDF file as base64
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            # Get file name
            file_name = os.path.basename(pdf_path)

            # Clean up temp file
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'status': 'success',
                'pdf_base64': pdf_base64,
                'file_name': file_name,
                'sow_id': sow_id
            }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            error_response = {
                'status': 'error',
                'error': str(e),
                'type': type(e).__name__
            }

            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
