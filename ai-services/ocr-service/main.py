import os
import shutil
import logging
from typing import List

# Prevent OpenMP/MKL thread contention and deadlock in FastAPI/Uvicorn on Windows CPU.
# 1 thread avoids the deadlock but makes OCR ~4x slower; 4 threads is stable with a
# single uvicorn worker and leaves headroom for the Next.js dev server.
os.environ['OMP_NUM_THREADS'] = '4'
os.environ['MKL_NUM_THREADS'] = '4'

# Disable oneDNN/MKLDNN to avoid PIR ConvertPirAttribute2RuntimeAttribute crash on Windows
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT'] = '0'

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from paddleocr import PaddleOCR
from utils.preprocessing import preprocess_image
from utils.parser import classify_document, parse_identity_card, parse_invoice
from utils.models import OCRResponse
from utils.facematch import compare_faces
from utils.email_service import send_confirmation_email
from utils.aml_screening import screen_identity
from utils.audit_trail import create_dossier, add_step as audit_add_step, get_dossier, update_identity, list_all_dossiers
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ocr_service")

app = FastAPI(title="SANAD OCR Microservice", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize PaddleOCR globally
# Configured with Arabic ('ar') multilingual model supporting Arabic, Latin, and numbers
# We disable document unwarping and orientation classification (use_doc_unwarping=False, use_doc_orientation_classify=False)
# to avoid loading heavy dewarping models (like UVDoc) which take ages on CPU.
# We use the default PP-OCRv5 server detection model as it provides high accuracy for numbers and names.
logger.info("Initializing PaddleOCR model (lang='ar', use_textline_orientation=True)...")
try:
    ocr_engine = PaddleOCR(
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=True,
        lang="ar",
        enable_mkldnn=False
    )
    logger.info("PaddleOCR engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize PaddleOCR engine: {e}", exc_info=True)
    ocr_engine = None

@app.get("/")
def read_root():
    return {
        "service": "SANAD OCR",
        "status": "running" if ocr_engine is not None else "failed_initialization"
    }

@app.post("/ocr", response_model=OCRResponse)
async def perform_ocr(file: UploadFile = File(...)):
    # 1. Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded"
        )
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".pdf", ".bmp", ".webp", ".tiff", ".tif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format {ext}. Allowed formats: JPG, PNG, PDF, BMP, WEBP, TIFF"
        )

    temp_input_path = os.path.join(UPLOAD_DIR, f"input_{file.filename}")
    temp_output_path = os.path.join(UPLOAD_DIR, f"preprocessed_{file.filename}")
    # Ensure preprocessed output is always a supported format (PNG)
    temp_output_png = os.path.splitext(temp_output_path)[0] + ".png"

    try:
        # 2. Save uploaded file to disk
        logger.info(f"Receiving file upload: {file.filename}")
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Verify file size/integrity
        if os.path.getsize(temp_input_path) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty or corrupted"
            )

        # 4. Image Preprocessing
        logger.info("Running image preprocessing pipeline...")
        preprocessed_path = preprocess_image(temp_input_path, temp_output_png)

        # 5. Run PaddleOCR
        if ocr_engine is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PaddleOCR engine is not initialized or failed to load"
            )

        logger.info("Running PaddleOCR text detection & recognition...")

        # PaddleOCR v3.7 uses .predict() which returns a generator of result objects
        ocr_results = list(ocr_engine.predict(preprocessed_path))

        raw_text_lines = []
        confidences = []

        for result in ocr_results:
            if result is None:
                continue
            # In PaddleOCR v3.7, each result is an object with a 'rec_texts', 'rec_scores',
            # and 'dt_polys' attributes, or it may be dict-like.
            # Let's handle both dict and object attribute access patterns.
            try:
                # Try attribute access first (PaddleOCR v3.7 result objects)
                if hasattr(result, 'rec_texts') and result.rec_texts is not None:
                    texts = result.rec_texts
                    scores = result.rec_scores if hasattr(result, 'rec_scores') else []
                    for i, text in enumerate(texts):
                        if text and text.strip():
                            raw_text_lines.append(text.strip())
                            if i < len(scores):
                                confidences.append(float(scores[i]))
                # Try dict-like access
                elif isinstance(result, dict):
                    texts = result.get('rec_texts', result.get('rec_text', []))
                    scores = result.get('rec_scores', result.get('rec_score', []))
                    if isinstance(texts, str):
                        texts = [texts]
                    if isinstance(scores, (int, float)):
                        scores = [scores]
                    for i, text in enumerate(texts):
                        if text and text.strip():
                            raw_text_lines.append(text.strip())
                            if i < len(scores):
                                confidences.append(float(scores[i]))
                # Fallback: old-style list of [[box, (text, conf)], ...]
                elif isinstance(result, list):
                    for line in result:
                        if isinstance(line, (list, tuple)) and len(line) >= 2:
                            text_info = line[1] if len(line) > 1 else line[0]
                            if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                                raw_text_lines.append(str(text_info[0]))
                                confidences.append(float(text_info[1]))
                            elif isinstance(text_info, str):
                                raw_text_lines.append(text_info)
            except Exception as parse_err:
                logger.warning(f"Could not parse OCR result item: {parse_err}. Raw: {str(result)[:200]}")
                continue

        avg_confidence = float(sum(confidences) / len(confidences) * 100) if confidences else 0.0
        logger.info(f"OCR Complete. Detected {len(raw_text_lines)} text lines. Average confidence: {avg_confidence:.2f}%")
        logger.info(f"Raw text lines: {raw_text_lines}")

        # 6. Classify Document Type
        document_type = classify_document(raw_text_lines)
        logger.info(f"Classified document type: {document_type}")

        # 7. Parse Extracted Text
        extracted_data = {}
        if document_type == "identity_card":
            extracted_data = parse_identity_card(raw_text_lines)
        elif document_type == "invoice":
            extracted_data = parse_invoice(raw_text_lines)
        else:
            # For unknown document types, return empty dictionary
            extracted_data = {}

        # 8. Build response
        response_data = OCRResponse(
            success=True,
            documentType=document_type,
            confidence=avg_confidence,
            rawText=raw_text_lines,
            extractedData=extracted_data
        )
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during OCR processing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )

    finally:
        # Cleanup temporary files to avoid disk bloat
        for path in [temp_input_path, temp_output_path, temp_output_png]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to delete temp file {path}: {cleanup_err}")


class EmailRequest(BaseModel):
    email: str
    userInfo: dict

@app.post("/face-match")
def perform_face_match(
    selfie: UploadFile = File(...),
    id_card: UploadFile = File(...)
):
    """
    Compares the face in the uploaded selfie with the face detected in the ID card.
    """
    import cv2
    import numpy as np

    try:
        # Read uploaded files
        selfie_bytes = selfie.file.read()
        id_card_bytes = id_card.file.read()

        nparr_selfie = np.frombuffer(selfie_bytes, np.uint8)
        nparr_id = np.frombuffer(id_card_bytes, np.uint8)

        img_selfie = cv2.imdecode(nparr_selfie, cv2.IMREAD_COLOR)
        img_id = cv2.imdecode(nparr_id, cv2.IMREAD_COLOR)

        if img_selfie is None or img_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image files provided"
            )

        result = compare_faces(img_id, img_selfie)
        return result

    except Exception as e:
        logger.error(f"Error during face matching: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face matching failed: {str(e)}"
        )

@app.post("/send-email")
def send_email_confirmation(request: EmailRequest):
    """
    Dispatches KYC registration receipt email containing the extracted information.
    """
    try:
        success = send_confirmation_email(request.email, request.userInfo)
        return {"success": success}
    except Exception as e:
        logger.error(f"Error during email dispatch: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email dispatch failed: {str(e)}"
        )


# ─── AML/CFT Risk Screening ─────────────────────────────────────────────────

class AMLScreenRequest(BaseModel):
    name_arabic: str = ""
    name_latin: str = ""
    cin: str = ""
    birth_date: str = ""
    birth_place: str = ""

@app.post("/aml-screen")
def aml_screen(request: AMLScreenRequest):
    """
    Screen identity against sanctions & PEP lists.
    Aligned with Tunisian Law 2015-26.
    """
    try:
        result = screen_identity(
            name_arabic=request.name_arabic,
            name_latin=request.name_latin,
            cin=request.cin,
            birth_date=request.birth_date,
            birth_place=request.birth_place,
        )
        return result
    except Exception as e:
        logger.error(f"AML screening error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AML screening failed: {str(e)}"
        )


# ─── Unified Audit Trail ────────────────────────────────────────────────────

class AuditStepRequest(BaseModel):
    dossier_id: str
    step_name: str
    status: str
    metadata: dict = {}

class AuditIdentityRequest(BaseModel):
    dossier_id: str
    identity: dict

@app.post("/audit/create")
def create_audit_dossier():
    """Create a new KYC audit dossier."""
    try:
        dossier = create_dossier()
        return dossier
    except Exception as e:
        logger.error(f"Audit create error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create audit dossier: {str(e)}"
        )

@app.post("/audit/step")
def add_audit_step(request: AuditStepRequest):
    """Add a verification step to an existing dossier."""
    try:
        dossier = audit_add_step(
            dossier_id=request.dossier_id,
            step_name=request.step_name,
            status=request.status,
            metadata=request.metadata if request.metadata else None,
        )
        return dossier
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Audit step error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add audit step: {str(e)}"
        )

@app.post("/audit/identity")
def update_audit_identity(request: AuditIdentityRequest):
    """Update identity data in a dossier."""
    try:
        dossier = update_identity(request.dossier_id, request.identity)
        return dossier
    except ValueError as e:
        err_msg = str(e)
        if "Fraude" in err_msg or "détectée" in err_msg:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
    except Exception as e:
        logger.error(f"Audit identity error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update identity: {str(e)}"
        )

@app.get("/audit/get/{dossier_id}")
def get_audit_dossier(dossier_id: str):
    """Retrieve a KYC dossier by ID."""
    dossier = get_dossier(dossier_id)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dossier not found: {dossier_id}"
        )
    return dossier


@app.get("/check-cin/{cin}")
def check_cin(cin: str):
    """Check if a CIN is already registered and get the name if so."""
    from utils.audit_trail import is_cin_already_registered, get_registered_name_by_cin
    registered = is_cin_already_registered(cin)
    name = get_registered_name_by_cin(cin) if registered else ""
    return {
        "registered": registered,
        "name": name
    }

@app.get("/audit/list")
def list_audit_dossiers():
    """List all KYC dossiers (full data) for the insurer dashboard."""
    return list_all_dossiers()
