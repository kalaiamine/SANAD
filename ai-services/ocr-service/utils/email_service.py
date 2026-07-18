import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging

logger = logging.getLogger("ocr_service.email_service")

def load_env_file():
    # Check service dir, ai-services dir, and project root for a .env file
    paths = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
    ]
    for path in paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip()
                            val = val.strip()
                            # Strip quotes
                            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                val = val[1:-1]
                            if key not in os.environ:
                                os.environ[key] = val
            except Exception as e:
                logger.error(f"Error loading .env file from {path}: {e}")

# Load environment file before configuring SMTP
load_env_file()

# SMTP Server Configurations (Load from Environment or default to local debug server)
# Both naming conventions are accepted: SMTP_HOST/SMTP_SERVER, SMTP_USER/SMTP_USERNAME, SMTP_FROM/SMTP_SENDER
SMTP_HOST = os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER", "localhost")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "1025"))
SMTP_USER = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM") or os.environ.get("SMTP_SENDER") or SMTP_USER or "no-reply@sanad-assurance.tn"

def send_confirmation_email(user_email: str, user_info: dict) -> bool:
    """
    Formulates a premium HTML registration receipt email containing
    the user's verification details and sends it via SMTP.
    """
    if not user_email:
        logger.warning("No recipient email provided.")
        return False
        
    subject = "Vérification KYC Réussie - SANAD Assurance"
    
    # Extract audit and AML details
    dossier_id = user_info.get('dossierId', 'Non spécifié')
    aml_level = user_info.get('amlLevel', 'LOW')
    aml_score = user_info.get('amlScore', 0)
    audit_steps = user_info.get('auditSteps', [])
    
    # Styling for AML badge
    aml_color = "#16a34a"  # green
    aml_bg = "#f0fdf4"
    if aml_level == "MEDIUM":
        aml_color = "#d97706"  # amber
        aml_bg = "#fef3c7"
    elif aml_level == "HIGH":
        aml_color = "#ea580c"  # orange
        aml_bg = "#ffedd5"
    elif aml_level == "CRITICAL":
        aml_color = "#dc2626"  # red
        aml_bg = "#fee2e2"

    steps_html = ""
    for step in audit_steps:
        status_color = "#16a34a" if step.get('status') == "SUCCESS" or step.get('status') == "PASSED" else "#ea580c"
        steps_html += f"""
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; font-size: 13px; color: #475569; font-weight: 500;">{step.get('step', '')}</td>
            <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 400;">{step.get('timestamp', '')[:19].replace('T', ' ')}</td>
            <td style="padding: 8px 0; font-size: 13px; color: {status_color}; font-weight: 600; text-align: right;">{step.get('status', '')}</td>
        </tr>
        """

    # Premium styled HTML Template
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f6f9fc;
                color: #333333;
                margin: 0;
                padding: 40px;
            }}
            .card {{
                max-width: 600px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                padding: 30px;
                margin: 0 auto;
                border: 1px solid #eef2f5;
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #0284c7;
                text-align: center;
                margin-bottom: 25px;
            }}
            .header {{
                font-size: 18px;
                color: #0f172a;
                margin-bottom: 20px;
                text-align: center;
                font-weight: 600;
            }}
            .success-badge {{
                display: inline-block;
                background-color: #f0fdf4;
                color: #16a34a;
                border: 1px solid #bbf7d0;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                margin: 10px auto;
                text-align: center;
            }}
            .aml-badge {{
                display: inline-block;
                background-color: {aml_bg};
                color: {aml_color};
                border: 1px solid {aml_color}30;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }}
            .section-title {{
                font-size: 14px;
                font-weight: 700;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 30px;
                margin-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 5px;
            }}
            .table-container {{
                margin-top: 15px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
            }}
            th, td {{
                text-align: left;
                padding: 10px 0;
                font-size: 14px;
            }}
            th {{
                color: #64748b;
                font-weight: 500;
                width: 40%;
            }}
            td {{
                color: #0f172a;
                font-weight: 600;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 12px;
                color: #94a3b8;
                text-align: center;
                border-top: 1px solid #f1f5f9;
                padding-top: 25px;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">SANAD ASSURANCE</div>
            <div class="header">Confirmation de votre inscription</div>
            <div style="text-align: center;">
                <span class="success-badge">Dossier KYC Validé</span>
            </div>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.5; text-align: center; margin-top: 15px;">
                Bonjour, votre identité a été validée via notre système d'intelligence artificielle partagé. Voici les informations enregistrées sur votre dossier KYC réutilisable :
            </p>

            <div class="section-title">Informations de l'Assuré</div>
            <div class="table-container">
                <table>
                    <tr>
                        <th>ID du Dossier KYC</th>
                        <td style="color: #0284c7; font-family: monospace;">{dossier_id}</td>
                    </tr>
                    <tr>
                        <th>Nom complet (Latin)</th>
                        <td>{user_info.get('fullNameLatin', '-')}</td>
                    </tr>
                    <tr>
                        <th>Nom complet (Arabic)</th>
                        <td>{user_info.get('fullNameArabic', '-')}</td>
                    </tr>
                    <tr>
                        <th>CIN (Numéro)</th>
                        <td>{user_info.get('cin', '-')}</td>
                    </tr>
                    <tr>
                        <th>Date de naissance</th>
                        <td>{user_info.get('birthDate', '-')}</td>
                    </tr>
                    <tr>
                        <th>Lieu de naissance</th>
                        <td>{user_info.get('birthPlace', '-')}</td>
                    </tr>
                    <tr>
                        <th>Nom du père</th>
                        <td>{user_info.get('fatherName', '-')}</td>
                    </tr>
                    <tr>
                        <th>Téléphone</th>
                        <td>{user_info.get('phone', '-')}</td>
                    </tr>
                    <tr>
                        <th>Adresse Résidence</th>
                        <td>{user_info.get('address', '-')}</td>
                    </tr>
                </table>
            </div>

            <div class="section-title">Évaluation AML/CFT (Loi 2015-26)</div>
            <div style="margin-top: 15px; background-color: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0;">
                <table style="width: 100%;">
                    <tr>
                        <th style="font-weight: 500; font-size: 13px; color: #64748b;">Niveau de Risque AML</th>
                        <td><span class="aml-badge">{aml_level}</span></td>
                    </tr>
                    <tr>
                        <th style="font-weight: 500; font-size: 13px; color: #64748b;">Score de Risque</th>
                        <td style="font-size: 14px; font-weight: 700; color: #334155;">{aml_score} / 100</td>
                    </tr>
                    <tr>
                        <th style="font-weight: 500; font-size: 13px; color: #64748b;">Conformité Réglementaire</th>
                        <td style="font-size: 12px; color: #64748b; font-weight: 400;">Filtrage des sanctions et PEP effectué conformément à la Loi 2015-26.</td>
                    </tr>
                </table>
            </div>

            {f'''
            <div class="section-title">Piste d'Audit Unifiée (Audit Trail)</div>
            <div class="table-container">
                <table style="width: 100%;">
                    <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1;">
                            <th style="padding-bottom: 8px; font-size: 12px; font-weight: 600; text-align: left; color: #475569;">Étape</th>
                            <th style="padding-bottom: 8px; font-size: 12px; font-weight: 600; text-align: left; color: #475569;">Horodatage</th>
                            <th style="padding-bottom: 8px; font-size: 12px; font-weight: 600; text-align: right; color: #475569;">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {steps_html}
                    </tbody>
                </table>
            </div>
            ''' if steps_html else ''}
            
            <div class="footer">
                Ce message a été généré automatiquement par le service KYC SANAD.<br/>
                © 2026 SANAD Assurance. Tous droits réservés.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Build MIME message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = user_email
    msg.attach(MIMEText(html_content, 'html'))
    
    # Try sending email
    try:
        # Check if dummy localhost or unconfigured
        if SMTP_HOST == "localhost" and SMTP_PORT == 1025:
            # Check if port 1025 is actually open
            logger.info("Attempting local debug SMTP dispatch...")
            
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5)
        if SMTP_USER and SMTP_PASSWORD:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            
        server.sendmail(SMTP_FROM, [user_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent registration receipt email to {user_email}")
        return True
    except Exception as e:
        # Graceful fallback: log the email content so we don't break registration in dev
        logger.error(f"SMTP dispatch failed: {e}. Fallback to printing email content locally.")
        logger.info(f"--- FALLBACK EMAIL SIMULATION FOR {user_email} ---")
        logger.info(f"Subject: {subject}")
        logger.info(f"Extracted info: {user_info}")
        logger.info("--------------------------------------------------")
        return False
