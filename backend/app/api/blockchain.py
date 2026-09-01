from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.verification import VerificationRecord
from app.blockchain.service import blockchain_service

router = APIRouter(prefix="/blockchain", tags=["Blockchain Integrity"])


@router.get("/status")
def get_blockchain_status(current_user: User = Depends(get_current_user)):
    """
    Returns Polygon Amoy blockchain network status, RPC connection, and contract metadata.
    """
    return {
        "success": True,
        "data": blockchain_service.get_status(),
    }


@router.get("/cases/{verification_id}")
def get_case_blockchain_metadata(
    verification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns blockchain anchoring metadata for a given verification case.
    """
    record = (
        db.query(VerificationRecord)
        .filter(VerificationRecord.verification_id == verification_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification case {verification_id} not found",
        )

    return {
        "success": True,
        "data": {
            "verification_id": record.verification_id,
            "blockchain_status": record.blockchain_status or "PENDING",
            "blockchain_network": record.blockchain_network,
            "case_hash": record.case_hash,
            "document_hash": record.document_hash,
            "result_hash": record.result_hash,
            "transaction_hash": record.blockchain_tx_hash,
            "block_number": record.blockchain_block_number,
            "anchored_at": record.blockchain_anchored_at.isoformat() if record.blockchain_anchored_at else None,
            "error": record.blockchain_error,
        },
    }


@router.post("/cases/{verification_id}/anchor")
def anchor_case_to_blockchain(
    verification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers or retries anchoring of a verification case to the Polygon Amoy blockchain.
    """
    res = blockchain_service.prepare_and_anchor(db=db, verification_id=verification_id)
    if not res.get("success") and res.get("error") and "not found" in res.get("error", "").lower():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=res.get("error"),
        )
    return {
        "success": True,
        "data": res,
    }


@router.get("/verify/{verification_id}")
def verify_case_integrity_against_blockchain(
    verification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compares the current database record with the immutable on-chain anchor hash.
    Demonstrates tamper detection (VALID vs INTEGRITY FAILED).
    """
    res = blockchain_service.verify_integrity(db=db, verification_id=verification_id)
    if not res.get("success") and res.get("integrity") == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=res.get("reason"),
        )
    return res
