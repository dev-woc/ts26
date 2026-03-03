import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Create a temporary Python script to run the generator
    const tempScript = `
import sys
import json
import base64
import os
from datetime import datetime
sys.path.append('${path.join(process.cwd(), 'lib', 'python').replace(/\\/g, '/')}')

from sow_generator_pdf import SOWGeneratorPDF

# Parse input
input_data = json.loads('''${JSON.stringify(body)}''')

rfp_data = input_data.get('rfp_data', {})
subcontractor = input_data.get('subcontractor', {'name': 'Subcontractor'})
sow_id = input_data.get('sow_id', 'SOW-default')

# Generate PDF
generator = SOWGeneratorPDF()
pdf_path = generator.generate_pdf_sow(rfp_data, subcontractor, sow_id)

# Read PDF and convert to base64
with open(pdf_path, 'rb') as f:
    pdf_base64 = base64.b64encode(f.read()).decode('utf-8')

# Generate structured content
service_desc = generator.get_service_description(rfp_data.get('naics_code', ''))

structured_content = {
    'header': {
        'title': 'SCOPE OF WORK (SOW)',
        'date': datetime.now().strftime('%B %d, %Y'),
        'sow_id': sow_id,
        'prepared_for': subcontractor.get('name', 'Subcontractor'),
        'prepared_by': '[Your Company Name]'
    },
    'project': {
        'title': rfp_data.get('title', 'Untitled'),
        'solicitation_number': rfp_data.get('solicitation_number', 'N/A'),
        'agency': rfp_data.get('agency', 'Various'),
        'naics_code': rfp_data.get('naics_code', 'N/A')
    },
    'sections': [
        {
            'title': '1.0 BACKGROUND & INTRODUCTION',
            'content': f"This Scope of Work (SOW) is provided by [Your Company Name] to {subcontractor.get('name', 'Subcontractor')} in connection with a proposal we are submitting to {rfp_data.get('agency', 'the Government Agency')} under Solicitation Number {rfp_data.get('solicitation_number', 'N/A')}."
        },
        {
            'title': '2.0 SCOPE OF SERVICES REQUIRED',
            'content': f"The Subcontractor shall provide the following services: {service_desc}. Professional execution of all tasks outlined in the solicitation, compliance with all federal, state, and local regulations, and quality assurance with timely delivery of services."
        },
        {
            'title': '3.0 PERIOD OF PERFORMANCE',
            'content': 'The anticipated period of performance will align with the solicitation requirements.'
        },
        {
            'title': '4.0 DELIVERABLES',
            'content': 'Completion of all services outlined in Section 2.0, weekly progress reports to the Prime Contractor, and final deliverable submission upon project completion.'
        }
    ]
}

# Output JSON response
print(json.dumps({
    'status': 'success',
    'pdf_base64': pdf_base64,
    'file_name': os.path.basename(pdf_path),
    'structured_content': structured_content
}))

# Clean up
os.remove(pdf_path)
`

    // Execute Python script
    const python = spawn('python3', ['-c', tempScript])

    let stdout = ''
    let stderr = ''

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    const exitCode = await new Promise<number>((resolve) => {
      python.on('close', resolve)
    })

    if (exitCode !== 0) {
      throw new Error(`Python script failed: ${stderr}`)
    }

    // Extract JSON from stdout (filter out print statements)
    const lines = stdout.trim().split('\n')
    const jsonLine = lines.find((line) => line.startsWith('{'))

    if (!jsonLine) {
      throw new Error('No JSON output from Python script')
    }

    const result = JSON.parse(jsonLine)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing Python script:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
