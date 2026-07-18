# SANAD OCR Microservice

An independent, FastAPI-based OCR microservice for SANAD. This service is designed to extract information from Tunisian National Identity Cards and repair invoices using **PaddleOCR** with a multilingual Arabic/Latin model.

## Features

- **Document Orientation Correction**: Automatic rotation detection and correction.
- **Text Preprocessing**: Image cleaning, resizing, bilateral denoising, and CLAHE contrast enhancement.
- **Unified Language Model**: Configured with `lang='ar'` to read Arabic text, French/Latin text, and numbers simultaneously.
- **Regex-Based Parsers**: Converts OCR output into structured JSON for:
  - Tunisian National Identity Cards (`fullNameArabic`, `fullNameLatin`, `cin`, `birthDate`, `expiryDate`, `nationality`).
  - Repair invoices (`garage`, `amount`, `currency`, `date`).

---

## Installation

### Prerequisites

- Python 3.11
- C++ Build Tools (required for compiling some dependencies if you are on Windows, or just run inside Docker)

### Local Virtual Environment Setup

1. Navigate to the service folder:
   ```bash
   cd ai-services/ocr-service
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Service

### Start Local Dev Server

Start the FastAPI application on port `8001`:

```bash
uvicorn main:app --reload --port 8001
```

Once started, the service will be accessible at:
- **API URL**: `http://localhost:8001`
- **Swagger Documentation**: [http://localhost:8001/docs](http://localhost:8001/docs)

### Run with Docker

To build and run the microservice using Docker:

```bash
docker build -t sanad-ocr-service .
docker run -p 8001:8001 sanad-ocr-service
```

---

## API Endpoints

### 1. Health Check
- **Endpoint**: `GET /`
- **Response**:
  ```json
  {
    "service": "SANAD OCR",
    "status": "running"
  }
  ```

### 2. Document OCR Analysis
- **Endpoint**: `POST /ocr`
- **Body**: `multipart/form-data`
  - `file`: The document image (`.jpg`, `.png`) or PDF file.
- **Response (Tunisian Identity Card)**:
  ```json
  {
    "success": true,
    "documentType": "identity_card",
    "confidence": 96.5,
    "rawText": ["الجمهورية التونسية", "بطاقة تعريف وطنية", "BEN ALI", "MOHAMED", "08765432"],
    "extractedData": {
      "fullNameArabic": "محمد بن علي",
      "fullNameLatin": "MOHAMED BEN ALI",
      "cin": "08765432",
      "birthDate": "1995-10-12",
      "expiryDate": "2032-10-12",
      "nationality": "Tunisienne"
    }
  }
  ```

---

## Next.js Integration

The frontend connects to this microservice at `http://localhost:8001/ocr`. Ensure that:
1. CORS is enabled in the backend (allowing `http://localhost:3000`).
2. Next.js forms upload images using `FormData` with the `file` field name.
