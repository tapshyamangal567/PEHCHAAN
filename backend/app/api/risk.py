import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body, status
from app.services.risk_scoring_service import risk_scoring_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/assess",
    summary="Explainable Risk Scoring Endpoint",
    description="Calculates deterministic risk score, level (LOW/MEDIUM/HIGH), coverage %, and factor breakdown from verification outputs."
)
async def assess_risk(payload: Dict[str, Any] = Body(..., description="Structured verification results from OCR, MRZ, Validation, Tampering, Face Verification")):
    try:
        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_PAYLOAD", "message": "Request payload must be a JSON object."}
            )

        result = risk_scoring_service.calculate_risk(payload)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing risk assessment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "RISK_ASSESSMENT_FAILED",
                "message": f"Unable to calculate risk assessment: {str(e)}"
            }
        )
