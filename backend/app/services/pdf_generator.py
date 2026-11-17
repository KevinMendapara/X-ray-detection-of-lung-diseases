import os
import json
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf_report(analysis: dict, patient: dict, output_pdf_path: str):
    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom colors
    primary_color = colors.HexColor("#1769AA")
    dark_navy = colors.HexColor("#183153")
    teal_color = colors.HexColor("#17A2A4")
    light_bg = colors.HexColor("#EAF4FC")
    alert_red = colors.HexColor("#D32F2F")
    success_green = colors.HexColor("#2E7D32")
    warning_orange = colors.HexColor("#ED6C02")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=primary_color,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=12
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=dark_navy,
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#222222")
    )
    bold_style = ParagraphStyle(
        'BoldDark',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#222222")
    )
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#666666")
    )

    elements = []

    aid = analysis.get("id", 1)
    created_at = analysis.get("created_at", "")[:19].replace("T", " ")
    model_version = analysis.get("model_version", "DenseNet121-SVM-v1.0 (ICMR Cohort)")

    # Header Banner
    header_data = [
        [
            Paragraph("<b>TB DETECT AI</b><br/><font size=7 color='#17A2A4'>Pulmonary Tuberculosis Explainable Decision-Support System</font>", title_style),
            Paragraph(f"<b>REPORT ID:</b> AR-{aid:05d}<br/><b>DATE:</b> {created_at} UTC<br/><b>MODEL:</b> {model_version}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[3.8 * inch, 3.7 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=8))

    # A. Patient Information
    elements.append(Paragraph("A. PATIENT DEMOGRAPHICS & CLINICAL HISTORY", section_heading))
    patient_table_data = [
        [Paragraph("<b>Patient ID:</b>", bold_style), Paragraph(patient.get("id", ""), body_style),
         Paragraph("<b>Full Name:</b>", bold_style), Paragraph(patient.get("full_name", ""), body_style)],
        [Paragraph("<b>Age / Gender:</b>", bold_style), Paragraph(f"{patient.get('age', '')} yrs / {patient.get('gender', '')}", body_style),
         Paragraph("<b>Contact:</b>", bold_style), Paragraph(patient.get("contact_number") or "N/A", body_style)],
        [Paragraph("<b>Reported Symptoms:</b>", bold_style), Paragraph(patient.get("symptoms") or "None noted", body_style),
         Paragraph("<b>Duration of Symptoms:</b>", bold_style), Paragraph(patient.get("symptom_duration") or "N/A", body_style)],
        [Paragraph("<b>Previous TB History:</b>", bold_style), Paragraph(patient.get("previous_tb_history") or "No", body_style),
         Paragraph("<b>Medical Background:</b>", bold_style), Paragraph(patient.get("medical_history") or "None reported", body_style)]
    ]
    p_table = Table(patient_table_data, colWidths=[1.4 * inch, 2.3 * inch, 1.4 * inch, 2.4 * inch])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CFD8DC")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 8))

    # B & C. AI Detection Result & Classification Output
    elements.append(Paragraph("B. AI DETECTION RESULTS & HYBRID DENSENET121 + SVM OUTPUT", section_heading))

    pred = analysis.get("prediction", "Inconclusive")
    is_tb = "TB Suspected" in pred
    result_color = alert_red if is_tb else (success_green if "Not Detected" in pred else warning_orange)

    conf = analysis.get("confidence_score", 0.0)
    decision = analysis.get("svm_decision_score", 0.0)
    quality = analysis.get("image_quality_status", "Optimal Diagnostic Quality")

    result_box_data = [
        [
            Paragraph(f"<font color='{result_color.hexval()}'><b>PREDICTION: {pred.upper()}</b></font>", ParagraphStyle('ResHead', fontName='Helvetica-Bold', fontSize=12, leading=14)),
            Paragraph(f"<b>Calibrated Model Confidence:</b> {conf:.2f}%<br/><b>SVM Margin Decision Score:</b> {decision:+.4f}", body_style),
            Paragraph(f"<b>Image Quality Status:</b> {quality}<br/><b>Dataset Standard:</b> ICMR-NIRT Benchmark", body_style)
        ]
    ]
    r_table = Table(result_box_data, colWidths=[2.6 * inch, 2.5 * inch, 2.4 * inch])
    r_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8F9FA")),
        ('BOX', (0, 0), (-1, -1), 1.5, result_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(r_table)
    elements.append(Spacer(1, 8))

    # Clinician review metadata is kept distinct from automated model output.
    review_status = escape(str(analysis.get("review_status") or "Pending Review"))
    clinician_notes = escape(str(analysis.get("clinician_notes") or "No clinician notes recorded."))
    elements.append(Paragraph("CLINICIAN REVIEW & FOLLOW-UP", section_heading))
    review_table = Table([[Paragraph(f"<b>Review status:</b> {review_status}<br/><b>Reviewed at:</b> {escape(str(analysis.get('reviewed_at') or 'Not reviewed'))}", body_style), Paragraph(f"<b>Clinician notes:</b><br/>{clinician_notes}", body_style)]], colWidths=[2.6 * inch, 4.9 * inch])
    review_table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F4F8F8")), ('BOX', (0, 0), (-1, -1), .6, colors.HexColor("#CFD8DC")), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    elements.append(review_table)
    elements.append(Spacer(1, 8))

    # D. Visualizations
    elements.append(Paragraph("C. EXPLAINABLE AI VISUALIZATION (GRAD-CAM++ LUNG ACTIVATION MAPS)", section_heading))

    col_w = 2.45 * inch
    img_h = 1.9 * inch

    def make_rl_img(p):
        if p and os.path.exists(p):
            return RLImage(p, width=col_w - 6, height=img_h)
        return Paragraph("<center>[Image Preview]</center>", body_style)

    images_row = [
        make_rl_img(analysis.get("full_processed_path")),
        make_rl_img(analysis.get("full_heatmap_path")),
        make_rl_img(analysis.get("full_overlay_path"))
    ]
    caption_row = [
        Paragraph("<center><b>Original Preprocessed CXR</b><br/>224x224 Windowed</center>", body_style),
        Paragraph("<center><b>Grad-CAM++ Heatmap</b><br/>Blue (Low) to Red (High)</center>", body_style),
        Paragraph("<center><b>Heatmap Overlay on CXR</b><br/>60% Anatomy + 40% CAM</center>", body_style)
    ]
    vis_table = Table([images_row, caption_row], colWidths=[col_w, col_w, col_w])
    vis_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(vis_table)
    elements.append(Spacer(1, 8))

    # Zone Analysis Breakdown
    zones = {}
    raw_zone = analysis.get("zone_analysis_json", "")
    if isinstance(raw_zone, str) and raw_zone:
        try:
            zones = json.loads(raw_zone)
        except Exception:
            pass
    elif isinstance(raw_zone, dict):
        zones = raw_zone

    if zones:
        elements.append(Paragraph("D. RADIOLOGICAL LUNG ZONE ACTIVATION METRICS", section_heading))
        zone_rows = [
            [
                Paragraph("<b>Anatomical Lung Zone</b>", bold_style),
                Paragraph("<b>Mean Activation</b>", bold_style),
                Paragraph("<b>Max Activation</b>", bold_style),
                Paragraph("<b>Highlighted Area %</b>", bold_style),
                Paragraph("<b>Model Status</b>", bold_style)
            ],
            [
                Paragraph("Anatomical Right Lung (Viewer Left)", body_style),
                Paragraph(f"{zones.get('anatomical_right_lung', {}).get('mean_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('anatomical_right_lung', {}).get('max_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('anatomical_right_lung', {}).get('highlighted_area_pct', 0)}%", body_style),
                Paragraph(zones.get('anatomical_right_lung', {}).get('clinical_status', 'N/A'), body_style)
            ],
            [
                Paragraph("Anatomical Left Lung (Viewer Right)", body_style),
                Paragraph(f"{zones.get('anatomical_left_lung', {}).get('mean_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('anatomical_left_lung', {}).get('max_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('anatomical_left_lung', {}).get('highlighted_area_pct', 0)}%", body_style),
                Paragraph(zones.get('anatomical_left_lung', {}).get('clinical_status', 'N/A'), body_style)
            ],
            [
                Paragraph("Upper Lung Zone (Apical)", body_style),
                Paragraph(f"{zones.get('upper_lung_zone', {}).get('mean_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('upper_lung_zone', {}).get('max_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('upper_lung_zone', {}).get('highlighted_area_pct', 0)}%", body_style),
                Paragraph(zones.get('upper_lung_zone', {}).get('clinical_status', 'N/A'), body_style)
            ],
            [
                Paragraph("Middle Lung Zone (Hilar/Perihilar)", body_style),
                Paragraph(f"{zones.get('middle_lung_zone', {}).get('mean_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('middle_lung_zone', {}).get('max_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('middle_lung_zone', {}).get('highlighted_area_pct', 0)}%", body_style),
                Paragraph(zones.get('middle_lung_zone', {}).get('clinical_status', 'N/A'), body_style)
            ],
            [
                Paragraph("Lower Lung Zone (Basilar)", body_style),
                Paragraph(f"{zones.get('lower_lung_zone', {}).get('mean_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('lower_lung_zone', {}).get('max_activation_pct', 0)}%", body_style),
                Paragraph(f"{zones.get('lower_lung_zone', {}).get('highlighted_area_pct', 0)}%", body_style),
                Paragraph(zones.get('lower_lung_zone', {}).get('clinical_status', 'N/A'), body_style)
            ]
        ]
        zone_table = Table(zone_rows, colWidths=[2.2 * inch, 1.3 * inch, 1.3 * inch, 1.3 * inch, 1.4 * inch])
        zone_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CFD8DC")),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(zone_table)
        elements.append(Spacer(1, 6))

    # E & F. Observations & Recovery Information
    elements.append(Paragraph("E. CLINICAL OBSERVATIONS & RECOVERY GUIDANCE", section_heading))
    guidance_text = (
        "<b>Automated Observations:</b> Heatmap highlights indicate mathematical feature activations of the DenseNet121 convolutional "
        "filters influencing the SVM classifier. Heatmap activation is not a direct measurement of active mycobacterial colony count, "
        "cavitation, or anatomical pathology.<br/>"
        "<b>Recovery & Treatment Facts:</b><br/>"
        "• <b>Tuberculosis is treatable and curable</b> when identified early and managed with standard first-line antimicrobial therapy.<br/>"
        "• <b>Consult a Physician:</b> Always review symptoms with a certified pulmonologist or infectious disease specialist.<br/>"
        "• <b>Confirmatory Diagnostics:</b> Radiographic screening must be supplemented by microbiological testing, including sputum smear microscopy and CBNAAT/GeneXpert molecular assays.<br/>"
        "• <b>Treatment Adherence:</b> If prescribed anti-TB therapy, complete the entire medication course (typically 6 months) strictly as directed to prevent drug resistance (MDR-TB).<br/>"
        "• <b>Avoid Self-Medication:</b> Do not initiate antibiotics or discontinue regimen without clinical supervision."
    )
    elements.append(Paragraph(guidance_text, body_style))
    elements.append(Spacer(1, 8))

    # G. Mandatory Medical Disclaimer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#B0BEC5"), spaceBefore=4, spaceAfter=6))
    elements.append(Paragraph("<b>MANDATORY MEDICAL DISCLAIMER:</b>", bold_style))
    disclaimer_text = (
        "This report is generated using an artificial intelligence research system. It is not a confirmed medical diagnosis. "
        "AI predictions and Grad-CAM++ visualizations may contain errors. Please consult a qualified radiologist or healthcare "
        "professional for clinical interpretation and appropriate diagnostic testing."
    )
    elements.append(Paragraph(disclaimer_text, disclaimer_style))

    # Build Document
    doc.build(elements)
    return output_pdf_path
