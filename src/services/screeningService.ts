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
