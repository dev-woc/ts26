import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

class SOWGeneratorPDF:
    def generate_pdf_sow(self, rfp_data, subcontractor, sow_id):
        """Generate a professional PDF SOW document"""
        print(f"📝 Generating PDF SOW for {subcontractor['name']}")

        # Create PDF directory if it doesn't exist
        os.makedirs('sows', exist_ok=True)
        
        # Create filename
        safe_name = subcontractor['name'].replace(' ', '_').replace('/', '_')
        filename = f"sows/SOW_{sow_id}_{safe_name}.pdf"
        
        # Create PDF document
        doc = SimpleDocTemplate(filename, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center aligned
        )
        story.append(Paragraph("SCOPE OF WORK (SOW)", title_style))
        story.append(Spacer(1, 12))
        
        # Document details
        details_style = styles["Normal"]
        story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", details_style))
        story.append(Paragraph(f"<b>SOW ID:</b> {sow_id}", details_style))
        story.append(Paragraph(f"<b>Prepared For:</b> {subcontractor['name']}", details_style))
        story.append(Paragraph(f"<b>Prepared By:</b> [Your Company Name]", details_style))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph(f"<b>Project:</b> {rfp_data['title']}", details_style))
        story.append(Paragraph(f"<b>Solicitation Number:</b> {rfp_data['solicitation_number']}", details_style))
        story.append(Paragraph(f"<b>Government Agency:</b> {rfp_data.get('agency', 'Various')}", details_style))
        story.append(Paragraph(f"<b>NAICS Code:</b> {rfp_data['naics_code']}", details_style))
        story.append(Spacer(1, 20))
        
        # Sections
        sections = [
            ("1.0 BACKGROUND & INTRODUCTION", 
             f"This Scope of Work (SOW) is provided by [Your Company Name] to {subcontractor['name']} "
             f"in connection with a proposal we are submitting to {rfp_data.get('agency', 'the Government Agency')} "
             f"under Solicitation Number {rfp_data['solicitation_number']}."),
            
            ("2.0 SCOPE OF SERVICES REQUIRED", 
             f"The Subcontractor shall provide the following services: {self.get_service_description(rfp_data['naics_code'])}. "
             "Professional execution of all tasks outlined in the solicitation, compliance with all federal, "
             "state, and local regulations, and quality assurance with timely delivery of services."),
            
            ("3.0 PERIOD OF PERFORMANCE", 
             "The anticipated period of performance will align with the solicitation requirements."),
            
            ("4.0 DELIVERABLES", 
             "Completion of all services outlined in Section 2.0, weekly progress reports to the Prime Contractor, "
             "and final deliverable submission upon project completion."),
        ]
        
        for title, content in sections:
            story.append(Paragraph(f"<b>{title}</b>", styles["Heading2"]))
            story.append(Paragraph(content, details_style))
            story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
        print(f"✅ PDF SOW saved: {filename}")
        return filename

    def get_service_description(self, naics_code):
        """Get service description based on NAICS code"""
        descriptions = {
            '561210': 'Facilities support and management services',
            '562111': 'Solid waste collection and disposal services',
            '334519': 'Manufacturing and calibration of measuring instruments',
            '541620': 'Environmental consulting services',
            '237990': 'Heavy construction and civil engineering services',
            '336413': 'Aircraft parts manufacturing and assembly',
            '513210': 'Software development and technical support services',
        }
        return descriptions.get(naics_code, 'Professional services as specified in the solicitation')
