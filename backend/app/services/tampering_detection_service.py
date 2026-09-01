from __future__ import annotations
import io
import cv2
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

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
    - Image Quality (resolution, blur, contrast)
    - Error Level Analysis (ELA JPEG compression anomaly)
    - Local Texture Variance Inconsistency
    - High-Frequency Noise Distribution
    - Edge Density Inconsistency
    - Illumination Gradient Uniformity
    """
    def analyze(self, image: Image.Image) -> Dict[str, Any]:
        if not image:
            return self._inconclusive_result("No image provided for tampering analysis")

        # 1. Convert PIL Image to RGB NumPy Array
        orig_img = image.convert("RGB")
        img_np = np.array(orig_img)
        h_orig, w_orig = img_np.shape[:2]

        # 2. Resize working copy for analysis if large (preserves original)
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

        # 3. Image Quality Pre-Check
        blur_val = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness_val = float(np.mean(gray))
        contrast_val = float(np.std(gray))
        resolution_px = w_orig * h_orig

        if blur_val < 25.0 or resolution_px < 200000 or contrast_val < 12.0:
            quality = "POOR"
        elif blur_val >= 90.0 and resolution_px >= 500000:
            quality = "GOOD"
        else:
            quality = "ACCEPTABLE"

        if quality == "POOR":
            return self._inconclusive_result("Image quality is too low for reliable forensic analysis")

        # 4. Error Level Analysis (ELA) Compression Anomaly
        ela_score, ela_grid = self._compute_ela_anomaly(proc_np)

        # 5. Local Grid Partitioning (6x4 grid)
        grid_rows, grid_cols = 4, 6
        patch_h = h_proc // grid_rows
        patch_w = w_proc // grid_cols

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
                y1 = r * patch_h
                y2 = (r + 1) * patch_h if r < grid_rows - 1 else h_proc
                x1 = c * patch_w
                x2 = (c + 1) * patch_w if c < grid_cols - 1 else w_proc

                patch_gray = gray[y1:y2, x1:x2]
                patch_noise = noise_layer[y1:y2, x1:x2]
                patch_edge = edge_map[y1:y2, x1:x2]

                texture_vars.append(float(np.std(patch_gray)))
                noise_vars.append(float(np.std(patch_noise)))
                edge_counts.append(float(np.sum(patch_edge > 0) / max(1, patch_gray.size)))
                illum_means.append(float(np.mean(patch_gray)))

                # Scale coordinates back to original image scale
                scale_x = w_orig / float(w_proc)
                scale_y = h_orig / float(h_proc)
                patch_coords.append({
                    "x": int(x1 * scale_x),
                    "y": int(y1 * scale_y),
                    "width": int((x2 - x1) * scale_x),
                    "height": int((y2 - y1) * scale_y),
                })

        # 6. Compute Normalized Anomaly Signals (0.0 to 1.0)
        texture_score = self._normalize_variation(texture_vars)
        noise_score = self._normalize_variation(noise_vars)
        edge_score = self._normalize_variation(edge_counts)
        illum_score = self._normalize_variation(illum_means)

        signals = {
            "compression_anomaly": round(float(ela_score), 2),
            "texture_anomaly": round(float(texture_score), 2),
            "noise_anomaly": round(float(noise_score), 2),
            "edge_anomaly": round(float(edge_score), 2),
            "illumination_anomaly": round(float(illum_score), 2),
        }

        # 7. Weighted Multi-Signal Scoring
        weights = {
            "compression_anomaly": 0.25,
            "texture_anomaly": 0.25,
            "noise_anomaly": 0.20,
            "edge_anomaly": 0.15,
            "illumination_anomaly": 0.15,
        }
        total_score = sum(weights[k] * signals[k] for k in weights)
        total_score = round(min(1.0, max(0.0, total_score)), 2)

        # 8. Status Determination
        if total_score < 0.25:
            status = "LOW_SUSPICION"
        elif total_score < 0.50:
            status = "MEDIUM_SUSPICION"
        else:
            status = "HIGH_SUSPICION"

        # 9. Detect Measurable Suspicious Regions (Patch > 3.0 std dev)
        suspicious_regions = []
        if len(texture_vars) > 0:
            combined_patch_scores = [
                (0.3 * ela_grid[i] + 0.3 * texture_vars[i] + 0.2 * noise_vars[i] + 0.2 * edge_counts[i])
                for i in range(len(texture_vars))
            ]
            mean_patch_score = float(np.mean(combined_patch_scores))
            std_patch_score = float(np.std(combined_patch_scores))

            if std_patch_score > 1e-4:
                for idx, patch_val in enumerate(combined_patch_scores):
                    z_score = (patch_val - mean_patch_score) / std_patch_score
                    if z_score > 3.0:
                        patch_s = round(min(0.99, max(0.60, 0.5 + z_score * 0.1)), 2)
                        coord = patch_coords[idx]
                        suspicious_regions.append({
                            "x": coord["x"],
                            "y": coord["y"],
                            "width": coord["width"],
                            "height": coord["height"],
                            "score": patch_s,
                        })

        # 10. Generate Explainable Reasons
        reasons = []
        if signals["compression_anomaly"] > 0.35:
            reasons.append("Localized compression inconsistency detected")
        if signals["texture_anomaly"] > 0.35:
            reasons.append("Texture pattern differs from surrounding region")
        if signals["noise_anomaly"] > 0.35:
            reasons.append("High-frequency noise distribution inconsistency detected")
        if signals["edge_anomaly"] > 0.35:
            reasons.append("Abnormal edge density / boundary artifact detected")
        if signals["illumination_anomaly"] > 0.35:
            reasons.append("Illumination gradient inconsistency detected")

        return {
            "status": status,
            "score": total_score,
            "confidence": None, # Uncalibrated baseline detector (no ML model confidence)
            "signals": signals,
            "suspicious_regions": suspicious_regions,
            "reasons": reasons,
            "method": "opencv_forensic_baseline",
            "model_version": "baseline-1.0",
        }

    def _compute_ela_anomaly(self, img_np: np.ndarray) -> tuple[float, list[float]]:
        """Computes Error Level Analysis (ELA) compression anomaly score."""
        try:
            pil_img = Image.fromarray(img_np)
            buffer = io.BytesIO()
            pil_img.save(buffer, format="JPEG", quality=95)
            buffer.seek(0)
            recompressed = Image.open(buffer).convert("RGB")
            recomp_np = np.array(recompressed)

            diff = cv2.absdiff(img_np, recomp_np)
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)

            # Grid patch variances of ELA diff
            h, w = diff_gray.shape
            grid_r, grid_c = 4, 6
            patch_h, patch_w = h // grid_r, w // grid_c
            ela_patches = []

            for r in range(grid_r):
                for c in range(grid_c):
                    p = diff_gray[r*patch_h:(r+1)*patch_h, c*patch_w:(c+1)*patch_w]
                    ela_patches.append(float(np.std(p)))

            ela_score = self._normalize_variation(ela_patches)
            return ela_score, ela_patches
        except Exception:
            return 0.10, [0.0] * 24

    def _normalize_variation(self, values: list[float]) -> float:
        """Normalizes variation across spatial grid patches to a [0.0, 1.0] scale."""
        if not values or len(values) < 2:
            return 0.0
        mean_val = float(np.mean(values))
        std_val = float(np.std(values))
        if mean_val <= 1e-6:
            return 0.0
        cv_val = std_val / mean_val
        # Map CV (coefficient of variation 0.0 - 1.5) to [0.0, 1.0]
        return min(1.0, max(0.0, cv_val / 1.2))

    def _inconclusive_result(self, reason: str) -> Dict[str, Any]:
        return {
            "status": "INCONCLUSIVE",
            "score": 0.0,
            "confidence": None,
            "signals": {
                "compression_anomaly": 0.0,
                "texture_anomaly": 0.0,
                "noise_anomaly": 0.0,
                "edge_anomaly": 0.0,
                "illumination_anomaly": 0.0,
            },
            "suspicious_regions": [],
            "reasons": [reason],
            "method": "opencv_forensic_baseline",
            "model_version": "baseline-1.0",
        }

tampering_detection_service = ForensicBaselineDetector()
