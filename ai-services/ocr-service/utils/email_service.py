import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging

logger = logging.getLogger("ocr_service.email_service")

# SMTP Server Configurations (Load from Environment or default to local debug server)
SMTP_HOST = os.environ.get("SMTP_HOST", "localhost")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "1025"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "no-reply@sanad-assurance.tn")

def send_confirmation_email(user_email: str, user_info: dict) -> bool:
    """
    Formulates a premium HTML registration receipt email containing
    the user's verification details and sends it via SMTP.
    """
    if not user_email:
        logger.warning("No recipient email provided.")
        return False
        
    subject = "Vérification KYC Réussie - SANAD Assurance"
    
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
            .table-container {{
                margin-top: 30px;
                border-top: 1px solid #f1f5f9;
                padding-top: 20px;
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
                <span class="success-badge">Identité vérifiée avec succès</span>
            </div>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.5; text-align: center; margin-top: 15px;">
                Bonjour, votre identité a été validée via notre système d'intelligence artificielle. Voici les informations enregistrées sur votre compte :
            </p>
            
            <div class="table-container">
                <table>
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
