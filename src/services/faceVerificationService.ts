import apiClient from './api/apiClient';

export type VerificationStatus =
  | 'MATCH'
  | 'REVIEW'
  | 'MISMATCH'
  | 'PASSPORT_FACE_NOT_FOUND'
  | 'LIVE_FACE_NOT_FOUND'
  | 'MULTIPLE_FACES'
  | 'IMAGE_QUALITY_INSUFFICIENT'
  | 'LIVENESS_FAILED';

export interface LivenessInfo {
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  confidence: number | null;
  method: string;
  message?: string;
}

export interface QualityInfo {
  passport_face: string;
  live_face: string;
}

export interface FaceVerificationData {
  status: VerificationStatus;
  similarity: number;
  passport_face: {
    detected: boolean;
  };
  live_face: {
    detected: boolean;
    count?: number;
  };
  liveness: LivenessInfo;
  quality: QualityInfo;
  message: string;
}

export interface FaceVerificationResponse {
  success: boolean;
  face_verification: FaceVerificationData;
}

export interface LivenessChallengePayload {
  challenges_completed: string[];
  passed: boolean;
  motion_detected: boolean;
}

export class FaceVerificationService {
  /**
   * Posts passport image and live camera image to POST /api/verification/face
   */
  static async verifyFace(
    passportUri: string,
    liveFaceUri: string,
    livenessPayload?: LivenessChallengePayload
  ): Promise<FaceVerificationResponse> {
    const formData = new FormData();

    // Append passport image file
    const passportParts = passportUri.split('/');
    const rawPassportName = passportParts[passportParts.length - 1] || 'passport.jpg';
    const cleanPassportName = rawPassportName.includes('.') ? rawPassportName : `${rawPassportName}.jpg`;
    const passportExt = (/\.(\w+)$/.exec(cleanPassportName)?.[1] || 'jpg').toLowerCase();
    const passportMime = passportExt === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('passport_image', {
      uri: passportUri,
      name: cleanPassportName,
      type: passportMime,
    } as any);

    // Append live face image file
    const liveParts = liveFaceUri.split('/');
    const rawLiveName = liveParts[liveParts.length - 1] || 'live_face.jpg';
    const cleanLiveName = rawLiveName.includes('.') ? rawLiveName : `${rawLiveName}.jpg`;
    const liveExt = (/\.(\w+)$/.exec(cleanLiveName)?.[1] || 'jpg').toLowerCase();
    const liveMime = liveExt === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('live_face_image', {
      uri: liveFaceUri,
      name: cleanLiveName,
      type: liveMime,
    } as any);

    if (livenessPayload) {
      formData.append('liveness_data', JSON.stringify(livenessPayload));
    }

    const response = await apiClient.post<FaceVerificationResponse>(
      '/api/verification/face',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }
}

export default FaceVerificationService;
