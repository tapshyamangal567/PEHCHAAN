import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.verification import VerificationRecord
from app.blockchain.config import blockchain_config
from app.blockchain.hashing import (
    compute_document_hash,
    compute_result_hash,
    compute_case_hash,
)
from app.blockchain.client import polygon_client

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Orchestrates deterministic hashing, immutable anchoring, and tamper detection
    between PostgreSQL/Supabase and the Polygon Blockchain.
    """

    def generate_hashes(
        self,
        record: VerificationRecord,
        raw_image_bytes: Optional[bytes] = None,
    ) -> Dict[str, str]:
        """
        Generates deterministic SHA-256 hashes without storing any PII on-chain.
        """
        doc_hash = compute_document_hash(raw_image_bytes or b"")
        res_hash = compute_result_hash(
            verification_result=record.verification_result or "COMPLETED",
            risk_score=record.risk_score or 0.0,
            risk_level=record.risk_level.value if hasattr(record.risk_level, "value") else str(record.risk_level or "LOW"),
            mrz_valid=record.mrz_checksum_valid,
            tampering_status=record.tampering_analysis.status if record.tampering_analysis else "NOT_EVALUATED",
            face_status=record.face_verification.match_result if record.face_verification else "NOT_EVALUATED",
        )
        created_str = (
            record.created_at.isoformat()
            if record.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        case_h = compute_case_hash(
            case_id=record.verification_id,
            document_hash=doc_hash,
            result_hash=res_hash,
            timestamp_iso=created_str,
        )
        return {
            "document_hash": doc_hash,
            "result_hash": res_hash,
            "case_hash": case_h,
        }

    def prepare_and_anchor(
        self,
        db: Session,
        verification_id: str,
        raw_image_bytes: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Generates hashes and triggers blockchain anchor submission.
        """
        record = (
            db.query(VerificationRecord)
            .filter(VerificationRecord.verification_id == verification_id)
            .first()
        )
        if not record:
            return {"success": False, "error": f"Verification {verification_id} not found"}

        # Idempotency: If already confirmed with transaction hash, do not submit duplicate
        if record.blockchain_status == "CONFIRMED" and record.blockchain_tx_hash:
            return {
                "success": True,
                "status": "CONFIRMED",
                "case_hash": record.case_hash,
                "tx_hash": record.blockchain_tx_hash,
                "block_number": record.blockchain_block_number,
                "network": record.blockchain_network,
                "anchored_at": record.blockchain_anchored_at.isoformat() if record.blockchain_anchored_at else None,
                "is_duplicate": True,
            }

        # Generate hashes if not already set
        if not record.case_hash:
            hashes = self.generate_hashes(record, raw_image_bytes)
            record.document_hash = hashes["document_hash"]
            record.result_hash = hashes["result_hash"]
            record.case_hash = hashes["case_hash"]

        record.blockchain_status = "QUEUED"
        record.blockchain_network = blockchain_config.POLYGON_NETWORK
        db.commit()

        # Submit on-chain anchor
        epoch_ts = int(record.created_at.timestamp()) if record.created_at else int(datetime.now(timezone.utc).timestamp())
        anchor_res = polygon_client.anchor_on_chain(
            case_hash=record.case_hash,
            document_hash=record.document_hash,
            result_hash=record.result_hash,
            timestamp=epoch_ts,
        )

        if anchor_res.get("success"):
            record.blockchain_status = "CONFIRMED"
            record.blockchain_tx_hash = anchor_res.get("tx_hash")
            record.blockchain_block_number = anchor_res.get("block_number")
            record.blockchain_timestamp = datetime.now(timezone.utc)
            record.blockchain_anchored_at = datetime.now(timezone.utc)
            record.blockchain_error = None
        else:
            record.blockchain_status = "FAILED"
            record.blockchain_error = anchor_res.get("error")

        db.commit()
        db.refresh(record)

        return {
            "success": anchor_res.get("success", False),
            "status": record.blockchain_status,
            "case_hash": record.case_hash,
            "document_hash": record.document_hash,
            "result_hash": record.result_hash,
            "tx_hash": record.blockchain_tx_hash,
            "block_number": record.blockchain_block_number,
            "network": record.blockchain_network,
            "explorer_url": f"{blockchain_config.POLYGON_EXPLORER_URL}/tx/{record.blockchain_tx_hash}" if record.blockchain_tx_hash else None,
            "error": record.blockchain_error,
        }

    def verify_integrity(self, db: Session, verification_id: str) -> Dict[str, Any]:
        """
        Validates the integrity of a database record against its immutable blockchain anchor.
        Demonstration of tamper-detection: If someone maliciously edits a passport record or risk score
        in the database, the computed hash will mismatch the immutable anchor!
        """
        record = (
            db.query(VerificationRecord)
            .filter(VerificationRecord.verification_id == verification_id)
            .first()
        )
        if not record:
            return {
                "success": False,
                "integrity": "NOT_FOUND",
                "reason": f"Verification {verification_id} not found",
            }

        if not record.case_hash:
            return {
                "success": False,
                "integrity": "NOT_ANCHORED",
                "reason": "Case has not been anchored to blockchain yet",
            }

        # Re-compute hash from current database fields
        current_res_hash = compute_result_hash(
            verification_result=record.verification_result or "COMPLETED",
            risk_score=record.risk_score or 0.0,
            risk_level=record.risk_level.value if hasattr(record.risk_level, "value") else str(record.risk_level or "LOW"),
            mrz_valid=record.mrz_checksum_valid,
            tampering_status=record.tampering_analysis.status if record.tampering_analysis else "NOT_EVALUATED",
            face_status=record.face_verification.match_result if record.face_verification else "NOT_EVALUATED",
        )
        created_str = (
            record.created_at.isoformat()
            if record.created_at
            else datetime.now(timezone.utc).isoformat()
        )
        current_case_hash = compute_case_hash(
            case_id=record.verification_id,
            document_hash=record.document_hash or ("0x" + "0" * 64),
            result_hash=current_res_hash,
            timestamp_iso=created_str,
        )

        # Compare current state with anchored state
        if current_case_hash.lower() == record.case_hash.lower():
            return {
                "success": True,
                "case_id": record.verification_id,
                "integrity": "VALID",
                "blockchain_status": record.blockchain_status,
                "case_hash": record.case_hash,
                "transaction_hash": record.blockchain_tx_hash,
                "block_number": record.blockchain_block_number,
                "network": record.blockchain_network,
                "anchored_at": record.blockchain_anchored_at.isoformat() if record.blockchain_anchored_at else None,
                "explorer_url": f"{blockchain_config.POLYGON_EXPLORER_URL}/tx/{record.blockchain_tx_hash}" if record.blockchain_tx_hash else None,
            }
        else:
            return {
                "success": True,
                "case_id": record.verification_id,
                "integrity": "FAILED",
                "reason": "Database record does not match blockchain anchor (Tampering Detected)",
                "computed_hash": current_case_hash,
                "anchored_hash": record.case_hash,
                "blockchain_status": record.blockchain_status,
                "transaction_hash": record.blockchain_tx_hash,
                "network": record.blockchain_network,
            }

    def get_status(self) -> Dict[str, Any]:
        """Returns Polygon Amoy blockchain configuration and connection status."""
        return {
            "network": blockchain_config.POLYGON_NETWORK,
            "chain_id": blockchain_config.POLYGON_CHAIN_ID,
            "rpc_url": blockchain_config.POLYGON_RPC_URL,
            "contract_address": blockchain_config.POLYGON_CONTRACT_ADDRESS,
            "relayer_address": polygon_client.get_relayer_address(),
            "rpc_connected": polygon_client.is_connected(),
            "explorer_base": blockchain_config.POLYGON_EXPLORER_URL,
        }


blockchain_service = BlockchainService()
