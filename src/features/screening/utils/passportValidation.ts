import { PassportValidationError } from '../types/passportTypes';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(1);
    return `${kb} KB`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${mb} MB`;
};

export const validatePassportImage = (
  uri: string,
  mimeType?: string,
  fileSize?: number
): { valid: boolean; error: PassportValidationError; errorMessage: string | null } => {
  // 1. Check file size if available
  if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'FILE_TOO_LARGE',
      errorMessage: 'File size exceeds 10 MB.',
    };
  }

  // 2. Check format by MIME type or extension
  const lowerUri = uri.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  const hasValidMime = ALLOWED_MIME_TYPES.some((mime) => lowerMime.includes(mime));
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerUri.endsWith(ext));

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: 'UNSUPPORTED_FORMAT',
      errorMessage: 'Unsupported file format. Please select a JPG or PNG image.',
    };
  }

  return { valid: true, error: null, errorMessage: null };
};
