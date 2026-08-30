# PEHCHAAN FastAPI Backend

Secure Identity Screening & Passport OCR Backend for PEHCHAAN.

---

## Architecture Overview

- **Framework**: FastAPI with Uvicorn server
- **OCR Engine**: EasyOCR (single-instance lazy reader)
- **Validation**: Pillow content verification & 10 MB size constraints
- **Field Parser**: Contextual regex parser for passport numbers, names, dates, and nationality
- **Security**: In-memory image processing; no raw passport image storage or byte logging

---

## Setup & Running on Windows

### 1. Activate Environment
Open PowerShell inside `D:\PEHCHAAN\backend`:

```powershell
.\venv\Scripts\Activate.ps1
```

### 2. Start Uvicorn Dev Server
Run the FastAPI application with hot reload:

```powershell
python -m uvicorn app.main:app --reload
```

Server will start at: `http://127.0.0.1:8000`

---

## Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint returning API status |
| `POST` | `/api/screening/passport` | Accept passport image upload & return OCR fields |
| `GET` | `/docs` | Interactive Swagger API Documentation |
| `GET` | `/redoc` | ReDoc API Documentation |

---

## Sample Request (`POST /api/screening/passport`)

Using `curl`:

```bash
curl -X POST "http://127.0.0.1:8000/api/screening/passport" \
  -F "file=@/path/to/passport_sample.jpg"
```

---

## Sample Successful Response

```json
{
  "success": true,
  "document_type": "passport",
  "ocr": {
    "raw_text": "PASSPORT\nIND A1234567\nSURNAME: MEHTA\nGIVEN NAME: ARJUN\nNATIONALITY: IND",
    "confidence": 0.9234
  },
  "fields": {
    "full_name": "MEHTA ARJUN",
    "passport_number": "A1234567",
    "nationality": "IND",
    "date_of_birth": "15/08/1990",
    "gender": "M",
    "date_of_issue": "10/01/2020",
    "date_of_expiry": "09/01/2030"
  },
  "mrz": null,
  "metadata": {
    "processing_time_ms": 1420.5,
    "fields_extracted": 7
  }
}
```

---

## Error Codes

- `INVALID_FILE_TYPE`: File is not JPG or PNG
- `FILE_TOO_LARGE`: Exceeds 10 MB limit
- `INVALID_IMAGE`: Corrupted or unreadable image stream
- `OCR_FAILED`: Internal processing or EasyOCR error
- `PROCESSING_FAILED`: Generic unexpected server error
