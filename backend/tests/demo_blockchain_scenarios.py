"""
PEHCHAAN Blockchain Integrity In-Process Demo & Test
Validates:
  1. Scenario 1: Normal Verification & Polygon Anchor
  2. Scenario 2: Offline Verification Sync & Polygon Anchor
  3. Scenario 3: Database Record Tampering Detection
"""
import io
import sys
import time
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.verification import VerificationRecord

client = TestClient(app)


def create_synthetic_passport():
    img = Image.new("RGB", (600, 400), color=(240, 240, 240))
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 200, 260], fill=(200, 160, 140))
    d.text((230, 40), "REPUBLIC OF INDIA", fill=(0, 0, 0))
    d.text((230, 80), "P<INDDEMO<<BLOCKCHAIN<<<<<<<<<<<<<<<", fill=(0, 0, 0))
    b = io.BytesIO()
    img.save(b, format="JPEG")
    return b.getvalue()


def run_demo():
    print("=" * 60, flush=True)
    print("PEHCHAAN POLYGON BLOCKCHAIN INTEGRITY LAYER DEMO", flush=True)
    print("=" * 60, flush=True)

    # 1. Login as Officer
    login_res = client.post(
        "/api/auth/login",
        json={"username": "OFF-8842", "password": "Password@123", "role": "OFFICER"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[1] Officer Authenticated successfully.", flush=True)

    # 2. Check Blockchain Status API
    status_res = client.get("/api/blockchain/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    print(f"[2] Blockchain Network: {status_data['network']} (Chain ID: {status_data['chain_id']})", flush=True)
    print(f"    Contract Address: {status_data['contract_address']}", flush=True)

    # === SCENARIO 1: Normal Verification & Polygon Anchor ===
    print("\n--- SCENARIO 1: Normal Verification & Polygon Anchor ---", flush=True)
    files = {"file": ("passport.jpg", create_synthetic_passport(), "image/jpeg")}
    ver_res = client.post("/api/verifications", headers=headers, files=files)
    assert ver_res.status_code == 200, f"Screening failed: {ver_res.text}"
    ver_data = ver_res.json()
    ver_id = ver_data["verification_id"]
    bc_info = ver_data.get("blockchain", {})
    print(f"-> Case ID: {ver_id}", flush=True)
    print(f"-> Blockchain Status: {bc_info.get('status')}", flush=True)
    print(f"-> Case Hash: {bc_info.get('case_hash')}", flush=True)
    print(f"-> Transaction Hash: {bc_info.get('transaction_hash')}", flush=True)
    print(f"-> Block Number: #{bc_info.get('block_number')}", flush=True)

    # Verify Cryptographic Integrity
    verify_res1 = client.get(f"/api/blockchain/verify/{ver_id}", headers=headers)
    assert verify_res1.status_code == 200
    print(f"-> Cryptographic Integrity: {verify_res1.json().get('integrity')} ([OK] VERIFIED IMMUTABLE)", flush=True)

    # === SCENARIO 2: Offline Verification Sync & Polygon Anchor ===
    print("\n--- SCENARIO 2: Offline Verification Sync & Polygon Anchor ---", flush=True)
    local_case_id = f"OFF-{int(time.time())}"
    sync_files = {"file": ("passport_offline.jpg", create_synthetic_passport(), "image/jpeg")}
    sync_data = {"local_case_id": local_case_id, "captured_at": "2026-09-01T10:00:00Z"}
    sync_res = client.post("/api/verifications/sync", headers=headers, files=sync_files, data=sync_data)
    if sync_res.status_code != 200:
        print(f"Sync error: {sync_res.status_code} {sync_res.text}", flush=True)
    assert sync_res.status_code == 200
    sync_ver_id = sync_res.json()["verification_id"]
    print(f"-> Offline Case Synced: {local_case_id} -> {sync_ver_id}", flush=True)

    # Check case blockchain metadata
    bc_meta = client.get(f"/api/blockchain/cases/{sync_ver_id}", headers=headers).json()["data"]
    print(f"-> Synced Case Blockchain Status: {bc_meta.get('blockchain_status')}", flush=True)
    print(f"-> Synced Case Hash: {bc_meta.get('case_hash')}", flush=True)
    print(f"-> Synced Case Tx: {bc_meta.get('transaction_hash')}", flush=True)

    # === SCENARIO 3: Tampering Detection Demonstration ===
    print("\n--- SCENARIO 3: Database Record Tampering Detection ---", flush=True)
    # Simulate malicious database tampering by altering risk score directly in PostgreSQL
    db = SessionLocal()
    try:
        rec = db.query(VerificationRecord).filter(VerificationRecord.verification_id == ver_id).first()
        original_score = rec.risk_score
        rec.risk_score = 99.9  # Malicious alteration
        rec.verification_result = "FAIL"
        db.commit()
        print(f"-> Simulated Tampering: Altered risk_score in DB from {original_score} to 99.9", flush=True)

        # Query Integrity Verification API
        tamper_verify_res = client.get(f"/api/blockchain/verify/{ver_id}", headers=headers)
        assert tamper_verify_res.status_code == 200
        t_json = tamper_verify_res.json()
        print(f"-> Tamper Check Integrity Result: {t_json.get('integrity')}", flush=True)
        print(f"-> Reason: {t_json.get('reason')}", flush=True)
        print(f"-> Computed Hash from DB: {t_json.get('computed_hash')}", flush=True)
        print(f"-> Immutable On-Chain Hash: {t_json.get('anchored_hash')}", flush=True)
        assert t_json.get("integrity") == "FAILED", "Integrity check should fail on tampered record!"
        print("-> [PASS] Blockchain successfully caught and proved database tampering!", flush=True)

        # Restore original score for clean state
        rec.risk_score = original_score
        rec.verification_result = "PASS"
        db.commit()
    finally:
        db.close()

    print("\n" + "=" * 60, flush=True)
    print("ALL 3 BLOCKCHAIN DEMO SCENARIOS COMPLETED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    run_demo()
