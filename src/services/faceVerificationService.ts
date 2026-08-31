import apiClient from './api/apiClient';
import { Platform } from 'react-native';

export interface FaceMatchResult {
  status: 'STRONG_MATCH' | 'POSSIBLE_MATCH' | 'LOW_SIMILARITY' | 'NOT_VERIFIED';
  similarity_score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  face_match: boolean;
  reference_face_detected: boolean;
  live_face_detected: boolean;
  quality: string;
  reason: string;
  recommendation: string;
  model_version: string;
  timestamp: string;
  updated_risk_score?: number;
  updated_risk_level?: string;
}

export interface VerifyFaceParams {
  liveFaceUri: string;
  passportUri?: string;
  verificationId?: string;
}

export class FaceVerificationService {
  /**
   * Submit live face capture and passport image for facial embedding comparison
   */
  static async verifyFace(params: VerifyFaceParams): Promise<FaceMatchResult> {
    const formData = new FormData();

    // 1. Append live selfie file
    const liveFilename = params.liveFaceUri.split('/').pop() || 'live_face.jpg';
    const liveFile: any = {
      uri: Platform.OS === 'ios' ? params.liveFaceUri.replace('file://', '') : params.liveFaceUri,
      type: 'image/jpeg',
      name: liveFilename,
    };
    formData.append('live_file', liveFile);

    // 2. Append passport file if available
    if (params.passportUri) {
      const passportFilename = params.passportUri.split('/').pop() || 'passport.jpg';
      const passportFile: any = {
        uri: Platform.OS === 'ios' ? params.passportUri.replace('file://', '') : params.passportUri,
        type: 'image/jpeg',
        name: passportFilename,
      };
      formData.append('passport_file', passportFile);
    }

    // 3. Append verification_id if linking with existing database record
    if (params.verificationId) {
      formData.append('verification_id', params.verificationId);
    }

    if (__DEV__) {
      console.log('[FACE_AUTH] Starting Face Verification request...');
      console.log('[FACE_AUTH] Endpoint: /api/verifications/face-match');
    }

    const response = await apiClient.post<FaceMatchResult>(
      '/api/verifications/face-match',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 20000, // 20s timeout for ML inference
      }
    );

    if (__DEV__) {
      console.log('[FACE_AUTH] Result Status:', response.data.status);
      console.log('[FACE_AUTH] Similarity Score:', response.data.similarity_score);
    }

    return response.data;
  }
}

export default FaceVerificationService;
