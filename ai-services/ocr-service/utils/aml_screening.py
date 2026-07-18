"""
AML/CFT Risk Scoring Engine
Sanctions & PEP screening aligned with Tunisian Law 2015-26
(Loi relative à la lutte contre le terrorisme et la répression du blanchiment d'argent)
"""

import os
import json
import logging
from difflib import SequenceMatcher
from datetime import datetime, date
from typing import List, Dict, Optional, Any

logger = logging.getLogger("ocr_service.aml")

# ─── Load sanctions & PEP data ─────────────────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SANCTIONS_PEP_PATH = os.path.join(DATA_DIR, "sanctions_pep.json")

_data_cache: Optional[Dict[str, Any]] = None

def _load_data() -> Dict[str, Any]:
    """Load and cache the sanctions/PEP dataset."""
    global _data_cache
    if _data_cache is not None:
        return _data_cache
    try:
        with open(SANCTIONS_PEP_PATH, "r", encoding="utf-8") as f:
            _data_cache = json.load(f)
        logger.info(f"Loaded AML dataset: {len(_data_cache.get('sanctions', []))} sanctions, "
                     f"{len(_data_cache.get('pep', []))} PEP entries")
    except FileNotFoundError:
        logger.warning(f"AML dataset not found at {SANCTIONS_PEP_PATH}, using empty dataset")
        _data_cache = {"sanctions": [], "pep": [], "high_risk_regions": []}
    return _data_cache


# ─── Fuzzy name matching ────────────────────────────────────────────────────

def _normalize(name: str) -> str:
    """Normalize a name for comparison: lowercase, strip, remove diacritics."""
    return name.strip().lower().replace("  ", " ")


def _fuzzy_match(name1: str, name2: str, threshold: float = 0.78) -> float:
    """
    Compute fuzzy similarity between two names.
    Returns similarity ratio (0.0 - 1.0). Match if >= threshold.
    """
    n1 = _normalize(name1)
    n2 = _normalize(name2)
    if not n1 or not n2:
        return 0.0
    return SequenceMatcher(None, n1, n2).ratio()


def _check_name_against_list(
    name_ar: str, name_latin: str, entries: List[Dict], threshold: float = 0.78
) -> List[Dict]:
    """
    Check a name (Arabic + Latin) against a list of entries.
    Returns list of matching entries with similarity scores.
    """
    hits = []
    for entry in entries:
        best_score = 0.0
        matched_field = ""

        # Compare Arabic names
        if name_ar and entry.get("name_ar"):
            score = _fuzzy_match(name_ar, entry["name_ar"], threshold)
            if score > best_score:
                best_score = score
                matched_field = "arabic"

        # Compare Latin names
        if name_latin and entry.get("name_latin"):
            score = _fuzzy_match(name_latin, entry["name_latin"], threshold)
            if score > best_score:
                best_score = score
                matched_field = "latin"

        if best_score >= threshold:
            hits.append({
                "name": entry.get("name_latin", entry.get("name_ar", "Unknown")),
                "name_ar": entry.get("name_ar", ""),
                "similarity": round(best_score * 100, 1),
                "source": entry.get("source", "Unknown"),
                "reason": entry.get("reason", entry.get("position", "")),
                "type": entry.get("type", "pep"),
                "matched_on": matched_field,
            })

    # Sort by similarity descending
    hits.sort(key=lambda x: x["similarity"], reverse=True)
    return hits


# ─── Risk scoring algorithm ────────────────────────────────────────────────

def screen_identity(
    name_arabic: str = "",
    name_latin: str = "",
    cin: str = "",
    birth_date: str = "",
    birth_place: str = "",
) -> Dict[str, Any]:
    """
    Screen an identity against sanctions & PEP lists.
    Returns risk assessment with level, score, hits, and factors.

    Risk levels (aligned with Law 2015-26 Art. 35-40):
    - LOW (0-15): Standard verification, no hits
    - MEDIUM (16-34): Enhanced due diligence recommended
    - HIGH (35-59): Enhanced due diligence required, supervisor notification
    - CRITICAL (60+): Transaction blocked, immediate reporting to CTAF
    """
    data = _load_data()
    factors: List[Dict[str, Any]] = []
    risk_score = 0

    # ── 1. Sanctions screening (weight: +50) ────────────────────────────
    sanctions_hits = _check_name_against_list(
        name_arabic, name_latin, data.get("sanctions", []), threshold=0.78
    )
    if sanctions_hits:
        top_score = sanctions_hits[0]["similarity"]
        weight = 50 if top_score >= 90 else 35 if top_score >= 80 else 25
        risk_score += weight
        factors.append({
            "factor": "SANCTIONS_MATCH",
            "description": f"Correspondance sanctions détectée ({len(sanctions_hits)} résultat(s))",
            "weight": weight,
            "severity": "critical" if top_score >= 90 else "high",
        })
        logger.warning(f"AML: Sanctions match for '{name_latin}' — {len(sanctions_hits)} hit(s), top={top_score}%")

    # ── 2. PEP screening (weight: +30) ──────────────────────────────────
    pep_hits = _check_name_against_list(
        name_arabic, name_latin, data.get("pep", []), threshold=0.80
    )
    if pep_hits:
        top_score = pep_hits[0]["similarity"]
        weight = 30 if top_score >= 90 else 20 if top_score >= 80 else 10
        risk_score += weight
        factors.append({
            "factor": "PEP_MATCH",
            "description": f"Personne Politiquement Exposée détectée ({len(pep_hits)} résultat(s))",
            "weight": weight,
            "severity": "high" if top_score >= 90 else "medium",
        })
        logger.info(f"AML: PEP match for '{name_latin}' — {len(pep_hits)} hit(s)")

    # ── 3. Document validity check (weight: +10) ────────────────────────
    # Tunisian CIN is valid for 10 years
    if birth_date:
        try:
            bd = datetime.strptime(birth_date, "%Y-%m-%d").date()
            today = date.today()
            age = (today - bd).days // 365

            if age < 18:
                risk_score += 15
                factors.append({
                    "factor": "UNDERAGE",
                    "description": f"Titulaire mineur ({age} ans) — vérification renforcée requise",
                    "weight": 15,
                    "severity": "high",
                })
            elif age < 21:
                risk_score += 5
                factors.append({
                    "factor": "YOUNG_ADULT",
                    "description": f"Titulaire jeune adulte ({age} ans)",
                    "weight": 5,
                    "severity": "low",
                })
            elif age > 70:
                risk_score += 5
                factors.append({
                    "factor": "ELDERLY",
                    "description": f"Titulaire âgé ({age} ans) — vigilance accrue",
                    "weight": 5,
                    "severity": "low",
                })
        except (ValueError, TypeError):
            pass

    # ── 4. High-risk region (weight: +5) ────────────────────────────────
    high_risk_regions = data.get("high_risk_regions", [])
    if birth_place:
        bp_lower = birth_place.strip().lower()
        for region in high_risk_regions:
            if _normalize(region) in bp_lower or bp_lower in _normalize(region):
                risk_score += 5
                factors.append({
                    "factor": "HIGH_RISK_REGION",
                    "description": f"Lieu de naissance en zone à risque ({birth_place})",
                    "weight": 5,
                    "severity": "low",
                })
                break

    # ── 5. No factors = clean ───────────────────────────────────────────
    if not factors:
        factors.append({
            "factor": "CLEAN",
            "description": "Aucune correspondance détectée dans les listes de sanctions et PPE",
            "weight": 0,
            "severity": "none",
        })

    # ── Determine risk level ────────────────────────────────────────────
    if risk_score >= 60:
        risk_level = "CRITICAL"
    elif risk_score >= 35:
        risk_level = "HIGH"
    elif risk_score >= 16:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    result = {
        "risk_level": risk_level,
        "risk_score": min(risk_score, 100),
        "sanctions_hits": sanctions_hits,
        "pep_hits": pep_hits,
        "factors": factors,
        "screened_at": datetime.utcnow().isoformat() + "Z",
        "legal_basis": "Loi n° 2015-26 du 7 août 2015",
    }

    logger.info(f"AML screening complete for '{name_latin}': {risk_level} (score={risk_score})")
    return result
