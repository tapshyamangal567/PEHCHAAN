from __future__ import annotations
import io
import cv2
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
from app.config import settings

class TamperingDetector(ABC):
    """
    Abstract interface for passport document tampering detection.
    Enables future ML model inference detectors to be swapped in seamlessly.
    """
    @abstractmethod
    def analyze(self, image: Image.Image) -> Dict[str, Any]:
        pass

class ForensicBaselineDetector(TamperingDetector):
    """
    OpenCV-based image forensic baseline detector measuring actual image features:
    - Image Quality (resolution, blur, contrast) -> Forensic Confidence
    - Error Level Analysis (ELA JPEG compression anomaly)
    - Local Texture Variance Inconsistency (Inner Canvas Patches)
    - High-Frequency Noise Distribution
    - Edge Density Inconsistency
    - Illumination Gradient Uniformity
    - Multi-Signal Co-location Consensus Analysis
    """
    METHOD_NAME = "OpenCV Forensic Baseline — image-level screening"

    def analyze(self, image: Image.Image) -> Dict[str, Any]:
        if not image:
            return self._inconclusive_result("No image provided for tampering analysis")

        # 1. Convert PIL Image to RGB NumPy Array
        orig_img = image.convert("RGB")
        img_np = np.array(orig_img)
        h_orig, w_orig = img_np.shape[:2]

        # 2. Resize working copy for analysis if large
        max_dim = 1200
        if max(h_orig, w_orig) > max_dim:
            scale = max_dim / float(max(h_orig, w_orig))
            w_proc = int(w_orig * scale)
            h_proc = int(h_orig * scale)
            proc_np = cv2.resize(img_np, (w_proc, h_proc), interpolation=cv2.INTER_AREA)
        else:
            proc_np = img_np.copy()
            w_proc, h_proc = w_orig, h_orig

        gray = cv2.cvtColor(proc_np, cv2.COLOR_RGB2GRAY)

        # 3. Image Quality & Forensic Confidence Pre-Check
        blur_val = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness_val = float(np.mean(gray))
        contrast_val = float(np.std(gray))
        resolution_px = w_orig * h_orig

        if blur_val < 20.0 or resolution_px < 150000 or contrast_val < 10.0:
            quality = "POOR"
        elif blur_val >= 80.0 and resolution_px >= 500000 and contrast_val >= 25.0:
            quality = "GOOD"
        else:
            quality = "ACCEPTABLE"

        # Forensic Confidence based on actual image metrics
        if quality == "GOOD":
            forensic_confidence = round(min(0.95, max(0.80, 0.70 + (blur_val / 500.0) * 0.20)), 2)
        elif quality == "ACCEPTABLE":
            forensic_confidence = round(min(0.79, max(0.60, 0.55 + (blur_val / 300.0) * 0.20)), 2)
        else:
            forensic_confidence = round(min(0.55, max(0.35, 0.35 + (blur_val / 200.0) * 0.15)), 2)

        if quality == "POOR":
            return self._inconclusive_result("Image quality limits reliable forensic assessment.", forensic_confidence)

        # 4. Error Level Analysis (ELA) Compression Anomaly
        ela_score, ela_patches = self._compute_ela_anomaly(proc_np)

        # 5. Spatial Inner Canvas Grid Partitioning (Ignoring outer 8% border margins)
        grid_rows, grid_cols = 4, 6
        margin_y = int(h_proc * 0.08)
        margin_x = int(w_proc * 0.08)
        inner_h = h_proc - 2 * margin_y
        inner_w = w_proc - 2 * margin_x

        patch_h = max(1, inner_h // grid_rows)
        patch_w = max(1, inner_w // grid_cols)

        texture_vars = []
        noise_vars = []
        edge_counts = []
        illum_means = []
        patch_coords = []

        # Precompute noise and edge maps
        blurred_gray = cv2.GaussianBlur(gray, (5, 5), 0)
        noise_layer = cv2.absdiff(gray, blurred_gray)
        edge_map = cv2.Canny(gray, 50, 150)

        for r in range(grid_rows):
            for c in range(grid_cols):
                y1 = margin_y + r * patch_h
                y2 = margin_y + (r + 1) * patch_h if r < grid_rows - 1 else h_proc - margin_y
                x1 = margin_x + c * patch_w
                x2 = margin_x + (c + 1) * patch_w if c < grid_cols - 1 else w_proc - margin_x

                patch_gray = gray[y1:y2, x1:x2]
                patch_noise = noise_layer[y1:y2, x1:x2]
                patch_edge = edge_map[y1:y2, x1:x2]

                texture_vars.append(float(np.std(patch_gray)))
                noise_vars.append(float(np.std(patch_noise)))
                edge_counts.append(float(np.sum(patch_edge > 0) / max(1, patch_gray.size)))
                illum_means.append(float(np.mean(patch_gray)))

                scale_x = w_orig / float(w_proc)
                scale_y = h_orig / float(h_proc)
                patch_coords.append({
                    "x": int(x1 * scale_x),
                    "y": int(y1 * scale_y),
                    "width": int((x2 - x1) * scale_x),
                    "height": int((y2 - y1) * scale_y),
                })

        # 6. Compute Normalized Anomaly Signals (0.0 to 1.0) with Localized Outlier Scoring
        texture_score = self._normalize_localized_outlier(texture_vars)
        noise_score = self._normalize_localized_outlier(noise_vars)
        edge_score = self._normalize_localized_outlier(edge_counts)
        illum_score = self._normalize_localized_outlier(illum_means)

        signals = {
            "compression_anomaly": round(float(ela_score), 2),
            "texture_anomaly": round(float(texture_score), 2),
            "noise_anomaly": round(float(noise_score), 2),
            "edge_anomaly": round(float(edge_score), 2),
            "illumination_anomaly": round(float(illum_score), 2),
        }

        # 7. Multi-Signal Co-Location & Agreement Analysis
        # Count patches where MULTIPLE independent signals show a localized anomaly
        max_colocated_signals = 0
        suspicious_regions = []

        num_patches = len(patch_coords)
        if num_patches > 0:
            ela_outliers = self._find_outlier_indices(ela_patches[:num_patches])
            text_outliers = self._find_outlier_indices(texture_vars)
            noise_outliers = self._find_outlier_indices(noise_vars)
            edge_outliers = self._find_outlier_indices(edge_counts)

            for i in range(num_patches):
                co_located_count = (
                    (1 if i in ela_outliers else 0) +
                    (1 if i in text_outliers else 0) +
                    (1 if i in noise_outliers else 0) +
                    (1 if i in edge_outliers else 0)
                )

                if co_located_count > max_colocated_signals:
                    max_colocated_signals = co_located_count

                if co_located_count >= 2:
                    coord = patch_coords[i]
                    suspicious_regions.append({
                        "x": coord["x"],
                        "y": coord["y"],
                        "width": coord["width"],
                        "height": coord["height"],
                        "score": round(min(0.99, 0.40 + co_located_count * 0.15), 2),
                    })

        # 8. Compute Tampering Suspicion Score based on Signal Consensus
        if max_colocated_signals >= 3:
            raw_suspicion = 0.55 + min(0.35, (max_colocated_signals - 3) * 0.15)
        elif max_colocated_signals == 2:
            raw_suspicion = 0.25 + min(0.18, len(suspicious_regions) * 0.05)
        else:
            # Single or zero localized anomaly: mild global baseline
            raw_suspicion = 0.05 + max(signals.values()) * 0.10

        tampering_suspicion_score = round(min(1.0, max(0.0, raw_suspicion)), 2)

        # 9. Configurable Threshold Evaluation
        low_max = getattr(settings, "TAMPERING_LOW_MAX", 0.20)
        medium_max = getattr(settings, "TAMPERING_MEDIUM_MAX", 0.50)

        if tampering_suspicion_score < low_max:
            status = "LOW_SUSPICION"
            primary_reason = "No significant localized forensic anomaly detected."
        elif tampering_suspicion_score < medium_max:
            status = "MEDIUM_SUSPICION"
            primary_reason = "Localized compression or texture anomalies detected; manual review recommended."
        else:
            status = "HIGH_SUSPICION"
            primary_reason = "Multiple agreeing forensic anomalies indicate possible localized manipulation."

        # 10. Structured Signals Evidence
        structured_signals = [
            {"name": "compression_consistency", "value": signals["compression_anomaly"], "status": "ANOMALY" if signals["compression_anomaly"] > 0.35 else "NORMAL"},
            {"name": "texture_consistency", "value": signals["texture_anomaly"], "status": "ANOMALY" if signals["texture_anomaly"] > 0.35 else "NORMAL"},
            {"name": "noise_distribution", "value": signals["noise_anomaly"], "status": "ANOMALY" if signals["noise_anomaly"] > 0.35 else "NORMAL"},
            {"name": "edge_density", "value": signals["edge_anomaly"], "status": "ANOMALY" if signals["edge_anomaly"] > 0.35 else "NORMAL"},
            {"name": "illumination_gradient", "value": signals["illumination_anomaly"], "status": "ANOMALY" if signals["illumination_anomaly"] > 0.35 else "NORMAL"}
        ]

        reasons = [primary_reason]

        return {
            "status": status,
            "score": tampering_suspicion_score,
            "suspicion_score": tampering_suspicion_score,
            "forensic_confidence": forensic_confidence,
            "confidence": forensic_confidence,
            "signals": signals,
            "structured_signals": structured_signals,
            "suspicious_regions": suspicious_regions,
            "reasons": reasons,
            "method": self.METHOD_NAME,
            "model_version": "baseline-1.0",
        }

    def _compute_ela_anomaly(self, img_np: np.ndarray) -> tuple[float, list[float]]:
        """Computes Error Level Analysis (ELA) compression anomaly score across patches."""
        try:
            pil_img = Image.fromarray(img_np)
            buffer = io.BytesIO()
            pil_img.save(buffer, format="JPEG", quality=95)
            buffer.seek(0)
            recompressed = Image.open(buffer).convert("RGB")
            recomp_np = np.array(recompressed)

            diff = cv2.absdiff(img_np, recomp_np)
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)

            h, w = diff_gray.shape
            grid_r, grid_c = 4, 6
            patch_h, patch_w = max(1, h // grid_r), max(1, w // grid_c)
            ela_patches = []

            for r in range(grid_r):
                for c in range(grid_c):
                    p = diff_gray[r*patch_h:(r+1)*patch_h, c*patch_w:(c+1)*patch_w]
                    ela_patches.append(float(np.std(p)))

            ela_score = self._normalize_localized_outlier(ela_patches)
            return ela_score, ela_patches
        except Exception:
            return 0.05, [0.0] * 24

    def _normalize_localized_outlier(self, values: list[float]) -> float:
        """
        Measures localized anomaly deviation (z-score > 3.0) rather than overall global variation.
        Distinguishes global page structure/text from localized edits.
        """
        if not values or len(values) < 4:
            return 0.0
        mean_val = float(np.mean(values))
        std_val = float(np.std(values))
        if std_val <= 1e-6 or mean_val <= 1e-6:
            return 0.0

        # Calculate max positive deviation z-score
        max_z = max(0.0, (max(values) - mean_val) / std_val)

        # High z-score (> 3.0) indicates a localized patch anomaly
        if max_z < 2.5:
            return 0.10
        elif max_z < 3.5:
            return 0.25
        else:
            return min(1.0, 0.35 + (max_z - 3.5) * 0.15)

    def _find_outlier_indices(self, values: list[float]) -> set[int]:
        """Returns patch indices that exhibit localized outlier status (z-score > 2.8)."""
        if not values or len(values) < 4:
            return set()
        mean_val = float(np.mean(values))
        std_val = float(np.std(values))
        if std_val <= 1e-6:
            return set()

        outliers = set()
        for idx, val in enumerate(values):
            if (val - mean_val) / std_val >= 2.8:
                outliers.add(idx)
        return outliers

    def _inconclusive_result(self, reason: str, confidence: float = 0.40) -> Dict[str, Any]:
        return {
            "status": "INCONCLUSIVE",
            "score": 0.0,
            "suspicion_score": 0.0,
            "forensic_confidence": confidence,
            "confidence": confidence,
            "signals": {
                "compression_anomaly": 0.0,
                "texture_anomaly": 0.0,
                "noise_anomaly": 0.0,
                "edge_anomaly": 0.0,
                "illumination_anomaly": 0.0,
            },
            "structured_signals": [
                {"name": "compression_consistency", "value": 0.0, "status": "NORMAL"},
                {"name": "texture_consistency", "value": 0.0, "status": "NORMAL"},
                {"name": "noise_distribution", "value": 0.0, "status": "NORMAL"},
                {"name": "edge_density", "value": 0.0, "status": "NORMAL"},
                {"name": "illumination_gradient", "value": 0.0, "status": "NORMAL"}
            ],
            "suspicious_regions": [],
            "reasons": [reason],
            "method": self.METHOD_NAME,
            "model_version": "baseline-1.0",
        }

tampering_detection_service = ForensicBaselineDetector()
