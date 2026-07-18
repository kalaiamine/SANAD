from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class OCRResponse(BaseModel):
    success: bool
    documentType: str = Field(..., description="Type of the document: 'identity_card', 'invoice', or 'unknown'")
    confidence: float = Field(..., description="Average confidence score (0-100)")
    rawText: List[str] = Field(..., description="Raw text lines detected by OCR")
    extractedData: Dict[str, Any] = Field(..., description="Structured parsed data")
