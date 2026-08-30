import apiClient from './api/apiClient';

export interface PassportFields {
  full_name: string | null;
  passport_number: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  date_of_issue: string | null;
  date_of_expiry: string | null;
}

export interface FieldConfidenceItem {
  value: string | null;
  confidence: number;
  source: string;
}

export interface OCRResult {
  raw_text: string;
  confidence: number;
}

export interface MRZResponseData {
  detected: boolean;
  line1: string | null;
  line2: string | null;
  checksum_valid: boolean | null;
}

export interface ConsistencyCheckResponse {
  name_match: boolean | null;
  passport_number_match: boolean | null;
  dob_match: boolean | null;
  expiry_match: boolean | null;
  name_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  passport_number_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  dob_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  expiry_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  gender_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  nationality_status?: 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
  overall_status?: 'PASS' | 'REVIEW' | 'FAIL' | 'NOT_AVAILABLE';
  overall_message?: string;
}

export interface ValidationCheckItem {
  status: 'PASS' | 'FAIL' | 'NOT_AVAILABLE' | 'REVIEW';
  message: string;
}

export interface ValidationResult {
  overall_status: 'PASS' | 'REVIEW' | 'FAIL';
  overall_message: string;
  checks: Record<string, ValidationCheckItem>;
  passed: number;
  failed: number;
  not_available: number;
}

export interface SuspiciousRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface TamperingSignals {
  compression_anomaly: number;
  texture_anomaly: number;
  noise_anomaly: number;
  edge_anomaly: number;
  illumination_anomaly: number;
}

export interface TamperingAnalysisResult {
  status: 'LOW_SUSPICION' | 'MEDIUM_SUSPICION' | 'HIGH_SUSPICION' | 'INCONCLUSIVE';
  score: number;
  confidence: number | null;
  signals: TamperingSignals;
  suspicious_regions: SuspiciousRegion[];
  reasons: string[];
  method: string;
  model_version: string;
}

export interface ScreeningMetadata {
  processing_time_ms: number;
  fields_extracted: number;
}

export interface PassportScreeningResponse {
  success: boolean;
  document_type: string;
  ocr: OCRResult;
  fields: PassportFields;
  field_confidence: Record<string, FieldConfidenceItem>;
  mrz: MRZResponseData | null;
  consistency: ConsistencyCheckResponse;
  validation?: ValidationResult | null;
  tampering_analysis?: TamperingAnalysisResult | null;
  metadata: ScreeningMetadata;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export class ScreeningService {
  /**
   * Uploads passport image to FastAPI endpoint POST /api/screening/passport
   * as multipart/form-data.
   */
  static async processPassport(imageUri: string): Promise<PassportScreeningResponse> {
    const formData = new FormData();

    // Determine filename and mimetype from URI
    const uriParts = imageUri.split('/');
    const rawFileName = uriParts[uriParts.length - 1] || 'passport.jpg';
    const cleanFileName = rawFileName.includes('.') ? rawFileName : `${rawFileName}.jpg`;

    const match = /\.(\w+)$/.exec(cleanFileName);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // React Native FormData file object format
    formData.append('file', {
      uri: imageUri,
      name: cleanFileName,
      type: mimeType,
    } as any);

    const response = await apiClient.post<PassportScreeningResponse>(
      '/api/screening/passport',
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

export default ScreeningService;
