from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime

# Add lib to path for importing shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/python'))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests - simple health check"""
        response_data = {
            "status": "success",
            "message": "Python serverless function is working!",
            "timestamp": datetime.now().isoformat(),
            "python_version": sys.version,
            "path_info": sys.path[:3]
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data, indent=2).encode())

    def do_POST(self):
        """Handle POST requests - echo back the data"""
        content_length = int(self.headers.get('Content-Length', 0))

        if content_length > 0:
            body = self.rfile.read(content_length)
            try:
                request_data = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                request_data = {"error": "Invalid JSON"}
        else:
            request_data = {}

        response_data = {
            "status": "success",
            "message": "POST request received",
            "timestamp": datetime.now().isoformat(),
            "received_data": request_data,
            "echo": f"You sent: {request_data.get('message', 'No message')}"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data, indent=2).encode())
