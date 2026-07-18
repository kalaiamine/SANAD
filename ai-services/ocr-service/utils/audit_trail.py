"""
Unified Audit Trail — KYC Dossier Manager
Creates and manages reusable KYC dossiers shared across all insurers.
Each dossier logs every verification step with timestamps.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

logger = logging.getLogger("ocr_service.audit")

# ─── Storage ────────────────────────────────────────────────────────────────

AUDIT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "audit")
os.makedirs(AUDIT_DIR, exist_ok=True)


def _dossier_path(dossier_id: str) -> str:
    """Get the file path for a dossier."""
    # Sanitize ID to prevent path traversal
    safe_id = dossier_id.replace("/", "").replace("\\", "").replace("..", "")
    return os.path.join(AUDIT_DIR, f"{safe_id}.json")


def _save_dossier(dossier: Dict[str, Any]) -> None:
    """Persist a dossier to disk."""
    path = _dossier_path(dossier["dossierId"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(dossier, f, ensure_ascii=False, indent=2)


# ─── Public API ─────────────────────────────────────────────────────────────

def create_dossier(identity: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a new KYC dossier with a unique ID.
    
    Returns the full dossier object:
    {
        "dossierId": "KYC-2026-07-18-a1b2c3d4",
        "createdAt": "2026-07-18T15:30:00Z",
        "identity": { ... },
        "steps": [],
        "riskAssessment": null,
        "finalStatus": "IN_PROGRESS"
    }
    """
    now = datetime.utcnow()
    short_uuid = uuid.uuid4().hex[:8]
    dossier_id = f"KYC-{now.strftime('%Y-%m-%d')}-{short_uuid}"

    dossier = {
        "dossierId": dossier_id,
        "createdAt": now.isoformat() + "Z",
        "updatedAt": now.isoformat() + "Z",
        "identity": identity or {},
        "steps": [],
        "riskAssessment": None,
        "finalStatus": "IN_PROGRESS",
    }

    _save_dossier(dossier)
    logger.info(f"Audit: Created dossier {dossier_id}")
    return dossier


def add_step(
    dossier_id: str,
    step_name: str,
    status: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Add a verification step to an existing dossier.
    
    Valid step_names:
    - OCR_SCAN
    - LIVENESS_CHECK
    - FACE_MATCH
    - AML_SCREENING
    - INFO_VALIDATION
    - ACCOUNT_CREATED
    
    Returns the updated dossier.
    """
    dossier = get_dossier(dossier_id)
    if not dossier:
        raise ValueError(f"Dossier not found: {dossier_id}")

    now = datetime.utcnow()
    step = {
        "step": step_name,
        "timestamp": now.isoformat() + "Z",
        "status": status,
    }
    if metadata:
        step["metadata"] = metadata

    dossier["steps"].append(step)
    dossier["updatedAt"] = now.isoformat() + "Z"

    # Auto-update risk assessment if this is an AML step
    if step_name == "AML_SCREENING" and metadata:
        dossier["riskAssessment"] = {
            "level": metadata.get("risk_level", "UNKNOWN"),
            "score": metadata.get("risk_score", 0),
        }

    # Auto-set final status
    if step_name == "ACCOUNT_CREATED":
        dossier["finalStatus"] = "APPROVED"

    _save_dossier(dossier)
    logger.info(f"Audit: Added step '{step_name}' ({status}) to dossier {dossier_id}")
    return dossier


def is_cin_already_registered(cin: str) -> bool:
    """
    Check if the CIN is already registered and approved in a previous KYC dossier.
    """
    if not cin:
        return False
    cin_clean = str(cin).strip()
    if not cin_clean:
        return False
        
    if not os.path.exists(AUDIT_DIR):
        return False
        
    for fname in os.listdir(AUDIT_DIR):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(AUDIT_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                d = json.load(f)
                
            # If the dossier is approved/finished or has ACCOUNT_CREATED with SUCCESS
            is_approved = d.get("finalStatus") == "APPROVED"
            if not is_approved:
                for step in d.get("steps", []):
                    if step.get("step") == "ACCOUNT_CREATED" and step.get("status") == "SUCCESS":
                        is_approved = True
                        break
                        
            if is_approved:
                ident = d.get("identity", {})
                existing_cin = ident.get("cin")
                if existing_cin and str(existing_cin).strip() == cin_clean:
                    return True
        except Exception as e:
            logger.warning(f"Error checking dossier {fname} for duplicate: {e}")
            continue
            
    return False


def get_registered_name_by_cin(cin: str) -> str:
    """
    Get the name of the registered user with this CIN.
    """
    if not cin:
        return ""
    cin_clean = str(cin).strip()
    if not cin_clean:
        return ""
        
    if not os.path.exists(AUDIT_DIR):
        return ""
        
    for fname in os.listdir(AUDIT_DIR):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(AUDIT_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                d = json.load(f)
            # If the dossier is approved/finished or has ACCOUNT_CREATED with SUCCESS
            is_approved = d.get("finalStatus") == "APPROVED"
            if not is_approved:
                for step in d.get("steps", []):
                    if step.get("step") == "ACCOUNT_CREATED" and step.get("status") == "SUCCESS":
                        is_approved = True
                        break
            if is_approved:
                ident = d.get("identity", {})
                existing_cin = ident.get("cin")
                if existing_cin and str(existing_cin).strip() == cin_clean:
                    return ident.get("fullNameLatin", ident.get("fullNameArabic", ""))
        except Exception:
            continue
    return ""


def update_identity(dossier_id: str, identity: Dict[str, Any]) -> Dict[str, Any]:
    """Update the identity data in a dossier."""
    dossier = get_dossier(dossier_id)
    if not dossier:
        raise ValueError(f"Dossier not found: {dossier_id}")

    # Check if a CIN is being provided/updated and if it is already registered
    new_cin = identity.get("cin")
    if new_cin:
        if is_cin_already_registered(new_cin):
            raise ValueError("Fraude détectée : vous avez déjà effectué votre eKYC avec ce numéro de carte d'identité.")

    dossier["identity"] = {**dossier.get("identity", {}), **identity}
    dossier["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    _save_dossier(dossier)
    return dossier


def get_dossier(dossier_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a dossier by ID. Returns None if not found."""
    path = _dossier_path(dossier_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Failed to read dossier {dossier_id}: {e}")
        return None


def list_dossiers(limit: int = 50) -> List[Dict[str, Any]]:
    """List recent dossiers (summary only)."""
    dossiers = []
    files = sorted(os.listdir(AUDIT_DIR), reverse=True)[:limit]
    for fname in files:
        if not fname.endswith(".json"):
            continue
        path = os.path.join(AUDIT_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                d = json.load(f)
                dossiers.append({
                    "dossierId": d["dossierId"],
                    "createdAt": d["createdAt"],
                    "identity": d.get("identity", {}).get("fullNameLatin", "N/A"),
                    "finalStatus": d.get("finalStatus", "UNKNOWN"),
                    "riskLevel": d.get("riskAssessment", {}).get("level") if d.get("riskAssessment") else None,
                    "stepsCount": len(d.get("steps", [])),
                })
        except Exception:
            continue
    return dossiers


def list_all_dossiers(limit: int = 100) -> List[Dict[str, Any]]:
    """Return full dossier objects for the dashboard, most-recent first."""
    if not os.path.exists(AUDIT_DIR):
        return []
    dossiers = []
    files = sorted(os.listdir(AUDIT_DIR), reverse=True)[:limit]
    for fname in files:
        if not fname.endswith(".json"):
            continue
        path = os.path.join(AUDIT_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                dossiers.append(json.load(f))
        except Exception:
            continue
    return dossiers

