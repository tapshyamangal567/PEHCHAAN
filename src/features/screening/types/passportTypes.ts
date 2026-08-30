export type DocumentSource = 'camera' | 'gallery';

export interface CapturedDocument {
  uri: string;
  source: DocumentSource;
  fileName: string;
  fileSize: number; // Size in bytes
  fileSizeFormatted: string; // e.g., "2.4 MB"
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt: string; // ISO timestamp
}

export type BackendAnalysisStepId =
  | 'PREPARING'
  | 'UPLOADING'
  | 'OCR_PROCESSING'
  | 'PARSING'
  | 'VALIDATING'
  | 'TAMPERING_ANALYSIS'
  | 'FACE_VERIFICATION'
  | 'RISK_ASSESSMENT'
  | 'COMPLETED'
  | 'FAILED';

export type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface AnalysisStepItem {
  id: string;
  backendStep: BackendAnalysisStepId;
  label: string;
  status: StepStatus;
  startTimeMs: number;
}

export interface SelectedPassportDocument {
  uri: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  width?: number;
  height?: number;
  selectedAt: string;
}

export type PassportValidationError =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'NO_IMAGE_SELECTED'
  | null;
