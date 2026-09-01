import apiClient from './api/apiClient';


export type VerificationStatus =
  | 'PASS'
  | 'REVIEW'
  | 'FAIL'
  | 'MATCH'
  | 'MISMATCH'
  | 'PASSPORT_FACE_NOT_FOUND'
  | 'LIVE_FACE_NOT_FOUND'
  | 'MULTIPLE_FACES'
  | 'IMAGE_QUALITY_INSUFFICIENT'
  | 'LIVENESS_FAILED';


export interface LivenessInfo {
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_AVAILABLE' | 'INCONCLUSIVE';
  challenge_type?: string | null;
  challenge_started?: boolean;
  challenge_completed?: boolean;
  result?: 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_AVAILABLE' | 'INCONCLUSIVE';
  confidence: number | null;
  method: string;
  message?: string;
}


export interface QualityInfo {
  passport_face: string;
  live_face: string;
}


export interface FaceVerificationData {
  passport_face_detected: boolean;
  live_face_detected: boolean;
  face_positioned: boolean;
  liveness_passed: boolean;
  similarity_score: number | null;
  match_threshold: number | null;
  status: VerificationStatus;
  message: string;
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
}


export interface FaceVerificationResponse {
  success: boolean;
  face_verification: FaceVerificationData;
}


export interface LivenessChallengePayload {
  challenge_type?: string;
  challenge_started?: boolean;
  challenge_completed?: boolean;
  challenges_completed?: string[];
  passed?: boolean;
  motion_detected?: boolean;
  timed_out?: boolean;
  multiple_faces?: boolean;
}


/**
 * Result format used by the Identity Verification UI.
 *
 * This keeps compatibility with the newer FaceMatchResult
 * data expected by VerificationResultsScreen.
 */
export interface FaceMatchResult {
  status:
  | 'STRONG_MATCH'
  | 'POSSIBLE_MATCH'
  | 'LOW_SIMILARITY'
  | 'NOT_VERIFIED';

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
   * Posts passport image and live camera image
   * to POST /api/verification/face.
   */
  static async verifyFace(
    passportUri: string,
    liveFaceUri: string,
    livenessPayload?: LivenessChallengePayload
  ): Promise<FaceVerificationResponse> {

    const formData = new FormData();


    // Append passport image file
    const passportParts = passportUri.split('/');

    const rawPassportName =
      passportParts[passportParts.length - 1] ||
      'passport.jpg';

    const cleanPassportName =
      rawPassportName.includes('.')
        ? rawPassportName
        : `${rawPassportName}.jpg`;

    const passportExt =
      (/\.(\w+)$/.exec(cleanPassportName)?.[1] || 'jpg')
        .toLowerCase();

    const passportMime =
      passportExt === 'png'
        ? 'image/png'
        : 'image/jpeg';


    formData.append('passport_image', {
      uri: passportUri,
      name: cleanPassportName,
      type: passportMime,
    } as any);


    // Append live face image file
    const liveParts = liveFaceUri.split('/');

    const rawLiveName =
      liveParts[liveParts.length - 1] ||
      'live_face.jpg';

    const cleanLiveName =
      rawLiveName.includes('.')
        ? rawLiveName
        : `${rawLiveName}.jpg`;

    const liveExt =
      (/\.(\w+)$/.exec(cleanLiveName)?.[1] || 'jpg')
        .toLowerCase();

    const liveMime =
      liveExt === 'png'
        ? 'image/png'
        : 'image/jpeg';


    formData.append('live_face_image', {
      uri: liveFaceUri,
      name: cleanLiveName,
      type: liveMime,
    } as any);


    // Append liveness information if available
    if (livenessPayload) {
      formData.append(
        'liveness_data',
        JSON.stringify(livenessPayload)
      );
    }


    const response =
      await apiClient.post<FaceVerificationResponse>(
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
